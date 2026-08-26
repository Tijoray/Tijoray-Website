import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  COUNTRIES, countryForIso, deviceCountry, digitsOnly, phoneProblem,
  phoneStatus, splitE164, stripTrunkPrefix, toE164,
  type Country, type PhoneStatus,
} from '../lib/phone'
import styles from './PhoneInput.module.css'

/**
 * A country picker joined to a national-number box, emitting strict E.164.
 *
 * The country is picked, never inferred from what is typed. That is the whole
 * point of the component: a Londoner types `07700 900123` because that is what
 * is printed in their contacts, and if we guess the calling code from the
 * digits we guess wrong. The piece then links its giftee by comparing this
 * number against the one they later verify, so a wrong calling code is a piece
 * that never unlocks — with no error, anywhere, ever.
 *
 * `onChange` therefore emits `+447700900123` and nothing else: no spaces, no
 * trunk prefix, one leading `+`. Empty while the number is incomplete, so a
 * caller can never mistake a half-typed number for a finished one.
 */
type Props = {
  value: string
  /** Strict E.164, or '' while the number is empty or incomplete. */
  onChange: (e164: string) => void
  id?: string
  error?: boolean
  disabled?: boolean
  /** Reports validity as the user types, for callers that gate a submit on it. */
  onStatusChange?: (status: PhoneStatus) => void
  /** Hides the helper line where a caller renders its own. */
  hideHint?: boolean
}

/** The flag as a pair of regional indicator symbols. Never load-bearing — the
 *  name and dial code sit beside it, so a missing glyph costs only decoration. */
function flagOf(iso: string): string {
  if (iso.length !== 2) return ''
  const A = 0x1f1e6
  return String.fromCodePoint(...[...iso.toUpperCase()].map(c => A + c.charCodeAt(0) - 65))
}

export default function PhoneInput({
  value, onChange, id, error, disabled, onStatusChange, hideHint,
}: Props) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = `${inputId}-hint`

  // Country and national digits are the source of truth; `value` is what they
  // compose to. Deriving them from `value` on every render instead would fight
  // the user mid-type, because an incomplete number composes to ''.
  const [country, setCountry] = useState<Country>(() => {
    const parsed = splitE164(value)
    return parsed?.country ?? deviceCountry()
  })
  const [national, setNational] = useState<string>(() => {
    const parsed = splitE164(value)
    return parsed ? stripTrunkPrefix(parsed.country, parsed.nsn) : digitsOnly(value)
  })

  // Adopt a value the parent changed underneath us (a reset, or a profile
  // loading in late). Compare against what we currently compose to, so this
  // never fires on our own emissions.
  const composed = toE164(country, national) ?? ''
  const lastSent = useRef(composed)
  useEffect(() => {
    if (value === lastSent.current) return
    const parsed = splitE164(value)
    if (parsed) {
      setCountry(parsed.country)
      setNational(stripTrunkPrefix(parsed.country, parsed.nsn))
    } else if (!value) {
      setNational('')
    }
    lastSent.current = value
  }, [value])

  const status = phoneStatus(country, national)
  useEffect(() => { onStatusChange?.(status) }, [status, onStatusChange])

  function emit(nextCountry: Country, nextNational: string) {
    const next = toE164(nextCountry, nextNational) ?? ''
    lastSent.current = next
    onChange(next)
  }

  function handleCountry(iso: string) {
    const next = countryForIso(iso)
    if (!next) return
    // Re-run the trunk rule against the new country: a number typed as
    // `07700900123` under a country with no trunk prefix keeps its 0, and must
    // lose it the moment the country becomes one that drops it.
    const renationalised = stripTrunkPrefix(next, national)
    setCountry(next)
    setNational(renationalised)
    emit(next, renationalised)
  }

  function handleNational(raw: string) {
    // Brackets, dashes, dots and spaces are dropped as they are typed rather
    // than rejected afterwards, so there is no way to submit "(555) 123-4567"
    // and be told it is wrong — the punctuation simply never appears.
    const next = stripTrunkPrefix(country, digitsOnly(raw))
    setNational(next)
    emit(country, next)
  }

  /** Pasting a full international number moves the calling code to the picker. */
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text').trim()
    if (!text.startsWith('+')) return
    const parsed = splitE164(text)
    if (!parsed) return
    e.preventDefault()
    const nsn = stripTrunkPrefix(parsed.country, parsed.nsn)
    setCountry(parsed.country)
    setNational(nsn)
    emit(parsed.country, nsn)
  }

  const options = useMemo(
    () => COUNTRIES.map(c => (
      <option key={c.iso} value={c.iso}>
        {flagOf(c.iso)} {c.name} +{c.callingCode}
      </option>
    )),
    [],
  )

  const problem = phoneProblem(country, status)

  return (
    <>
      <div className={`${styles.wrapper} ${error ? styles.error : ''} ${disabled ? styles.disabled : ''}`}>
        <select
          className={styles.dialSelect}
          value={country.iso}
          onChange={e => handleCountry(e.target.value)}
          disabled={disabled}
          aria-label="Country"
        >
          {options}
        </select>
        <span className={styles.divider} aria-hidden="true" />
        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          className={styles.numberInput}
          value={national}
          onChange={e => handleNational(e.target.value)}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder={country.example}
          aria-describedby={hideHint ? undefined : hintId}
        />
      </div>

      {!hideHint && (
        <p id={hintId} className={styles.hint}>
          {/* The country's full name, because the picker only has room for a
              flag and a dial code — and picking the wrong country is the whole
              failure this component exists to prevent. */}
          <span className={styles.hintCountry}>{country.name}</span>
          {status === 'empty' || status === 'valid'
            ? <> · e.g. {country.example}</>
            : <span className={styles.hintProblem}> · {problem}</span>}
        </p>
      )}
    </>
  )
}
