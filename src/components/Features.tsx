import styles from './Features.module.css'
import { useReveal } from '../lib/useReveal'

export default function Features() {
  const reveal = useReveal(styles.inView)

  return (
    <section className={styles.features}>
      <div className={styles.featuresInner}>
        <header className={styles.featuresHeader}>
          <p className={styles.sectionEyebrow}>The Tijoray System</p>
          <h2 className={styles.sectionTitle}>Craft you can see. A vault you <em>can't.</em></h2>
        </header>

        <div className={styles.featuresGrid}>
          <article ref={reveal} className={styles.featureCard}>
            <div className={styles.featureNum}>01</div>
            <h3 className={styles.featureTitle}>The Jewel</h3>
            <p className={styles.featureBody}>
              Each Tijoray piece is individually handcrafted in our atelier, with
              custom-blended alloys, hand-finished settings, and responsibly
              sourced gemstones.
            </p>
          </article>

          <article ref={reveal} className={styles.featureCard} style={{ transitionDelay: '0.06s' }}>
            <div className={styles.featureNum}>02</div>
            <h3 className={styles.featureTitle}>The Vault</h3>
            <p className={styles.featureBody}>
              A passive NFC vault sits inside your jewelry. It opens when your phone
              touches it, and not before. Keep photographs, voice notes, letters
              and certificates in the piece you wear every day.
            </p>
          </article>

          <article ref={reveal} className={styles.featureCard} style={{ transitionDelay: '0.12s' }}>
            <div className={styles.featureNum}>03</div>
            <h3 className={styles.featureTitle}>The Legacy</h3>
            <p className={styles.featureBody}>
              Photographs end up in a drawer. Files end up on a phone nobody can
              unlock. A Tijoray doesn't. Hand the piece on and the vault goes
              with it, intact.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
