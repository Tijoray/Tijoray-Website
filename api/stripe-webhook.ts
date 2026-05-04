import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const sig = req.headers['stripe-signature'] as string
  if (!sig) return res.status(400).json({ error: 'Missing stripe-signature' })

  let event: Stripe.Event
  try {
    const rawBody = await readRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed'
    console.error('Webhook error:', message)
    return res.status(400).json({ error: message })
  }

  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true })
  }

  type SessionWithShipping = Stripe.Checkout.Session & {
    shipping_details?: { address?: Stripe.Address | null; name?: string | null } | null
  }
  const session = event.data.object as SessionWithShipping
  const { userId, items: itemsJson, recipientName, recipientPhone } = session.metadata ?? {}

  // Build shipping address from Stripe's collected address
  const stripeAddr = session.shipping_details?.address
  const shippingAddress = stripeAddr ? {
    name:        session.shipping_details?.name ?? '',
    line1:       stripeAddr.line1 ?? '',
    line2:       stripeAddr.line2 ?? '',
    city:        stripeAddr.city ?? '',
    state:       stripeAddr.state ?? '',
    postal_code: stripeAddr.postal_code ?? '',
    country:     stripeAddr.country ?? '',
  } : null

  if (!userId) {
    console.error('Webhook: missing userId in session metadata')
    return res.status(400).json({ error: 'Missing userId in metadata' })
  }

  // Parse per-item metadata (stringified JSON array)
  let itemList: { shape: string; stoneId: string; metalId: string }[] = []
  try {
    const raw = JSON.parse(itemsJson ?? '[]') as string[]
    itemList = raw.map(s => JSON.parse(s))
  } catch {
    console.error('Webhook: failed to parse items metadata')
    return res.status(400).json({ error: 'Malformed items metadata' })
  }

  for (const item of itemList) {
    const { shape, stoneId, metalId } = item

    const serial = 'ARC-' + Math.random().toString(36).slice(2, 10).toUpperCase()

    const { data: piece, error: pieceErr } = await supabase
      .from('Pieces')
      .insert({
        serial,
        collection:      `${shape?.charAt(0).toUpperCase()}${shape?.slice(1)} Pendant`,
        stone_id:        stoneId  || null,
        metal_id:        metalId  || null,
        sender_id:       userId,
        created_at:      new Date().toISOString(),
        activated_at:    new Date().toISOString(),
        shipping_address: shippingAddress,
        recipient_name:  recipientName  || null,
        recipient_phone: recipientPhone || null,
      })
      .select('id')
      .single()

    if (pieceErr || !piece) {
      console.error('Failed to insert piece:', pieceErr)
      continue // try remaining items
    }

    await supabase.from('Messages').insert({
      piece_id:  piece.id,
      sender_id: userId,
      title:     'Your Gift Message',
    })

    await supabase.from('Vault').insert({
      piece_id: piece.id,
      owner_id: userId,
      name:     'Memory Vault',
    })
  }

  // Send confirmation email
  const customerEmail = session.customer_details?.email
  if (customerEmail && resend) {
    await resend.emails.send({
      from: 'Tijoray <hello@tijoray.com>',
      to:   customerEmail,
      subject: 'Your Tijoray pendant is being crafted',
      html: `
        <p>Thank you for your order.</p>
        <p>Your <strong>${session.metadata?.collection ?? 'Tijoray'}</strong> pendant is now in production. You'll receive a shipping confirmation within 10–14 business days.</p>
        <p>Once it arrives, visit <a href="${process.env.VITE_SITE_URL}/portal">your portal</a> to compose the memory inside.</p>
        <p>— The Tijoray Atelier</p>
      `,
    }).catch(err => console.error('Resend error:', err))
  }

  return res.status(200).json({ received: true })
}

// Disable Vercel's body parser so we can read the raw stream for Stripe signature verification
export const config = {
  api: { bodyParser: false },
  runtime: 'nodejs',
}
