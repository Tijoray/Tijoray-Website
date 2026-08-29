import type { User } from '@supabase/supabase-js'

/**
 * Structured shipping address captured via the OpenStreetMap (Nominatim)
 * autocomplete and stored on the Supabase user's `user_metadata.address`.
 */
export type Address = {
  formatted: string          // human-readable single line (Nominatim display_name, trimmed)
  line?:     string          // house number + road
  unit?:     string          // apartment / suite — entered manually
  city?:     string
  state?:    string
  postcode?: string
  country?:  string
  lat?:      string
  lon?:      string
}

/** Provider that authenticated this session ('google' | 'apple' | 'email' | …). */
export function getProvider(user: User | null): string {
  return (user?.app_metadata?.provider as string) ?? ''
}

/** True when the user signed in with Google or Apple (vs. email/password). */
export function isOAuthUser(user: User | null): boolean {
  const provider = getProvider(user)
  if (provider === 'google' || provider === 'apple') return true
  // Fall back to the linked identities in case app_metadata.provider is stale.
  return (user?.identities ?? []).some(
    i => i.provider === 'google' || i.provider === 'apple',
  )
}

/** Best-effort full name from the user's metadata (Google populates `full_name`/`name`). */
export function getMetaName(user: User | null): string {
  const m = (user?.user_metadata ?? {}) as Record<string, unknown>
  return ((m.name as string) || (m.full_name as string) || '').trim()
}

/** Phone stored on the user's metadata. */
export function getMetaPhone(user: User | null): string {
  const m = (user?.user_metadata ?? {}) as Record<string, unknown>
  return ((m.phone as string) || '').trim()
}

/** Address stored on the user's metadata, if any. */
export function getMetaAddress(user: User | null): Address | null {
  const m = (user?.user_metadata ?? {}) as Record<string, unknown>
  const addr = m.address
  if (!addr) return null
  if (typeof addr === 'string') return addr.trim() ? { formatted: addr.trim() } : null
  const a = addr as Address
  return a.formatted ? a : null
}

/**
 * True once the address on the account has actually been confirmed.
 *
 * `signUp` refusing to return a session is the whole of the enforcement
 * otherwise, and it only covers one route in — it says nothing about a session
 * from a password sign-in, from recovery, or from a provider. Checking the
 * value itself covers all of them.
 *
 * Self-activating, like the app's AuthGate equivalent: while "Confirm email"
 * is off in the hosted project GoTrue stamps `email_confirmed_at` at signup,
 * so this is true for everyone and the gate below is inert. Turning the
 * setting on is what starts producing sessions it can catch — no redeploy has
 * to be co-ordinated with the toggle.
 */
export function isEmailConfirmed(user: User | null): boolean {
  if (!user) return false
  // An account with no email is not an unconfirmed email — nothing to confirm,
  // and bouncing it to a page that resends to nowhere would strand it.
  if (!user.email) return true
  return !!user.email_confirmed_at
}

/**
 * A profile is complete once we have a name, a phone number, and a shipping
 * address.
 *
 * The phone here is contact detail, not a credential. It is never SMS-verified
 * on the web — verification happens in the mobile app, where the recipient
 * confirms the number that a piece is registered to. Anything that decides who
 * may open a piece must read the confirmed number from `auth.users.phone`,
 * never this one. See `Users.contact_phone` vs `Users.phone_number` in the
 * database, which keeps the two apart by name so no reader has to remember a
 * flag.
 */
export function isProfileComplete(user: User | null): boolean {
  if (!user) return false
  return !!getMetaName(user) && !!getMetaPhone(user) && !!getMetaAddress(user)
}

/**
 * OAuth users (Google/Apple) skip the from-scratch signup form, so they never
 * provide a phone or address up front. This flags when they must be routed
 * through the profile-completion gate before continuing.
 */
export function needsProfileCompletion(user: User | null): boolean {
  return isOAuthUser(user) && !isProfileComplete(user)
}
