import { Link } from 'react-router-dom'
import styles from './CtaSection.module.css'

export default function CtaSection() {
  return (
    <section className={styles.ctaSection}>
      <div className={styles.ctaInner}>
        <p className={styles.ctaEyebrow}>Your Legacy Starts Here</p>
        <h2 className={styles.ctaTitle}>
          Begin Your<br /><em>Legacy Piece</em>
        </h2>
        <p className={styles.ctaBody}>
          Every Tijoray piece begins with a conversation. Tell us what you wish to preserve,
          and our atelier will craft a jewel worthy of carrying it — now and for generations to come.
        </p>
        <div className={styles.ctaBtns}>
          <Link to="/contact" className={styles.btnPrimary}>Book Private Consultation</Link>
          <Link to="/technology" className={styles.btnSecondary}>Explore the Technology</Link>
        </div>
      </div>
    </section>
  )
}
