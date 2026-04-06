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
            <li><a href="#">Necklaces</a></li>
            <li><a href="#">Bracelets</a></li>
            <li><a href="#">Build Your Arcana</a></li>
            <li><a href="#">Gift a Legacy</a></li>
          </ul>
        </div>

        <div>
          <p className={styles.footerColHead}>Atelier</p>
          <ul className={styles.footerLinks}>
            <li><a href="#">Our Story</a></li>
            <li><a href="#">The Technology</a></li>
            <li><a href="#">Craftsmanship</a></li>
            <li><a href="#">Journal</a></li>
          </ul>
        </div>

        <div>
          <p className={styles.footerColHead}>Support</p>
          <ul className={styles.footerLinks}>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Care Guide</a></li>
            <li><a href="#">FAQ</a></li>
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
