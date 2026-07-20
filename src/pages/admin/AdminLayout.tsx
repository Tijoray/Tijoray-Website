import { useEffect, useState } from 'react'
import { NavLink, Outlet, Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { adminApi } from '../../lib/adminApi'
import styles from './admin.module.css'

type GateState = 'checking' | 'ok' | 'denied'

/**
 * Admin shell + access gate. The real security boundary is server-side
 * (ADMIN_EMAILS allowlist re-checked on every /api/admin call); this just avoids
 * rendering the UI to non-admins and gives them a clear message.
 */
export default function AdminLayout() {
  const { user, loading, signOut } = useAuth()
  const location = useLocation()
  const [gate, setGate] = useState<GateState>('checking')
  const [email, setEmail] = useState<string>('')

  useEffect(() => {
    if (loading || !user) return
    let alive = true
    adminApi.whoami()
      .then(r => { if (alive) { setGate('ok'); setEmail(r.email) } })
      .catch(() => { if (alive) setGate('denied') })
    return () => { alive = false }
  }, [loading, user])

  if (loading || (user && gate === 'checking')) {
    return <div className={styles.gate}>Checking access…</div>
  }
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  if (gate === 'denied') {
    return (
      <div className={styles.gate}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28 }}>Not authorised</div>
        <p>This account doesn’t have admin access.</p>
        <Link to="/" className={styles.linkOut}>← Back to site</Link>
      </div>
    )
  }

  const link = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.navLink} ${styles.navActive}` : styles.navLink

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Tijoray</div>
        <div className={styles.brandSub}>Operations</div>
        <nav className={styles.nav}>
          <NavLink to="/admin" end className={link}>Dashboard</NavLink>
          <NavLink to="/admin/pieces" className={link}>Pieces &amp; Orders</NavLink>
          <NavLink to="/admin/customers" className={link}>Customers</NavLink>
          <NavLink to="/admin/emails" className={link}>Emails</NavLink>
        </nav>
        <button className={styles.signOut} onClick={() => signOut()}>
          {email} · Sign out
        </button>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
