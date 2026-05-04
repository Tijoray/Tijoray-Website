import { useState, useId } from 'react'
import styles from './PhoneInput.module.css'

const COUNTRIES = [
  { code: 'US', name: 'United States',    dial: '+1' },
  { code: 'CA', name: 'Canada',           dial: '+1' },
  { code: 'GB', name: 'United Kingdom',   dial: '+44' },
  { code: 'AU', name: 'Australia',        dial: '+61' },
  { code: 'NZ', name: 'New Zealand',      dial: '+64' },
  { code: 'IE', name: 'Ireland',          dial: '+353' },
  { code: 'FR', name: 'France',           dial: '+33' },
  { code: 'DE', name: 'Germany',          dial: '+49' },
  { code: 'IT', name: 'Italy',            dial: '+39' },
  { code: 'ES', name: 'Spain',            dial: '+34' },
  { code: 'PT', name: 'Portugal',         dial: '+351' },
  { code: 'NL', name: 'Netherlands',      dial: '+31' },
  { code: 'BE', name: 'Belgium',          dial: '+32' },
  { code: 'CH', name: 'Switzerland',      dial: '+41' },
  { code: 'SE', name: 'Sweden',           dial: '+46' },
  { code: 'NO', name: 'Norway',           dial: '+47' },
  { code: 'DK', name: 'Denmark',          dial: '+45' },
  { code: 'FI', name: 'Finland',          dial: '+358' },
  { code: 'IN', name: 'India',            dial: '+91' },
  { code: 'SG', name: 'Singapore',        dial: '+65' },
  { code: 'HK', name: 'Hong Kong',        dial: '+852' },
  { code: 'JP', name: 'Japan',            dial: '+81' },
  { code: 'KR', name: 'South Korea',      dial: '+82' },
  { code: 'AE', name: 'UAE',              dial: '+971' },
  { code: 'SA', name: 'Saudi Arabia',     dial: '+966' },
  { code: 'ZA', name: 'South Africa',     dial: '+27' },
  { code: 'BR', name: 'Brazil',           dial: '+55' },
  { code: 'MX', name: 'Mexico',           dial: '+52' },
] as const

function parseValue(value: string): { dialIdx: number; local: string } {
  if (!value) return { dialIdx: 0, local: '' }
  for (let i = 0; i < COUNTRIES.length; i++) {
    const { dial } = COUNTRIES[i]
    if (value.startsWith(dial)) {
      return { dialIdx: i, local: value.slice(dial.length).trimStart() }
    }
  }
  return { dialIdx: 0, local: value }
}

type Props = {
  value:     string
  onChange:  (value: string) => void
  id?:       string
  error?:    boolean
  disabled?: boolean
}

export default function PhoneInput({ value, onChange, id, error, disabled }: Props) {
  const autoId = useId()
  const inputId = id ?? autoId

  const parsed = parseValue(value)
  const [dialIdx, setDialIdx] = useState(parsed.dialIdx)
  const [local,   setLocal]   = useState(parsed.local)

  function handleDialChange(idx: number) {
    setDialIdx(idx)
    const combined = COUNTRIES[idx].dial + (local ? ' ' + local : '')
    onChange(combined)
  }

  function handleLocalChange(raw: string) {
    setLocal(raw)
    const combined = COUNTRIES[dialIdx].dial + (raw ? ' ' + raw : '')
    onChange(combined)
  }

  return (
    <div className={`${styles.wrapper} ${error ? styles.error : ''} ${disabled ? styles.disabled : ''}`}>
      <select
        className={styles.dialSelect}
        value={dialIdx}
        onChange={e => handleDialChange(Number(e.target.value))}
        disabled={disabled}
        aria-label="Country code"
      >
        {COUNTRIES.map((c, i) => (
          <option key={`${c.code}-${i}`} value={i}>
            {c.code} {c.dial}
          </option>
        ))}
      </select>
      <span className={styles.divider} aria-hidden="true" />
      <input
        id={inputId}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        className={styles.numberInput}
        value={local}
        onChange={e => handleLocalChange(e.target.value)}
        disabled={disabled}
        placeholder="Phone number"
      />
    </div>
  )
}
