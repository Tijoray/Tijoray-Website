import { supabase } from './supabase'

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
  estRevenueCents: number
  customerCount: number
  emailByType: Record<string, number>
  recentAudit: { id: string; actor_email: string; action: string; entity_type: string | null; entity_id: string | null; created_at: string }[]
}

export type AdminCustomer = {
  id: string; name: string | null; email: string | null; phone_number: string | null
  address: unknown; created_at: string; piecesBought: number; estSpendCents: number
}

export type EmailRow = { id: string; ref: string; type: string; recipient: string | null; sent_at: string }

/* ── API surface ─────────────────────────────────────────────────────────────── */

export const adminApi = {
  whoami:        () => call<{ isAdmin: boolean; email: string }>('whoami'),
  dashboard:     () => call<DashboardStats>('dashboard'),
  listPieces:    (p: { status?: string | null; search?: string } = {}) => call<{ pieces: AdminPieceRow[] }>('list-pieces', p),
  getPiece:      (id: string) => call<PieceDetail>('get-piece', { id }),
  updatePiece:   (id: string, patch: Record<string, unknown>) => call<{ piece: AdminPieceRow; emailResult: string | null }>('update-piece', { id, patch }),
  listCustomers: (p: { search?: string } = {}) => call<{ customers: AdminCustomer[] }>('list-customers', p),
  listEmails:    (p: { type?: string | null } = {}) => call<{ emails: EmailRow[] }>('list-emails', p),
  signFile:      (key: string) => call<{ url: string }>('sign-file', { key }),
}
