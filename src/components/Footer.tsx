import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>

        <div className={styles.footerBrand}>
          <div className={styles.footerLogo}>
            <img src="/assets/Arcana Logo.png" alt="Arcana" />
          </div>
          <p className={styles.footerTagline}>
            "A jewel for every memory.<br />A memory for every generation."
          </p>
        </div>

        <div>
          <p className={styles.footerColHead}>Collection</p>
          <ul className={styles.footerLinks}>
            <li><Link to="/collection">Pendants</Link></li>
            <li><Link to="/collection">Bracelets</Link></li>
            <li><Link to="/build">Build Your Arcana</Link></li>
            <li><span className={styles.linkPlaceholder}>Gift a Legacy</span></li>
          </ul>
        </div>

        <div>
          <p className={styles.footerColHead}>Atelier</p>
          <ul className={styles.footerLinks}>
            <li><Link to="/about">Our Story</Link></li>
            <li><Link to="/technology">The Technology</Link></li>
            <li><span className={styles.linkPlaceholder}>Craftsmanship</span></li>
            <li><span className={styles.linkPlaceholder}>Journal</span></li>
          </ul>
        </div>

        <div>
          <p className={styles.footerColHead}>Support</p>
          <ul className={styles.footerLinks}>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><span className={styles.linkPlaceholder}>Care Guide</span></li>
            <li><span className={styles.linkPlaceholder}>FAQ</span></li>
            <li><a href="mailto:curator@atelierarcana.com">curator@atelierarcana.com</a></li>
          </ul>
        </div>

      </div>

      <div className={styles.footerBottom}>
        <p className={styles.footerCopy}>© {new Date().getFullYear()} Atelier Arcana. All rights reserved.</p>
        <nav className={styles.footerLegal} aria-label="Legal">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Preferences</a>
        </nav>
      </div>
    </footer>
  )
}
