import type { VercelRequest, VercelResponse } from '@vercel/node'
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import path from 'path'

/**
 * Memory-file operations, consolidated into ONE serverless function routed on a
 * POST `action` field — the same shape as api/admin.ts, and for the same
 * reason: the deploy must stay under Vercel's Hobby-plan function ceiling.
 *
 *   presign — signed PUT URL for uploading one encrypted (TJE1) container
 *   serve   — short-lived signed GET URL for one stored object
 *   delete  — remove one stored object (sender only)
 */
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

// 25 MB limit (plaintext size — the encrypted container is marginally larger)
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

/** Extract `pieceId` from a stored key: piece/<pieceId>/message/<filename>. */
function pieceIdFromKey(key: unknown): string | null {
  if (!key || typeof key !== 'string') return null
  const match = key.match(/^piece\/([^/]+)\/message\//)
  return match ? match[1] : null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // ── Auth ───────────────────────────────────────────────────────────────────
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' })

  const { action } = req.body ?? {}
  const bucket = process.env.AWS_S3_BUCKET_NAME!

  // ── presign ────────────────────────────────────────────────────────────────
  if (action === 'presign') {
    if (isRateLimited(user.id)) {
      return res.status(429).json({ error: 'Too many upload requests. Please wait a moment.' })
    }

    const { filename, contentType, pieceId } = req.body
    if (!filename || !contentType || !pieceId) {
      return res.status(400).json({ error: 'Missing filename, contentType, or pieceId' })
    }

    const allowedExtensions = ALLOWED_TYPES[contentType]
    if (!allowedExtensions) {
      return res.status(400).json({
        error: `File type "${contentType}" is not allowed. Permitted types: photos, videos, and audio files.`,
      })
    }

    const ext = path.extname(filename).toLowerCase()
    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({
        error: `File extension "${ext}" does not match content type "${contentType}".`,
      })
    }

    // Only the sender may add files to a piece.
    const { data: piece, error: pieceErr } = await supabase
      .from('Pieces')
      .select('id')
      .eq('id', pieceId)
      .eq('sender_id', user.id)
      .single()
    if (pieceErr || !piece) {
      return res.status(403).json({ error: 'Piece not found or access denied' })
    }

    // No extension in the key. The body is a TJE1 container and unreadable, but
    // `birthday-video.mp4` sitting in a bucket listing would give away most of
    // what the encryption is there to hide. The real name and type travel inside
    // the encrypted metadata on the row instead.
    const key = `piece/${pieceId}/message/${randomUUID()}`

    // Everything is stored application/octet-stream: the bytes genuinely are
    // opaque now, and labelling them image/jpeg would be a lie that only helps
    // someone trying to get our storage domain to render their content.
    // `declared-type` records the type this function approved, fixed at signing
    // time — both it and Content-Type are signed headers, so R2 rejects a PUT
    // that sends anything else.
    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket:      bucket,
        Key:         key,
        ContentType: 'application/octet-stream',
        Metadata:    { 'declared-type': contentType, enc: 'tje1' },
      }),
      { expiresIn: 300 },
    )

    return res.status(200).json({
      uploadUrl,
      fileKey: key,
      contentType,
      maxBytes: MAX_BYTES,
      uploadHeaders: {
        'Content-Type': 'application/octet-stream',
        'x-amz-meta-declared-type': contentType,
        'x-amz-meta-enc': 'tje1',
      },
    })
  }

  // ── serve ──────────────────────────────────────────────────────────────────
  if (action === 'serve') {
    const { key } = req.body
    const pieceId = pieceIdFromKey(key)
    if (!pieceId) return res.status(400).json({ error: 'Invalid key format' })

    // Sender or receiver may fetch the (encrypted) bytes.
    const { data: piece, error: pieceErr } = await supabase
      .from('Pieces')
      .select('sender_id, receiver_id')
      .eq('id', pieceId)
      .single()
    if (pieceErr || !piece) return res.status(403).json({ error: 'Access denied' })
    if (piece.sender_id !== user.id && piece.receiver_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 300 }, // 5-minute window
    )
    return res.status(200).json({ signedUrl })
  }

  // ── delete ─────────────────────────────────────────────────────────────────
  if (action === 'delete') {
    const { key } = req.body
    const pieceId = pieceIdFromKey(key)
    if (!pieceId) return res.status(400).json({ error: 'Invalid key format' })

    // Only the sender may delete files.
    const { data: piece, error: pieceErr } = await supabase
      .from('Pieces')
      .select('sender_id')
      .eq('id', pieceId)
      .single()
    if (pieceErr || !piece) return res.status(403).json({ error: 'Access denied' })
    if (piece.sender_id !== user.id) return res.status(403).json({ error: 'Access denied' })

    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    return res.status(200).json({ ok: true })
  }

  return res.status(400).json({ error: 'Unknown action' })
}
