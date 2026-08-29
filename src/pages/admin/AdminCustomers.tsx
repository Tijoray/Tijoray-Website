import { useEffect, useState, useCallback } from 'react'
import { adminApi, type AdminCustomer } from '../../lib/adminApi'
import { money, date } from './format'
import styles from './admin.module.css'

/**
 * A confirmed number and a typed one are not the same fact, so they must not
 * render identically. `phone_number` has been through an SMS round-trip and is
 * what a piece is matched against; `contact_phone` is only what someone typed
 * into the website. Showing the second one unlabelled would invite exactly the
 * confusion the two columns exist to prevent — see the 20260828000000
 * migration in the app repo.
 */
function phoneCell(c: AdminCustomer) {
  if (c.phone_number) return c.phone_number
  if (c.contact_phone) {
    return (
      <>
        {c.contact_phone}{' '}
        <span className={`${styles.pill} ${styles.pillMuted}`} title="Typed on the website, never confirmed by SMS. Not usable to match a piece.">
          unverified
        </span>
      </>
    )
  }
  return '—'
}

export default function AdminCustomers() {
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<AdminCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    adminApi.listCustomers({ search })
      .then(r => setRows(r.customers))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addrLine = (a: unknown): string => {
    const o = a as { formatted?: string; city?: string; state?: string } | null
    return o?.formatted ?? [o?.city, o?.state].filter(Boolean).join(', ') ?? ''
  }

  return (
    <>
      <h1 className={styles.h1}>Customers</h1>
      <p className={styles.subtle}>Everyone with an account, with pieces bought and estimated spend.</p>

      <div className={styles.toolbar}>
        <input className={styles.input} placeholder="Search name, email, phone…"
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') load() }} />
        <button className={styles.filterBtn} onClick={load}>Search</button>
      </div>

      {error && <div className={styles.msg + ' ' + styles.msgErr}>{error}</div>}

      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Location</th><th>Pieces</th><th>Est. spend</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className={styles.loading}>Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className={styles.empty}>No customers match.</td></tr>
              ) : rows.map(c => (
                <tr key={c.id}>
                  <td data-label="Name">{c.name ?? '—'}</td>
                  <td data-label="Email">{c.email ?? '—'}</td>
                  <td data-label="Phone">{phoneCell(c)}</td>
                  <td data-label="Location">{addrLine(c.address) || '—'}</td>
                  <td data-label="Pieces">{c.piecesBought}</td>
                  <td data-label="Est. spend">{money(c.estSpendCents)}</td>
                  <td data-label="Joined">{date(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
