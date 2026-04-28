import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import styles from './CollectionPage.module.css'
import { asset } from '../lib/assets'

const BIRTHSTONES = [
  { month: 'Jan', stone: 'Garnet',       color: '#9B1B30' },
  { month: 'Feb', stone: 'Amethyst',     color: '#9B59B6' },
  { month: 'Mar', stone: 'Aquamarine',   color: '#7EC8C8' },
  { month: 'Apr', stone: 'Diamond',      color: '#E8F4F8' },
  { month: 'May', stone: 'Emerald',      color: '#2ECC71' },
  { month: 'Jun', stone: 'Pearl',        color: '#D4AF8A' },
  { month: 'Jul', stone: 'Ruby',         color: '#CC0000' },
  { month: 'Aug', stone: 'Peridot',      color: '#93C572' },
  { month: 'Sep', stone: 'Sapphire',     color: '#154EC1' },
  { month: 'Oct', stone: 'Tourmaline',   color: '#FF6EB4' },
  { month: 'Nov', stone: 'Citrine',      color: '#E4A800' },
  { month: 'Dec', stone: 'Turquoise',    color: '#3BC4C4' },
]

export default function CollectionPage() {
  const fadeRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add(styles.inView)
      }),
      { threshold: 0.12 }
    )
    fadeRefs.current.forEach(el => { if (el) io.observe(el) })
    return () => io.disconnect()
  }, [])

  function ref(i: number) {
    return (el: HTMLElement | null) => { fadeRefs.current[i] = el }
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

      {/* ── Birthstone Collection ── */}
      <section className={`${styles.collectionSection} ${styles.fadeUp}`} ref={ref(0) as any}>
        <div className={styles.collectionInner}>

          {/* Collection header */}
          <div className={styles.collectionHeader}>
            <div className={styles.collectionMeta}>
              <p className={styles.collectionNum}>Collection No. 01</p>
              <h2 className={styles.collectionTitle}>The Birthstone Collection</h2>
              <p className={styles.collectionDesc}>
                Twelve stones. Twelve months. Each piece carries the gemstone of the
                moment your loved one entered the world — set in your chosen metal,
                embedded with a private memory, and registered in the Tijoray vault forever.
              </p>
            </div>
            <div className={styles.stoneStrip}>
              {BIRTHSTONES.map(b => (
                <div key={b.month} className={styles.stoneChip} title={b.stone}>
                  <span className={styles.stoneDot} style={{ background: b.color }} />
                  <span className={styles.stoneMonth}>{b.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Product cards */}
          <div className={styles.productGrid}>

            {/* Pendant */}
            <Link
              to="/products/birthstone-pendant"
              className={`${styles.productCard} ${styles.fadeUp}`}
              ref={ref(1) as any}
            >
              <div className={styles.cardVisual}>
                <img
                  src={asset('/assets/jewelry/birthstone-pendant.png')}
                  alt="Birthstone Pendant — square and circle in 18K gold"
                  className={styles.cardPhoto}
                />
                <div className={styles.cardLabel}>
                  <p className={styles.cardSeries}>Birthstone Series</p>
                </div>
              </div>
              <div className={styles.cardInfo}>
                <div>
                  <p className={styles.cardCollection}>The Birthstone Collection</p>
                  <h3 className={styles.cardName}>Birthstone Pendant</h3>
                  <p className={styles.cardDetail}>
                    Available in square and circle silhouettes. Set in steel, silver,
                    10K, or 18K gold — with your chosen birthstone at the center.
                  </p>
                </div>
                <div className={styles.cardBottom}>
                  <div className={styles.cardPrice}>
                    <span className={styles.priceFrom}>From</span>
                    <span className={styles.priceNum}>$1,299</span>
                  </div>
                  <span className={styles.cardCta}>Build Your Piece</span>
                </div>
              </div>
            </Link>

            {/* Bracelet — coming soon */}
            <article
              className={`${styles.productCard} ${styles.productCardSoon} ${styles.fadeUp}`}
              ref={ref(2) as any}
              style={{ transitionDelay: '0.14s' }}
            >
              <div className={`${styles.cardVisual} ${styles.cardVisualSoon}`}>
                <img
                  src={asset('/assets/jewelry/birthstone-bracelet.png')}
                  alt="Birthstone Bracelet — square and circle in 18K gold"
                  className={styles.cardPhoto}
                />
                <div className={styles.soonBadge}>Coming Soon</div>
                <div className={styles.cardLabel}>
                  <p className={styles.cardSeries}>Birthstone Series</p>
                </div>
              </div>
              <div className={styles.cardInfo}>
                <div>
                  <p className={styles.cardCollection}>The Birthstone Collection</p>
                  <h3 className={styles.cardName}>Birthstone Bracelet</h3>
                  <p className={styles.cardDetail}>
                    The same craft, the same vault — worn around the wrist.
                    Currently in development at the atelier.
                  </p>
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

          </div>
        </div>
      </section>

      {/* ── More collections coming ── */}
      <section className={`${styles.comingSection} ${styles.fadeUp}`} ref={ref(3) as any}>
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
      <section className={`${styles.ctaSection} ${styles.fadeUp}`} ref={ref(4) as any}>
        <div className={styles.ctaInner}>
          <p className={styles.eyebrow}>Begin</p>
          <h2 className={styles.ctaTitle}>
            Your piece is <em>waiting.</em>
          </h2>
          <div className={styles.ctaBtns}>
            <Link to="/build" className={styles.btnPrimary}>Build Your Tijoray</Link>
            <Link to="/contact" className={styles.btnSecondary}>Speak with the Atelier</Link>
          </div>
        </div>
      </section>

    </main>
  )
}
