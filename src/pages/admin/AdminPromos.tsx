import { useCallback, useEffect, useState } from 'react'
import {
  adminApi,
  type AdminPromo, type PromoRedemption, type NewPromoInput,
} from '../../lib/adminApi'
import { money, moneyExact, date, dateTime } from './format'
import styles from './admin.module.css'

/**
 * Promotion code manager.
 *
 * Two halves that answer two different questions. Stripe knows how many times a
 * code was redeemed and enforces the limits; this page shows that live. What
 * Stripe cannot hold is who we handed the code to and why, so that lives in our
 * own ledger and is editable here — a code with nine redemptions and no memory
 * of who was given it is not a record of anything.
 *
 * Discount terms are create-only, mirroring Stripe: a coupon's percentage cannot
 * change once issued, because people are already holding the code. To change a
 * discount you deactivate and mint a new one, which is also the honest thing to
 * do by anyone still carrying the old one.
 */

/** A code's single most important state, resolved in priority order. */
function statusOf(p: AdminPromo): { label: string; cls: string; title?: string } {
  if (p.missingInStripe) return {
    label: 'not in Stripe', cls: styles.pillWarn,
    title: 'Our ledger has this code but Stripe does not. It was archived or deleted in the Stripe dashboard and will not work at checkout.',
  }
  if (!p.active)  return { label: 'off',       cls: styles.pillMuted }
  if (p.expired)  return { label: 'expired',   cls: styles.pillMuted }
  if (p.exhausted) return { label: 'used up',  cls: styles.pillMuted }
  return { label: 'live', cls: styles.pillShipped }
}

const EMPTY_FORM = {
  code: '', discountType: 'percent' as 'percent' | 'amount',
  percentOff: '', amountOff: '',
  maxRedemptions: '', expiresAt: '', minimumAmount: '', firstTimeOnly: false,
  issuedToName: '', issuedToEmail: '', campaign: '', notes: '',
}

export default function AdminPromos() {
  const [rows, setRows]       = useState<AdminPromo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [notice, setNotice]   = useState('')

  const [creating, setCreating] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)

  const [openId, setOpenId]           = useState<string | null>(null)
  const [redemptions, setRedemptions] = useState<PromoRedemption[]>([])
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [editing, setEditing] = useState<Record<string, string>>({})

  const load = useCallback(() => {
    setLoading(true)
    adminApi.listPromos()
      .then(r => { setRows(r.promos); setError('') })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function openRow(p: AdminPromo) {
    if (openId === p.stripe_promotion_code_id) { setOpenId(null); return }
    setOpenId(p.stripe_promotion_code_id)
    setEditing({
      issuedToName:  p.issued_to_name  ?? '',
      issuedToEmail: p.issued_to_email ?? '',
      campaign:      p.campaign        ?? '',
      notes:         p.notes           ?? '',
    })
    setRedeemLoading(true)
    setRedemptions([])
    try {
      const r = await adminApi.promoRedemptions(p.stripe_promotion_code_id)
      setRedemptions(r.redemptions)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load redemptions')
    } finally {
      setRedeemLoading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setNotice('')
    const payload: NewPromoInput = {
      code: form.code,
      percentOff:     form.discountType === 'percent' ? Number(form.percentOff) : null,
      // Entered in dollars, stored and sent in cents — the API speaks only cents.
      amountOffCents: form.discountType === 'amount'  ? Math.round(Number(form.amountOff) * 100) : null,
      maxRedemptions:     form.maxRedemptions ? Number(form.maxRedemptions) : null,
      expiresAt:          form.expiresAt || null,
      minimumAmountCents: form.minimumAmount ? Math.round(Number(form.minimumAmount) * 100) : null,
      firstTimeOnly:      form.firstTimeOnly,
      issuedToName:  form.issuedToName,
      issuedToEmail: form.issuedToEmail,
      campaign:      form.campaign,
      notes:         form.notes,
    }
    try {
      const { promo } = await adminApi.createPromo(payload)
      setNotice(`${promo.code} created — ${promo.label}.`)
      setForm(EMPTY_FORM)
      setCreating(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the code')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(p: AdminPromo) {
    setError(''); setNotice('')
    try {
      await adminApi.updatePromo(p.stripe_promotion_code_id, { active: !p.active })
      setNotice(`${p.code} is now ${p.active ? 'off' : 'live'}.`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the code')
    }
  }

  async function saveNotes(p: AdminPromo) {
    setError(''); setNotice('')
    try {
      await adminApi.updatePromo(p.stripe_promotion_code_id, {
        issuedToName:  editing.issuedToName,
        issuedToEmail: editing.issuedToEmail,
        campaign:      editing.campaign,
        notes:         editing.notes,
      })
      setNotice(`Saved notes for ${p.code}.`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    }
  }

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  return (
    <>
      <h1 className={styles.h1}>Promo codes</h1>
      <p className={styles.subtle}>
        Stripe enforces the discount and the limits. This page records who holds each code,
        and shows who has used it.
      </p>

      {error  && <div className={`${styles.msg} ${styles.msgErr}`}>{error}</div>}
      {notice && <div className={`${styles.msg} ${styles.msgOk}`}>{notice}</div>}

      <div className={styles.toolbar}>
        <button className={styles.btn} onClick={() => setCreating(c => !c)}>
          {creating ? 'Cancel' : 'New code'}
        </button>
        <button className={styles.filterBtn} onClick={load}>Refresh</button>
      </div>

      {creating && (
        <form className={styles.panel} onSubmit={submit}>
          <p className={styles.panelTitle}>Issue a code</p>

          <div className={styles.grid2}>
            <div className={styles.formRow}>
              <label htmlFor="code">Code</label>
              <input id="code" className={styles.input} value={form.code} onChange={set('code')}
                placeholder="FOUNDER20" autoComplete="off" required />
              <p className={styles.hint}>Letters, numbers, hyphens. Case doesn’t matter to the customer.</p>
            </div>

            <div className={styles.formRow}>
              <label htmlFor="discount">Discount</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  id="discount"
                  className={styles.input}
                  style={{ minWidth: 0, flex: '0 0 110px' }}
                  value={form.discountType}
                  onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'percent' | 'amount' }))}
                >
                  <option value="percent">Percent</option>
                  <option value="amount">Amount</option>
                </select>
                {form.discountType === 'percent' ? (
                  <input className={styles.input} style={{ minWidth: 0, flex: 1 }} type="number"
                    min="1" max="100" step="0.01" placeholder="20"
                    value={form.percentOff} onChange={set('percentOff')} required />
                ) : (
                  <input className={styles.input} style={{ minWidth: 0, flex: 1 }} type="number"
                    min="1" step="0.01" placeholder="50.00"
                    value={form.amountOff} onChange={set('amountOff')} required />
                )}
              </div>
              <p className={styles.hint}>
                Can’t be changed later — a code already in someone’s hands has to keep its promise.
              </p>
            </div>
          </div>

          <div className={styles.grid3}>
            <div className={styles.formRow}>
              <label htmlFor="maxRedemptions">Redemption limit</label>
              <input id="maxRedemptions" className={styles.input} type="number" min="1"
                placeholder="Unlimited" value={form.maxRedemptions} onChange={set('maxRedemptions')} />
            </div>
            <div className={styles.formRow}>
              <label htmlFor="expiresAt">Expires</label>
              <input id="expiresAt" className={styles.input} type="date"
                value={form.expiresAt} onChange={set('expiresAt')} />
            </div>
            <div className={styles.formRow}>
              <label htmlFor="minimumAmount">Minimum order ($)</label>
              <input id="minimumAmount" className={styles.input} type="number" min="0" step="0.01"
                placeholder="None" value={form.minimumAmount} onChange={set('minimumAmount')} />
            </div>
          </div>

          <label className={styles.toggle} style={{ marginBottom: 14 }}>
            <input type="checkbox" checked={form.firstTimeOnly} onChange={set('firstTimeOnly')} />
            <span>First order only</span>
          </label>

          <div className={styles.sectionTitle}>Who is this for?</div>
          <div className={styles.grid3}>
            <div className={styles.formRow}>
              <label htmlFor="issuedToName">Issued to</label>
              <input id="issuedToName" className={styles.input} placeholder="Name or outlet"
                value={form.issuedToName} onChange={set('issuedToName')} />
            </div>
            <div className={styles.formRow}>
              <label htmlFor="issuedToEmail">Their email</label>
              <input id="issuedToEmail" className={styles.input} type="email"
                value={form.issuedToEmail} onChange={set('issuedToEmail')} />
            </div>
            <div className={styles.formRow}>
              <label htmlFor="campaign">Campaign</label>
              <input id="campaign" className={styles.input} placeholder="Launch press"
                value={form.campaign} onChange={set('campaign')} />
            </div>
          </div>
          <div className={styles.formRow}>
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" className={styles.textarea} value={form.notes} onChange={set('notes')} />
          </div>

          <button className={styles.btn} type="submit" disabled={saving}>
            {saving ? 'Creating…' : 'Create code'}
          </button>
        </form>
      )}

      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th><th>Discount</th><th>Issued to</th><th>Campaign</th>
                <th>Used</th><th>Discount given</th><th>Expires</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className={styles.loading}>Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className={styles.empty}>No codes issued yet.</td></tr>
              ) : rows.map(p => {
                const st = statusOf(p)
                const open = openId === p.stripe_promotion_code_id
                return [
                  <tr key={p.id} className={styles.rowLink} onClick={() => openRow(p)}>
                    <td data-label="Code" className={styles.mono}>{p.code}</td>
                    <td data-label="Discount">{p.label}</td>
                    <td data-label="Issued to">{p.issued_to_name || p.issued_to_email || '—'}</td>
                    <td data-label="Campaign">{p.campaign ?? '—'}</td>
                    <td data-label="Used">
                      {p.timesRedeemed}{p.maxRedemptions != null ? ` / ${p.maxRedemptions}` : ''}
                    </td>
                    <td data-label="Discount given">{moneyExact(p.discountCents)}</td>
                    <td data-label="Expires">{p.expiresAt ? date(p.expiresAt) : 'Never'}</td>
                    <td data-label="Status">
                      <span className={`${styles.pill} ${st.cls}`} title={st.title}>{st.label}</span>
                    </td>
                    <td data-label="">
                      <button
                        className={p.active ? styles.dangerBtn : styles.filterBtn}
                        onClick={e => { e.stopPropagation(); toggleActive(p) }}
                        disabled={p.missingInStripe}
                        title={p.missingInStripe ? 'This code no longer exists in Stripe.' : undefined}
                      >
                        {p.active ? 'Turn off' : 'Turn on'}
                      </button>
                    </td>
                  </tr>,

                  open && (
                    <tr key={`${p.id}-detail`}>
                      <td colSpan={9} style={{ background: '#faf8f4' }}>
                        <div className={styles.grid2} style={{ alignItems: 'start' }}>

                          <div>
                            <div className={styles.sectionTitle} style={{ marginTop: 8 }}>Who holds this code</div>
                            <div className={styles.formRow}>
                              <label>Issued to</label>
                              <input className={styles.input} value={editing.issuedToName ?? ''}
                                onChange={e => setEditing(v => ({ ...v, issuedToName: e.target.value }))} />
                            </div>
                            <div className={styles.formRow}>
                              <label>Their email</label>
                              <input className={styles.input} value={editing.issuedToEmail ?? ''}
                                onChange={e => setEditing(v => ({ ...v, issuedToEmail: e.target.value }))} />
                            </div>
                            <div className={styles.formRow}>
                              <label>Campaign</label>
                              <input className={styles.input} value={editing.campaign ?? ''}
                                onChange={e => setEditing(v => ({ ...v, campaign: e.target.value }))} />
                            </div>
                            <div className={styles.formRow}>
                              <label>Notes</label>
                              <textarea className={styles.textarea} value={editing.notes ?? ''}
                                onChange={e => setEditing(v => ({ ...v, notes: e.target.value }))} />
                            </div>
                            <button className={styles.btn} onClick={() => saveNotes(p)}>Save</button>

                            <div className={styles.sectionTitle}>Terms</div>
                            <div className={styles.field}>
                              <span className={styles.fieldLabel}>Minimum order</span>
                              <span className={styles.fieldValue}>
                                {p.minimum_amount_cents ? money(p.minimum_amount_cents) : 'None'}
                              </span>
                            </div>
                            <div className={styles.field}>
                              <span className={styles.fieldLabel}>First order only</span>
                              <span className={styles.fieldValue}>{p.first_time_only ? 'Yes' : 'No'}</span>
                            </div>
                            <div className={styles.field}>
                              <span className={styles.fieldLabel}>Created</span>
                              <span className={styles.fieldValue}>{date(p.created_at)} · {p.created_by ?? '—'}</span>
                            </div>
                          </div>

                          <div>
                            <div className={styles.sectionTitle} style={{ marginTop: 8 }}>
                              Redemptions ({p.timesRedeemed})
                            </div>
                            {/* Stripe's counter can exceed this list: an order paid for
                                before the Orders table existed was counted by Stripe but
                                never recorded here. Said plainly rather than left to look
                                like missing data. */}
                            {redeemLoading ? (
                              <div className={styles.loading}>Loading…</div>
                            ) : redemptions.length === 0 ? (
                              <div className={styles.empty}>
                                {p.timesRedeemed > 0
                                  ? 'Redeemed in Stripe, but no order recorded here.'
                                  : 'Not used yet.'}
                              </div>
                            ) : (
                              <table className={styles.table}>
                                <thead>
                                  <tr><th>When</th><th>Customer</th><th>Discount</th><th>Paid</th></tr>
                                </thead>
                                <tbody>
                                  {redemptions.map(r => (
                                    <tr key={r.id}>
                                      <td>{dateTime(r.paid_at)}</td>
                                      <td>{r.buyerName ?? r.email ?? '—'}</td>
                                      <td>−{moneyExact(r.discount_cents)}</td>
                                      <td>{moneyExact(r.total_cents)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>

                        </div>
                      </td>
                    </tr>
                  ),
                ]
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
