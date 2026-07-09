import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import {
  sendShippedEmail,
  sendRecipientLinkedEmail,
  sendRecipientViewedEmail,
} from '../../lib/email.js'

/**
 * Receiver for the Supabase Database Webhook on `Pieces` UPDATE. Diffs
 * old_record → record and fires the matching buyer email:
 *
 *   status      crafting → shipped   → #4 shipped (memories sealed)
 *   receiver_id null → set           → #6 recipient linked
 *   first_viewed_at null → set       → #7 recipient viewed   (mobile app stamps this)
 *
 * Configure in Supabase: Database → Webhooks → POST to
 *   https://<site>/api/hooks/piece-changed
 * with header `x-tijoray-webhook-secret: <TIJORAY_WEBHOOK_SECRET>`.
 *
 * Each email dedupes via Email_Log, so webhook re-delivery is exactly-once.
 */
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const SITE = (process.env.VITE_SITE_URL ?? 'https://tijoray.com').replace(/\/+$/, '')

type PieceRow = {
  id: string
  collection: string | null
  sender_id: string | null
  receiver_id: string | null
  recipient_name: string | null
  status: string | null
  first_viewed_at: string | null
}

type WebhookBody = {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: PieceRow | null
  old_record: PieceRow | null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const secret = process.env.TIJORAY_WEBHOOK_SECRET
  if (!secret || req.headers['x-tijoray-webhook-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const body = req.body as WebhookBody
  if (body?.table !== 'Pieces' || body.type !== 'UPDATE' || !body.record || !body.old_record) {
    return res.status(200).json({ ignored: true })
  }

  const rec = body.record
  const old = body.old_record
  if (!rec.sender_id) return res.status(200).json({ ignored: true, reason: 'no sender' })

  // Buyer (recipient of all these notifications).
  const { data: buyerData } = await supabase.auth.admin.getUserById(rec.sender_id)
  const buyer = buyerData?.user
  if (!buyer?.email) return res.status(200).json({ ignored: true, reason: 'no buyer email' })
  const buyerName = (buyer.user_metadata?.name as string | undefined) ?? null

  const pieceName = rec.collection ?? 'Tijoray piece'
  const portalUrl = `${SITE}/portal/piece/${rec.id}`

  // Recipient name: prefer the stored value; fall back to the linked account.
  async function recipientName(): Promise<string | null> {
    if (rec.recipient_name?.trim()) return rec.recipient_name.trim()
    if (rec.receiver_id) {
      const { data } = await supabase.auth.admin.getUserById(rec.receiver_id)
      return (data?.user?.user_metadata?.name as string | undefined) ?? null
    }
    return null
  }

  const fired: string[] = []

  try {
    // #4 — shipped
    if (old.status !== 'shipped' && rec.status === 'shipped') {
      const r = await sendShippedEmail({
        pieceId: rec.id, to: buyer.email, buyerName,
        recipientName: await recipientName(), pieceName, portalUrl,
      })
      if (r === 'sent') fired.push('shipped')
    }

    // #6 — recipient linked
    if (!old.receiver_id && rec.receiver_id) {
      const r = await sendRecipientLinkedEmail({
        pieceId: rec.id, to: buyer.email, buyerName,
        recipientName: await recipientName(), pieceName,
      })
      if (r === 'sent') fired.push('linked')
    }

    // #7 — recipient viewed (mobile app stamps first_viewed_at)
    if (!old.first_viewed_at && rec.first_viewed_at) {
      const r = await sendRecipientViewedEmail({
        pieceId: rec.id, to: buyer.email, buyerName,
        recipientName: await recipientName(), pieceName,
      })
      if (r === 'sent') fired.push('viewed')
    }
  } catch (err) {
    console.error('piece-changed: send failed', err)
    return res.status(500).json({ error: 'Send failed' })
  }

  return res.status(200).json({ ok: true, fired })
}

export const config = { runtime: 'nodejs' }
