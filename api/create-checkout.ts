import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import {
  METAL_LABELS_LONG       as METAL_LABELS,
  METAL_COLOR_LABELS_LONG as METAL_COLOR_LABELS,
  STONE_NAMES_SHORT       as BIRTHSTONE_NAMES,
  PRODUCT_TYPE_LABELS,
} from '../src/data/catalog.js'
import type { Metal } from '../src/data/catalog.js'
import { getCatalog } from '../lib/catalog-store.js'
import { priceCents } from '../src/data/catalog-doc.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Verify caller identity — extract userId from the Bearer token, never from the body
  const authHeader = req.headers.authorization ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const userId = user.id

  const { items, recipientName, recipientPhone, forSelf }: {
    items: CartItem[]
    recipientName?: string
    recipientPhone?: string
    forSelf?: boolean
  } = req.body

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // When the buyer is purchasing for themselves, the recipient IS the buyer —
  // derive name/phone from their own account rather than the (omitted) form fields.
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const selfName  = String(meta.name ?? meta.full_name ?? meta.fullName ?? '').trim() || (user.email ?? '')
  const selfPhone = String(meta.phone ?? meta.phone_number ?? '').trim()

  const finalRecipientName  = forSelf ? selfName  : (recipientName  ?? '')
  const finalRecipientPhone = forSelf ? selfPhone : (recipientPhone ?? '')

  // Build Stripe line items. Each item's full config goes into its OWN metadata
  // key (item_0, item_1, …) rather than one combined value — Stripe caps each
  // metadata value at 500 chars, which a multi-item cart would otherwise blow.
  const lineItems: Array<{
    price_data: { currency: string; unit_amount: number; product_data: { name: string; description: string } }
    quantity: number
  }> = []
  const itemMeta: Record<string, string> = {}

  // Prices come from the DB-backed catalog (per product × metal), with the code
  // defaults as fallback. NEVER trust a price from the client `items` payload.
  const { doc: catalog } = await getCatalog()

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
    const metalLine      = item.metal === 'steel'
      ? METAL_LABELS[item.metal]
      : `${METAL_COLOR_LABELS[item.metalColor]} ${METAL_LABELS[item.metal]}`

    // Look up IDs
    const { data: stones } = await supabase.from('Stones').select('id').ilike('name', birthstoneName).limit(1)
    const stoneId = stones?.[0]?.id ?? ''

    const metalColour = item.metal === 'steel' ? 'silver' : item.metalColor
    const { data: metals } = await supabase.from('Metals').select('id')
      .eq('purity', item.metal).eq('colour', metalColour).limit(1)
    const metalId = metals?.[0]?.id ?? ''

    lineItems.push({
      price_data: {
        currency:     'usd',
        unit_amount:  priceCents(catalog, collectionId, productType, item.metal as Metal),
        product_data: {
          name:        `The Tijoray ${productLabel} — ${shapeLabel}`,
          description: item.specLine ?? `${metalLine} · ${birthstoneName}`,
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

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    shipping_address_collection: {
      allowed_countries: ['US', 'CA', 'GB', 'AU'],
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
