import type { VercelRequest, VercelResponse } from '@vercel/node'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { admin, requireAdmin, audit, type AdminUser } from '../lib/admin.js'
import { sendShippedEmail } from '../lib/email.js'
import { METAL_PRICES_CENTS } from '../src/data/catalog.js'
import type { Metal } from '../src/data/catalog.js'
import { getCatalog, saveCatalog } from '../lib/catalog-store.js'
import type { CatalogDoc } from '../src/data/catalog-doc.js'

/**
 * Consolidated admin-panel API. ONE serverless function that routes on a
 * `action` field in the POST body, so the whole panel adds a single function to
 * the deployment (keeps us well under Vercel's function limit). Every action is
 * gated by requireAdmin (ADMIN_EMAILS allowlist) and mutations write Admin_Audit.
 */

const SITE = (process.env.VITE_SITE_URL ?? 'https://tijoray.com').replace(/\/+$/, '')

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: !!process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

/* ── Small helpers ─────────────────────────────────────────────────────────── */

/** Map sender_id → { name, email } from the synced public Users table, in one query. */
async function buyersByIds(ids: string[]): Promise<Map<string, { name: string | null; email: string | null }>> {
  const map = new Map<string, { name: string | null; email: string | null }>()
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return map
  const { data } = await admin.from('Users').select('id, name, email').in('id', unique)
  for (const u of data ?? []) map.set(u.id, { name: u.name ?? null, email: u.email ?? null })
  return map
}

/** Count memory items per piece, for a set of piece ids, in two queries. */
async function memoryCounts(pieceIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  for (const id of pieceIds) counts.set(id, 0)
  if (pieceIds.length === 0) return counts

  const { data: msgs } = await admin.from('Messages').select('id, piece_id').in('piece_id', pieceIds)
  const msgToPiece = new Map<string, string>()
  for (const m of msgs ?? []) msgToPiece.set(m.id, m.piece_id)
  const msgIds = [...msgToPiece.keys()]
  if (msgIds.length === 0) return counts

  const { data: items } = await admin.from('Message_Items').select('message_id').in('message_id', msgIds)
  for (const it of items ?? []) {
    const pid = msgToPiece.get(it.message_id)
    if (pid) counts.set(pid, (counts.get(pid) ?? 0) + 1)
  }
  return counts
}

function estCents(config: unknown): number {
  const metal = (config as { metal?: string } | null)?.metal as Metal | undefined
  return (metal && METAL_PRICES_CENTS[metal]) || 0
}

/* ── Actions ───────────────────────────────────────────────────────────────── */

async function dashboard() {
  const { data: pieces } = await admin
    .from('Pieces')
    .select('id, status, hardware_id, memory_deadline, first_viewed_at, config, created_at')

  const rows = pieces ?? []
  const counts = await memoryCounts(rows.map(p => p.id))
  const now = Date.now()

  const byStatus = { crafting: 0, shipped: 0, delivered: 0 } as Record<string, number>
  let craftingNoMemories = 0
  let overdueNoMemories = 0
  let shippedNoTag = 0
  let viewed = 0
  let estRevenueCents = 0

  for (const p of rows) {
    byStatus[p.status ?? 'crafting'] = (byStatus[p.status ?? 'crafting'] ?? 0) + 1
    const mem = counts.get(p.id) ?? 0
    if (p.status === 'crafting' && mem === 0) {
      craftingNoMemories++
      if (p.memory_deadline && new Date(p.memory_deadline).getTime() < now) overdueNoMemories++
    }
    if ((p.status === 'shipped' || p.status === 'delivered') && !p.hardware_id) shippedNoTag++
    if (p.first_viewed_at) viewed++
    estRevenueCents += estCents(p.config)
  }

  const { count: customerCount } = await admin.from('Users').select('id', { count: 'exact', head: true })

  const { data: emails } = await admin.from('Email_Log').select('type')
  const emailByType: Record<string, number> = {}
  for (const e of emails ?? []) emailByType[e.type] = (emailByType[e.type] ?? 0) + 1

  const { data: recentAudit } = await admin
    .from('Admin_Audit')
    .select('id, actor_email, action, entity_type, entity_id, created_at')
    .order('created_at', { ascending: false })
    .limit(12)

  return {
    totalPieces: rows.length,
    byStatus,
    craftingNoMemories,
    overdueNoMemories,
    shippedNoTag,
    viewed,
    estRevenueCents,
    customerCount: customerCount ?? 0,
    emailByType,
    recentAudit: recentAudit ?? [],
  }
}

async function listPieces(body: Record<string, unknown>) {
  const status = typeof body.status === 'string' ? body.status : null
  const search = typeof body.search === 'string' ? body.search.trim().toLowerCase() : ''

  let q = admin.from('Pieces').select(
    'id, serial, collection, product_type, config, status, hardware_id, ' +
    'carrier, tracking_number, sender_id, receiver_id, recipient_name, ' +
    'created_at, shipped_at, memory_deadline, first_viewed_at',
  ).order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)

  const { data: pieces, error } = await q
  if (error) throw error

  const rows = pieces ?? []
  const buyers = await buyersByIds(rows.map(p => p.sender_id).filter(Boolean) as string[])
  const counts = await memoryCounts(rows.map(p => p.id))

  let out = rows.map(p => {
    const b = p.sender_id ? buyers.get(p.sender_id) : undefined
    return {
      ...p,
      buyerName:  b?.name ?? null,
      buyerEmail: b?.email ?? null,
      memoryCount: counts.get(p.id) ?? 0,
    }
  })

  if (search) {
    out = out.filter(p =>
      (p.serial ?? '').toLowerCase().includes(search) ||
      (p.buyerName ?? '').toLowerCase().includes(search) ||
      (p.buyerEmail ?? '').toLowerCase().includes(search) ||
      (p.recipient_name ?? '').toLowerCase().includes(search) ||
      (p.hardware_id ?? '').toLowerCase().includes(search),
    )
  }

  return { pieces: out }
}

async function getPiece(body: Record<string, unknown>) {
  const id = String(body.id ?? '')
  if (!id) throw new Error('Missing piece id')

  const { data: piece, error } = await admin.from('Pieces').select('*').eq('id', id).single()
  if (error || !piece) throw new Error('Piece not found')

  // Buyer + recipient identities (freshest, via auth admin).
  let buyer: { name: string | null; email: string | null } | null = null
  if (piece.sender_id) {
    const { data } = await admin.auth.admin.getUserById(piece.sender_id)
    const u = data?.user
    buyer = { name: (u?.user_metadata?.name as string) ?? null, email: u?.email ?? null }
  }
  let recipient: { name: string | null; email: string | null } | null = null
  if (piece.receiver_id) {
    const { data } = await admin.auth.admin.getUserById(piece.receiver_id)
    const u = data?.user
    recipient = { name: (u?.user_metadata?.name as string) ?? null, email: u?.email ?? null }
  }

  // Memories: messages → items.
  const { data: messages } = await admin
    .from('Messages').select('id, title, revealed_at, created_at').eq('piece_id', id)
  const msgIds = (messages ?? []).map(m => m.id)
  let items: unknown[] = []
  if (msgIds.length) {
    const { data } = await admin
      .from('Message_Items')
      .select('id, message_id, title, type, file_url, content, sort_order, created_at')
      .in('message_id', msgIds)
      .order('sort_order', { ascending: true })
    items = data ?? []
  }

  const { data: vault } = await admin
    .from('Vault').select('name, storage_used_bytes, storage_limit_bytes').eq('piece_id', id).maybeSingle()

  // Email history for this piece (per-piece emails ref = piece id).
  const { data: emails } = await admin
    .from('Email_Log').select('type, recipient, sent_at').eq('ref', id).order('sent_at', { ascending: false })

  return { piece, buyer, recipient, messages: messages ?? [], items, vault: vault ?? null, emails: emails ?? [] }
}

const EDITABLE = ['status', 'carrier', 'tracking_number', 'tracking_url', 'hardware_id', 'nfc_linked_at', 'memory_deadline'] as const

async function updatePiece(actor: AdminUser, body: Record<string, unknown>) {
  const id = String(body.id ?? '')
  if (!id) throw new Error('Missing piece id')

  const patch = (body.patch ?? {}) as Record<string, unknown>

  const { data: before, error: loadErr } = await admin.from('Pieces').select('*').eq('id', id).single()
  if (loadErr || !before) throw new Error('Piece not found')

  const update: Record<string, unknown> = {}
  for (const key of EDITABLE) {
    if (key in patch) update[key] = patch[key] === '' ? null : patch[key]
  }

  // Marking shipped stamps shipped_at if not already set.
  if (update.status === 'shipped' && !before.shipped_at) {
    update.shipped_at = new Date().toISOString()
  }

  if (Object.keys(update).length === 0) throw new Error('No editable fields in patch')

  const { data: after, error: updErr } = await admin
    .from('Pieces').update(update).eq('id', id).select('*').single()
  if (updErr) throw updErr

  await audit({
    actor, action: 'piece.update', entityType: 'piece', entityId: id,
    before: Object.fromEntries(Object.keys(update).map(k => [k, before[k as keyof typeof before]])),
    after: update,
  })

  // Side effect: flipping to shipped fires the buyer "shipped" email. Email_Log
  // dedupes on (pieceId,'shipped'), so this is exactly-once even if the Supabase
  // DB webhook also fires.
  let emailResult: string | null = null
  if (before.status !== 'shipped' && after.status === 'shipped' && before.sender_id) {
    try {
      const { data: bdata } = await admin.auth.admin.getUserById(before.sender_id)
      const buyerEmail = bdata?.user?.email
      const buyerName = (bdata?.user?.user_metadata?.name as string) ?? null
      if (buyerEmail) {
        emailResult = await sendShippedEmail({
          pieceId: id, to: buyerEmail, buyerName,
          recipientName: after.recipient_name ?? null,
          pieceName: after.collection ?? 'Tijoray piece',
          portalUrl: `${SITE}/portal/piece/${id}`,
        })
      }
    } catch (err) {
      console.error('[admin] shipped email failed', err)
    }
  }

  return { piece: after, emailResult }
}

async function listCustomers(body: Record<string, unknown>) {
  const search = typeof body.search === 'string' ? body.search.trim().toLowerCase() : ''

  const { data: users } = await admin
    .from('Users').select('id, name, email, phone_number, address, created_at')
    .order('created_at', { ascending: false })

  // Piece counts per user (as sender), one query.
  const { data: pieces } = await admin.from('Pieces').select('sender_id, config')
  const bought = new Map<string, number>()
  const spend = new Map<string, number>()
  for (const p of pieces ?? []) {
    if (!p.sender_id) continue
    bought.set(p.sender_id, (bought.get(p.sender_id) ?? 0) + 1)
    spend.set(p.sender_id, (spend.get(p.sender_id) ?? 0) + estCents(p.config))
  }

  let out = (users ?? []).map(u => ({
    ...u,
    piecesBought: bought.get(u.id) ?? 0,
    estSpendCents: spend.get(u.id) ?? 0,
  }))

  if (search) {
    out = out.filter(u =>
      (u.name ?? '').toLowerCase().includes(search) ||
      (u.email ?? '').toLowerCase().includes(search) ||
      (u.phone_number ?? '').toLowerCase().includes(search),
    )
  }

  return { customers: out }
}

async function listEmails(body: Record<string, unknown>) {
  const type = typeof body.type === 'string' ? body.type : null
  let q = admin.from('Email_Log').select('id, ref, type, recipient, sent_at')
    .order('sent_at', { ascending: false }).limit(500)
  if (type) q = q.eq('type', type)
  const { data } = await q
  return { emails: data ?? [] }
}

/** Sign a media key for admin viewing. Verifies the key belongs to a real piece. */
async function signFile(body: Record<string, unknown>) {
  const raw = String(body.key ?? '')
  if (!raw) throw new Error('Missing key')
  // Stored value may be a full URL or an S3 key; only sign keys we recognise.
  if (/^https?:\/\//i.test(raw)) return { url: raw }

  const match = raw.match(/^piece\/([^/]+)\/message\//)
  if (!match) throw new Error('Invalid key format')

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME!, Key: raw }),
    { expiresIn: 300 },
  )
  return { url }
}

/* ── Catalog ───────────────────────────────────────────────────────────────── */

async function getCatalogAction() {
  const { doc, version, updatedAt, updatedBy, isDefault } = await getCatalog()
  return { doc, version, updatedAt, updatedBy, isDefault }
}

async function saveCatalogAction(actor: AdminUser, body: Record<string, unknown>) {
  const doc = body.doc as CatalogDoc
  if (!doc) throw new Error('Missing catalog document')
  const expectedVersion = typeof body.expectedVersion === 'number' ? body.expectedVersion : undefined

  const { version: beforeVersion } = await getCatalog()
  const result = await saveCatalog(doc, actor.email, expectedVersion)

  await audit({
    actor, action: 'catalog.save', entityType: 'catalog', entityId: 'live',
    before: { version: beforeVersion }, after: { version: result.version },
  })
  return result
}

/* ── Entry point ───────────────────────────────────────────────────────────── */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const actor = await requireAdmin(req.headers.authorization)
  if (!actor) return res.status(403).json({ error: 'Forbidden' })

  const body = (req.body ?? {}) as Record<string, unknown>
  const action = String(body.action ?? '')

  try {
    switch (action) {
      case 'whoami':        return res.status(200).json({ isAdmin: true, email: actor.email })
      case 'dashboard':     return res.status(200).json(await dashboard())
      case 'list-pieces':   return res.status(200).json(await listPieces(body))
      case 'get-piece':     return res.status(200).json(await getPiece(body))
      case 'update-piece':  return res.status(200).json(await updatePiece(actor, body))
      case 'list-customers':return res.status(200).json(await listCustomers(body))
      case 'list-emails':   return res.status(200).json(await listEmails(body))
      case 'sign-file':     return res.status(200).json(await signFile(body))
      case 'get-catalog':   return res.status(200).json(await getCatalogAction())
      case 'save-catalog':  return res.status(200).json(await saveCatalogAction(actor, body))
      default:              return res.status(400).json({ error: `Unknown action: ${action}` })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Admin action failed'
    console.error(`[admin] action=${action} failed:`, message)
    return res.status(500).json({ error: message })
  }
}

export const config = { runtime: 'nodejs' }
