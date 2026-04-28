import { useEffect, useRef } from 'react'
import styles from './HowItWorks.module.css'

const STEPS = [
  {
    num: '01',
    title: 'Choose Your Jewel',
    body: 'Select from our handcrafted pendants and bracelets, choosing your metal, gemstone, and silhouette in our atelier.',
  },
  {
    num: '02',
    title: 'Upload Memories Securely',
    body: 'Add photographs, voice notes, letters, and certificates to your private encrypted vault — accessible only by you.',
  },
  {
    num: '03',
    title: 'Tap With Your Phone',
    body: 'A single touch of your phone to the piece unlocks your world instantly. No app needed, no internet required.',
  },
  {
    num: '04',
    title: 'Pass It On for Generations',
    body: 'Transfer ownership and vault access to a loved one. Your legacy, worn and remembered — for generations to come.',
  },
]

export default function HowItWorks() {
  const cardRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add(styles.inView)
      }),
      { threshold: 0.15 }
    )
    cards.forEach(c => io.observe(c))
    return () => io.disconnect()
  }, [])

  return (
    <section id="how-it-works" className={styles.section}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>How Tijoray Works</p>
          <h2 className={styles.title}>Four steps to <em>eternal memory.</em></h2>
        </header>

        <div className={styles.grid}>
          {STEPS.map((step, i) => (
            <article
              key={step.num}
              ref={el => { cardRefs.current[i] = el }}
              className={styles.card}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className={styles.num}>{step.num}</div>
              <div className={styles.connector} aria-hidden="true" />
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.cardBody}>{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
