import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { sendCraftingEmail, MEMORY_WINDOW_DAYS } from '../lib/email.js'
import type { Metal } from '../src/data/catalog.js'
import { getCatalog } from '../lib/catalog-store.js'
import { priceCents } from '../src/data/catalog-doc.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

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

  type ShippingDetails = { address?: Stripe.Address | null; name?: string | null }
  type SessionWithShipping = Stripe.Checkout.Session & {
    shipping_details?: ShippingDetails | null
    collected_information?: { shipping_details?: ShippingDetails | null } | null
  }
  const session = event.data.object as SessionWithShipping
  const meta = session.metadata ?? {}
  const { userId, recipientName, recipientPhone } = meta

  // Build shipping address from Stripe's collected address. API version
  // 2026-03-25.dahlia moved this under `collected_information`; the top-level
  // field is kept as a fallback so older redeliveries still resolve.
  const shipping = session.collected_information?.shipping_details ?? session.shipping_details
  const stripeAddr = shipping?.address
  const shippingAddress = stripeAddr ? {
    name:        shipping?.name ?? '',
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
  // Memory-collection window closes this far out — drives the reminder cron.
  const memoryDeadline = new Date(Date.now() + MEMORY_WINDOW_DAYS * 86400000).toISOString()
  // Accumulated for the order-confirmation email.
  const emailItems: { name: string; priceCents: number }[] = []
  // Any item that failed for a retryable reason forces a non-2xx so Stripe
  // redelivers. Safe now that each item carries an idempotency key: the retry
  // adopts what already landed and only fills in what is missing.
  let hadFailure = false

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

  // Catalog document — used to itemise the confirmation email at the same
  // per-product × metal prices checkout charged (falls back to code defaults).
  const { doc: catalog } = await getCatalog()

  for (const [index, item] of itemList.entries()) {
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

    // The bracelet's 'square' key is an asscher cut — label it accordingly.
    const shapeLabel = shape
      ? (productType === 'bracelet' && shape === 'square'
          ? 'Asscher'
          : `${shape.charAt(0).toUpperCase()}${shape.slice(1)}`)
      : 'Tijoray'
    emailItems.push({
      name:       `${shapeLabel} ${productLabel}`,
      priceCents: priceCents(catalog, item.collectionId ?? 'birthstone', productType, item.metal as Metal),
    })

    const genSerial = () => 'TIJ-' + randomBytes(5).toString('hex').toUpperCase()

    // Idempotency. Stripe delivers AT-LEAST-ONCE, so a redelivery must not mint
    // a second piece for an order paid for once. Keyed per (session, item)
    // rather than per session — see migration 0006 for why a session-level
    // guard silently drops items when a retry follows a partial failure.
    const lookupExisting = () => supabase
      .from('Pieces')
      .select('id')
      .eq('stripe_session_id', session.id)
      .eq('stripe_item_index', index)
      .maybeSingle()

    const { data: existing, error: existingErr } = await lookupExisting()
    if (existingErr) {
      console.error(`Piece lookup failed (item ${index}):`, existingErr)
      hadFailure = true
      continue
    }

    let piece: { id: string } | null = existing ?? null
    let pieceErr: unknown = null

    if (!piece) {
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
            status:          'crafting',
            memory_deadline: memoryDeadline,
            shipping_address: shippingAddress,
            recipient_name:  recipientName  || null,
            recipient_phone: recipientPhone || null,
            stripe_session_id: session.id,
            stripe_item_index: index,
          })
          .select('id')
          .single()

        piece = result.data
        pieceErr = result.error
        if (!result.error) break
        if ((result.error as any).code !== '23505') break

        // 23505 now covers two distinct constraints. A `serial` collision is
        // retryable with a fresh serial; a (session, item) collision means a
        // concurrent delivery of this same event won the race, so adopt its row
        // instead of treating it as an error.
        const detail = `${(result.error as any).message ?? ''} ${(result.error as any).details ?? ''}`
        if (detail.includes('pieces_stripe_session_item_key')) {
          const { data: raced } = await lookupExisting()
          if (raced) {
            piece = raced
            pieceErr = null
          }
          break
        }
      }
    }

    if (pieceErr || !piece) {
      console.error(`Failed to insert piece (item ${index}):`, pieceErr)
      hadFailure = true
      continue // try remaining items; the 500 below makes Stripe retry
    }

    // Ensure the gift-message row exists, rather than blindly inserting one.
    // Split from the piece insert so a redelivery that adopts an already-created
    // piece still repairs a message that failed to land the first time.
    const { data: existingMsg, error: msgLookupErr } = await supabase
      .from('Messages').select('id').eq('piece_id', piece.id).limit(1)
    if (msgLookupErr) {
      console.error(`Message lookup failed (item ${index}):`, msgLookupErr)
      hadFailure = true
      continue
    }
    if (!existingMsg?.length) {
      const { error: msgErr } = await supabase.from('Messages').insert({
        piece_id:  piece.id,
        sender_id: userId,
        title:     'Your Gift Message',
      })
      if (msgErr) {
        console.error(`Failed to insert message (item ${index}):`, msgErr)
        hadFailure = true
        continue
      }
    }

    // No Vault row is created here, deliberately.
    //
    // The vault is the RECIPIENT's private storage, not the buyer's — the app
    // never issues the `vault` data key to a piece's sender, so a vault owned
    // by the buyer is one nobody can ever open. The app's VaultService
    // .ensureVault creates the row on first use, keyed on
    // (piece_id, owner_id = the signed-in recipient).
    //
    // Creating one here was worse than redundant: the recipient's ensureVault
    // filters on their own owner_id, so it would not find the buyer's row and
    // would insert a second one for the same piece — or, if piece_id carries a
    // unique constraint, fail outright and leave the recipient with no vault.
  }

  // Order-confirmation email (being crafted + start-building CTA). Keyed on the
  // Stripe session id so a re-delivered webhook never double-sends.
  // Held back when an item failed: the 500 below asks Stripe to redeliver, and
  // "your order is being crafted" should not go out for an order that is not
  // fully recorded. The retry sends it once every piece has landed (the send is
  // itself keyed on the session id, so it stays single-shot).
  const customerEmail = session.customer_details?.email
  if (!hadFailure && customerEmail && emailItems.length > 0) {
    try {
      await sendCraftingEmail({
        sessionId:  session.id,
        to:         customerEmail,
        buyerName:  session.customer_details?.name,
        items:      emailItems,
        totalCents: session.amount_total ?? emailItems.reduce((s, i) => s + i.priceCents, 0),
        // amount_total includes tax, so the receipt needs the tax line to add up.
        taxCents:   session.total_details?.amount_tax ?? 0,
      })
    } catch (err) {
      console.error('Crafting email error:', err)
    }
  }

  // A paid order that did not fully persist must NOT be acknowledged: a 200
  // tells Stripe the event is handled and it never retries, so the order would
  // vanish with no trace outside these logs. 500 puts it back in the retry
  // queue, and the per-item idempotency keys make that redelivery safe.
  if (hadFailure) {
    console.error(`Webhook ${event.id}: one or more items failed to persist; asking Stripe to retry`)
    return res.status(500).json({ error: 'Failed to persist all items' })
  }

  return res.status(200).json({ received: true })
}

// Disable Vercel's body parser so we can read the raw stream for Stripe signature verification
export const config = {
  api: { bodyParser: false },
  runtime: 'nodejs',
}
