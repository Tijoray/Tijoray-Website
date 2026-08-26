import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { adminApi, type AdminPieceRow } from '../../lib/adminApi'
import { describeConfig, StatusPill, Pill, date } from './format'
import BindTagPanel from './BindTagPanel'
import styles from './admin.module.css'

const STATUSES = ['all', 'crafting', 'shipped', 'delivered'] as const

export default function AdminPieces() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? 'all'
  const [search, setSearch] = useState('')
  const [pieces, setPieces] = useState<AdminPieceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const load = useCallback(() => {
    setLoading(true)
    adminApi.listPieces({ status: status === 'all' ? null : status, search })
      .then(r => setPieces(r.pieces))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [status, search])

  useEffect(() => { load() }, [load])

  const setStatus = (s: string) => {
    const next = new URLSearchParams(params)
    if (s === 'all') next.delete('status'); else next.set('status', s)
    setParams(next)
  }

  return (
    <>
      <h1 className={styles.h1}>Pieces &amp; Orders</h1>
      <p className={styles.subtle}>Every piece ever ordered. Click a row to manage status, shipping, NFC tag, and memories.</p>

      <BindTagPanel onBound={load} />

      <div className={styles.toolbar}>
        {STATUSES.map(s => (
          <button
            key={s}
            className={`${styles.filterBtn} ${status === s ? styles.filterActive : ''}`}
            onClick={() => setStatus(s)}
          >{s}</button>
        ))}
        <input
          className={styles.input}
          placeholder="Search serial, buyer, recipient, tag…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') load() }}
        />
        <button className={styles.btnGhost + ' ' + styles.filterBtn} onClick={load}>Search</button>
      </div>

      {error && <div className={styles.msg + ' ' + styles.msgErr}>{error}</div>}

      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Serial</th><th>Piece</th><th>Buyer</th><th>Recipient</th>
                <th>Status</th><th>Memories</th><th>NFC tag</th><th>Ordered</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className={styles.loading}>Loading…</td></tr>
              ) : pieces.length === 0 ? (
                <tr><td colSpan={8} className={styles.empty}>No pieces match.</td></tr>
              ) : pieces.map(p => (
                <tr key={p.id} className={styles.rowLink} onClick={() => navigate(`/admin/pieces/${p.id}`)}>
                  <td className={styles.mono}>{p.serial ?? '—'}</td>
                  <td>{describeConfig(p.config, p.product_type)}</td>
                  <td>{p.buyerName ?? p.buyerEmail ?? '—'}</td>
                  <td>{p.recipient_name ?? (p.receiver_id ? 'Linked' : '—')}</td>
                  <td><StatusPill status={p.status} /></td>
                  <td>{p.memoryCount === 0 ? <Pill tone="warn">0</Pill> : p.memoryCount}</td>
                  <td>{p.hardware_id
                    ? <span className={styles.mono}>{p.hardware_id}</span>
                    : (p.status !== 'crafting' ? <Pill tone="warn">missing</Pill> : '—')}</td>
                  <td>{date(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
