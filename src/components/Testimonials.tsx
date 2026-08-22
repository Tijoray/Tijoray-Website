import { useEffect, useRef } from 'react'
import styles from './Testimonials.module.css'

// Honest editorial voice — not customer reviews. Swap in real, permissioned
// testimonials (name + purchase verified) once the first pieces are worn.
const TESTIMONIALS = [
  {
    quote: 'A photograph fades. A voice recording sits forgotten in a phone. We built Tijoray so the moments that matter most live inside something you reach for every day.',
    name: 'Why we make this',
    detail: 'The idea behind every piece',
  },
  {
    quote: 'Every piece is finished by hand and carries its own vault — a private, encrypted archive that opens with a tap and asks nothing of you. No battery. No charging. No subscription.',
    name: 'How it is made',
    detail: 'Craft first, technology concealed',
  },
  {
    quote: 'A Tijoray is meant to be given twice: once when it is clasped for the first time, and again decades later, when the memories inside it are worth more than the metal.',
    name: 'What it is for',
    detail: 'Made to be passed on',
  },
]

export default function Testimonials() {
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
    <section className={styles.section}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>From the Atelier</p>
          <h2 className={styles.title}>Worn and <em>remembered.</em></h2>
        </header>

        <div className={styles.grid}>
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={i}
              ref={el => { cardRefs.current[i] = el }}
              className={styles.card}
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              <span className={styles.openQuote} aria-hidden="true">"</span>
              <blockquote className={styles.quote}>{t.quote}</blockquote>
              <figcaption className={styles.caption}>
                <span className={styles.name}>{t.name}</span>
                <span className={styles.detail}>{t.detail}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
