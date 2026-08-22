import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './FaqPage.module.css'

const FAQS = [
  {
    q: 'Does it work on iPhone and Android?',
    a: 'Yes. Tijoray uses standard NFC technology supported natively on modern iPhones (XS and later) and NFC-enabled Android devices. Tapping your phone to the piece opens the Tijoray experience, where your memories are waiting.',
  },
  {
    q: 'What happens if I lose my jewelry?',
    a: 'Your memories are stored in an encrypted cloud vault, not solely on the NFC chip. If your piece is lost or stolen, your data remains safe and accessible via your account. You can order a replacement piece and transfer your vault to the new NFC chip.',
  },
  {
    q: 'Is my data stored online?',
    a: 'Your memories are encrypted with AES-256 on your device before they are uploaded, and stored as ciphertext in secure cloud storage. The NFC chip itself holds only the piece\'s identity — never your memories. Decryption keys are issued only to the sender and recipient of a piece; our support tools can see that a memory exists, not what it contains.',
  },
  {
    q: 'Can I transfer ownership to someone else?',
    a: 'Yes. Tijoray pieces are designed to be passed down through generations — the vault belongs to the piece, not to a single account. When you are ready to hand a piece on, contact the atelier and we will transfer the vault and its provenance to the new owner.',
  },
  {
    q: 'Are you able to make custom orders with this technology?',
    a: 'Absolutely. Please reach out with any design ideas and we will work closely with you to bring them to life; combining your vision with our technology to create something truly unique.',
  },
  {
    q: 'How secure is NFC technology?',
    a: 'The chip is entirely passive — it has no battery and emits no signal unless it is actively read by a phone held against it. It carries only the piece\'s identity: your memories are never stored on the chip, and viewing them always requires a verified, authorised account.',
  },
  {
    q: 'How long does it last?',
    a: 'The NFC chip is rated for decades of use with no maintenance — no battery, no charging. The jewelry is crafted from materials chosen for longevity: stainless steel, sterling silver, and 10K or 18K gold. The memory vault is included with your piece — there is no subscription and nothing further to pay.',
  },
]

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(null)

  function toggle(i: number) {
    setOpen(prev => prev === i ? null : i)
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.eyebrow}>Support</p>
        <h1 className={styles.title}>Frequently Asked <em>Questions</em></h1>
        <p className={styles.subtitle}>
          Everything you need to know about Tijoray jewelry and the memory vault.
        </p>
      </div>

      <div className={styles.content}>
        <dl className={styles.accordion}>
          {FAQS.map((faq, i) => (
            <div key={i} className={`${styles.item} ${open === i ? styles.itemOpen : ''}`}>
              <dt>
                <button
                  className={styles.question}
                  onClick={() => toggle(i)}
                  aria-expanded={open === i}
                  aria-controls={`faq-answer-${i}`}
                  id={`faq-question-${i}`}
                >
                  <span>{faq.q}</span>
                  <span className={styles.chevron} aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>
              </dt>
              <dd
                id={`faq-answer-${i}`}
                role="region"
                aria-labelledby={`faq-question-${i}`}
                className={styles.answer}
              >
                <p>{faq.a}</p>
              </dd>
            </div>
          ))}
        </dl>

        <div className={styles.cta}>
          <p className={styles.ctaText}>Still have questions?</p>
          <Link to="/contact" className={styles.ctaBtn}>Contact Our Atelier</Link>
        </div>
      </div>
    </div>
  )
}
