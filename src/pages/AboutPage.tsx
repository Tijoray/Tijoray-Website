import { Link } from 'react-router-dom'
import styles from './AboutPage.module.css'
import { useReveal } from '../lib/useReveal'
import { usePageMeta } from '../lib/usePageMeta'
import { IMG } from '../lib/assets'

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
            Some things deserve<br />
            to <em>last.</em>
          </h1>
          <p className={styles.heroSub}>
            Atelier Tijoray makes fine jewelry whose passive NFC identity opens
            an encrypted online collection of photographs, voices and letters.
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
            <img
              src={IMG.pendantCloseup}
              alt="Macro view of a Tijoray pendant, the stone set flush in its gold bezel"
              className={styles.missionImage}
              loading="lazy"
              width="1086"
              height="1448"
            />
          </div>
          <div className={styles.missionRight}>
            <p className={styles.bodyText}>
              We make jewelry that connects gemstone and metal with the photographs
              and voices you would not want to lose.
            </p>
            <p className={styles.bodyText}>
              Our atelier works across jewelry and software: a physical piece made
              by hand, with encrypted online memories and managed recovery.
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
              title: 'Considered Craft',
              body: 'Each piece is individually finished by hand in our atelier. Responsibly sourced metals and gemstones, blended and set to tolerances that hold up after decades of daily wear.',
            },
            {
              num: '02',
              title: 'Private by Design',
              body: 'Memories are encrypted before upload and access is restricted to authorized accounts. Tijoray manages recovery keys, so this is not end-to-end encryption.',
            },
            {
              num: '03',
              title: 'Generational Transfer',
              body: 'Tijoray pieces can be passed on. Support verifies the parties and transfers access to the online memory collection and provenance record.',
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
              Each Tijoray piece begins as raw metal and stone, responsibly sourced
              and closely inspected. Our jewelers work in sterling silver and 10K or 18K
              gold, finishing every surface by hand before the birthstone
              is set.
            </p>
            <p className={styles.bodyText}>
              The NFC chip inside the jewelry needs no battery or charging and carries
              only the piece's identity. The Tijoray app uses internet access to open
              its encrypted online memories; the service is included without a subscription.
            </p>
          </div>
          <div className={styles.craftQuote}>
            <div className={styles.quoteRule} />
            <blockquote className={styles.quoteText}>
              "Fashion was never the thing to beat. Time was."
            </blockquote>
            <p className={styles.quoteAttr}>Atelier Tijoray, founding principle</p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={`${styles.ctaSection} ${styles.fadeUp}`} ref={reveal}>
        <div className={styles.ctaInner}>
          <p className={styles.eyebrow}>Begin Your Legacy</p>
          <h2 className={styles.ctaTitle}>
            Compose something <em>personal.</em>
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
