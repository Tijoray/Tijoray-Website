import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './FaqPage.module.css'
import { usePageMeta } from '../lib/usePageMeta'

const FAQS = [
  {
    q: 'Does it work on iPhone and Android?',
    a: 'Tijoray uses standard NFC. The recipient needs the free Tijoray app, a verified account, internet access and a compatible NFC phone. The jewelry itself has nothing to pair or charge. Final supported OS versions and verified store links will be published in the setup guide.',
  },
  {
    q: 'Do I need an app, and who needs it, me or the person I gift it to?',
    a: 'Whoever wears the piece needs the free Tijoray app on their phone; that is what reads the tag and opens the memories. You compose the memories here on the website after ordering, so you do not need the app yourself unless the piece is for you. When a gift arrives, the recipient installs the app, taps the piece, and everything you prepared is waiting for them.',
  },
  {
    q: 'How long does it take to arrive, and can I return it?',
    a: 'Every piece is made to your configuration, so allow 10–14 business days from payment before it ships. Shipping is complimentary. Because each piece is made to order we cannot accept returns for a change of mind, so please configure carefully. If a piece arrives damaged or with a manufacturing defect, email support@tijoray.com within 14 days with photographs and we will arrange a replacement or a full refund.',
  },
  {
    q: 'What happens if I lose my jewelry?',
    a: 'Your memories are stored in Tijoray\'s encrypted online service, not on the NFC chip, so losing the jewelry does not by itself delete the stored files. Contact support to verify ownership and discuss recovery or a replacement piece. Online access remains subject to the service terms.',
  },
  {
    q: 'Is my data stored online?',
    a: 'Your memories are encrypted with AES-256 on your device before upload and stored as ciphertext online. The NFC chip holds only the piece\'s identity, never the memories. Each piece has its own key, held in escrow by Tijoray and released through account and piece authorization. This is not end-to-end encryption: Tijoray can technically decrypt stored content. Managed keys support gifting, transfer and recovery.',
  },
  {
    q: 'Can I transfer ownership to someone else?',
    a: 'Yes. Tijoray pieces are designed to be passed down through generations, because the vault belongs to the piece rather than to a single account. When you are ready to hand a piece on, contact the atelier and we will transfer the vault and its provenance to the new owner.',
  },
  {
    q: 'Are you able to make custom orders with this technology?',
    a: 'Absolutely. Please reach out with any design ideas and we will work closely with you to bring them to life; combining your vision with our technology to create something truly unique.',
  },
  {
    q: 'How secure is NFC technology?',
    a: 'The chip is entirely passive. It has no battery and emits no signal unless it is actively read by a phone held against it. It carries only the piece\'s identity: your memories are never stored on the chip, and viewing them always requires a verified, authorised account.',
  },
  {
    q: 'How long does it last?',
    a: 'The passive NFC chip has no battery and needs no charging. The online memory service is included with the piece without a subscription. Access depends on Tijoray continuing to operate the app and service, as explained in the Terms of Service.',
  },
]

/**
 * Care guidance, written against what we actually sell: sterling silver,
 * 10K and 18K gold, the twelve birthstones, and a passive NFC chip sealed
 * inside the piece.
 */
const CARE: { title: string; body?: string; points?: string[] }[] = [
  {
    title: 'Everyday wear',
    body: 'Your piece is made to be worn, not stored. A few habits keep it looking new for far longer:',
    points: [
      'Put it on last, after perfume, lotion, hairspray and sunscreen have dried.',
      'Take it off before swimming. Chlorine and salt water are hard on metal and can loosen a setting over time.',
      'Take it off for the gym, gardening, and anything with knocks or heavy lifting.',
      'Remove it before sleeping. Most broken chains are broken overnight.',
    ],
  },
  {
    title: 'Cleaning',
    body: 'Warm water, a drop of mild washing-up liquid, and a soft toothbrush is all that is needed. Rinse, then dry thoroughly with a soft lint-free cloth before wearing or storing.',
    points: [
      'Never use bleach, ammonia or abrasive polish. They pit the metal and dull a stone.',
      'Avoid home ultrasonic and steam cleaners. They can crack included or treated stones and loosen settings.',
    ],
  },
  {
    title: 'Stones that need a gentler hand',
    body: 'Most of our birthstones are hard-wearing. Four are not, and are worth knowing about:',
    points: [
      'Mother of Pearl (June) and Turquoise (December) are soft and porous. Keep them away from water, perfume and household chemicals, and wipe with a barely damp cloth only.',
      'Emerald (May) is commonly included and should never see an ultrasonic cleaner or hot water.',
      'Peridot (August) scratches more easily than the rest, so store it apart from harder stones.',
      'Ruby, sapphire, topaz, garnet, amethyst, citrine, aquamarine and tourmaline are all durable enough for daily wear.',
    ],
  },
  {
    title: 'By metal',
    points: [
      'Sterling silver tarnishes. That is the metal behaving normally, not a fault. Store it dry and away from air, and bring the shine back with a proper silver cloth.',
      '10K gold is the harder, more scratch-resistant gold; 18K is softer and warmer in color, so treat it a little more carefully.',
      'Rose and white finishes are best kept away from chlorine, which attacks the alloy over time.',
    ],
  },
  {
    title: 'The chip inside',
    body: 'The NFC chip is passive and sealed within the piece. It has no battery, never needs charging, and requires no maintenance at all.',
    points: [
      'Water, everyday knocks and airport scanners will not harm it.',
      'Do not attempt to drill, bend, cut or heat the piece. Any of those can destroy the chip, and doing so voids the warranty.',
      'If a tap stops working, try again with the phone held still against the piece before assuming a fault, then contact us.',
    ],
  },
  {
    title: 'Storage',
    body: 'Keep each piece separately in a soft pouch or a lined box. Stones scratch other stones, and chains left loose in a drawer knot and kink.',
    points: [
      'Store somewhere dry. A bathroom cabinet is the worst place in most homes.',
      'For a piece being put away for years, a sealed bag with the air pressed out slows tarnish considerably.',
    ],
  },
]

export default function FaqPage() {
  usePageMeta('FAQ & Care Guide', 'Answers on NFC taps, phone compatibility, encryption, ownership transfer, and how to care for each metal and stone.')
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

        {/* Linked from the footer as /faq#care. Kept on this page rather than
            given its own route so support has one place to send people. */}
        <section id="care" className={styles.careSection}>
          <header className={styles.careHeader}>
            <p className={styles.eyebrow}>Care Guide</p>
            <h2 className={styles.careTitle}>Looking after <em>your piece.</em></h2>
            <p className={styles.careIntro}>
              A Tijoray piece is made to be worn every day and handed on. These are
              the habits that keep the metal bright, the stone secure, and the chip
              inside reading cleanly for decades.
            </p>
          </header>

          <div className={styles.careGrid}>
            {CARE.map(section => (
              <article key={section.title} className={styles.careCard}>
                <h3>{section.title}</h3>
                {section.body && <p>{section.body}</p>}
                {section.points && (
                  <ul>
                    {section.points.map(point => <li key={point}>{point}</li>)}
                  </ul>
                )}
              </article>
            ))}
          </div>

          <p className={styles.careNote}>
            Something wrong with your piece? Don&rsquo;t attempt a repair yourself.
            Prising at a setting is the most common way a stone is lost. Write to{' '}
            <a href="mailto:support@tijoray.com">support@tijoray.com</a> and we will
            look after it.
          </p>
        </section>

        <div className={styles.cta}>
          <p className={styles.ctaText}>Still have questions?</p>
          <Link to="/contact" className={styles.ctaBtn}>Contact Our Atelier</Link>
        </div>
      </div>
    </div>
  )
}
