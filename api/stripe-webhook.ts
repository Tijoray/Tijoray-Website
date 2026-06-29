import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'

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
  const meta = session.metadata ?? {}
  const { userId, recipientName, recipientPhone } = meta

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

  // Parse per-item metadata (item_0, item_1, … — one Stripe metadata key each).
  type ItemMeta = {
    productType?: string; collectionId?: string
    shape?: string; metal?: string; metalColor?: string; birthstoneIndex?: number
    stoneId?: string; metalId?: string
  }
  const itemCount = parseInt(meta.itemCount ?? '0', 10)
  const itemList: ItemMeta[] = []
  try {
    for (let i = 0; i < itemCount; i++) {
      const raw = meta[`item_${i}`]
      if (raw) itemList.push(JSON.parse(raw))
    }
  } catch {
    console.error('Webhook: failed to parse items metadata')
    return res.status(400).json({ error: 'Malformed items metadata' })
  }

  // Human-readable collection label for the legacy `collection` column.
  const COLLECTION_NAMES: Record<string, string> = {
    'birthstone':     'Birthstone Collection',
    'diamond':        'Diamond Collection',
    'initial-letter': 'Initial Collection',
  }

  for (const item of itemList) {
    const { shape, stoneId, metalId } = item
    const productType  = item.productType ?? 'pendant'
    const productLabel = productType.charAt(0).toUpperCase() + productType.slice(1)
    const collName     = COLLECTION_NAMES[item.collectionId ?? 'birthstone'] ?? 'Birthstone Collection'
    const config = {
      productType,
      collectionId:    item.collectionId ?? 'birthstone',
      shape:           item.shape,
      metal:           item.metal,
      metalColor:      item.metalColor,
      birthstoneIndex: item.birthstoneIndex,
    }

    const genSerial = () => 'TIJ-' + randomBytes(5).toString('hex').toUpperCase()

    let piece: { id: string } | null = null
    let pieceErr: unknown = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const result = await supabase
        .from('Pieces')
        .insert({
          serial:          genSerial(),
          collection:      `${shape?.charAt(0).toUpperCase()}${shape?.slice(1)} ${productLabel} — ${collName}`,
          product_type:    productType,
          config,
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
      piece = result.data
      pieceErr = result.error
      // retry only on unique-constraint violation (serial collision)
      if (!result.error || (result.error as any).code !== '23505') break
    }

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
