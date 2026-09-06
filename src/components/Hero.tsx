import { Link } from 'react-router-dom'
import styles from './Hero.module.css'
import { IMG } from '../lib/assets'
import HeroCarousel from './HeroCarousel'

function scrollToHowItWorks(e: React.MouseEvent) {
  e.preventDefault()
  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
}

export default function Hero() {
  return (
    <section className={`${styles.hero} hero-section`} aria-label="Hero" id="hero-section">
      <picture>
        <source media="(max-width: 768px)" srcSet={IMG.heroMobile} />
        <img
          src={IMG.hero}
          alt=""
          aria-hidden="true"
          className={styles.heroImage}
          loading="eager"
          fetchPriority="high"
        />
      </picture>
      <div className={styles.heroWash} aria-hidden="true" />
      <div className={styles.heroVignette} aria-hidden="true" />

      <div className={styles.heroLayout}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Jewelry that opens<br />
            your favorite<br />
            <em>memories.</em>
          </h1>
          <p className={styles.heroSub}>
            Choose a birthstone pendant or bracelet, then add photos, voice notes
            and messages to its encrypted online memory collection. The recipient
            opens them by tapping the jewelry with a compatible phone in the Tijoray app.
          </p>
          <p className={styles.heroPractical}>
            No battery or charging for the jewelry. The free app, an account and
            internet access are needed to open memories.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/collection" className={styles.heroBtnPrimary}>Shop the collection</Link>
            <a href="#how-it-works" className={styles.heroBtnSecondary} onClick={scrollToHowItWorks}>How It Works</a>
          </div>
        </div>

        <div className={styles.heroCarouselPanel}>
          <HeroCarousel />
        </div>
      </div>

    </section>
  )
}
