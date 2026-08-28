import styles from './Features.module.css'
import { useReveal } from '../lib/useReveal'

export default function Features() {
  const reveal = useReveal(styles.inView)

  return (
    <section className={styles.features}>
      <div className={styles.featuresInner}>
        <header className={styles.featuresHeader}>
          <p className={styles.sectionEyebrow}>The Tijoray System</p>
          <h2 className={styles.sectionTitle}>Craft. Vault. <em>Legacy.</em></h2>
        </header>

        <div className={styles.featuresGrid}>
          <article ref={reveal} className={styles.featureCard}>
            <div className={styles.featureNum}>01</div>
            <h3 className={styles.featureTitle}>The Jewel</h3>
            <p className={styles.featureBody}>
              Each Tijoray piece is individually handcrafted in our atelier.
              Custom-blended alloys, hand-finished settings, and responsibly sourced
              gemstones — created for those who demand permanence.
            </p>
          </article>

          <article ref={reveal} className={styles.featureCard} style={{ transitionDelay: '0.06s' }}>
            <div className={styles.featureNum}>02</div>
            <h3 className={styles.featureTitle}>The Vault</h3>
            <p className={styles.featureBody}>
              A passive NFC vault lives within your jewelry. It authenticates through
              proximity and intent alone. Store photographs, voice notes, letters, and
              certificates within the piece you wear closest to your heart.
            </p>
          </article>

          <article ref={reveal} className={styles.featureCard} style={{ transitionDelay: '0.12s' }}>
            <div className={styles.featureNum}>03</div>
            <h3 className={styles.featureTitle}>The Legacy</h3>
            <p className={styles.featureBody}>
              Unlike photographs in a drawer or files lost to time, Tijoray endures.
              Transfer your vault to the next generation. A private archive, worn as
              jewelry — crafted to outlast its maker.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
