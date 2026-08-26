/**
 * The authoritative second opinion on a phone number.
 *
 * Split from phone.ts on purpose: that module is pure formatting logic with no
 * dependencies, so it can be reasoned about and tested on its own, and a form
 * that only needs to format a number does not drag the Supabase client in
 * behind it. This half is the one that talks to the network.
 */
import { supabase } from './supabase'

/**
 * The `phone-check` edge function's verdict, verbatim.
 *
 * That function is the app's, and this type is a mirror of it rather than a
 * design of our own — the two clients must read one answer the same way. See
 * supabase/functions/phone-check/index.ts in the phone-app repo.
 */
export type Verdict = {
  allowed: boolean
  /** A sentence for the user. Null when allowed. */
  problem: string | null
  /** Why. `unchecked` means the service could not answer and we allowed it. */
  reason: 'ok' | 'invalid' | 'unreachable_type' | 'unchecked'
  /** Canonical E.164 from the service. Prefer this over what we composed. */
  e164?: string
  country?: string
  lineType?: string
  carrier?: string
}

/**
 * Second opinion on a number, from the shared `phone-check` function.
 *
 * Local length rules catch a typo'd digit count. They cannot tell you that a
 * well-formed number was never allocated, or that it is a landline the giftee
 * can never receive their verification code on — and that second class is
 * exactly what strands a piece with no error anywhere. Worth a round trip
 * before we take someone's money.
 *
 * Signed-in callers only: the function proxies a metered API and refuses
 * anonymous calls, so this must run after the account exists. `supabase`
 * attaches the session JWT for us.
 *
 * FAILS OPEN, always — including when there is no session at all. This sits in
 * front of a payment, and a checkout that cannot complete because a third party
 * is slow is a worse outcome than a number we did not double-check. The OTP
 * round trip is the real gate; this is only an early warning.
 */
export async function verifyPhone(e164: string): Promise<Verdict> {
  const open: Verdict = { allowed: true, problem: null, reason: 'unchecked', e164 }

  // The function's own guard is `^\+[0-9]{6,15}$`. Sending anything else earns
  // a 400 and burns a round trip to learn what we already knew.
  if (!/^\+[0-9]{6,15}$/.test(e164)) return open

  try {
    const { data, error } = await supabase.functions.invoke<Verdict>('phone-check', {
      body: { phone: e164 },
    })
    if (error || !data) return open
    // Only an explicit false is a rejection. A shape we don't recognise means
    // we could not tell, and "could not tell" must never read as "invalid".
    if (data.allowed === false) {
      return {
        allowed: false,
        problem: data.problem ?? 'That number could not be verified. Check the digits and the country.',
        reason:  data.reason ?? 'invalid',
        e164:    data.e164 ?? e164,
        country: data.country,
        lineType: data.lineType,
        carrier: data.carrier,
      }
    }
    return { ...open, ...data, allowed: true }
  } catch {
    return open
  }
}
