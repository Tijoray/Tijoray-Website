import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-03-31.basil' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const METAL_PRICES_CENTS: Record<string, number> = {
  steel: 29900, silver: 39900, '10k': 79900, '18k': 129900,
}

const METAL_LABELS: Record<string, string> = {
  steel: 'Stainless Steel', silver: 'Sterling Silver', '10k': '10K Gold', '18k': '18K Gold',
}

const METAL_COLOR_LABELS: Record<string, string> = {
  white: 'White', gold: 'Yellow', rose: 'Rose',
}

const BIRTHSTONE_NAMES = [
  'Garnet', 'Amethyst', 'Aquamarine', 'White Topaz',
  'Emerald', 'Pearl', 'Ruby', 'Peridot',
  'Sapphire', 'Pink Tourmaline', 'Citrine', 'Turquoise',
]

type CartItem = {
  shape:           string
  metal:           string
  metalColor:      string
  birthstoneIndex: number
  price:           number
  specLine:        string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { items, userId, recipientName, recipientPhone }: {
    items: CartItem[]
    userId: string
    recipientName?: string
    recipientPhone?: string
  } = req.body

  if (!Array.isArray(items) || items.length === 0 || !userId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Build Stripe line items + collect metadata for webhook
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  const itemMetadata: string[] = []

  for (const item of items) {
    const birthstoneName = BIRTHSTONE_NAMES[item.birthstoneIndex] ?? 'Unknown'
    const shapeLabel     = item.shape.charAt(0).toUpperCase() + item.shape.slice(1)
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
        unit_amount:  METAL_PRICES_CENTS[item.metal] ?? 129900,
        product_data: {
          name:        `The Tijoray Pendant — ${shapeLabel}`,
          description: item.specLine ?? `${metalLine} · ${birthstoneName}`,
        },
      },
      quantity: 1,
    })

    itemMetadata.push(JSON.stringify({
      shape:   item.shape,
      stoneId,
      metalId,
    }))
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
      items:          JSON.stringify(itemMetadata),
      recipientName:  recipientName  ?? '',
      recipientPhone: recipientPhone ?? '',
    },
    success_url: `${process.env.VITE_SITE_URL ?? 'https://tijoray.com'}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.VITE_SITE_URL ?? 'https://tijoray.com'}/cart`,
  })

  return res.status(200).json({ sessionUrl: session.url })
}
