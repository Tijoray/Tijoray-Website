import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { label: 'Collection', to: '/collection' },
  { label: 'Technology', to: '/technology' },
  { label: 'Atelier',    to: '/about' },
  { label: 'Journal',    to: null }, // coming soon
]

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null)
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [closing,      setClosing]      = useState(false)
  const [accountOpen,  setAccountOpen]  = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { items } = useCart()
  const { user, signOut }  = useAuth()

  // Close account dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      } else {
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
        <ul className={styles.links}>
          {NAV_LINKS.map(({ label, to }) => (
            <li key={label}>
              {to ? (
                <Link
                  to={to}
                  aria-current={pathname === to ? 'page' : undefined}
                >
                  {label}
                </Link>
              ) : (
                <span className={styles.linkSoon}>
                  {label}
                  <span className={styles.soonBadge}>Soon</span>
                </span>
              )}
            </li>
          ))}
        </ul>
        <Link to="/" className={styles.logo} aria-label="Tijoray Home">
          <img src="/assets/brand/Text.svg" alt="Tijoray" />
        </Link>
        <div className={styles.navRight}>
          {user ? (
            <div className={styles.accountWrap} ref={accountRef}>
              <button
                className={styles.accountIcon}
                aria-label="My account"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen(o => !o)}
              >
                <span className={styles.accountInitial}>
                  {(user.email?.[0] ?? 'A').toUpperCase()}
                </span>
              </button>
              {accountOpen && (
                <div className={styles.accountDropdown}>
                  <Link
                    to="/portal"
                    className={styles.dropdownItem}
                    onClick={() => setAccountOpen(false)}
                  >
                    Portal
                  </Link>
                  <Link
                    to="/settings"
                    className={styles.dropdownItem}
                    onClick={() => setAccountOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    className={`${styles.dropdownItem} ${styles.dropdownSignOut}`}
                    onClick={() => { setAccountOpen(false); signOut(); navigate('/') }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={styles.signInLink}>Sign In</Link>
          )}
          {items.length > 0 && (
            <Link to="/cart" className={styles.cartIcon} aria-label="View cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <span className={styles.cartBadge}>{items.length}</span>
            </Link>
          )}
          <Link to="/build" className={styles.cta}>Build Your Tijoray</Link>
        </div>
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
                {to ? (
                  <Link to={to} onClick={closeMenu} aria-current={pathname === to ? 'page' : undefined}>
                    {label}
                  </Link>
                ) : (
                  <span className={styles.mobileLinkSoon}>{label}</span>
                )}
              </li>
            ))}
          </ul>
          <Link to="/build" className={styles.mobileCta} onClick={closeMenu}>
            Build Your Tijoray
          </Link>
          <div className={styles.mobileAccount} onClick={e => e.stopPropagation()}>
            {user ? (
              <>
                <Link to="/portal" className={styles.mobileAccountLink} onClick={closeMenu}>Portal</Link>
                <Link to="/settings" className={styles.mobileAccountLink} onClick={closeMenu}>Settings</Link>
                <button
                  className={`${styles.mobileAccountLink} ${styles.mobileSignOut}`}
                  onClick={() => { closeMenu(); signOut(); navigate('/') }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" className={styles.mobileAccountLink} onClick={closeMenu}>Sign In</Link>
            )}
            {items.length > 0 && (
              <Link to="/cart" className={styles.mobileAccountLink} onClick={closeMenu}>
                Cart ({items.length})
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}
