import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi, type DashboardStats } from '../../lib/adminApi'
import { money, dateTime } from './format'
import styles from './admin.module.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    adminApi.dashboard().then(setStats).catch(e => setError(e.message))
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
