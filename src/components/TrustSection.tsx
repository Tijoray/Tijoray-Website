import { useState } from 'react'
import styles from './TrustSection.module.css'
import { useReveal } from '../lib/useReveal'
import { IMG } from '../lib/assets'

const TRUST_POINTS = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    label: 'AES-256 Encrypted Memories',
    detail: 'Memories are encrypted with AES-256 in your browser before they are uploaded. That is the same encryption standard used by governments and financial institutions. What reaches our servers is ciphertext, not your photos and voices.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    label: 'Private by Design',
    detail: 'Every piece has its own key and access is controlled through account and piece authorization. We hold those keys in escrow rather than stranding them on a single phone, which supports gifting, transfer and recovery. It also means this is not end-to-end encryption: Tijoray can technically decrypt stored content.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    label: 'Passive NFC, No Charging',
    detail: 'The NFC chip is completely passive and draws power from your phone\'s field. The jewelry has no battery and needs no charging. The app uses internet access to verify the piece and retrieve its encrypted online memories.',
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
    detail: 'A Tijoray piece can be transferred to a new owner. Tijoray support verifies the parties and transfers access to its online memory collection and provenance record under the service terms.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    label: 'Registered & Authenticated',
    detail: 'Every piece carries a unique serial identity, registered with our atelier at the moment of creation and verified on every tap, so a Tijoray can always be told from an imitation.',
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
            Encrypted before upload and restricted to authorized accounts. Tijoray
            manages recovery keys, so this is not end-to-end encryption.
          </p>
        </header>

        <figure className={styles.cutaway}>
          <img
            src={IMG.nfcCutaway}
            alt="Cutaway of a Tijoray pendant, showing the NFC coil sealed in the gold body beneath the stone"
            className={styles.cutawayImg}
            loading="lazy"
            width="960"
            height="960"
          />
          <figcaption className={styles.cutawayCaption}>
            The chip sits under the stone and carries the piece's identity, not the memories themselves.
          </figcaption>
        </figure>

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
