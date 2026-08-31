/**
 * Promotion codes — validation for the money path, and issuance/reporting for
 * the admin panel.
 *
 * Division of responsibility, which is the whole design:
 *
 *   Stripe owns the DISCOUNT. It stores the coupon, enforces expiry, redemption
 *   caps, minimum order value and first-order-only restrictions, and — the part
 *   that matters most — it applies the discount BEFORE tax is calculated, which
 *   is what a tax authority expects and what we would get wrong by hand.
 *
 *   We own the CONTEXT. Who a code was given to, for what campaign, with what
 *   note. Stripe has nowhere to put that, and a coupon with nine redemptions and
 *   no memory of who it was issued to is not a record of anything.
 *
 * Nothing here ever computes a charge. `quote()` produces a number to SHOW a
 * shopper before they leave the site; the amount actually billed is always the
 * one Stripe derives from the promotion code id we hand to Checkout. If the two
 * ever disagree, Stripe is right by construction.
 *
 * Server-only (Stripe secret key + service-role Supabase).
 */
import Stripe from 'stripe'
import { admin } from './admin.js'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

/** Codes are typed by hand, so they are compared without case or stray spaces. */
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

export type PromoQuote = {
  ok: true
  /** Stripe promotion code id — the ONLY thing safe to pass to Checkout. */
  promotionCodeId: string
  couponId: string
  code: string
  /** Human label, e.g. "20% off" or "$50 off". */
  label: string
  /** Indicative discount on the current cart, for display only. */
  discountCents: number
}

export type PromoRejection = { ok: false; reason: string }

/**
 * Resolve a customer-entered code against Stripe and check it can be applied to
 * this cart right now.
 *
 * The restriction checks below duplicate ones Stripe also performs at redemption
 * — deliberately. Without them the shopper's only feedback is a rejection on
 * Stripe's own page after they have already left ours, with wording we do not
 * control. Duplicating them buys a specific error next to the input box; Stripe
 * still has the final say, so a race (a cap filling between quote and pay) fails
 * safely there rather than being silently discounted here.
 */
export async function quotePromo(opts: {
  code: string
  subtotalCents: number
  currency?: string
  /** Stripe customer, when known — required to evaluate first-order-only codes. */
  customerId?: string | null
}): Promise<PromoQuote | PromoRejection> {
  const code = normalizeCode(opts.code)
  if (!code) return { ok: false, reason: 'Enter a code.' }

  const currency = opts.currency ?? 'usd'

  let list: Stripe.ApiList<Stripe.PromotionCode>
  try {
    // A promotion code no longer carries its discount directly: as of API
    // 2026-03-25 it points at a `promotion`, which points at the coupon. The
    // coupon holds the actual terms, so it has to be expanded or every field
    // below reads as an opaque id string.
    list = await stripe.promotionCodes.list({
      code, active: true, limit: 1, expand: ['data.promotion.coupon'],
    })
  } catch (err) {
    console.error('[promos] lookup failed', err)
    // A payments outage must not be reported as "your code is invalid" — that
    // sends the shopper away believing they were given a dud code.
    return { ok: false, reason: 'We could not check that code just now. Please try again.' }
  }

  const promo = list.data[0]
  if (!promo) return { ok: false, reason: 'That code isn’t recognised.' }

  const coupon = resolveCoupon(promo)
  // An unexpanded coupon means the expand above silently did not apply. Treating
  // that as "invalid code" would blame the shopper for our own bad request.
  if (!coupon) {
    console.error('[promos] coupon did not expand on', promo.id)
    return { ok: false, reason: 'We could not check that code just now. Please try again.' }
  }
  if (!coupon.valid) return { ok: false, reason: 'That code has expired.' }

  if (promo.expires_at && promo.expires_at * 1000 < Date.now()) {
    return { ok: false, reason: 'That code has expired.' }
  }
  if (promo.max_redemptions != null && promo.times_redeemed >= promo.max_redemptions) {
    return { ok: false, reason: 'That code has already been fully redeemed.' }
  }

  const restrictions = promo.restrictions
  const minimum = restrictions?.minimum_amount
  if (minimum != null && opts.subtotalCents < minimum) {
    return { ok: false, reason: `That code applies to orders over ${formatMoney(minimum, currency)}.` }
  }
  // Only checkable with a customer attached. When we have no customer yet
  // (a first-time buyer, which is precisely who this restriction targets) the
  // code is allowed through and Stripe adjudicates at payment.
  if (restrictions?.first_time_transaction && opts.customerId) {
    const prior = await hasPriorOrder(opts.customerId)
    if (prior) return { ok: false, reason: 'That code is for first orders only.' }
  }

  return {
    ok: true,
    promotionCodeId: promo.id,
    couponId: coupon.id,
    code: promo.code,
    label: couponLabel(coupon),
    discountCents: discountFor(coupon, opts.subtotalCents),
  }
}

/** Has this Stripe customer already paid for something? */
async function hasPriorOrder(customerId: string): Promise<boolean> {
  try {
    const { data } = await stripe.paymentIntents.list({ customer: customerId, limit: 20 })
    return data.some(pi => pi.status === 'succeeded')
  } catch {
    return false // fail open: never block a sale on a restriction check
  }
}

/**
 * Pull the expanded coupon off a promotion code, or null if it came back as a
 * bare id. Only `type: 'coupon'` promotions exist today, but the field is a
 * discriminated union, so it is narrowed rather than assumed.
 */
function resolveCoupon(promo: Stripe.PromotionCode): Stripe.Coupon | null {
  const c = promo.promotion?.coupon
  return c && typeof c === 'object' ? c : null
}

/** Indicative discount for display. Stripe recomputes this authoritatively. */
export function discountFor(coupon: Stripe.Coupon, subtotalCents: number): number {
  if (coupon.percent_off) return Math.round((subtotalCents * coupon.percent_off) / 100)
  if (coupon.amount_off)  return Math.min(coupon.amount_off, subtotalCents)
  return 0
}

export function couponLabel(coupon: Pick<Stripe.Coupon, 'percent_off' | 'amount_off' | 'currency'>): string {
  if (coupon.percent_off) return `${trimZeros(coupon.percent_off)}% off`
  if (coupon.amount_off)  return `${formatMoney(coupon.amount_off, coupon.currency ?? 'usd')} off`
  return 'Discount'
}

// Number() first: percent_off is read back from a Postgres numeric column in
// the admin path, and PostgREST's serialisation of numerics is not something to
// stake a .toFixed() call on.
const trimZeros = (n: number) => String(Number(Number(n).toFixed(2)))

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: currency.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)
}

/* ── Issuance (admin) ──────────────────────────────────────────────────────── */

export type NewPromo = {
  code: string
  percentOff?: number | null
  amountOffCents?: number | null
  maxRedemptions?: number | null
  expiresAt?: string | null          // ISO date
  minimumAmountCents?: number | null
  firstTimeOnly?: boolean
  issuedToName?: string | null
  issuedToEmail?: string | null
  campaign?: string | null
  notes?: string | null
}

/**
 * Mint a coupon + promotion code in Stripe, then record who it was issued to.
 *
 * The Stripe objects are created first and the ledger row second, so the failure
 * mode is an un-annotated code rather than a ledger row promising a discount
 * that does not exist. An orphan is visible in the admin list (Stripe is what
 * the list enumerates) and can be annotated later; the reverse would hand a
 * customer a code that fails at the till.
 */
export async function createPromo(input: NewPromo, actorEmail: string) {
  const code = normalizeCode(input.code)
  if (!code) throw new Error('A code is required')
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
    throw new Error('Codes may use letters, numbers, hyphens and underscores (3–40 characters)')
  }

  const percentOff = numOrNull(input.percentOff)
  const amountOff  = intOrNull(input.amountOffCents)
  if ((percentOff == null) === (amountOff == null)) {
    throw new Error('Choose exactly one of percent off or amount off')
  }
  if (percentOff != null && (percentOff <= 0 || percentOff > 100)) {
    throw new Error('Percent off must be between 0 and 100')
  }
  if (amountOff != null && amountOff <= 0) {
    throw new Error('Amount off must be greater than zero')
  }

  // Reject a duplicate before creating anything in Stripe. Stripe would accept a
  // second promotion code with the same string only if the first were inactive,
  // and the ambiguity that creates is not worth discovering at redemption.
  const { data: clash } = await admin
    .from('Promo_Codes').select('id').ilike('code', code).maybeSingle()
  if (clash) throw new Error(`The code ${code} already exists`)

  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null
  if (expiresAt && Number.isNaN(expiresAt.getTime())) throw new Error('Invalid expiry date')
  if (expiresAt && expiresAt.getTime() < Date.now()) throw new Error('Expiry must be in the future')

  const maxRedemptions = intOrNull(input.maxRedemptions)
  if (maxRedemptions != null && maxRedemptions < 1) throw new Error('Redemption limit must be at least 1')

  const minimumAmount = intOrNull(input.minimumAmountCents)

  // `duration: 'once'` is the only meaningful value for one-off payments — the
  // repeating/forever durations describe how many subscription invoices a
  // discount survives, and there are no subscriptions here.
  const coupon = await stripe.coupons.create({
    duration: 'once',
    name: code,
    ...(percentOff != null ? { percent_off: percentOff } : {}),
    ...(amountOff  != null ? { amount_off: amountOff, currency: 'usd' } : {}),
    metadata: { created_by: actorEmail, campaign: input.campaign ?? '' },
  })

  const promotionCode = await stripe.promotionCodes.create({
    promotion: { type: 'coupon', coupon: coupon.id },
    code,
    active: true,
    ...(maxRedemptions != null ? { max_redemptions: maxRedemptions } : {}),
    ...(expiresAt ? { expires_at: Math.floor(expiresAt.getTime() / 1000) } : {}),
    restrictions: {
      ...(input.firstTimeOnly ? { first_time_transaction: true } : {}),
      ...(minimumAmount != null ? { minimum_amount: minimumAmount, minimum_amount_currency: 'usd' } : {}),
    },
    metadata: {
      issued_to_name:  input.issuedToName ?? '',
      issued_to_email: input.issuedToEmail ?? '',
      campaign:        input.campaign ?? '',
      created_by:      actorEmail,
    },
  })

  const { data: row, error } = await admin.from('Promo_Codes').insert({
    stripe_promotion_code_id: promotionCode.id,
    stripe_coupon_id:         coupon.id,
    code,
    percent_off:          percentOff,
    amount_off_cents:     amountOff,
    currency:             'usd',
    max_redemptions:      maxRedemptions,
    expires_at:           expiresAt?.toISOString() ?? null,
    minimum_amount_cents: minimumAmount,
    first_time_only:      !!input.firstTimeOnly,
    issued_to_name:       input.issuedToName  || null,
    issued_to_email:      input.issuedToEmail || null,
    campaign:             input.campaign      || null,
    notes:                input.notes         || null,
    active:               true,
    created_by:           actorEmail,
  }).select('*').single()

  if (error) {
    // The code is live in Stripe and will work; only the annotation is missing.
    console.error('[promos] ledger insert failed after Stripe create', error)
    throw new Error(
      `Created ${code} in Stripe, but failed to save its notes: ${error.message}. ` +
      'The code is usable; reopen this page to annotate it.',
    )
  }

  return { row, promotionCode, coupon }
}

/**
 * Edit a code. The discount itself is immutable in Stripe (a coupon's terms
 * cannot change once issued — people are holding it), so this only touches the
 * two things that can honestly change: whether the code is live, and what we
 * have written about who holds it.
 */
export async function updatePromo(
  promotionCodeId: string,
  patch: { active?: boolean; issuedToName?: string | null; issuedToEmail?: string | null; campaign?: string | null; notes?: string | null },
) {
  if (typeof patch.active === 'boolean') {
    // Stripe first: if it refuses, our ledger must not claim otherwise.
    await stripe.promotionCodes.update(promotionCodeId, { active: patch.active })
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof patch.active === 'boolean') update.active = patch.active
  if ('issuedToName'  in patch) update.issued_to_name  = patch.issuedToName  || null
  if ('issuedToEmail' in patch) update.issued_to_email = patch.issuedToEmail || null
  if ('campaign'      in patch) update.campaign        = patch.campaign      || null
  if ('notes'         in patch) update.notes           = patch.notes         || null

  const { data, error } = await admin
    .from('Promo_Codes').update(update).eq('stripe_promotion_code_id', promotionCodeId).select('*').single()
  if (error) throw error
  return data
}

const numOrNull = (v: unknown): number | null =>
  v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v)
const intOrNull = (v: unknown): number | null => {
  const n = numOrNull(v)
  return n == null ? null : Math.round(n)
}
