import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useCatalog } from '../contexts/CatalogContext'
import PieceThumbnail from './PieceThumbnail'
import styles from './CartDrawer.module.css'
import { SHAPE_LABELS, metalPhrase, STONE_NAMES } from '../data/catalog'

const fmt = (n: number) => new Intl.NumberFormat('en-CA', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(n)

/**
 * Slide-over cart shown after a piece is added.
 *
 * Adding used to navigate straight to /cart, which ended the session at the
 * moment a shopper was most engaged — and the pieces are explicitly sold as a
 * set ("a different stone for each person"), so the natural next action is a
 * second piece, not checkout.
 */
export default function CartDrawer() {
  const { items, removeItem, cartOpen, closeCart } = useCart()
  const catalog = useCatalog()
  const panelRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  const subtotal = items.reduce((sum, i) => sum + i.price, 0)

  // The cart page is the cart — a drawer on top of it would just be in the way.
  const onCartPage = pathname === '/cart' || pathname === '/checkout'
  const open = cartOpen && !onCartPage

  /* Lock the page behind the drawer, and close on Escape. */
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') closeCart() }
    document.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open, closeCart])

  /* A route change means the shopper moved on — never strand the drawer open.
     Guarded on an actual path change so a re-render can't close it on open. */
  const lastPath = useRef(pathname)
  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    closeCart()
  }, [pathname, closeCart])

  if (!open) return null

  // Suggest the piece they are not already looking at, using live catalog copy.
  const suggestion = catalog.doc.products.find(
    p => p.available && !items.some(i => i.productType === p.productTypeId),
  )

  return (
    <div className={styles.scrim} onClick={closeCart} role="presentation">
      <aside
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        <header className={styles.head}>
          <p className={styles.eyebrow}>Added to cart</p>
          <button className={styles.close} onClick={closeCart} aria-label="Close cart">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <ul className={styles.list}>
          {items.map((item, idx) => (
            <li key={idx} className={styles.row}>
              <div className={styles.thumb}>
                <PieceThumbnail
                  productType={item.productType}
                  shape={item.shape}
                  metal={item.metal}
                  metalColor={item.metalColor}
                  birthstoneIndex={item.birthstoneIndex}
                  size={120}
                />
              </div>
              <div className={styles.rowText}>
                <p className={styles.rowTitle}>
                  {item.productType === 'bracelet' && item.shape === 'square'
                    ? 'Asscher'
                    : SHAPE_LABELS[item.shape]}{' '}
                  {item.productType === 'bracelet' ? 'Bracelet' : 'Pendant'}
                </p>
                <p className={styles.rowSpec}>
                  {metalPhrase(item.metal, item.metalColor)} · {STONE_NAMES[item.birthstoneIndex]}
                </p>
                <div className={styles.rowBottom}>
                  <span className={styles.rowPrice}>{fmt(item.price)}</span>
                  <button className={styles.remove} onClick={() => removeItem(idx)}>Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.foot}>
          <div className={styles.subtotalRow}>
            <span>Subtotal</span>
            <span className={styles.subtotalValue}>{fmt(subtotal)}</span>
          </div>
          <p className={styles.footNote}>Complimentary shipping to Canada, the US, UK and Australia. Tax is calculated at checkout.</p>

          <Link to="/checkout" className={styles.checkout} onClick={closeCart}>
            Checkout
          </Link>
          <button className={styles.keepGoing} onClick={closeCart}>
            Keep designing
          </button>

          {suggestion && (
            <Link to={suggestion.route} className={styles.suggest} onClick={closeCart}>
              <span className={styles.suggestLabel}>Wear it together</span>
              <span className={styles.suggestName}>
                Add a {suggestion.name.toLowerCase()} →
              </span>
            </Link>
          )}

          <Link to="/cart" className={styles.viewCart} onClick={closeCart}>
            View full cart
          </Link>
        </div>
      </aside>
    </div>
  )
}
