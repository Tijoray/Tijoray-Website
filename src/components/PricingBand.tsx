import { Link } from 'react-router-dom'
import styles from './PricingBand.module.css'
import { useCatalog } from '../contexts/CatalogContext'
import type { Metal } from '../data/catalog'

const dollars = (n: number) => `from $${Math.round(n).toLocaleString('en-US')}`

export default function PricingBand() {
  const { doc } = useCatalog()

  // Lowest price across all products for the given metals (in dollars).
  const lowestAcross = (metals: Metal[]) => {
    const vals = doc.products.flatMap(p => metals.map(m => p.prices?.[m]).filter((v): v is number => typeof v === 'number'))
    return vals.length ? Math.min(...vals) / 100 : 0
  }

  const TIERS = [
    {
      name: 'Steel & Silver',
      from: dollars(lowestAcross(['steel', 'silver'])),
      desc: 'Stainless steel and sterling silver pieces — the same handcrafted form and memory vault, at an accessible entry point.',
      link: '/collection',
      cta: 'Explore Collection',
    },
    {
      name: 'Gold Collection',
      from: dollars(lowestAcross(['10k', '18k'])),
      desc: '10K and 18K gold settings in white, yellow, or rose. Each piece carries a genuine birthstone and a lifetime memory vault.',
      link: '/products/birthstone-pendant',
      cta: 'Configure Yours',
    },
    {
      name: 'Bespoke Commission',
      from: 'by consultation',
      desc: 'Fully custom work — rare gemstones, platinum settings, and a private atelier process for heirloom-grade pieces.',
      link: '/contact',
      cta: 'Begin Commission',
    },
  ]

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
