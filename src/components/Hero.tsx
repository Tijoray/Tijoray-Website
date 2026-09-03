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
            Tap it with<br />
            your phone.<br />
            Your memories <em>appear.</em>
          </h1>
          <p className={styles.heroSub}>
            Handcrafted gold and silver jewelry with an encrypted vault sealed
            inside — photographs, voice notes and letters, opened by a touch.
            No charging, no pairing, nothing to set up.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/collection" className={styles.heroBtnPrimary}>Design your piece</Link>
            <a href="#how-it-works" className={styles.heroBtnSecondary} onClick={scrollToHowItWorks}>How It Works</a>
          </div>
        </div>

        <div className={styles.heroCarouselPanel} aria-hidden="true">
          <HeroCarousel />
        </div>
      </div>

    </section>
  )
}
