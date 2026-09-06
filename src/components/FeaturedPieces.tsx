import { Link } from 'react-router-dom'
import { useCatalog } from '../contexts/CatalogContext'
import { useReveal } from '../lib/useReveal'
import styles from './FeaturedPieces.module.css'

const fmt = (n: number) => new Intl.NumberFormat('en-CA', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(n)

/**
 * The pieces themselves, on the homepage.
 *
 * Jewelry is bought with the eyes, and the homepage previously showed none of
 * it — a visitor met an illustrated process, three text panels and a price
 * table before ever seeing something they could buy.
 */
export default function FeaturedPieces() {
  const catalog = useCatalog()
  const reveal  = useReveal(styles.inView)
  const products = catalog.doc.products.filter(p => p.available)

  if (!products.length) return null

  return (
    <section className={styles.section} aria-labelledby="featured-heading">
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>The Pieces</p>
          <h2 id="featured-heading" className={styles.title}>
            Choose a form. <em>Make it yours.</em>
          </h2>
          <p className={styles.sub}>
            You choose the silhouette, the metal, and the stone for whichever month
            matters. Then it is made by hand to that order.
          </p>
        </header>

        <div className={styles.grid}>
          {products.map((p, i) => (
            <Link
              key={p.id}
              to={p.route}
              className={`${styles.card} ${styles.fadeUp}`}
              ref={reveal}
              style={i > 0 ? { transitionDelay: `${(i * 0.07).toFixed(2)}s` } : undefined}
            >
              <div className={styles.imageWrap}>
                <img src={p.cardImage} alt={p.name} className={styles.image} loading="lazy" />
              </div>
              <div className={styles.body}>
                <h3 className={styles.name}>{p.name}</h3>
                <p className={styles.detail}>{p.cardDetail}</p>
                <div className={styles.bottom}>
                  <span className={styles.price}>
                    <span className={styles.priceFrom}>From</span> {fmt(p.priceFrom)}
                  </span>
                  <span className={styles.cta}>Design yours →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
