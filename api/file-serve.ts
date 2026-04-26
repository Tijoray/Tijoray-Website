import type { VercelRequest, VercelResponse } from '@vercel/node'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@supabase/supabase-js'

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' })

  const { key } = req.body
  if (!key || typeof key !== 'string') return res.status(400).json({ error: 'Missing key' })

  // key must follow: piece/<pieceId>/message/<filename>
  const match = key.match(/^piece\/([^/]+)\/message\//)
  if (!match) return res.status(400).json({ error: 'Invalid key format' })
  const pieceId = match[1]

  // User must be the sender or receiver of this piece
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
    new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key:    key,
    }),
    { expiresIn: 300 }, // 5-minute window
  )

  return res.status(200).json({ signedUrl })
}
