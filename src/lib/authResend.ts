/**
 * Shared cooldown rules for re-sending a signup confirmation email.
 *
 * Two pages offer the resend — LoginPage, to someone turned away at sign-in,
 * and VerifyEmailPage, to someone already holding an unconfirmed session — and
 * they have to agree, because they are resending against the same GoTrue floor.
 * A button that comes back before the server will accept it just produces a
 * second failure.
 */

/** Seconds before another confirmation email may be requested. */
export const RESEND_WAIT = 60

/**
 * The wait GoTrue names in its own 429, when it names one.
 *
 * Its floor is set by the project's "minimum interval per user" and may be
 * longer than ours, so its number wins whenever we can read it. Returns null
 * when the message carries no duration, leaving the caller on RESEND_WAIT.
 */
export function parseRetryAfter(message: string): number | null {
  const m = /(\d+)\s*second/.exec(message)
  return m ? Number(m[1]) : null
}
