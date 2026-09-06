import { IMG } from '../lib/assets'
import { useReveal } from '../lib/useReveal'
import styles from './HowItWorks.module.css'

const STEPS = [
  {
    num: '01',
    title: 'Choose Your Jewel',
    body: 'Choose from our handcrafted pendants and bracelets, then select your metal, gemstone, and silhouette in our atelier.',
    illustration: IMG.hiw1,
  },
  {
    num: '02',
    title: 'Upload Memories Securely',
    body: 'After purchase, add photographs, voice notes, letters, and certificates in your online memory portal. Access is restricted to authorized accounts.',
    illustration: IMG.hiw2,
  },
  {
    num: '03',
    title: 'Gift It to Someone Special',
    body: 'Give a Tijoray to a loved one, a friend, or even yourself. Jewelry to wear, and a memory to keep.',
    illustration: IMG.hiw4,
  },
  {
    num: '04',
    title: 'Tap With Your Phone',
    body: 'The recipient installs the free Tijoray app, signs in with a verified account, then touches a compatible phone to the piece. The jewelry needs no pairing, battery, or charging; opening memories requires internet access.',
    illustration: IMG.hiw3,
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
