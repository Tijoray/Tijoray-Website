/**
 * Admin-panel server helpers — identity gating + audit logging.
 *
 * Server-only (uses the Supabase service-role key). Lives OUTSIDE /api so Vercel
 * never turns it into an endpoint; api/admin.ts imports from here.
 *
 * Admin identity is an ENV ALLOWLIST, not a DB flag: `ADMIN_EMAILS` is a
 * comma-separated list of authorised admin emails. A caller is an admin iff
 * their verified Supabase auth email is on that list. This means admin access
 * can never be granted by editing a database row — only by a deploy-time env
 * change — which is the right posture for a surface that can refund payments,
 * trigger customer emails, and read private memories.
 */
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

export const admin: SupabaseClient = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/** Parsed, lower-cased set of allowed admin emails from ADMIN_EMAILS. */
export function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmails().has(email.toLowerCase())
}

export type AdminUser = { id: string; email: string }

/**
 * Verify a Bearer token belongs to an allow-listed admin. Returns the admin
 * identity on success, or null (caller should respond 401/403).
 */
export async function requireAdmin(authHeader?: string): Promise<AdminUser | null> {
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  const { data, error } = await admin.auth.getUser(token)
  const user: User | null = error ? null : data.user
  if (!user?.email || !isAdminEmail(user.email)) return null

  return { id: user.id, email: user.email }
}

/** Append a row to Admin_Audit. Never throws — audit failure must not block the action. */
export async function audit(entry: {
  actor: AdminUser
  action: string
  entityType?: string
  entityId?: string
  before?: unknown
  after?: unknown
  meta?: unknown
}): Promise<void> {
  try {
    await admin.from('Admin_Audit').insert({
      actor_email: entry.actor.email,
      actor_id:    entry.actor.id,
      action:      entry.action,
      entity_type: entry.entityType ?? null,
      entity_id:   entry.entityId ?? null,
      before:      entry.before ?? null,
      after:       entry.after ?? null,
      meta:        entry.meta ?? null,
    })
  } catch (err) {
    console.error('[admin] audit write failed', err)
  }
}
