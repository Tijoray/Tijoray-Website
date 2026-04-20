import { Link } from 'react-router-dom'
import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section className={`${styles.hero} hero-section`} aria-label="Hero">
      <div className={styles.heroOrb} aria-hidden="true" />

      <div className={styles.heroContent}>
        <p className={styles.heroEyebrow}>Atelier Tijoray</p>
        <h1 className={styles.heroTitle}>
          Memories.<br />
          <em>Forever.</em>
        </h1>
        <p className={styles.heroSub}>
          Fine jewellery woven with encrypted digital legacy.<br />
          Every piece, an heirloom. Every touch, a memory.
        </p>
        <div className={styles.heroCtas}>
          <Link to="/contact" className={styles.heroBtnPrimary}>Curate Your Legacy</Link>
          <Link to="/about" className={styles.heroBtnSecondary}>Explore the Collection</Link>
        </div>
        <div className={styles.heroRule} aria-hidden="true" />
      </div>

      <div className={styles.scrollCue} aria-hidden="true">
        <span>Scroll to Discover</span>
        <div className={styles.scrollLine} />
      </div>
    </section>
  )
}
