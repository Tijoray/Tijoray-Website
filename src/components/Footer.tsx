import { Link } from 'react-router-dom'
import styles from './Footer.module.css'
import { BRAND_PHONE_DISPLAY, BRAND_PHONE_E164, LEGAL_ENTITY_LINE, SUPPORT_EMAIL } from '../lib/brand'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>

        <div className={styles.footerBrand}>
          <div className={styles.footerLogo}>
            <img src="/assets/brand/Logo with text.svg" alt="Tijoray" />
          </div>
          <p className={styles.footerTagline}>
            "A jewel for every memory.<br />A memory for every generation."
          </p>
        </div>

        <div>
          <p className={styles.footerColHead}>Collection</p>
          <ul className={styles.footerLinks}>
            <li><Link to="/products/birthstone-pendant">Pendants</Link></li>
            <li><Link to="/products/birthstone-bracelet">Bracelets</Link></li>
            <li><Link to="/collection">Build Your Tijoray</Link></li>
          </ul>
        </div>

        <div>
          <p className={styles.footerColHead}>Atelier</p>
          <ul className={styles.footerLinks}>
            <li><Link to="/about">Our Story</Link></li>
            <li><Link to="/technology">The Technology</Link></li>
            <li><Link to="/craftsmanship">Craftsmanship</Link></li>
          </ul>
        </div>

        <div>
          <p className={styles.footerColHead}>Support</p>
          <ul className={styles.footerLinks}>
            <li><Link to="/app">Get the App</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/faq#care">Care Guide</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
            {BRAND_PHONE_E164 && (
              <li><a href={`tel:${BRAND_PHONE_E164}`}>{BRAND_PHONE_DISPLAY}</a></li>
            )}
          </ul>
        </div>

      </div>

      <div className={styles.footerBottom}>
        <p className={styles.footerCopy}>© {new Date().getFullYear()} Atelier Tijoray. All rights reserved. {LEGAL_ENTITY_LINE}</p>
        <nav className={styles.footerLegal} aria-label="Legal">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/cookies">Cookies</Link>
          <Link to="/terms">Terms of Service</Link>
          {/* Plain anchor on purpose: this one is a static file, not a router route. */}
          <a href="/sms-opt-in.html">SMS</a>
        </nav>
      </div>
    </footer>
  )
}
