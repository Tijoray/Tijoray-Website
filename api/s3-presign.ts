import type { VercelRequest, VercelResponse } from '@vercel/node'
import { S3Client } from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import path from 'path'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: !!process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── Allowed MIME types and their permitted extensions ──────────────────────────
const ALLOWED_TYPES: Record<string, string[]> = {
  'image/jpeg':  ['.jpg', '.jpeg'],
  'image/png':   ['.png'],
  'image/webp':  ['.webp'],
  'image/heic':  ['.heic'],
  'image/heif':  ['.heif'],
  'video/mp4':   ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/webm':  ['.webm'],
  'audio/mpeg':  ['.mp3'],
  'audio/mp4':   ['.m4a'],
  'audio/wav':   ['.wav'],
  'audio/webm':  ['.webm'],
  'audio/ogg':   ['.ogg'],
}

// 25 MB limit
const MAX_BYTES = 25 * 1024 * 1024

// Simple in-memory rate limit: max 10 presign requests per user per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 })
    return false
  }
  if (entry.count >= 10) return true
  entry.count++
  return false
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  console.log('[s3-presign] env check', {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    hasKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecret: !!process.env.AWS_SECRET_ACCESS_KEY,
    publicBase: process.env.PUBLIC_FILE_BASE_URL,
  })

  // ── Auth ───────────────────────────────────────────────────────────────────
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' })

  // ── Rate limit ─────────────────────────────────────────────────────────────
  if (isRateLimited(user.id)) {
    return res.status(429).json({ error: 'Too many upload requests. Please wait a moment.' })
  }

  const { filename, contentType, pieceId } = req.body

  if (!filename || !contentType || !pieceId) {
    return res.status(400).json({ error: 'Missing filename, contentType, or pieceId' })
  }

  // ── MIME type whitelist ────────────────────────────────────────────────────
  const allowedExtensions = ALLOWED_TYPES[contentType]
  if (!allowedExtensions) {
    return res.status(400).json({
      error: `File type "${contentType}" is not allowed. Permitted types: photos, videos, and audio files.`,
    })
  }

  // ── Extension must match declared MIME type ────────────────────────────────
  const ext = path.extname(filename).toLowerCase()
  if (!allowedExtensions.includes(ext)) {
    return res.status(400).json({
      error: `File extension "${ext}" does not match content type "${contentType}".`,
    })
  }

  // ── Ownership check ────────────────────────────────────────────────────────
  const { data: piece, error: pieceErr } = await supabase
    .from('Pieces')
    .select('id')
    .eq('id', pieceId)
    .eq('sender_id', user.id)
    .single()

  if (pieceErr || !piece) {
    return res.status(403).json({ error: 'Piece not found or access denied' })
  }

  // ── Generate presigned POST (supports ContentLengthRange) ─────────────────
  const key    = `pieces/${pieceId}/${randomUUID()}${ext}`
  const bucket = process.env.AWS_S3_BUCKET_NAME!

  const { url, fields } = await createPresignedPost(s3, {
    Bucket:  bucket,
    Key:     key,
    Expires: 300, // 5 minutes
    Conditions: [
      ['content-length-range', 1, MAX_BYTES],       // 1 byte – 50 MB
      ['eq', '$Content-Type', contentType],          // must match exactly
      ['eq', '$Content-Disposition', 'attachment'],  // never serve inline
    ],
    Fields: {
      'Content-Type':        contentType,
      'Content-Disposition': 'attachment',
    },
  })

  const fileUrl = process.env.PUBLIC_FILE_BASE_URL
    ? `${process.env.PUBLIC_FILE_BASE_URL.replace(/\/$/, '')}/${key}`
    : `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

  return res.status(200).json({ presignedPost: { url, fields }, fileUrl })
}
