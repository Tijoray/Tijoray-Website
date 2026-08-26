/**
 * Phone numbers, in the one format the whole system agrees on: E.164.
 *
 * This exists because of a failure that is completely silent. A piece links its
 * giftee by comparing the number the gifter typed at checkout against the
 * number the giftee later verified, digit for digit. If the gifter types
 * `07700 900123` and the giftee verifies `+44 7700 900123`, the digits are
 * `07700900123` and `447700900123` — no match, no error, and a piece that never
 * unlocks. Nothing anywhere reports it.
 *
 * So every number leaves this module as `+447700900123` and nothing else: one
 * leading `+`, calling code, national number, no spaces, no trunk prefix. The
 * phone app writes the same shape from the same dialling table (see
 * scripts/generate-countries.mjs) — the two have to agree or the bug comes back
 * wearing a different hat.
 */
import { COUNTRIES, type Country } from '../data/countries'

export type { Country }
export { COUNTRIES }

/** How the number in a field currently reads. */
export type PhoneStatus = 'empty' | 'tooShort' | 'tooLong' | 'valid'

const BY_ISO = new Map(COUNTRIES.map(c => [c.iso, c]))

/** Calling code → the region a bare code resolves to (+1 is 25 territories). */
const BY_CALLING_CODE = (() => {
  const m = new Map<number, Country>()
  for (const c of COUNTRIES) {
    const existing = m.get(c.callingCode)
    if (!existing || (c.isPrimaryForCode && !existing.isPrimaryForCode)) {
      m.set(c.callingCode, c)
    }
  }
  return m
})()

export function countryForIso(iso: string | null | undefined): Country | null {
  if (!iso) return null
  return BY_ISO.get(iso.toUpperCase()) ?? null
}

export function countryForCallingCode(code: number): Country | null {
  return BY_CALLING_CODE.get(code) ?? null
}

export const digitsOnly = (s: string): string => s.replace(/\D/g, '')

/**
 * The browser's region, for the picker's opening position. Falls back to the
 * United States, which is where most pieces are delivered.
 *
 * Only ever a starting guess. The country is picked, never inferred from what
 * the user types — guessing the calling code wrong is what produces the
 * mismatch this module exists to prevent.
 */
export function deviceCountry(): Country {
  const fallback = countryForIso('US')!
  if (typeof navigator === 'undefined') return fallback
  for (const tag of navigator.languages ?? [navigator.language]) {
    if (!tag) continue
    try {
      const region = new Intl.Locale(tag).region
      const hit = countryForIso(region)
      if (hit) return hit
    } catch {
      // A malformed language tag is not worth failing over.
    }
  }
  return fallback
}

/**
 * Splits a stored international number back into a country and a national part,
 * so a saved value lands on the picker rather than in the text box.
 *
 * Longest calling code first: +1 must not swallow a +1-prefixed +1876.
 */
export function splitE164(input: string): { country: Country; nsn: string } | null {
  const trimmed = input.trim()
  if (!trimmed.startsWith('+')) return null
  const digits = digitsOnly(trimmed)
  if (!digits) return null
  for (let len = 3; len >= 1; len--) {
    if (digits.length <= len) continue
    const country = countryForCallingCode(Number(digits.slice(0, len)))
    if (country) return { country, nsn: digits.slice(len) }
  }
  return null
}

/**
 * Drops the digit locals dial before their own numbers and foreigners don't.
 *
 * A Londoner types 07700 900123 because that is what is printed in their
 * contacts, but the international form is +44 7700 900123 — the 0 has to go or
 * the number is a digit too long and unroutable. Russia's is 8, the US's is 1.
 *
 * Only where the country actually has one: Italy, Spain and Mexico keep their
 * leading digits, and `trunkPrefix` is null for exactly those.
 */
export function stripTrunkPrefix(country: Country, digits: string): string {
  const trunk = country.trunkPrefix
  if (!trunk) return digits
  // Wait for a second digit before stripping, so typing "0" doesn't make the
  // keystroke vanish under the cursor.
  if (digits.length <= trunk.length) return digits
  if (!digits.startsWith(trunk)) return digits
  return digits.slice(trunk.length)
}

export function phoneStatus(country: Country, nationalDigits: string): PhoneStatus {
  const d = digitsOnly(nationalDigits)
  if (!d) return 'empty'
  if (d.length < country.nsnMin) return 'tooShort'
  if (d.length > country.nsnMax) return 'tooLong'
  return 'valid'
}

/** The number in E.164, or null while it isn't one yet. */
export function toE164(country: Country, nationalDigits: string): string | null {
  const d = digitsOnly(nationalDigits)
  return phoneStatus(country, d) === 'valid' ? `+${country.callingCode}${d}` : null
}

/**
 * What to tell the user, or null when there is nothing wrong.
 *
 * Names the country, because "too short" is only meaningful against the country
 * it is too short for — and if the picker is on the wrong country, seeing its
 * name in the error is the fastest way to notice.
 */
export function phoneProblem(country: Country, status: PhoneStatus): string | null {
  switch (status) {
    case 'empty':    return 'Enter a phone number.'
    case 'tooShort': return `That looks too short for a ${country.name} number.`
    case 'tooLong':  return `That looks too long for a ${country.name} number.`
    case 'valid':    return null
  }
}
