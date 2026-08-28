import { useRef, useState } from 'react'
import type { Address } from '../lib/profile'
import styles from './AddressAutocomplete.module.css'

/* Nominatim (OpenStreetMap) — free, no API key. Same service used for the
   portal location search. We request addressdetails=1 so we can store a
   structured address for shipping rather than just a display string. */
type NominatimAddress = {
  house_number?: string
  road?:         string
  pedestrian?:   string
  neighbourhood?: string
  suburb?:       string
  city?:         string
  town?:         string
  village?:      string
  hamlet?:       string
  state?:        string
  county?:       string
  postcode?:     string
  country?:      string
}

type NominatimResult = {
  place_id:     number
  display_name: string
  lat:          string
  lon:          string
  address:      NominatimAddress
}

function toAddress(r: NominatimResult): Address {
  const a = r.address ?? {}
  const line = [a.house_number, a.road || a.pedestrian].filter(Boolean).join(' ')
  return {
    formatted: r.display_name.split(',').slice(0, 4).map(s => s.trim()).join(', '),
    line:      line || undefined,
    city:      a.city || a.town || a.village || a.hamlet || a.suburb || undefined,
    state:     a.state || a.county || undefined,
    postcode:  a.postcode || undefined,
    country:   a.country || undefined,
    lat:       r.lat,
    lon:       r.lon,
  }
}

type Props = {
  value:    Address | null
  onChange: (a: Address | null) => void
  id?:      string
  error?:   boolean
}

export default function AddressAutocomplete({ value, onChange, id, error }: Props) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function search(q: string) {
    setQuery(q)
    if (value) onChange(null) // clear a confirmed address once the user edits
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!q.trim()) { setResults([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          // Proxied through our own API so the customer's IP and the address
          // they are typing never reach OpenStreetMap. See api/geocode.ts.
          `/api/geocode?q=${encodeURIComponent(q)}&details=1`,
        )
        const data: NominatimResult[] = await res.json()
        setResults(data)
        setOpen(true)
      } catch { /* network hiccup — leave results as-is */ }
      finally { setLoading(false) }
    }, 400)
  }

  function select(r: NominatimResult) {
    setQuery('')
    setResults([])
    setOpen(false)
    onChange(toAddress(r))
  }

  // Confirmed-address view: show what we captured + a free unit/apartment line.
  if (value) {
    return (
      <div className={styles.confirmed}>
        <div className={styles.confirmedRow}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.pin}>
            <path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z"/><circle cx="10" cy="8" r="2"/>
          </svg>
          <span className={styles.confirmedText}>{value.formatted}</span>
          <button
            type="button"
            className={styles.change}
            onClick={() => { onChange(null); setQuery('') }}
          >
            Change
          </button>
        </div>
        <input
          type="text"
          className={styles.unitInput}
          placeholder="Apartment, suite, unit (optional)"
          value={value.unit ?? ''}
          onChange={e => onChange({ ...value, unit: e.target.value })}
          autoComplete="address-line2"
        />
      </div>
    )
  }

  // Search view.
  return (
    <div className={styles.wrap}>
      <div className={styles.inputWrap}>
        <svg className={styles.icon} width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z"/><circle cx="10" cy="8" r="2"/>
        </svg>
        <input
          id={id}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          value={query}
          onChange={e => search(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true) }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Start typing your address…"
          autoComplete="off"
        />
        {loading && <div className={styles.spinner} />}
      </div>
      {open && results.length > 0 && (
        <ul className={styles.dropdown}>
          {results.map(r => (
            <li key={r.place_id} className={styles.option} onMouseDown={() => select(r)}>
              <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.optionPin}>
                <path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z"/><circle cx="10" cy="8" r="2"/>
              </svg>
              <span>{r.display_name.split(',').slice(0, 5).join(', ')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
