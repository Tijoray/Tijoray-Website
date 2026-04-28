import { useEffect, useRef, useState } from 'react'
import styles from './TrustSection.module.css'

const TRUST_POINTS = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    label: 'AES-256 Encrypted Storage',
    detail: 'Your memories are encrypted with AES-256, the same standard used by governments and financial institutions worldwide. No one — including Tijoray — can access your vault.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    label: 'Private Owner-Controlled Access',
    detail: 'Access keys are generated on your device and never stored on our servers. You hold the only copy. If you choose to share, you control exactly who sees what.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    label: 'Passive NFC — No Charging Required',
    detail: 'The NFC chip is completely passive — it draws power from your phone\'s field. No battery, no charging, no connectivity required. It works for decades without maintenance.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
    label: 'Secure Transfer to Future Owner',
    detail: 'When you pass your piece to the next generation, ownership transfer is cryptographically verified. The vault transfers intact — memories and provenance preserved.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    label: 'Tamper-Aware Authentication',
    detail: 'Each piece carries a cryptographic certificate of authenticity. Any tampering with the NFC chip invalidates the certificate, protecting both the vault and the piece\'s provenance.',
  },
]

export default function TrustSection() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) el.classList.add(styles.inView)
      }),
      { threshold: 0.1 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Security &amp; Privacy</p>
          <h2 className={styles.title}>Built for the <em>long run.</em></h2>
          <p className={styles.subtitle}>
            Your memories deserve the same protection as your most prized possessions.
          </p>
        </header>

        <ul className={styles.list}>
          {TRUST_POINTS.map((point, i) => (
            <li key={i} className={styles.item}>
              <button
                className={`${styles.itemBtn} ${expandedIndex === i ? styles.itemBtnOpen : ''}`}
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                aria-expanded={expandedIndex === i}
              >
                <span className={styles.itemIcon}>{point.icon}</span>
                <span className={styles.itemLabel}>{point.label}</span>
                <span className={styles.itemChevron} aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>
              {expandedIndex === i && (
                <p className={styles.itemDetail}>{point.detail}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
