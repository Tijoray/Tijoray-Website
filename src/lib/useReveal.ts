import { useCallback, useEffect, useRef } from 'react'

/**
 * Reveal-on-scroll that can never leave content invisible.
 *
 * Pages fade sections in by pairing an `.inView` class with a CSS rule that
 * starts the element at `opacity: 0`. A plain IntersectionObserver created once
 * on mount breaks that contract in two ways we hit in production:
 *
 *   1. Elements rendered AFTER mount are never observed. The Collection page
 *      re-renders its product cards when the live catalog hydrates over the
 *      code defaults, so the cards sat at opacity 0 forever — an empty shop.
 *   2. A fast wheel/flick scroll can carry an element from below the viewport
 *      to above it between two observer samples. It never intersects, so it
 *      stays hidden even after the reader has scrolled past it.
 *
 * So elements register through a ref callback (late arrivals are always
 * observed) and the observer is backed by a rAF-throttled scroll sweep that
 * reveals anything that has reached the fold. Readers who prefer reduced
 * motion get everything revealed immediately.
 *
 * Usage:
 *   const reveal = useReveal(styles.inView)
 *   <section className={`${styles.card} ${styles.fadeUp}`} ref={reveal}>
 */
export function useReveal(inViewClass: string) {
  const pending  = useRef<Set<Element>>(new Set())
  const observer = useRef<IntersectionObserver | null>(null)
  const frame    = useRef<number | null>(null)
  const reduced  = useRef(false)

  // Kept in a ref so the ref callback below stays referentially stable — an
  // unstable ref callback is re-invoked by React on every single render.
  const className = useRef(inViewClass)
  className.current = inViewClass

  const show = useCallback((el: Element) => {
    el.classList.add(className.current)
    pending.current.delete(el)
    observer.current?.unobserve(el)
  }, [])

  /** Safety net for anything the observer skipped (see #2 above). */
  const sweep = useCallback(() => {
    frame.current = null
    const limit = reduced.current ? Infinity : window.innerHeight * 0.92
    // Snapshot first — show() mutates the set as we go.
    for (const el of Array.from(pending.current)) {
      if (el.getBoundingClientRect().top < limit) show(el)
    }
  }, [show])

  const scheduleSweep = useCallback(() => {
    if (frame.current === null) frame.current = requestAnimationFrame(sweep)
  }, [sweep])

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!reduced.current && typeof IntersectionObserver !== 'undefined') {
      observer.current = new IntersectionObserver(
        entries => entries.forEach(e => { if (e.isIntersecting) show(e.target) }),
        // Fire on the first pixel, a touch before the element is fully in frame.
        { threshold: 0.01, rootMargin: '0px 0px -6% 0px' },
      )
      // Catch anything registered during the render pass before this effect ran.
      pending.current.forEach(el => observer.current!.observe(el))
    }

    window.addEventListener('scroll', scheduleSweep, { passive: true })
    window.addEventListener('resize', scheduleSweep, { passive: true })
    scheduleSweep()

    return () => {
      observer.current?.disconnect()
      observer.current = null
      window.removeEventListener('scroll', scheduleSweep)
      window.removeEventListener('resize', scheduleSweep)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = null
    }
  }, [show, scheduleSweep])

  /** Stable ref callback — pass straight to `ref` on any element to reveal. */
  return useCallback((el: HTMLElement | null) => {
    if (!el || el.classList.contains(className.current)) return
    pending.current.add(el)
    observer.current?.observe(el)
    scheduleSweep()
  }, [scheduleSweep])
}
