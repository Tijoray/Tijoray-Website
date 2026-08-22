import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { getOrCreatePieceDek, type KeyScope } from './_envelope'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/// Hands a piece's data key to the gifter.
///
/// This is the only door to the keys, so it is exactly as strong as the whole
/// scheme. The website is the gifter's surface: they may hold the `message`
/// key for a piece they sent, and nothing else. The `vault` key is the
/// giftee's alone and is never issued here — that separation is the reason the
/// two scopes have different keys rather than sharing one.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' })

  const { pieceId, scope } = req.body as { pieceId?: string; scope?: string }
  if (!pieceId) return res.status(400).json({ error: 'Missing pieceId' })
  if (scope !== undefined && scope !== 'message') {
    return res.status(403).json({ error: 'Access denied' })
  }

  const { data: piece, error: pieceErr } = await supabase
    .from('Pieces')
    .select('id')
    .eq('id', pieceId)
    .eq('sender_id', user.id)
    .maybeSingle()
  if (pieceErr || !piece) {
    return res.status(403).json({ error: 'Piece not found or access denied' })
  }

  try {
    const dek = await getOrCreatePieceDek(supabase, pieceId, 'message' as KeyScope)
    return res.status(200).json({ scope: 'message', dek: dek.toString('base64') })
  } catch (e) {
    console.error('[piece-key]', e)
    return res.status(500).json({ error: 'Could not obtain key' })
  }
}
