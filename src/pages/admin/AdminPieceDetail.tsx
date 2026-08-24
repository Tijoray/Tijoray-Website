import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminApi, type PieceDetail, type MessageItem } from '../../lib/adminApi'
import { describeConfig, StatusPill, money, date, dateTime, estCents } from './format'
import styles from './admin.module.css'

const CARRIERS = ['', 'usps', 'ups', 'fedex', 'dhl', 'other']

export default function AdminPieceDetail() {
  const { pieceId } = useParams<{ pieceId: string }>()
  const [data, setData] = useState<PieceDetail | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null)

  // Editable form state
  const [form, setForm] = useState({
    status: '', carrier: '', tracking_number: '', tracking_url: '', hardware_id: '', memory_deadline: '',
  })

  const load = () => {
    if (!pieceId) return
    adminApi.getPiece(pieceId)
      .then(d => {
        setData(d)
        const p = d.piece
        setForm({
          status: (p.status as string) ?? 'crafting',
          carrier: (p.carrier as string) ?? '',
          tracking_number: (p.tracking_number as string) ?? '',
          tracking_url: (p.tracking_url as string) ?? '',
          hardware_id: (p.hardware_id as string) ?? '',
          memory_deadline: p.memory_deadline ? String(p.memory_deadline).slice(0, 10) : '',
        })
      })
      .catch(e => setError(e.message))
  }
  useEffect(load, [pieceId])

  const save = async () => {
    if (!pieceId) return
    setSaving(true); setFlash(null)
    try {
      const patch: Record<string, unknown> = {
        status: form.status,
        carrier: form.carrier || null,
        tracking_number: form.tracking_number || null,
        tracking_url: form.tracking_url || null,
        hardware_id: form.hardware_id || null,
        memory_deadline: form.memory_deadline ? new Date(form.memory_deadline).toISOString() : null,
      }
      const r = await adminApi.updatePiece(pieceId, patch)
      const emailNote = r.emailResult === 'sent' ? ' · shipped email sent'
        : r.emailResult === 'skipped' ? ' · shipped email already sent' : ''
      setFlash({ ok: true, text: `Saved${emailNote}.` })
      load()
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  if (error) return <div className={styles.msg + ' ' + styles.msgErr}>{error}</div>
  if (!data) return <div className={styles.loading}>Loading…</div>

  const { piece, buyer, recipient, items, vault, emails } = data
  const addr = piece.shipping_address as Record<string, string> | null

  const Field = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className={styles.field}><span className={styles.fieldLabel}>{label}</span><span className={styles.fieldValue}>{value}</span></div>
  )

  return (
    <>
      <Link to="/admin/pieces" className={styles.back}>← All pieces</Link>
      <h1 className={styles.h1}>{describeConfig(piece.config, piece.product_type)}</h1>
      <p className={styles.subtle}>
        <span className={styles.mono}>{piece.serial ?? '—'}</span> · <StatusPill status={piece.status} />
      </p>

      <div className={styles.detailGrid}>
        {/* ── Left: info ─────────────────────────────────── */}
        <div>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Order</div>
            <Field label="Serial" value={<span className={styles.mono}>{piece.serial ?? '—'}</span>} />
            <Field label="Collection" value={piece.collection ?? '—'} />
            <Field label="Configuration" value={describeConfig(piece.config, piece.product_type)} />
            <Field label="Est. price" value={money(estCents(piece.config))} />
            <Field label="Ordered" value={dateTime(piece.created_at)} />
            <Field label="Memory deadline" value={date(piece.memory_deadline as string)} />
            <Field label="Shipped" value={dateTime(piece.shipped_at as string)} />
            <Field label="First viewed" value={dateTime(piece.first_viewed_at as string)} />
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>People</div>
            <Field label="Buyer" value={buyer?.name ?? '—'} />
            <Field label="Buyer email" value={buyer?.email ?? '—'} />
            <Field label="Recipient" value={piece.recipient_name ?? recipient?.name ?? '—'} />
            <Field label="Recipient phone" value={(piece.recipient_phone as string) ?? '—'} />
            <Field label="Linked account" value={recipient?.email ?? (piece.receiver_id ? 'Linked' : 'Not yet linked')} />
          </div>

          {addr && (
            <div className={styles.panel}>
              <div className={styles.panelTitle}>Shipping address</div>
              <div className={styles.memoryBody}>
                {addr.name && <div>{addr.name}</div>}
                <div>{[addr.line1, addr.line2].filter(Boolean).join(', ')}</div>
                <div>{[addr.city, addr.state, addr.postal_code].filter(Boolean).join(', ')}</div>
                <div>{addr.country}</div>
              </div>
            </div>
          )}

          <div className={styles.panel}>
            <div className={styles.panelTitle}>Memories ({items.length})</div>
            {items.length === 0
              ? <div className={styles.empty}>No memories added yet.</div>
              : items.map(it => <MemoryRow key={it.id} item={it} />)}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>Email history</div>
            {emails.length === 0
              ? <div className={styles.empty}>No emails sent for this piece.</div>
              : emails.map((e, i) => (
                <Field key={i} label={e.type.replace(/_/g, ' ')} value={`${e.recipient ?? ''} · ${dateTime(e.sent_at)}`} />
              ))}
          </div>
        </div>

        {/* ── Right: management ──────────────────────────── */}
        <div>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Manage</div>

            {flash && <div className={`${styles.msg} ${flash.ok ? styles.msgOk : styles.msgErr}`}>{flash.text}</div>}

            <div className={styles.formRow}>
              <label>Status</label>
              <select className={styles.select} value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="crafting">Crafting</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            {/* Two identifiers, easily confused, so the difference is spelled
                out here: the UID is the chip's own, burned in by the
                manufacturer and only readable from the tag; the serial above
                is ours, and is what gets written onto the tag. */}
            <div className={styles.formRow}>
              <label>Tag UID (from manufacturer)</label>
              <div style={{ minWidth: 0 }}>
                <input className={styles.input} style={{ width: '100%', minWidth: 0 }} value={form.hardware_id}
                  placeholder="e.g. 04A224B2C13D80"
                  onChange={e => setForm(f => ({ ...f, hardware_id: e.target.value }))} />
                <p style={{ margin: '6px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--ink-soft, #888)' }}>
                  The chip&rsquo;s own identifier. Not the serial &mdash; write{' '}
                  <span className={styles.mono}>{piece.serial ?? 'TIJ-…'}</span> onto the tag.
                </p>
              </div>
            </div>

            <div className={styles.formRow}>
              <label>Carrier</label>
              <select className={styles.select} value={form.carrier}
                onChange={e => setForm(f => ({ ...f, carrier: e.target.value }))}>
                {CARRIERS.map(c => <option key={c} value={c}>{c ? c.toUpperCase() : '—'}</option>)}
              </select>
            </div>

            <div className={styles.formRow}>
              <label>Tracking number</label>
              <input className={styles.input} style={{ minWidth: 0 }} value={form.tracking_number}
                onChange={e => setForm(f => ({ ...f, tracking_number: e.target.value }))} />
            </div>

            <div className={styles.formRow}>
              <label>Tracking URL (optional)</label>
              <input className={styles.input} style={{ minWidth: 0 }} value={form.tracking_url}
                onChange={e => setForm(f => ({ ...f, tracking_url: e.target.value }))} />
            </div>

            <div className={styles.formRow}>
              <label>Memory deadline</label>
              <input type="date" className={styles.input} style={{ minWidth: 0 }} value={form.memory_deadline}
                onChange={e => setForm(f => ({ ...f, memory_deadline: e.target.value }))} />
            </div>

            <button className={styles.btn} onClick={save} disabled={saving} style={{ width: '100%', marginTop: 8 }}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <p className={styles.subtle} style={{ marginTop: 12, marginBottom: 0 }}>
              Setting status to <strong>Shipped</strong> stamps the ship date and emails the buyer (once).
            </p>
          </div>

          {vault && (
            <div className={styles.panel}>
              <div className={styles.panelTitle}>Storage</div>
              <Field label="Used" value={fmtBytes(vault.storage_used_bytes)} />
              <Field label="Limit" value={fmtBytes(vault.storage_limit_bytes)} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ── Memory row ──────────────────────────────────────────────────────── */
/// Memories are not viewable from admin, and that is the intended result
/// rather than a gap to work around. Admin holds the bucket and the database;
/// it holds no key, so there is nothing here to render. What the row still
/// shows is that a memory exists and what kind it is — which is what support
/// actually needs, since "did their photo upload?" is answerable without
/// looking at the photo.
function MemoryRow({ item }: { item: MessageItem }) {
  return (
    <div className={styles.memoryItem}>
      <div className={styles.memoryType}>{item.type.replace(/_/g, ' ')}</div>
      <div className={styles.memoryBody}>
        <div style={{ color: 'var(--ink-soft, #888)', display: 'flex', gap: 6, alignItems: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/>
          </svg>
          Encrypted &mdash; readable only by the sender and recipient
        </div>
      </div>
    </div>
  )
}

function fmtBytes(b: string | null): string {
  if (!b) return '—'
  const n = Number(b)
  if (!n) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB']; let i = 0; let v = n
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${u[i]}`
}
