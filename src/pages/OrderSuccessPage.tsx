import { useEffect, useRef } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import styles from './OrderSuccessPage.module.css'

export default function OrderSuccessPage() {
  const { clearCart } = useCart()
  const [params] = useSearchParams()
  const hasSession = Boolean(params.get('session_id'))

  // Empty the cart once, on arrival back from Stripe. The ref guard matters:
  // this page is the one place clearCart is called from an effect, and if it
  // ever re-fires the resulting render loop wedges the page — the "Go to My
  // Portal" link below stops responding and the only way out is a reload.
  const cleared = useRef(false)
  useEffect(() => {
    if (cleared.current) return
    cleared.current = true
    clearCart()
  }, [clearCart])

  // No Stripe session in the URL means there is no order to confirm — a direct
  // hit or a stale bookmark. Redirect during render so nothing flashes first.
  if (!hasSession) return <Navigate to="/" replace />

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.iconWrap} aria-hidden="true">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>

        <p className={styles.eyebrow}>Order Confirmed</p>
        <h1 className={styles.title}>Your piece is being crafted</h1>
        <p className={styles.body}>
          A confirmation has been sent to your email. Your piece will be handcrafted and dispatched within 10–14 business days.
        </p>
        <p className={styles.body}>
          Once your piece arrives, return to your portal to compose the memory inside — photos, voice notes, music, and more.
        </p>

        <div className={styles.actions}>
          <Link to="/portal" className={styles.primaryBtn}>
            Go to My Portal
          </Link>
          <Link to="/" className={styles.secondaryLink}>
            Return to home
          </Link>
        </div>
      </div>
    </main>
  )
}
