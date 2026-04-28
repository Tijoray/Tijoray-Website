import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import styles from './CraftsmanshipPage.module.css'

const PILLARS = [
  {
    num: '01',
    title: 'Alloy Composition',
    body: 'Every Tijoray piece begins with metallurgy. Our goldsmiths work in 18k yellow, white, and rose gold, each with a proprietary alloy blend that enhances durability without sacrificing warmth. Platinum pieces are crafted in 950Pt — the purest standard for fine jewellery.',
  },
  {
    num: '02',
    title: 'Gemstone Sourcing',
    body: 'We source only ethically certified gemstones — conflict-free diamonds graded by GIA, and coloured stones from traceable mines across Sri Lanka, Colombia, and East Africa. Each stone is hand-selected by our gemmologist for cut, clarity, and character.',
  },
  {
    num: '03',
    title: 'Hand Finishing',
    body: 'Settings are hand-finished by our master craftspeople — a process that cannot be replicated by machine. Bezels are polished to a mirror standard on the exterior and brushed on hidden surfaces, creating depth that rewards close inspection.',
  },
  {
    num: '04',
    title: 'Hallmarking & Certification',
    body: "Every Tijoray piece carries our atelier hallmark alongside the metal fineness stamp. Bespoke pieces include a certificate of provenance detailing the alloy composition, gemstone grading report, and the artisan's signature.",
  },
]

const SPECS = [
  { label: 'Metal Standards', value: '18k Gold (750/1000) · Platinum (950Pt) · Sterling Silver (925)' },
  { label: 'Diamond Grading', value: 'GIA Certified · Conflict-Free · Minimum VS2 Clarity' },
  { label: 'Coloured Stones', value: 'Ethically Sourced · Traceable Origin · Gemological Report Included' },
  { label: 'NFC Integration', value: 'Passive Chip · IP68 Rated · Decade-Rated Durability' },
  { label: 'Finishing', value: 'Hand-Polished · 24-Hour Quality Inspection · Artisan Signed' },
  { label: 'Hallmarking', value: 'Atelier Mark + Metal Fineness + Year of Creation' },
]

export default function CraftsmanshipPage() {
  const pillarRefs = useRef<(HTMLElement | null)[]>([])
  const specsRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const els = [
      ...pillarRefs.current.filter(Boolean) as HTMLElement[],
      specsRef.current,
    ].filter(Boolean) as HTMLElement[]

    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add(styles.inView)
      }),
      { threshold: 0.12 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.eyebrow}>Atelier</p>
        <h1 className={styles.title}>The craft behind <em>every piece.</em></h1>
        <p className={styles.subtitle}>
          Fine jewellery has always been a statement of permanence.
          Tijoray pieces are built to outlast their makers — through their materials, technique, and legacy.
        </p>
      </div>

      <section className={styles.pillarsSection}>
        <div className={styles.inner}>
          <div className={styles.pillarsGrid}>
            {PILLARS.map((p, i) => (
              <article
                key={p.num}
                ref={el => { pillarRefs.current[i] = el }}
                className={styles.pillarCard}
                style={{ transitionDelay: `${i * 0.1}s` }}
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
        ref={specsRef}
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
            <Link to="/build" className={styles.btnSecondary}>Configure a Piece</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
