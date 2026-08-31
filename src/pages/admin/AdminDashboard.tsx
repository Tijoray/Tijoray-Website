import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi, type DashboardStats, type TaxSummary } from '../../lib/adminApi'
import { money, moneyExact, dateTime } from './format'
import styles from './admin.module.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [tax, setTax] = useState<TaxSummary | null>(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    adminApi.dashboard().then(setStats).catch(e => setError(e.message))
    // Loaded separately so a reporting hiccup cannot blank the operational
    // cards above, which are what the panel is opened for day to day.
    adminApi.taxSummary().then(setTax).catch(() => setTax(null))
  }, [])

  if (error) return <div className={styles.msg + ' ' + styles.msgErr}>{error}</div>
  if (!stats) return <div className={styles.loading}>Loading…</div>

  const card = (label: string, value: string | number, opts?: { alert?: boolean; to?: string }) => (
    <div
      className={`${styles.card} ${opts?.alert ? styles.cardAlert : ''}`}
      style={opts?.to ? { cursor: 'pointer' } : undefined}
      onClick={opts?.to ? () => navigate(opts.to!) : undefined}
    >
      <div className={styles.cardLabel}>{label}</div>
      <div className={styles.cardValue}>{value}</div>
    </div>
  )

  return (
    <>
      <h1 className={styles.h1}>Dashboard</h1>
      <p className={styles.subtle}>Operational overview across all pieces, customers, and emails.</p>

      <div className={styles.sectionTitle}>Action queue</div>
      <div className={styles.cards}>
        {card('Crafting · no memories', stats.craftingNoMemories, { alert: stats.craftingNoMemories > 0, to: '/admin/pieces?status=crafting' })}
        {card('Past deadline · empty', stats.overdueNoMemories, { alert: stats.overdueNoMemories > 0 })}
        {card('Shipped · no NFC tag', stats.shippedNoTag, { alert: stats.shippedNoTag > 0 })}
        {card('Ready to ship', stats.byStatus.crafting ?? 0, { to: '/admin/pieces?status=crafting' })}
      </div>

      <div className={styles.sectionTitle}>Pipeline</div>
      <div className={styles.cards}>
        {card('Total pieces', stats.totalPieces, { to: '/admin/pieces' })}
        {card('Crafting', stats.byStatus.crafting ?? 0)}
        {card('Shipped', stats.byStatus.shipped ?? 0)}
        {card('Delivered', stats.byStatus.delivered ?? 0)}
        {card('Recipients viewed', stats.viewed)}
        {card('Customers', stats.customerCount, { to: '/admin/customers' })}
        {card('Est. revenue', money(stats.estRevenueCents))}
      </div>

      <div className={styles.sectionTitle}>Revenue &amp; tax</div>
      <div className={styles.cards}>
        {card('Orders', stats.orderCount)}
        {card('Charged', money(stats.revenueCents))}
        {card('Tax collected', moneyExact(stats.taxCollectedCents))}
        {card('Discounts given', money(stats.discountGivenCents), { to: '/admin/promos' })}
        {/* A tax calculation Stripe could not finish is a hole in a filing, not
            a rounding difference — it gets the alert treatment. */}
        {stats.unresolvedTax > 0 && card('Tax unresolved', stats.unresolvedTax, { alert: true })}
      </div>
      <p className={styles.hint}>
        Charged is what Stripe actually took, from orders recorded since the Orders table went in.
        Older pieces are estimated separately at {money(stats.estRevenueCents)} from their metal.
      </p>

      {tax && tax.jurisdictions.length > 0 && (
        <>
          <div className={styles.sectionTitle}>Tax collected by jurisdiction</div>
          <div className={styles.tableWrap}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Country</th><th>State / province</th><th>Orders</th>
                    <th>Taxable base</th><th>Tax collected</th><th>Gross</th>
                  </tr>
                </thead>
                <tbody>
                  {tax.jurisdictions.map(j => (
                    <tr key={`${j.country}/${j.state}`}>
                      <td data-label="Country">{j.country}</td>
                      <td data-label="State / province">{j.state || '—'}</td>
                      <td data-label="Orders">{j.orders}</td>
                      <td data-label="Taxable base">{moneyExact(j.netCents)}</td>
                      <td data-label="Tax collected">{moneyExact(j.taxCents)}</td>
                      <td data-label="Gross">{moneyExact(j.grossCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className={styles.hint}>
            Grouped by shipping destination, which is what these physical goods are taxed on.
            Taxable base is the subtotal less any discount, before tax — the figure a return declares.
          </p>
        </>
      )}

      <div className={styles.sectionTitle}>Emails sent</div>
      <div className={styles.cards}>
        {Object.keys(stats.emailByType).length === 0
          ? <div className={styles.subtle}>No emails logged yet.</div>
          : Object.entries(stats.emailByType).map(([type, n]) => card(type.replace(/_/g, ' '), n))}
      </div>

      <div className={styles.sectionTitle}>Recent admin activity</div>
      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr><th>When</th><th>Admin</th><th>Action</th><th>Entity</th></tr>
            </thead>
            <tbody>
              {stats.recentAudit.length === 0 ? (
                <tr><td colSpan={4} className={styles.empty}>No admin actions logged yet.</td></tr>
              ) : stats.recentAudit.map(a => (
                <tr key={a.id}>
                  <td>{dateTime(a.created_at)}</td>
                  <td>{a.actor_email}</td>
                  <td className={styles.mono}>{a.action}</td>
                  <td className={styles.mono}>{a.entity_type ?? ''} {a.entity_id?.slice(0, 8) ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
