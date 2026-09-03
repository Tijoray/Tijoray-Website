import { Link } from 'react-router-dom'
import { IMG } from '../lib/assets'
import { useReveal } from '../lib/useReveal'
import styles from './TheMoment.module.css'

/**
 * The comparison the shopper is actually making.
 *
 * At $399–$1,299 the real competition is a pretty locket, and the answer to
 * "what do I get for the difference?" was previously scattered across four
 * pages for the reader to assemble. This states it outright, next to a picture
 * of the one thing no other jewelry does — the tap.
 */
const CONTRASTS = [
  {
    before: 'A photograph in a drawer',
    after:  'Worn every day, on the piece itself',
  },
  {
    before: 'A caption under a picture',
    after:  'Her actual voice, in her actual words',
  },
  {
    before: 'A receipt in a folder somewhere',
    after:  'Provenance sealed into the piece, verified on every tap',
  },
]

export default function TheMoment() {
  const reveal = useReveal(styles.inView)

  return (
    <section className={styles.section} aria-labelledby="moment-heading">
      <div className={styles.inner}>
        <div className={`${styles.media} ${styles.fadeUp}`} ref={reveal}>
          <img
            src={IMG.nfcTap}
            alt="A phone held against a Tijoray pendant, opening the vault inside it"
            className={styles.image}
            loading="lazy"
          />
          <p className={styles.caption}>One tap. No app pairing, no battery, nothing to set up.</p>
        </div>

        <div className={`${styles.text} ${styles.fadeUp}`} ref={reveal}>
          <p className={styles.eyebrow}>Why Tijoray</p>
          <h2 id="moment-heading" className={styles.title}>
            A locket holds one photograph.<br />
            A Tijoray holds <em>her voice.</em>
          </h2>
          <p className={styles.lede}>
            The jewelry is the point — handmade, hallmarked, meant to be worn for
            decades. What makes it a Tijoray is sealed underneath the stone.
          </p>

          <dl className={styles.contrasts}>
            {CONTRASTS.map(c => (
              <div key={c.before} className={styles.contrastRow}>
                <dt className={styles.before}>{c.before}</dt>
                <dd className={styles.after}>{c.after}</dd>
              </div>
            ))}
          </dl>

          <Link to="/technology" className={styles.link}>See how the vault works →</Link>
        </div>
      </div>
    </section>
  )
}
