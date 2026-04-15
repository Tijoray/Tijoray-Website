import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import styles from './OrderSuccessPage.module.css'

export default function OrderSuccessPage() {
  const { clearCart } = useCart()
  const navigate = useNavigate()

  // Clear the cart once the success page is reached
  useEffect(() => {
    clearCart()
  }, [clearCart])

  // Redirect to home if no session_id in URL (direct access)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.get('session_id')) navigate('/', { replace: true })
  }, [navigate])

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
          A confirmation has been sent to your email. Your pendant will be handcrafted and dispatched within 10–14 business days.
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
