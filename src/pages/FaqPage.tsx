import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './FaqPage.module.css'

const FAQS = [
  {
    q: 'Does it work on iPhone and Android?',
    a: 'Yes. Tijoray uses standard NFC technology supported natively on all modern iPhones (XS and later) and Android devices. No app download is required — simply tap your phone to the piece to unlock your vault.',
  },
  {
    q: 'What happens if I lose my jewellery?',
    a: 'Your memories are stored in an encrypted cloud vault, not solely on the NFC chip. If your piece is lost or stolen, your data remains safe and accessible via your account. You can order a replacement piece and transfer your vault to the new NFC chip.',
  },
  {
    q: 'Is my data stored online?',
    a: 'Your vault contents are encrypted with AES-256 before leaving your device and stored in a private, owner-controlled cloud vault. The NFC chip itself holds only encrypted authentication credentials — not your memories. Tijoray staff cannot access your vault.',
  },
  {
    q: 'Can I transfer ownership to someone else?',
    a: "Yes. Tijoray pieces are designed to be passed down through generations. Our ownership transfer process is cryptographically verified, ensuring both the piece's provenance and vault access transfer securely to the new owner. You control exactly what memories are included.",
  },
  {
    q: 'Can I customise the gemstone?',
    a: 'Absolutely. Our signature collection features twelve birthstones, and bespoke commissions can incorporate diamonds, emeralds, sapphires, rubies, and other precious stones. Visit the Build Your Tijoray configurator or book a private consultation for bespoke options.',
  },
  {
    q: 'How secure is NFC technology?',
    a: 'The NFC chip uses encrypted authentication — it will only respond to authenticated requests from authorised devices. Physical tampering with the chip invalidates its cryptographic certificate, triggering a tamper alert. The chip is also entirely passive, meaning it emits no signal unless actively read by your phone.',
  },
  {
    q: 'How long does it last?',
    a: 'The NFC chip itself is rated for decades of use with no maintenance — it requires no battery or charging. The jewellery is handcrafted from materials chosen for longevity: 18k gold, platinum, and sterling silver. Your vault subscription is covered for the lifetime of the piece.',
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
          Everything you need to know about Tijoray jewellery and the memory vault.
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
