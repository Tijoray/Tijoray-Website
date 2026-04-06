import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import styles from './AboutPage.module.css'

export default function AboutPage() {
  const fadeRefs = useRef<(HTMLElement | null)[]>([])

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

  function ref(i: number) {
    return (el: HTMLElement | null) => { fadeRefs.current[i] = el }
  }

  return (
    <main className={styles.about}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Our Story</p>
          <h1 className={styles.heroTitle}>
            Born from the belief that <em>some things</em><br />
            deserve to last forever.
          </h1>
          <p className={styles.heroSub}>
            Atelier Arcana was founded at the intersection of fine jewellery and
            encrypted memory — for those who understand that legacy is not inherited,
            it is composed.
          </p>
        </div>
        <div className={styles.heroRule} />
      </section>

      {/* ── Mission ── */}
      <section className={styles.missionSection} ref={ref(0) as any}>
        <div className={styles.missionInner}>
          <div className={styles.missionLeft}>
            <p className={styles.eyebrow}>The Atelier</p>
            <h2 className={styles.sectionTitle}>
              Every piece is a <em>vessel.</em>
            </h2>
          </div>
          <div className={styles.missionRight}>
            <p className={styles.bodyText}>
              We do not make accessories. We craft objects with intention — each one
              designed to hold something far more precious than gemstone or metal:
              the moments and voices that define a life.
            </p>
            <p className={styles.bodyText}>
              Our atelier brings together master jewellers, materials scientists, and
              cryptographic engineers under a single conviction — that permanence is
              the highest form of luxury.
            </p>
          </div>
        </div>
      </section>

      {/* ── Pillars ── */}
      <section className={styles.pillarsSection}>
        <div className={styles.pillarsInner}>
          {[
            {
              num: '01',
              title: 'Eternal Craft',
              body: 'Each piece is individually finished by hand in our atelier. Responsibly sourced metals and gemstones, blended and set to exacting tolerances that outlast trends and time.',
            },
            {
              num: '02',
              title: 'Private by Design',
              body: 'Your vault belongs to you alone. Passive NFC means no app is required to read what you have stored — only the piece itself, held close, unlocks what is inside.',
            },
            {
              num: '03',
              title: 'Generational Transfer',
              body: 'Arcana pieces are designed to be passed on. When you transfer the jewel, you transfer the vault — photographs, voices, letters — intact across generations.',
            },
          ].map((p, i) => (
            <article
              key={p.num}
              className={`${styles.pillarCard} ${styles.fadeUp}`}
              ref={ref(i + 1) as any}
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              <div className={styles.pillarNum}>{p.num}</div>
              <h3 className={styles.pillarTitle}>{p.title}</h3>
              <p className={styles.pillarBody}>{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Craftsmanship callout ── */}
      <section className={`${styles.craftSection} ${styles.fadeUp}`} ref={ref(4) as any}>
        <div className={styles.craftInner}>
          <div className={styles.craftSpecs}>
            <p className={styles.eyebrow}>Material Specification</p>
            {[
              { label: 'Metal Purity', value: '18K — Hallmark Certified' },
              { label: 'Metal Type',   value: 'Rose Gold / Yellow Gold / White Gold' },
              { label: 'Setting',      value: 'Hand-finished, prong and bezel options' },
              { label: 'Gemstone',     value: 'Responsibly sourced, DIA certified' },
              { label: 'NFC Vault',    value: 'Passive — no battery, no signal required' },
              { label: 'Guarantee',    value: 'Lifetime Heritage Guarantee' },
            ].map(s => (
              <div key={s.label} className={styles.specRow}>
                <span className={styles.specLabel}>{s.label}</span>
                <span className={styles.specValue}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className={styles.craftQuote}>
            <div className={styles.quoteRule} />
            <blockquote className={styles.quoteText}>
              "We are not competing with fashion. We are competing with time."
            </blockquote>
            <p className={styles.quoteAttr}>— Atelier Arcana, Founding Principle</p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={`${styles.ctaSection} ${styles.fadeUp}`} ref={ref(5) as any}>
        <div className={styles.ctaInner}>
          <p className={styles.eyebrow}>Begin Your Legacy</p>
          <h2 className={styles.ctaTitle}>
            Compose something <em>permanent.</em>
          </h2>
          <p className={styles.ctaBody}>
            Every Arcana piece begins with a conversation. Tell us what you wish to
            preserve, and our atelier will craft a jewel worthy of carrying it.
          </p>
          <div className={styles.ctaBtns}>
            <Link to="/contact" className={styles.btnPrimary}>Speak with the Atelier</Link>
            <Link to="/" className={styles.btnSecondary}>Explore the Collection</Link>
          </div>
        </div>
      </section>

    </main>
  )
}
