import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import styles from './TechnologyPage.module.css'
import { asset } from '../lib/assets'

const NFC_STEPS = [
  {
    num: '01',
    img: asset('/assets/app/app-tap.png'),
    title: 'Tap Your Piece',
    desc: 'Hold your Tijoray jewel to the back of your phone. No app launch required — the connection begins the moment metal meets signal.',
  },
  {
    num: '02',
    img: asset('/assets/app/app-connecting.png'),
    title: 'Identity Confirmed',
    desc: "Your piece's unique serial identity is verified against the Tijoray vault in seconds. Authenticated. Immutable. Yours.",
  },
  {
    num: '03',
    img: asset('/assets/app/app-connected.png'),
    title: 'Your World Unlocks',
    desc: 'The full digital profile of your piece opens — provenance, stone data, personal memories, and the certificate that proves its origin.',
  },
]

const APP_FEATURES = [
  {
    img: asset('/assets/app/app-memory.png'),
    label: 'The Tijoray Experience',
    title: 'A message waiting inside your gift.',
    body: 'When you commission a Tijoray piece, you can embed a private message directly into the jewel itself — photographs, voice recordings, handwritten notes, or words you want your loved one to carry forever. The moment they tap the pendant, it opens. Not a card. Not a text. Something that lives inside what you gave them.',
    pills: ['Photos & Video', 'Voice Messages', 'Personal Notes', 'Revealed on First Tap'],
  },
  {
    img: asset('/assets/app/app-atelier.png'),
    label: 'Stone Intelligence',
    title: 'Every stone, documented.',
    body: "Tap your piece and unlock a complete gemological record. Stone type, clarity grade, color range, carat weight, and cut quality — all sourced directly from the artisan's certification at the moment of creation.",
    pills: ['Stone Type', 'Clarity Grade', 'GIA Certificate', 'Carat Weight'],
  },
  {
    img: asset('/assets/app/app-gold.png'),
    label: 'Gold Composition',
    title: 'Know what you wear.',
    body: "Every alloy in your Tijoray piece is catalogued — metal purity, color composition, and total mass. Our Craftsmanship Guarantee is embedded directly in the record, verified by the Atelier's Master Smith.",
    pills: ['Metal Purity', 'Composition', 'Weight', 'Craftsmanship Guarantee'],
  },
  {
    img: asset('/assets/app/app-vault.png'),
    label: 'The Vault',
    title: 'A private archive, secured forever.',
    body: 'Your personal vault holds every memory, certificate, and document tied to your collection. Organized by date, accessible anywhere, and protected by the Tijoray security infrastructure. Your legacy, archived.',
    pills: ['Personal Storage', 'Certificate Archive', 'Date Organized', 'Secure Access'],
  },
]

const STATS = [
  { num: 'Lifetime', label: 'Heritage Guarantee' },
  { num: 'Encrypted', label: 'Vault Storage' },
  { num: 'Immutable', label: 'Provenance Record' },
]

export default function TechnologyPage() {
  const fadeRefs    = useRef<(HTMLElement | null)[]>([])
  const scrollImgs  = useRef<(HTMLImageElement | null)[]>([])

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add(styles.inView)
      }),
      { threshold: 0.15 }
    )
    fadeRefs.current.forEach(el => { if (el) io.observe(el) })
    return () => io.disconnect()
  }, [])

  // Scroll-driven image reveal — image starts at top and slides up as user scrolls
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    function onScroll() {
      scrollImgs.current.forEach((img) => {
        if (!img) return
        const container = img.parentElement
        if (!container) return
        const rect    = container.getBoundingClientRect()
        const viewH   = window.innerHeight
        const contH   = container.clientHeight
        const imgH    = img.offsetHeight
        const maxShift = Math.max(0, imgH - contH)
        // progress: 0 when section top hits bottom of viewport, 1 when section bottom hits top
        const progress = 1 - (rect.bottom / (viewH + rect.height))
        const clamped  = Math.max(0, Math.min(1, progress))
        img.style.transform = `translateY(${-(clamped * maxShift)}px)`
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function ref(i: number) {
    return (el: HTMLElement | null) => { fadeRefs.current[i] = el }
  }

  function scrollImgRef(i: number) {
    return (el: HTMLImageElement | null) => { scrollImgs.current[i] = el }
  }

  return (
    <main className={styles.technology}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>The Technology</p>
          <h1 className={styles.heroTitle}>
            The intelligence <em>within</em> your jewel.
          </h1>
          <p className={styles.heroSub}>
            Every Tijoray piece carries a concealed chip — a permanent, encrypted bridge
            between the physical and digital. One tap connects your jewelry to a living
            record of its craft, its stones, and the memories you bind to it.
          </p>
        </div>
        <hr className={styles.heroRule} />
      </section>

      {/* ── NFC Flow ── */}
      <section className={`${styles.nfcSection} ${styles.fadeUp}`} ref={ref(0) as any}>
        <div className={styles.nfcInner}>
          <div className={styles.nfcHeader}>
            <p className={styles.eyebrow}>How It Works</p>
            <h2 className={styles.sectionTitle}>Three moments. One connection.</h2>
          </div>
          <div className={styles.nfcGrid}>
            {NFC_STEPS.map((step, i) => (
              <article
                key={step.num}
                className={`${styles.nfcCard} ${styles.fadeUp}`}
                ref={ref(i + 1) as any}
                style={{ transitionDelay: `${i * 0.12}s` }}
              >
                <div className={styles.nfcStepNum}>{step.num}</div>
                <div className={styles.phoneFrame}>
                  <img src={step.img} alt={step.title} className={styles.phoneImg} />
                </div>
                <h3 className={styles.nfcCardTitle}>{step.title}</h3>
                <p className={styles.nfcCardDesc}>{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── App Features ── */}
      <section className={styles.appSection}>
        <div className={styles.appInner}>
          <div className={`${styles.appHeader} ${styles.fadeUp}`} ref={ref(4) as any}>
            <p className={styles.eyebrow}>The App</p>
            <h2 className={styles.sectionTitle}>Your Digital Atelier</h2>
            <p className={styles.appHeaderSub}>
              The Tijoray app is where your gift comes alive. Embed a private message before you give — and watch it reveal itself the moment your loved one taps their piece for the first time.
            </p>
          </div>

          {APP_FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className={`${styles.featureRow} ${i % 2 !== 0 ? styles.featureReverse : ''} ${styles.fadeUp}`}
              ref={ref(5 + i) as any}
            >
              <div className={styles.featurePhone}>
                <div className={styles.appPhoneFrame}>
                  {i === 0 ? (
                    <video
                      className={styles.gifImg}
                      autoPlay
                      loop
                      muted
                      playsInline
                      aria-label="Tijoray memory feature — a personalised message revealing on first tap"
                    >
                      <source src={asset('/assets/video/memory-page.mp4')} type="video/mp4" />
                      <source src={asset('/assets/video/memory-page.mov')} type="video/quicktime" />
                    </video>
                  ) : (
                    <img
                      src={feature.img}
                      alt={feature.title}
                      className={styles.scrollImg}
                      ref={scrollImgRef(i - 1)}
                    />
                  )}
                </div>
              </div>
              <div className={styles.featureContent}>
                <p className={styles.featureLabel}>{feature.label}</p>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureBody}>{feature.body}</p>
                <div className={styles.pillsRow}>
                  {feature.pills.map(pill => (
                    <span key={pill} className={styles.pill}>{pill}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Heritage Guarantee ── */}
      <section className={`${styles.heritageSection} ${styles.fadeUp}`} ref={ref(9) as any}>
        <div className={styles.heritageInner}>
          <blockquote className={styles.heritageQuote}>
            "Every Tijoray piece is registered in our permanent digital archive, ensuring
            provenance and value for generations to come."
          </blockquote>
          <div className={styles.statGrid}>
            {STATS.map(stat => (
              <div key={stat.label} className={styles.statCard}>
                <div className={styles.statNum}>{stat.num}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={`${styles.ctaSection} ${styles.fadeUp}`} ref={ref(10) as any}>
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
