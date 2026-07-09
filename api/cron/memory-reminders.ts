import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { sendMemoryReminder, MEMORY_WINDOW_DAYS } from '../../lib/email.js'

/**
 * Daily cron (see vercel.json). For every piece still being crafted with NO
 * memories added yet, sends the most-advanced reminder tier that has become due
 * and hasn't been sent. Tiers auto-stop the moment a memory is added (the
 * emptiness check below) or the piece ships (status filter).
 *
 * Vercel attaches `Authorization: Bearer ${CRON_SECRET}` when CRON_SECRET is
 * set — we reject anything that doesn't match so the endpoint isn't public.
 */
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Day offsets (from purchase) at which each tier becomes due. Tier 3 = deadline − 2.
const TIERS: { tier: 1 | 2 | 3; day: number }[] = [
  { tier: 1, day: 3 },
  { tier: 2, day: 7 },
  { tier: 3, day: MEMORY_WINDOW_DAYS - 2 },
]

const SITE = (process.env.VITE_SITE_URL ?? 'https://tijoray.com').replace(/\/+$/, '')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const now = Date.now()

  // Candidate pieces: still crafting, at least the first tier old.
  const { data: pieces, error } = await supabase
    .from('Pieces')
    .select('id, collection, sender_id, recipient_name, created_at, memory_deadline, status')
    .eq('status', 'crafting')
  if (error) {
    console.error('reminders: piece query failed', error)
    return res.status(500).json({ error: 'Query failed' })
  }

  // Cache buyer lookups across pieces from the same sender.
  const userCache = new Map<string, { email: string | null; name: string | null }>()
  async function buyer(senderId: string) {
    if (userCache.has(senderId)) return userCache.get(senderId)!
    const { data } = await supabase.auth.admin.getUserById(senderId)
    const u = data?.user
    const v = { email: u?.email ?? null, name: (u?.user_metadata?.name as string | undefined) ?? null }
    userCache.set(senderId, v)
    return v
  }

  let sent = 0, skipped = 0

  for (const p of pieces ?? []) {
    if (!p.sender_id) continue
    const ageDays = (now - new Date(p.created_at).getTime()) / 86400000

    // Most-advanced tier that's due. Avoids sending stale earlier tiers late.
    const due = [...TIERS].reverse().find(t => ageDays >= t.day)
    if (!due) continue

    // Skip if memories have already been added (stops all remaining reminders).
    const { data: msgs } = await supabase.from('Messages').select('id').eq('piece_id', p.id)
    const msgIds = (msgs ?? []).map(m => m.id)
    if (msgIds.length) {
      const { count } = await supabase
        .from('Message_Items')
        .select('id', { count: 'exact', head: true })
        .in('message_id', msgIds)
      if ((count ?? 0) > 0) continue
    }

    const b = await buyer(p.sender_id)
    if (!b.email) continue

    const deadline = p.memory_deadline
      ?? new Date(new Date(p.created_at).getTime() + MEMORY_WINDOW_DAYS * 86400000).toISOString()

    try {
      const result = await sendMemoryReminder({
        pieceId:   p.id,
        tier:      due.tier,
        to:        b.email,
        buyerName: b.name,
        deadline,
        portalUrl: `${SITE}/portal/piece/${p.id}`,
      })
      result === 'sent' ? sent++ : skipped++
    } catch (err) {
      console.error(`reminders: send failed for piece ${p.id}`, err)
    }
  }

  return res.status(200).json({ ok: true, sent, skipped, scanned: pieces?.length ?? 0 })
}

export const config = { runtime: 'nodejs' }
