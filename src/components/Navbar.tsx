import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { label: 'Collection', to: '#' },
  { label: 'Technology', to: '/technology' },
  { label: 'Atelier',    to: '/about' },
  { label: 'Journal',    to: '#' },
]

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const { pathname } = useLocation()

  function closeMenu() {
    setClosing(true)
    setTimeout(() => {
      setMenuOpen(false)
      setClosing(false)
    }, 260) // match exit animation duration
  }

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    // On non-home pages, always use frosted style
    const hero = document.querySelector('.hero-section') as HTMLElement | null
    const story = document.getElementById('scroll-story') as HTMLElement | null

    if (!hero || !story) {
      nav.classList.remove('in-dark')
      nav.classList.add('frosted')
      return
    }

    function update() {
      const y = window.scrollY
      const heroBottom = hero!.offsetHeight
      const storyEnd = story!.offsetTop + story!.offsetHeight
      nav!.classList.remove('frosted', 'in-dark')
      if (y > heroBottom && y < storyEnd - window.innerHeight * 0.5) {
        nav!.classList.add('in-dark')
      } else if (y > heroBottom) {
        nav!.classList.add('frosted')
      }
    }

    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [pathname])

  return (
    <>
      <nav ref={navRef} className={styles.navbar} aria-label="Primary navigation">
        <Link to="/" className={styles.logo} aria-label="Arcana Home">
          <img src="/assets/Arcana Logo.png" alt="Arcana" />
        </Link>
        <ul className={styles.links}>
          {NAV_LINKS.map(({ label, to }) => (
            <li key={label}>
              <Link to={to}>{label}</Link>
            </li>
          ))}
        </ul>
        <Link to="/build" className={styles.cta}>Build Your Arcana</Link>
        <button
          className={styles.hamburger}
          onClick={() => menuOpen ? closeMenu() : setMenuOpen(true)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span className={menuOpen ? styles.barTop + ' ' + styles.barOpen : styles.barTop} />
          <span className={menuOpen ? styles.barMid + ' ' + styles.barOpen : styles.barMid} />
          <span className={menuOpen ? styles.barBot + ' ' + styles.barOpen : styles.barBot} />
        </button>
      </nav>
      {menuOpen && (
        <div
          className={`${styles.mobileOverlay} ${closing ? styles.overlayClosing : ''}`}
          aria-modal="true"
          role="dialog"
          onClick={closeMenu}
        >
          <button
            className={styles.overlayClose}
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <span className={styles.barTop + ' ' + styles.barOpen} />
            <span className={styles.barMid + ' ' + styles.barOpen} />
            <span className={styles.barBot + ' ' + styles.barOpen} />
          </button>
          <ul className={`${styles.mobileLinks} ${closing ? styles.linksClosing : ''}`} onClick={e => e.stopPropagation()}>
            {NAV_LINKS.map(({ label, to }) => (
              <li key={label}>
                <Link to={to} onClick={closeMenu}>{label}</Link>
              </li>
            ))}
          </ul>
          <Link to="/build" className={styles.mobileCta} onClick={closeMenu}>
            Build Your Arcana
          </Link>
        </div>
      )}
    </>
  )
}
