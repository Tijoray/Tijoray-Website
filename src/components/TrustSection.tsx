import { useState } from 'react'
import styles from './TrustSection.module.css'
import { useReveal } from '../lib/useReveal'

const TRUST_POINTS = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    label: 'AES-256 Encrypted Memories',
    detail: 'Memories are encrypted with AES-256 in your browser before they are uploaded — the same encryption standard used by governments and financial institutions. What reaches our servers is ciphertext, not your photos and voices.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    label: 'Private by Design',
    detail: 'Every piece has its own key, released only to the sender and the recipient once their identity is verified. We hold those keys in escrow rather than stranding them on a single phone, which is what lets a piece be given away, inherited, or recovered. It also means this is not end-to-end encryption: we could decrypt if legally compelled. We would rather say so than promise otherwise.',
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
    label: 'Made to Be Passed On',
    detail: 'A Tijoray piece is designed to outlive its first owner. When it is handed to the next generation, the vault travels with it — memories and provenance intact, tied to the piece rather than to a single account.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    label: 'Registered & Authenticated',
    detail: 'Every piece carries a unique serial identity, registered with our atelier at the moment of creation and verified on every tap — so a Tijoray can always be told from an imitation.',
  },
]

export default function TrustSection() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const reveal = useReveal(styles.inView)

  return (
    <section ref={reveal} className={styles.section}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Security &amp; Privacy</p>
          <h2 className={styles.title}>Built for the <em>long run.</em></h2>
          <p className={styles.subtitle}>
            Encrypted before they leave your phone. Readable by no one but you
            and the person you give the piece to.
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
