import { Link } from 'react-router-dom'
import styles from './Hero.module.css'
import { asset } from '../lib/assets'

export default function Hero() {
  return (
    <section className={`${styles.hero} hero-section`} aria-label="Hero">
      <picture>
        <source media="(max-width: 768px)" srcSet={asset('/assets/editorial/hero-mobile.png')} />
        <img
          src={asset('/assets/editorial/hero.png')}
          alt=""
          aria-hidden="true"
          className={styles.heroImage}
          loading="eager"
          fetchPriority="high"
        />
      </picture>
      <div className={styles.heroWash} aria-hidden="true" />
      <div className={styles.heroVignette} aria-hidden="true" />

      <div className={styles.heroContent}>
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
      </div>

      <div className={styles.scrollCue} aria-hidden="true">
        <span>Scroll to Discover</span>
        <div className={styles.scrollLine} />
      </div>
    </section>
  )
}
