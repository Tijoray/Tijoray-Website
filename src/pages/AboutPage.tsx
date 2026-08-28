import { Link } from 'react-router-dom'
import styles from './AboutPage.module.css'
import { useReveal } from '../lib/useReveal'
import { usePageMeta } from '../lib/usePageMeta'

export default function AboutPage() {
  usePageMeta('Our Story', 'Atelier Tijoray was founded at the intersection of fine jewelry and encrypted memory. This is why we make what we make.')
  const reveal = useReveal(styles.inView)

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
            Atelier Tijoray was founded at the intersection of fine jewelry and
            encrypted memory — for those who understand that legacy is not inherited,
            it is composed.
          </p>
        </div>
        <div className={styles.heroRule} />
      </section>

      {/* ── Mission ── */}
      <section className={styles.missionSection} ref={reveal}>
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
              Our atelier brings jewelry craft and modern encryption together under a
              single conviction — that permanence is the highest form of luxury.
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
              body: 'Your vault belongs to you alone. Memories are encrypted before they ever leave your device, and only the piece itself — held close and tapped — unlocks what is inside.',
            },
            {
              num: '03',
              title: 'Generational Transfer',
              body: 'Tijoray pieces are designed to be passed on. When you transfer the jewel, you transfer the vault — photographs, voices, letters — intact across generations.',
            },
          ].map((p, i) => (
            <article
              key={p.num}
              className={`${styles.pillarCard} ${styles.fadeUp}`}
              ref={reveal}
              style={{ transitionDelay: `${i * 0.06}s` }}
            >
              <div className={styles.pillarNum}>{p.num}</div>
              <h3 className={styles.pillarTitle}>{p.title}</h3>
              <p className={styles.pillarBody}>{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Craftsmanship callout ── */}
      <section className={`${styles.craftSection} ${styles.fadeUp}`} ref={reveal}>
        <div className={styles.craftInner}>
          <div className={styles.craftSpecs}>
            <p className={styles.eyebrow}>The Making</p>
            <p className={styles.bodyText}>
              Each Tijoray piece begins as raw metal and stone — responsibly sourced,
              rigorously selected. Our jewelers work in sterling silver and 10K or 18K
              gold, finishing every surface by hand before the birthstone
              is set.
            </p>
            <p className={styles.bodyText}>
              The NFC vault sealed within requires no battery, no signal, no subscription.
              It exists entirely within the piece — passive, permanent, and yours alone to open.
            </p>
          </div>
          <div className={styles.craftQuote}>
            <div className={styles.quoteRule} />
            <blockquote className={styles.quoteText}>
              "We are not competing with fashion. We are competing with time."
            </blockquote>
            <p className={styles.quoteAttr}>— Atelier Tijoray, Founding Principle</p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={`${styles.ctaSection} ${styles.fadeUp}`} ref={reveal}>
        <div className={styles.ctaInner}>
          <p className={styles.eyebrow}>Begin Your Legacy</p>
          <h2 className={styles.ctaTitle}>
            Compose something <em>permanent.</em>
          </h2>
          <p className={styles.ctaBody}>
            Every Tijoray piece begins with a conversation. Tell us what you wish to
            preserve, and our atelier will craft a jewel worthy of carrying it.
          </p>
          <div className={styles.ctaBtns}>
            <Link to="/contact" className={styles.btnPrimary}>Speak with the Atelier</Link>
            <Link to="/collection" className={styles.btnSecondary}>Explore the Collection</Link>
          </div>
        </div>
      </section>

    </main>
  )
}
