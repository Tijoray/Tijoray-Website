import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import styles from './CollectionPage.module.css'
import type { Collection } from '../data/collections'
import type { Product } from '../data/products'
import { PRODUCTS, collectionsWithProducts, productsByCollection } from '../data/products'

const fmt = (n: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(n)

// First live product — drives the page's primary CTAs.
const firstLiveProduct = PRODUCTS.find(p => p.available)

export default function CollectionPage() {
  // Collect every fade-in element; the observer reveals each as it scrolls in.
  const fadeRefs = useRef<Set<HTMLElement>>(new Set())
  const addFade = (el: HTMLElement | null) => { if (el) fadeRefs.current.add(el) }

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add(styles.inView)
      }),
      { threshold: 0.12 }
    )
    fadeRefs.current.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  function ProductCard({ product, collection, index }: { product: Product; collection: Collection; index: number }) {
    const series = `${collection.designLabel} Series`
    const delay  = index > 0 ? { transitionDelay: `${(index * 0.14).toFixed(2)}s` } : undefined

    if (product.available) {
      return (
        <Link
          to={product.route}
          className={`${styles.productCard} ${styles.fadeUp}`}
          ref={addFade as any}
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
              <span className={styles.cardCta}>Build Your Piece</span>
            </div>
          </div>
        </Link>
      )
    }

    // Coming soon
    return (
      <article
        className={`${styles.productCard} ${styles.productCardSoon} ${styles.fadeUp}`}
        ref={addFade as any}
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

  return (
    <main className={styles.collection}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>The Collection</p>
          <h1 className={styles.heroTitle}>
            Every piece tells a <em>story.</em>
          </h1>
          <p className={styles.heroSub}>
            Each Tijoray collection is built around a single idea — that fine jewelry
            should carry more than beauty. Browse our series below, each crafted to hold
            memory, provenance, and meaning for generations.
          </p>
        </div>
        <hr className={styles.heroRule} />
      </section>

      {/* ── Collections (data-driven from the products matrix) ── */}
      {collectionsWithProducts().map(collection => (
        <section key={collection.id} className={`${styles.collectionSection} ${styles.fadeUp}`} ref={addFade as any}>
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
                  {collection.chips.map(b => (
                    <div key={b.month} className={styles.stoneChip} title={b.stone}>
                      <span className={styles.stoneDot} style={{ background: b.color }} />
                      <span className={styles.stoneMonth}>{b.month}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product cards */}
            <div className={styles.productGrid}>
              {productsByCollection(collection.id).map((product, i) => (
                <ProductCard key={product.id} product={product} collection={collection} index={i} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ── More collections coming ── */}
      <section className={`${styles.comingSection} ${styles.fadeUp}`} ref={addFade as any}>
        <div className={styles.comingInner}>
          <p className={styles.eyebrow}>The Archive</p>
          <h2 className={styles.comingTitle}>
            More collections <em>in the atelier.</em>
          </h2>
          <p className={styles.comingBody}>
            Each new series is developed slowly and deliberately. If you have a specific
            commission in mind — a piece outside our current collections — speak with the atelier directly.
          </p>
          <Link to="/contact" className={styles.comingLink}>Speak with the Atelier →</Link>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={`${styles.ctaSection} ${styles.fadeUp}`} ref={addFade as any}>
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
