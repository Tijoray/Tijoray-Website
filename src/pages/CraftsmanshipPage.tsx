import { Link } from 'react-router-dom'
import styles from './CraftsmanshipPage.module.css'
import { useReveal } from '../lib/useReveal'
import { usePageMeta } from '../lib/usePageMeta'

const PILLARS = [
  {
    num: '01',
    title: 'Metals',
    body: 'Every Tijoray piece begins with its metal. We work in sterling silver and 10K or 18K gold — in white, yellow, and rose — each chosen for how it wears over years of daily contact, not just how it photographs on day one.',
  },
  {
    num: '02',
    title: 'Birthstones',
    body: 'Twelve stones, one for every month, each selected for color and character and set by hand at the center of the piece. The stone you choose — and the month it stands for — is recorded in the piece\'s digital profile the moment it is made.',
  },
  {
    num: '03',
    title: 'Hand Finishing',
    body: 'Settings are finished by hand in our atelier — a process that cannot be replicated by machine. Surfaces are polished to a mirror standard on the exterior and softened on hidden edges, creating depth that rewards close inspection.',
  },
  {
    num: '04',
    title: 'Identity & Record',
    body: 'Every Tijoray piece carries a unique serial identity, bound to the NFC vault sealed inside it. Its metal, stone, and configuration are registered with the atelier at creation — a provenance record that travels with the piece for life.',
  },
]

const SPECS = [
  { label: 'Metals', value: 'Sterling Silver (925) · 10K & 18K Gold' },
  { label: 'Birthstones', value: 'Twelve Stones · Hand-Set · Recorded in the Piece\'s Profile' },
  { label: 'NFC Integration', value: 'Passive Chip · No Battery · Rated for Decades of Use' },
  { label: 'Finishing', value: 'Hand-Finished · Inspected Before Dispatch' },
  { label: 'Identity', value: 'Unique Serial · Digital Provenance Record' },
  { label: 'Bespoke', value: 'Platinum & Rare Gemstones by Private Consultation' },
]

export default function CraftsmanshipPage() {
  usePageMeta('Craftsmanship', 'How a Tijoray piece is made: hand-set stones, multi-stage finishing, and the Lifetime Heritage Guarantee that follows it.')
  const reveal = useReveal(styles.inView)

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.eyebrow}>Atelier</p>
        <h1 className={styles.title}>The craft behind <em>every piece.</em></h1>
        <p className={styles.subtitle}>
          Fine jewelry has always been a statement of permanence.
          Tijoray pieces are built to outlast their makers — through their materials, technique, and legacy.
        </p>
      </div>

      <section className={styles.pillarsSection}>
        <div className={styles.inner}>
          <div className={styles.pillarsGrid}>
            {PILLARS.map((p, i) => (
              <article
                key={p.num}
                ref={reveal}
                className={styles.pillarCard}
                style={{ transitionDelay: `${i * 0.05}s` }}
              >
                <div className={styles.pillarNum}>{p.num}</div>
                <h2 className={styles.pillarTitle}>{p.title}</h2>
                <p className={styles.pillarBody}>{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        ref={reveal}
        className={styles.specsSection}
      >
        <div className={styles.inner}>
          <header className={styles.specsHeader}>
            <p className={styles.eyebrow}>Technical Specifications</p>
            <h2 className={styles.specsTitle}>Standards we hold <em>ourselves to.</em></h2>
          </header>
          <dl className={styles.specsList}>
            {SPECS.map(spec => (
              <div key={spec.label} className={styles.specRow}>
                <dt className={styles.specLabel}>{spec.label}</dt>
                <dd className={styles.specValue}>{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <p className={styles.ctaEyebrow}>Commission a Piece</p>
          <h2 className={styles.ctaTitle}>Every Tijoray begins <em>with you.</em></h2>
          <p className={styles.ctaBody}>
            Our atelier is available for private consultations. Discuss materials, gemstones, and the memories you wish to preserve.
          </p>
          <div className={styles.ctaBtns}>
            <Link to="/contact" className={styles.btnPrimary}>Book Consultation</Link>
            <Link to="/products/birthstone-pendant" className={styles.btnSecondary}>Configure a Piece</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
