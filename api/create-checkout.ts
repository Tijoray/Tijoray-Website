import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import {
  METAL_LABELS_LONG       as METAL_LABELS,
  METAL_COLOR_LABELS_LONG as METAL_COLOR_LABELS,
  STONE_NAMES_SHORT       as BIRTHSTONE_NAMES,
  PRODUCT_TYPE_LABELS,
} from '../src/data/catalog.js'
import type { Metal } from '../src/data/catalog.js'
import { getCatalog } from '../lib/catalog-store.js'
import { priceCents, type CatalogDoc } from '../src/data/catalog-doc.js'
import { stripe, quotePromo } from '../lib/promos.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type CartItem = {
  productType?:    string
  collectionId?:   string
  shape:           string
  metal:           string
  metalColor:      string
  birthstoneIndex: number
  price:           number
  specLine:        string
}

/**
 * Server-side cart subtotal, pre-discount and pre-tax.
 *
 * Recomputed from the catalog rather than summed from `item.price`, for the same
 * reason the line items are: the client's number is a display value that a
 * shopper's devtools can edit. A promotion code's minimum-order restriction is
 * checked against this, so trusting the client here would let anyone unlock a
 * "spend $2000, save $200" code with a one-dollar cart.
 */
function cartSubtotalCents(catalog: CatalogDoc, items: CartItem[]): number {
  return items.reduce((sum, item) => sum + priceCents(
    catalog,
    item.collectionId ?? 'birthstone',
    item.productType  ?? 'pendant',
    item.metal as Metal,
  ), 0)
}

/** Read a buyer's Stripe customer id, without minting one. */
async function lookupCustomer(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('Users').select('stripe_customer_id').eq('id', userId).maybeSingle()
  return data?.stripe_customer_id ?? null
}

/**
 * The buyer's Stripe customer, created on first checkout.
 *
 * Worth the extra round trip for two reasons. Promotion codes restricted to a
 * first order are evaluated against the customer's payment history, which Stripe
 * cannot do for an anonymous session — without this, "first order only" silently
 * applies to everyone. And it keeps one buyer as one customer, so their receipts
 * and saved tax location accumulate in one place instead of a fresh customer per
 * purchase.
 *
 * Fails OPEN. A customer record is a convenience; a sale is not. If Stripe or the
 * write fails we proceed anonymously — first-order-only codes then fall through
 * to Stripe's own adjudication at payment, which is the safe direction.
 *
 * Two simultaneous first checkouts can mint two customers and keep the second.
 * That is a cosmetic duplicate in the Stripe dashboard, not a payment fault, and
 * locking a row to prevent it costs more than it saves.
 */
async function getOrCreateCustomer(userId: string, email: string | null, name: string): Promise<string | null> {
  const existing = await lookupCustomer(userId)
  if (existing) return existing

  try {
    const customer = await stripe.customers.create({
      email: email ?? undefined,
      name:  name || undefined,
      metadata: { supabase_user_id: userId },
    })
    await supabase.from('Users').update({ stripe_customer_id: customer.id }).eq('id', userId)
    return customer.id
  } catch (err) {
    console.error('[checkout] could not create Stripe customer', err)
    return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Verify caller identity — extract userId from the Bearer token, never from the body
  const authHeader = req.headers.authorization ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const userId = user.id

  const { items, recipientName, recipientPhone, forSelf, promoCode, intent }: {
    items: CartItem[]
    recipientName?: string
    recipientPhone?: string
    forSelf?: boolean
    promoCode?: string
    intent?: string
  } = req.body

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // ── Promo code check, for the box on the checkout page ────────────────────
  //
  // Shares this endpoint rather than adding its own so the deployment does not
  // grow another serverless function, and so the subtotal a code is judged
  // against is computed by exactly the same code that will price the sale.
  //
  // A rejected code answers 200, not 4xx: "this code has expired" is a normal
  // outcome of asking, not a failed request, and the client renders the reason
  // beside the input instead of an error banner.
  if (intent === 'validate-promo') {
    const { doc } = await getCatalog()
    const subtotal = cartSubtotalCents(doc, items)
    const quote = await quotePromo({
      code: String(promoCode ?? ''),
      subtotalCents: subtotal,
      customerId: await lookupCustomer(userId),
    })
    return res.status(200).json(
      quote.ok
        ? { ok: true, code: quote.code, label: quote.label, discountCents: quote.discountCents, subtotalCents: subtotal }
        : { ok: false, reason: quote.reason },
    )
  }

  // When the buyer is purchasing for themselves, the recipient IS the buyer —
  // derive name/phone from their own account rather than the (omitted) form fields.
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const selfName  = String(meta.name ?? meta.full_name ?? meta.fullName ?? '').trim() || (user.email ?? '')

  // Prefer the SMS-confirmed number over anything in metadata.
  //
  // recipient_phone is not contact detail — it is the key the mobile app
  // matches a piece against when someone claims it, and the claimant has to
  // prove that exact number by OTP. Minting it from user_metadata meant
  // minting it from a value the buyer typed once, possibly long ago, and never
  // proved: a single wrong digit produces a piece that only the wrong verified
  // handset can ever open, and nobody finds out until the recipient's
  // collection is mysteriously empty. auth.users.phone is only populated by a
  // completed OTP round-trip, so when it is there it is the number to use.
  //
  // The metadata fallback stays for buyers who have never verified — the web
  // has no OTP flow, so refusing them would block self-purchase entirely. It
  // is a target for a later proof, not a proof itself.
  const confirmedPhone = user.phone_confirmed_at
    ? String(user.phone ?? '').trim()
    : ''
  const typedPhone = String(meta.phone ?? meta.phone_number ?? '').trim()
  // auth.users.phone is stored without the leading +; recipient_phone is
  // matched in E.164, so put it back.
  const selfPhone = confirmedPhone
    ? (confirmedPhone.startsWith('+') ? confirmedPhone : `+${confirmedPhone}`)
    : typedPhone

  const finalRecipientName  = forSelf ? selfName  : (recipientName  ?? '')
  const finalRecipientPhone = forSelf ? selfPhone : (recipientPhone ?? '')

  // Build Stripe line items. Each item's full config goes into its OWN metadata
  // key (item_0, item_1, …) rather than one combined value — Stripe caps each
  // metadata value at 500 chars, which a multi-item cart would otherwise blow.
  const lineItems: Array<{
    price_data: {
      currency: string
      unit_amount: number
      tax_behavior: 'exclusive' | 'inclusive'
      product_data: { name: string; description: string; tax_code: string }
    }
    quantity: number
  }> = []
  const itemMeta: Record<string, string> = {}

  // Prices come from the DB-backed catalog (per product × metal), with the code
  // defaults as fallback. NEVER trust a price from the client `items` payload.
  const { doc: catalog } = await getCatalog()
  const subtotal = cartSubtotalCents(catalog, items)

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const productType    = item.productType  ?? 'pendant'
    const collectionId   = item.collectionId ?? 'birthstone'
    const birthstoneName = BIRTHSTONE_NAMES[item.birthstoneIndex] ?? 'Unknown'
    const productLabel   = PRODUCT_TYPE_LABELS[productType] ?? 'Pendant'
    // The bracelet's 'square' key is an asscher cut — label it accordingly.
    const shapeLabel     = productType === 'bracelet' && item.shape === 'square'
      ? 'Asscher'
      : item.shape.charAt(0).toUpperCase() + item.shape.slice(1)
    const metalLine      = `${METAL_COLOR_LABELS[item.metalColor]} ${METAL_LABELS[item.metal]}`

    // Look up IDs
    const { data: stones } = await supabase.from('Stones').select('id').ilike('name', birthstoneName).limit(1)
    const stoneId = stones?.[0]?.id ?? ''

    const { data: metals } = await supabase.from('Metals').select('id')
      .eq('purity', item.metal).eq('colour', item.metalColor).limit(1)
    const metalId = metals?.[0]?.id ?? ''

    lineItems.push({
      price_data: {
        currency:     'usd',
        unit_amount:  priceCents(catalog, collectionId, productType, item.metal as Metal),
        // Catalog prices are pre-tax; Stripe adds tax on top at checkout. This
        // is required once automatic_tax is on, and is inert while it is off.
        tax_behavior: 'exclusive',
        product_data: {
          name:        `The Tijoray ${shapeLabel} ${productLabel}`,
          description: item.specLine ?? `${metalLine} · ${birthstoneName}`,
          // Jewellery has no dedicated Stripe tax code; physical goods is the
          // correct classification for a shipped piece.
          tax_code:    'txcd_99999999', // General - Tangible Goods
        },
      },
      quantity: 1,
    })

    // Full configuration the customer chose — persisted to Pieces.config by the webhook.
    itemMeta[`item_${i}`] = JSON.stringify({
      productType,
      collectionId,
      shape:           item.shape,
      metal:           item.metal,
      metalColor:      item.metalColor,
      birthstoneIndex: item.birthstoneIndex,
      stoneId,
      metalId,
    })
  }

  // Stripe Tax. Kept behind a flag because enabling it before the account's
  // head office + registrations are configured does NOT fail at session
  // creation — the session is created happily and the calculation then fails
  // for the customer mid-checkout. Flip STRIPE_TAX_ENABLED to 'true' only once
  // https://dashboard.stripe.com/settings/tax shows the account as active.
  //
  // Registered in Ontario: Stripe charges the destination province's GST/HST on
  // Canadian orders and zero-rates exports, so most international orders come
  // through with no tax line.
  const taxEnabled = process.env.STRIPE_TAX_ENABLED === 'true'

  // The buyer's Stripe customer. Also what makes `customer_update` below legal —
  // that field is rejected outright when no customer is attached.
  const customerId = await getOrCreateCustomer(userId, user.email ?? null, selfName)

  // ── Discount ──────────────────────────────────────────────────────────────
  //
  // A code entered on our checkout page is re-validated here before it is
  // honoured. The client already asked once, but that answer is a display value
  // it could have fabricated, and minutes may have passed — a redemption cap can
  // fill between the two calls.
  //
  // Only the promotion code ID reaches Stripe, never an amount. Stripe applies
  // the discount to the subtotal and calculates tax on what remains, which is the
  // order a tax authority expects and the single easiest thing to get wrong by
  // computing a discounted price ourselves.
  //
  // `discounts` and `allow_promotion_codes` are mutually exclusive in Checkout,
  // so a shopper who typed nothing here still gets Stripe's own code box.
  let discounts: { promotion_code: string }[] | undefined
  if (typeof promoCode === 'string' && promoCode.trim()) {
    const quote = await quotePromo({ code: promoCode, subtotalCents: subtotal, customerId })
    if (!quote.ok) return res.status(400).json({ error: quote.reason })
    discounts = [{ promotion_code: quote.promotionCodeId }]
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    automatic_tax: { enabled: taxEnabled },
    ...(customerId
      ? {
          customer: customerId,
          // Required by Stripe once a customer is attached and automatic_tax is
          // on: the tax engine needs an address on the customer, and 'auto' is
          // what writes the one collected at checkout back to them.
          customer_update: { address: 'auto' as const, name: 'auto' as const, shipping: 'auto' as const },
        }
      : {}),
    ...(discounts ? { discounts } : { allow_promotion_codes: true }),
    shipping_address_collection: {
      allowed_countries: ['US', 'CA', 'GB', 'AU'],
    },
    // Free shipping stated as an actual zero-cost rate rather than only as copy
    // on our own summary. It carries a shipping tax code because some
    // jurisdictions tax delivery on a taxable order; at $0 that resolves to
    // nothing, and it stays correct if shipping is ever charged.
    shipping_options: [{
      shipping_rate_data: {
        type: 'fixed_amount' as const,
        fixed_amount: { amount: 0, currency: 'usd' },
        display_name: 'Complimentary shipping',
        tax_behavior: 'exclusive' as const,
        tax_code: 'txcd_92010001', // Shipping
      },
    }],
    // ── The invoice ───────────────────────────────────────────────────────
    //
    // Without this a customer gets, at best, a payment RECEIPT — and only if the
    // account has automatic receipts switched on, which is off by default and
    // never sent for test payments. A receipt is not an invoice: it carries no
    // invoice number, no business address, and no tax registration number, so a
    // business buyer cannot claim an input tax credit from it and we have no
    // sequentially numbered document for an order we charged tax on.
    //
    // Stripe emails the invoice summary (with PDFs of both the invoice and the
    // receipt) once payment actually SUCCEEDS — not when checkout closes. It
    // still requires Settings → Business → Customer emails → "Successful
    // payments" to be on; this flag alone sends nothing. See TAX_AND_PROMOS.md.
    //
    // Billed by Stripe at 0.4% of the transaction, capped at $2 per invoice.
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: 'Handcrafted Tijoray piece',
        // The tax registration number the invoice is issued under. Omitted
        // rather than faked when unset: an invoice showing a blank or wrong
        // registration is worse than one showing none, because a buyer may act
        // on it. Set STRIPE_ACCOUNT_TAX_ID once the account tax ID exists.
        ...(process.env.STRIPE_ACCOUNT_TAX_ID
          ? { account_tax_ids: [process.env.STRIPE_ACCOUNT_TAX_ID] }
          : {}),
        metadata: { userId },
      },
    },
    metadata: {
      userId,
      itemCount:      String(items.length),
      ...itemMeta,
      recipientName:  finalRecipientName,
      recipientPhone: finalRecipientPhone,
    },
    success_url: `${process.env.VITE_SITE_URL ?? 'https://tijoray.com'}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.VITE_SITE_URL ?? 'https://tijoray.com'}/cart`,
  })

  return res.status(200).json({ sessionUrl: session.url })
}
