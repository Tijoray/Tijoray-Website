import { supabase } from './supabase'
import type { CatalogDoc } from '../data/catalog-doc'

/**
 * Client for the consolidated /api/admin router. Every call attaches the current
 * Supabase access token; the server re-verifies it against the ADMIN_EMAILS
 * allowlist, so this is a convenience layer, not the security boundary.
 */
async function call<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Not signed in')

  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, ...params }),
  })
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}))
    throw new Error((msg as { error?: string }).error ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

/* ── Response shapes ─────────────────────────────────────────────────────────── */

export type PieceConfig = {
  productType?: string; collectionId?: string; shape?: string
  metal?: string; metalColor?: string; birthstoneIndex?: number
}

export type AdminPieceRow = {
  id: string
  serial: string | null
  collection: string | null
  product_type: string | null
  config: PieceConfig | null
  status: string | null
  hardware_id: string | null
  carrier: string | null
  tracking_number: string | null
  sender_id: string | null
  receiver_id: string | null
  recipient_name: string | null
  created_at: string
  shipped_at: string | null
  memory_deadline: string | null
  first_viewed_at: string | null
  buyerName: string | null
  buyerEmail: string | null
  memoryCount: number
}

export type MessageItem = {
  id: string; message_id: string; title: string | null
  type: string; file_url: string | null; content: string | null
  sort_order: number | null; created_at: string
}

export type PieceDetail = {
  piece: AdminPieceRow & Record<string, unknown>
  buyer: { name: string | null; email: string | null } | null
  recipient: { name: string | null; email: string | null } | null
  messages: { id: string; title: string | null; revealed_at: string | null; created_at: string }[]
  items: MessageItem[]
  vault: { name: string | null; storage_used_bytes: string | null; storage_limit_bytes: string | null } | null
  emails: { type: string; recipient: string | null; sent_at: string }[]
}

export type DashboardStats = {
  totalPieces: number
  byStatus: Record<string, number>
  craftingNoMemories: number
  overdueNoMemories: number
  shippedNoTag: number
  viewed: number
  /** Metal-derived guess, kept so pieces predating the Orders table still count. */
  estRevenueCents: number
  /** Actually charged, from Orders. Zero until the first order lands post-migration. */
  revenueCents: number
  taxCollectedCents: number
  discountGivenCents: number
  orderCount: number
  /** Orders where Stripe could not finish the tax calculation. */
  unresolvedTax: number
  customerCount: number
  emailByType: Record<string, number>
  recentAudit: { id: string; actor_email: string; action: string; entity_type: string | null; entity_id: string | null; created_at: string }[]
}

export type AdminCustomer = {
  id: string; name: string | null; email: string | null
  /** SMS-confirmed number. Absent for anyone who has not verified in the app. */
  phone_number: string | null
  /** Unverified number as typed on the website. Contact detail only. */
  contact_phone: string | null
  address: unknown; created_at: string; piecesBought: number; estSpendCents: number
}

export type EmailRow = { id: string; ref: string; type: string; recipient: string | null; sent_at: string }

export type AdminPromo = {
  id: string
  code: string
  stripe_promotion_code_id: string
  stripe_coupon_id: string
  percent_off: number | null
  amount_off_cents: number | null
  currency: string
  minimum_amount_cents: number | null
  first_time_only: boolean
  issued_to_name: string | null
  issued_to_email: string | null
  campaign: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  /** "20% off" / "$50 off", precomputed server-side. */
  label: string
  /** Live from Stripe — the counter that actually enforces the cap. */
  timesRedeemed: number
  maxRedemptions: number | null
  expiresAt: string | null
  active: boolean
  exhausted: boolean
  expired: boolean
  /** Totals across orders that used this code. */
  ordersCents: number
  discountCents: number
  /** Our ledger has it, Stripe does not — archived or deleted in the dashboard. */
  missingInStripe: boolean
}

export type PromoRedemption = {
  id: string
  email: string | null
  user_id: string | null
  buyerName: string | null
  subtotal_cents: number
  discount_cents: number
  tax_cents: number
  total_cents: number
  paid_at: string | null
  promo_code: string | null
}

export type NewPromoInput = {
  code: string
  percentOff?: number | null
  amountOffCents?: number | null
  maxRedemptions?: number | null
  expiresAt?: string | null
  minimumAmountCents?: number | null
  firstTimeOnly?: boolean
  issuedToName?: string | null
  issuedToEmail?: string | null
  campaign?: string | null
  notes?: string | null
}

export type TaxJurisdiction = {
  country: string
  state: string
  orders: number
  /** Taxable base: subtotal less discount, before tax. */
  netCents: number
  taxCents: number
  grossCents: number
}

export type TaxSummary = {
  orderCount: number
  grossCents: number
  netCents: number
  taxCents: number
  discountCents: number
  unresolvedTax: number
  jurisdictions: TaxJurisdiction[]
  from: string | null
  to: string | null
}

export type CatalogLoad = {
  doc: CatalogDoc
  version: number
  updatedAt: string | null
  updatedBy: string | null
  isDefault: boolean
}
export type { CatalogDoc }

export type BindResult = {
  pieceId: string
  serial: string
  hardwareId: string
  nfcLinkedAt: string | null
  /** True when this exact tag was already recorded — nothing changed. */
  alreadyBound: boolean
}

/* ── API surface ─────────────────────────────────────────────────────────────── */

export const adminApi = {
  whoami:        () => call<{ isAdmin: boolean; email: string }>('whoami'),
  dashboard:     () => call<DashboardStats>('dashboard'),
  listPieces:    (p: { status?: string | null; search?: string } = {}) => call<{ pieces: AdminPieceRow[] }>('list-pieces', p),
  getPiece:      (id: string) => call<PieceDetail>('get-piece', { id }),
  updatePiece:   (id: string, patch: Record<string, unknown>) => call<{ piece: AdminPieceRow; emailResult: string | null }>('update-piece', { id, patch }),
  bindHardware:  (serial: string, hardwareId: string) => call<BindResult>('bind-hardware', { serial, hardwareId }),
  listCustomers: (p: { search?: string } = {}) => call<{ customers: AdminCustomer[] }>('list-customers', p),
  listEmails:    (p: { type?: string | null } = {}) => call<{ emails: EmailRow[] }>('list-emails', p),
  signFile:      (key: string) => call<{ url: string }>('sign-file', { key }),
  getCatalog:    () => call<CatalogLoad>('get-catalog'),
  saveCatalog:   (doc: CatalogDoc, expectedVersion: number) =>
    call<{ version: number; updatedAt: string }>('save-catalog', { doc, expectedVersion }),

  listPromos:    () => call<{ promos: AdminPromo[] }>('list-promos'),
  createPromo:   (promo: NewPromoInput) => call<{ promo: AdminPromo }>('create-promo', { promo }),
  updatePromo:   (promotionCodeId: string, patch: {
    active?: boolean; issuedToName?: string | null; issuedToEmail?: string | null
    campaign?: string | null; notes?: string | null
  }) => call<{ promo: AdminPromo }>('update-promo', { promotionCodeId, patch }),
  promoRedemptions: (promotionCodeId: string) =>
    call<{ redemptions: PromoRedemption[] }>('promo-redemptions', { promotionCodeId }),
  taxSummary:    (p: { from?: string | null; to?: string | null } = {}) => call<TaxSummary>('tax-summary', p),
}
