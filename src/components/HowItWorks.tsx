import { asset } from '../lib/assets'
import { useReveal } from '../lib/useReveal'
import styles from './HowItWorks.module.css'

const STEPS = [
  {
    num: '01',
    title: 'Choose Your Jewel',
    body: 'Choose from our handcrafted pendants and bracelets, then select your metal, gemstone, and silhouette in our atelier.',
    illustration: asset('/assets/illustrations/how-it-works-1-choose.png'),
  },
  {
    num: '02',
    title: 'Upload Memories Securely',
    body: 'Add photographs, voice notes, letters, and certificates to your private encrypted vault — seen only by you and the person you give it to.',
    illustration: asset('/assets/illustrations/how-it-works-2-upload.png'),
  },
  {
    num: '03',
    title: 'Tap With Your Phone',
    body: 'Open the free Tijoray app and touch your phone to the piece. Your memories unfold on screen — no pairing, no charging, nothing to set up.',
    illustration: asset('/assets/illustrations/how-it-works-3-tap.png'),
  },
  {
    num: '04',
    title: 'Gift It to Someone Special',
    body: 'Give a Tijoray to a loved one, a friend, or even yourself. A gift that holds memories, not just beauty — worn close, forever.',
    illustration: asset('/assets/illustrations/how-it-works-4-legacy.png'),
  },
]

export default function HowItWorks() {
  const reveal = useReveal(styles.inView)

  return (
    <section id="how-it-works" className={styles.section}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>How Tijoray Works</p>
          <h2 className={styles.title}>Four steps to a piece that <em>remembers.</em></h2>
        </header>

        <div className={styles.grid}>
          {STEPS.map((step, i) => (
            <article
              key={step.num}
              ref={reveal}
              className={styles.card}
              style={{ transitionDelay: `${i * 0.05}s` }}
            >
              <div className={styles.illustrationWrap}>
                <img
                  src={step.illustration}
                  alt={step.title}
                  className={styles.illustration}
                  loading="lazy"
                  draggable={false}
                />
              </div>
              <div className={styles.cardText}>
                <div className={styles.stepNum}>{step.num}</div>
                <h3 className={styles.cardTitle}>{step.title}</h3>
                <p className={styles.cardBody}>{step.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
