import { Link } from 'react-router-dom'
import styles from './CollectionPage.module.css'
import { useReveal } from '../lib/useReveal'
import { useCatalog } from '../contexts/CatalogContext'
import type { CatalogCollection, CatalogProduct } from '../data/catalog-doc'
import { usePageMeta } from '../lib/usePageMeta'
import { IMG, stoneSwatch } from '../lib/assets'

const fmt = (n: number) => new Intl.NumberFormat('en-CA', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(n)

type ProductCardProps = {
  product:    CatalogProduct
  collection: CatalogCollection
  index:      number
  reveal:     (el: HTMLElement | null) => void
}

function ProductCard({ product, collection, index, reveal }: ProductCardProps) {
  const series = `${collection.designLabel} Series`
  const delay  = index > 0 ? { transitionDelay: `${(index * 0.07).toFixed(2)}s` } : undefined

  if (product.available) {
    return (
      <Link
        to={product.route}
        className={`${styles.productCard} ${styles.fadeUp}`}
        ref={reveal}
        style={delay}
      >
        <div className={styles.cardVisual}>
          <img src={product.cardImage} alt={product.name} className={styles.cardPhoto} />
          <div className={styles.cardLabel}>
            <p className={styles.cardSeries}>{series}</p>
          </div>
        </div>
        <div className={styles.cardInfo}>
          <div>
            <p className={styles.cardCollection}>{collection.name}</p>
            <h3 className={styles.cardName}>{product.name}</h3>
            <p className={styles.cardDetail}>{product.cardDetail}</p>
          </div>
          <div className={styles.cardBottom}>
            <div className={styles.cardPrice}>
              <span className={styles.priceFrom}>From</span>
              <span className={styles.priceNum}>{fmt(product.priceFrom)}</span>
            </div>
            <span className={styles.cardCta}>Customize</span>
          </div>
        </div>
      </Link>
    )
  }

  // Coming soon
  return (
    <article
      className={`${styles.productCard} ${styles.productCardSoon} ${styles.fadeUp}`}
      ref={reveal}
      style={delay}
    >
      <div className={`${styles.cardVisual} ${styles.cardVisualSoon}`}>
        <img src={product.cardImage} alt={product.name} className={styles.cardPhoto} />
        <div className={styles.soonBadge}>Coming Soon</div>
        <div className={styles.cardLabel}>
          <p className={styles.cardSeries}>{series}</p>
        </div>
      </div>
      <div className={styles.cardInfo}>
        <div>
          <p className={styles.cardCollection}>{collection.name}</p>
          <h3 className={styles.cardName}>{product.name}</h3>
          <p className={styles.cardDetail}>{product.cardDetail}</p>
        </div>
        <div className={styles.cardBottom}>
          <div className={styles.cardPrice}>
            <span className={styles.priceFrom}>Pricing</span>
            <span className={styles.priceNum}>TBA</span>
          </div>
          <Link to="/contact" className={styles.cardCtaGhost}>Register Your Interest</Link>
        </div>
      </div>
    </article>
  )
}

export default function CollectionPage() {
  usePageMeta('The Collection', 'Customize birthstone pendants and bracelets from US$399. Each piece uses a passive NFC identity to open encrypted online memories in the Tijoray app.')
  const catalog = useCatalog()
  // First live product — drives the page's primary CTAs.
  const firstLiveProduct = catalog.doc.products.find(p => p.available)
  const reveal = useReveal(styles.inView)

  return (
    <main className={styles.collection}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>The Collection</p>
          <h1 className={styles.heroTitle}>
            Every piece <em>carries</em> its story.
          </h1>
          <p className={styles.heroSub}>
            Choose a pendant or bracelet, its shape, metal and birthstone. A passive
            NFC identity inside the jewelry opens its encrypted online collection of
            photographs, recordings and letters in the Tijoray app.
          </p>
        </div>
        <img
          src={IMG.collectionHero}
          alt="The twelve Tijoray birthstone pendants, January through December, laid out in a grid"
          className={styles.heroImage}
          loading="eager"
          width="1122"
          height="1402"
        />
        <hr className={styles.heroRule} />
      </section>

      {/* ── Collections (data-driven from the products matrix) ── */}
      {catalog.collectionsWithProducts().map(collection => (
        <section key={collection.id} className={`${styles.collectionSection} ${styles.fadeUp}`} ref={reveal}>
          <div className={styles.collectionInner}>

            {/* Collection header */}
            <div className={styles.collectionHeader}>
              <div className={styles.collectionMeta}>
                <p className={styles.collectionNum}>Collection No. {collection.number}</p>
                <h2 className={styles.collectionTitle}>{collection.name}</h2>
                <p className={styles.collectionDesc}>{collection.description}</p>
              </div>
              {collection.chips && (
                <div className={styles.stoneStrip}>
                  {collection.chips.map((b, i) => (
                    <div key={b.month} className={styles.stoneChip} title={b.stone}>
                      <img
                        src={stoneSwatch(i)}
                        alt={b.stone}
                        className={styles.stoneDot}
                        loading="lazy"
                        width="520"
                        height="520"
                      />
                      <span className={styles.stoneMonth}>{b.month}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product cards */}
            <div className={styles.productGrid}>
              {catalog.productsByCollection(collection.id).map((product, i) => (
                <ProductCard key={product.id} product={product} collection={collection} index={i} reveal={reveal} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ── More collections coming ── */}
      <section className={`${styles.comingSection} ${styles.fadeUp}`} ref={reveal}>
        <div className={styles.comingInner}>
          <p className={styles.eyebrow}>In the Atelier</p>
          <h2 className={styles.comingTitle}>
            More collections <em>in the atelier.</em>
          </h2>
          <p className={styles.comingBody}>
            Each new series is developed slowly and deliberately. If you have a specific
            commission in mind, a piece outside our current collections, speak with the atelier directly.
          </p>
          <Link to="/contact" className={styles.comingLink}>Speak with the Atelier →</Link>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={`${styles.ctaSection} ${styles.fadeUp}`} ref={reveal}>
        <div className={styles.ctaInner}>
          <p className={styles.eyebrow}>Begin</p>
          <h2 className={styles.ctaTitle}>
            Your piece is <em>waiting.</em>
          </h2>
          <div className={styles.ctaBtns}>
            <Link to={firstLiveProduct?.route ?? '/contact'} className={styles.btnPrimary}>Build Your Tijoray</Link>
            <Link to="/contact" className={styles.btnSecondary}>Speak with the Atelier</Link>
          </div>
        </div>
      </section>

    </main>
  )
}
