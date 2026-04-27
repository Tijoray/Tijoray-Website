import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null
  if (!token) return res.status(401).json({ error: 'Missing token' })

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' })

  const { pieceId } = req.body
  if (!pieceId) return res.status(400).json({ error: 'Missing pieceId' })

  // Verify requester is the sender and get receiver_id
  const { data: piece, error: pieceErr } = await supabase
    .from('Pieces')
    .select('receiver_id')
    .eq('id', pieceId)
    .eq('sender_id', user.id)
    .single()

  if (pieceErr || !piece?.receiver_id) return res.status(200).json({ name: null })

  // Look up recipient's name via admin API
  const { data: { user: recipient }, error: recipErr } = await supabase.auth.admin.getUserById(piece.receiver_id)
  if (recipErr || !recipient) return res.status(200).json({ name: null })

  const name = (recipient.user_metadata?.name as string | undefined) ?? recipient.email ?? null
  return res.status(200).json({ name })
}
