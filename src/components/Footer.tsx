import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

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
            <li><Link to="/collection">Pendants</Link></li>
            <li><Link to="/collection">Bracelets</Link></li>
            <li><Link to="/collection">Build Your Tijoray</Link></li>
            <li><span className={styles.linkSoon}>Gift a Legacy Piece<span className={styles.soonBadge}>Soon</span></span></li>
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
            <li><Link to="/contact">Contact Us</Link></li>
            <li><span className={styles.linkSoon}>Care Guide<span className={styles.soonBadge}>Soon</span></span></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><a href="mailto:curator@tijoray.com">curator@tijoray.com</a></li>
          </ul>
        </div>

      </div>

      <div className={styles.footerBottom}>
        <p className={styles.footerCopy}>© {new Date().getFullYear()} Atelier Tijoray. All rights reserved.</p>
        <nav className={styles.footerLegal} aria-label="Legal">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </nav>
      </div>
    </footer>
  )
}
