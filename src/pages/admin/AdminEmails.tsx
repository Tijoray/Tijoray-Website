import { useEffect, useState, useCallback } from 'react'
import { adminApi, type EmailRow } from '../../lib/adminApi'
import { dateTime } from './format'
import styles from './admin.module.css'

const TYPES = ['all', 'crafting', 'reminder_1', 'reminder_2', 'reminder_3', 'shipped', 'linked', 'viewed']

export default function AdminEmails() {
  const [type, setType] = useState('all')
  const [rows, setRows] = useState<EmailRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    adminApi.listEmails({ type: type === 'all' ? null : type })
      .then(r => setRows(r.emails))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [type])

  useEffect(() => { load() }, [load])

  return (
    <>
      <h1 className={styles.h1}>Emails</h1>
      <p className={styles.subtle}>The exactly-once lifecycle-email log (most recent 500).</p>

      <div className={styles.toolbar}>
        {TYPES.map(t => (
          <button key={t} className={`${styles.filterBtn} ${type === t ? styles.filterActive : ''}`}
            onClick={() => setType(t)}>{t.replace(/_/g, ' ')}</button>
        ))}
      </div>

      {error && <div className={styles.msg + ' ' + styles.msgErr}>{error}</div>}

      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr><th>Sent</th><th>Type</th><th>Recipient</th><th>Ref</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className={styles.loading}>Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} className={styles.empty}>No emails logged.</td></tr>
              ) : rows.map(e => (
                <tr key={e.id}>
                  <td>{dateTime(e.sent_at)}</td>
                  <td>{e.type.replace(/_/g, ' ')}</td>
                  <td>{e.recipient ?? '—'}</td>
                  <td className={styles.mono}>{e.ref.slice(0, 12)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
