import { Link } from 'react-router-dom'
import styles from './CtaSection.module.css'

export default function CtaSection() {
  return (
    <section className={styles.ctaSection}>
      <div className={styles.ctaInner}>
        <p className={styles.ctaEyebrow}>Begin Your Journey</p>
        <h2 className={styles.ctaTitle}>
          Curate Your<br /><em>Legacy</em>
        </h2>
        <p className={styles.ctaBody}>
          Every Tijoray piece begins with a conversation. Tell us what you wish to preserve,
          and our atelier will craft a jewel worthy of carrying it — now and for generations to come.
        </p>
        <div className={styles.ctaBtns}>
          <Link to="/contact" className={styles.btnPrimary}>Enter the Atelier</Link>
          <Link to="/about" className={styles.btnSecondary}>Discover the Technology</Link>
        </div>
      </div>
    </section>
  )
}
