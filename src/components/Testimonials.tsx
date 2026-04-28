import { useEffect, useRef } from 'react'
import styles from './Testimonials.module.css'

const TESTIMONIALS = [
  {
    quote: "A piece of extraordinary craftsmanship and ingenuity. The ability to carry my grandmother's voice inside a jewel I wear every day is something I could not have imagined before Tijoray.",
    name: 'Isabelle M.',
    detail: 'Birthstone Pendant — Circle, 18k Yellow Gold',
  },
  {
    quote: 'I gifted my mother a Tijoray pendant for her 60th birthday. She wept when she unlocked it and found photographs from her childhood she thought were lost. Nothing has ever moved her like this.',
    name: 'James A.',
    detail: 'Bespoke Commission — Sapphire & Platinum',
  },
  {
    quote: 'As someone who owns pieces from Cartier and Van Cleef, I can say Tijoray stands apart — not just in concept, but in the quality of the handwork. The finishing is immaculate.',
    name: 'Priya S.',
    detail: 'Diamond Edition — Pear Silhouette',
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
          <p className={styles.eyebrow}>From Our Clients</p>
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
