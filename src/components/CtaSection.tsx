import { Link } from 'react-router-dom'
import styles from './CtaSection.module.css'

export default function CtaSection() {
  return (
    <section className={styles.ctaSection}>
      {/* The configurator is the journey that scales, so it takes the primary
          button. "Book Private Consultation" was reading as the main action on
          a page whose entry piece is $399 — high friction, and it told a gift
          shopper this shop was not meant for them. Bespoke stays available as
          a quiet second path. */}
      <div className={styles.ctaInner}>
        <p className={styles.ctaEyebrow}>Begin</p>
        <h2 className={styles.ctaTitle}>
          Design a piece<br /><em>worth keeping</em>
        </h2>
        <p className={styles.ctaBody}>
          Choose the silhouette, the metal, and the stone for whichever month
          matters. It is made to that order and arrives with its vault ready —
          yours to fill before you give it away.
        </p>
        <div className={styles.ctaBtns}>
          <Link to="/collection" className={styles.btnPrimary}>Design your piece — from $399</Link>
          <Link to="/technology" className={styles.btnSecondary}>See how it works</Link>
        </div>
        <p className={styles.ctaAside}>
          Something entirely custom in mind?{' '}
          <Link to="/contact">Speak with the atelier about a commission.</Link>
        </p>
      </div>
    </section>
  )
}
