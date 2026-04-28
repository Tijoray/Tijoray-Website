import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './StickyMobileCta.module.css'

export default function StickyMobileCta() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const hero = document.getElementById('hero-section')
    if (!hero) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        // Show bar when hero is no longer in view
        if (!dismissed) setVisible(!entry.isIntersecting)
      },
      { threshold: 0.1 }
    )
    observerRef.current.observe(hero)
    return () => observerRef.current?.disconnect()
  }, [dismissed])

  if (dismissed) return null

  return (
    <div
      className={`${styles.bar} ${visible ? styles.barVisible : ''}`}
      role="complementary"
      aria-label="Sticky call to action"
    >
      <Link to="/build" className={styles.cta}>
        Build Your Tijoray
      </Link>
      <button
        className={styles.dismiss}
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
