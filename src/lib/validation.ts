import { phoneStatus, splitE164, stripTrunkPrefix } from './phone'

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/**
 * True only for a complete international number.
 *
 * Deliberately stricter than the old digit count. PhoneInput emits strict E.164
 * or the empty string, so anything else reaching here is a caller that has
 * stopped going through the picker — and a number without a calling code is the
 * exact shape that silently fails to link a piece to its giftee. Better to fail
 * the form than to store it.
 *
 * The length rules come from the shared dialling table, so "too short for a UK
 * mobile" is caught here rather than at the OTP, where it costs a message and
 * reads to the user as a carrier problem.
 */
export function isValidPhone(phone: string): boolean {
  const parsed = splitE164(phone.trim())
  if (!parsed) return false
  return phoneStatus(parsed.country, stripTrunkPrefix(parsed.country, parsed.nsn)) === 'valid'
}
