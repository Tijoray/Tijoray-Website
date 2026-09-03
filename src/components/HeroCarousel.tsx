import { useEffect, useRef, useState } from 'react'
import { IMG } from '../lib/assets'
import styles from './HeroCarousel.module.css'

const SLIDES = [
  { src: IMG.pendantCloseup, alt: 'Tijoray pendant — macro close-up' },
  { src: IMG.pendantWorn,    alt: 'Tijoray pendant worn on model' },
  { src: IMG.braceletWorn,   alt: 'Tijoray bracelet on wrist' },
  { src: IMG.unboxing,        alt: 'Tijoray unboxing and packaging' },
  { src: IMG.nfcTap,         alt: 'NFC tap — unlocking the vault' },
]

const INTERVAL = 6000

export default function HeroCarousel() {
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function advance(to?: number) {
    setActive(prev => to !== undefined ? to : (prev + 1) % SLIDES.length)
  }

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => advance(), INTERVAL)
  }

  useEffect(() => {
    timerRef.current = setInterval(() => advance(), INTERVAL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function goTo(i: number) {
    advance(i)
    resetTimer()
  }

  // Touch swipe
  const touchStartX = useRef(0)
  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) < 40) return
    if (dx < 0) { advance((active + 1) % SLIDES.length); resetTimer() }
    else { advance((active - 1 + SLIDES.length) % SLIDES.length); resetTimer() }
  }

  return (
    <div
      className={styles.carousel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setZoomed(true)}
      onMouseLeave={() => setZoomed(false)}
    >
      <div className={styles.track}>
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            className={`${styles.slide} ${i === active ? styles.slideActive : ''}`}
            aria-hidden={i !== active}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className={`${styles.img} ${zoomed ? styles.imgZoomed : ''}`}
              draggable={false}
            />
            <div className={styles.overlay} aria-hidden="true" />
          </div>
        ))}
      </div>

      <div className={styles.dots} role="tablist" aria-label="Carousel navigation">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === active}
            aria-label={`Slide ${i + 1}`}
            className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  )
}
