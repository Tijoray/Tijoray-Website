import { Link } from 'react-router-dom'
import styles from './Hero.module.css'
import { asset } from '../lib/assets'
import HeroCarousel from './HeroCarousel'

function scrollToHowItWorks(e: React.MouseEvent) {
  e.preventDefault()
  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
}

export default function Hero() {
  return (
    <section className={`${styles.hero} hero-section`} aria-label="Hero" id="hero-section">
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

      <div className={styles.heroLayout}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Luxury jewellery that<br />
            stores your private<br />
            memories <em>forever.</em>
          </h1>
          <p className={styles.heroSub}>
            Handcrafted pendants and bracelets with encrypted NFC vaults
            for photos, voice notes, letters, and legacy.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/build" className={styles.heroBtnPrimary}>Build Your Tijoray</Link>
            <a href="#how-it-works" className={styles.heroBtnSecondary} onClick={scrollToHowItWorks}>How It Works</a>
          </div>
        </div>

        <div className={styles.heroCarouselPanel} aria-hidden="true">
          <HeroCarousel />
        </div>
      </div>

      <div className={styles.scrollCue} aria-hidden="true">
        <span>Scroll to Discover</span>
        <div className={styles.scrollLine} />
      </div>
    </section>
  )
}
