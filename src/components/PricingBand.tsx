import { Link } from 'react-router-dom'
import styles from './PricingBand.module.css'

const TIERS = [
  {
    name: 'Signature Pieces',
    from: 'from $1,250',
    desc: 'Handcrafted pendants and bracelets with a birthstone vault.',
    link: '/collection',
    cta: 'Explore Collection',
  },
  {
    name: 'Bespoke Creations',
    from: 'from $5,000',
    desc: 'Fully bespoke pieces with custom alloys, rare gemstones, and a private commission process.',
    link: '/contact',
    cta: 'Begin Commission',
  },
  {
    name: 'Diamond Editions',
    from: 'by consultation',
    desc: 'Our most exceptional pieces — diamonds, platinum, and enduring craftsmanship.',
    link: '/contact',
    cta: 'Book Consultation',
  },
]

export default function PricingBand() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Investment in Legacy</p>
        <div className={styles.grid}>
          {TIERS.map(tier => (
            <div key={tier.name} className={styles.tier}>
              <p className={styles.tierName}>{tier.name}</p>
              <p className={styles.tierFrom}>{tier.from}</p>
              <p className={styles.tierDesc}>{tier.desc}</p>
              <Link to={tier.link} className={styles.tierCta}>{tier.cta}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
