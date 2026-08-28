import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import PieceThumbnail from '../components/PieceThumbnail'
import styles from './CartPage.module.css'
import {
  SHAPE_LABELS,
  METAL_LABELS_LONG       as METAL_LABELS,
  METAL_COLOR_LABELS_LONG as METAL_COLOR_LABELS,
  STONE_NAMES_SHORT       as BIRTHSTONE_NAMES,
} from '../data/catalog'
import { PRODUCT_TYPES } from '../data/product-types'
import { usePageMeta } from '../lib/usePageMeta'

/** "Square Pendant", "Asscher Bracelet", … from a cart item's product identity. */
const itemTitle = (shape: string, productType: string) => {
  // The bracelet's 'square' key is an asscher cut — label it the way the
  // configurator (and the Stripe receipt) do.
  const shapeLabel = productType === 'bracelet' && shape === 'square'
    ? 'Asscher'
    : SHAPE_LABELS[shape as keyof typeof SHAPE_LABELS]
  return `${shapeLabel} ${PRODUCT_TYPES[productType as keyof typeof PRODUCT_TYPES]?.label ?? 'Pendant'}`
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(n)

export default function CartPage() {
  usePageMeta('Your Cart')
  const { items, removeItem } = useCart()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.empty}>
          <p className={styles.eyebrow}>Your Cart</p>
          <h1 className={styles.title}>Nothing here yet</h1>
          <p className={styles.body}>Configure a piece and add it to begin.</p>
          <Link to="/collection" className={styles.ctaBtn}>Build Your Tijoray</Link>
        </div>
      </main>
    )
  }

  const total = items.reduce((sum, i) => sum + i.price, 0)

  // Heading noun: the shared product-type label when the cart is all one form,
  // otherwise a generic "Piece" so a mixed pendant + bracelet cart still reads right.
  const uniformType = items.every(i => i.productType === items[0].productType)
    ? items[0].productType : null
  const headingNoun = uniformType
    ? PRODUCT_TYPES[uniformType as keyof typeof PRODUCT_TYPES]?.label ?? 'Piece'
    : 'Piece'

  return (
    <main className={styles.page}>
      <div className={styles.inner}>

        {/* Left — item list */}
        <div className={styles.left}>
          <p className={styles.eyebrow}>Your Cart</p>
          <h1 className={styles.title}>The <em>Tijoray</em> {headingNoun}{items.length > 1 ? 's' : ''}</h1>

          <ul className={styles.itemList}>
            {items.map((item, idx) => {
              const metalLine = `${METAL_COLOR_LABELS[item.metalColor]} ${METAL_LABELS[item.metal]}`

              return (
                <li key={idx} className={styles.card}>
                  <div className={styles.cardThumb}>
                    <PieceThumbnail
                      productType={item.productType}
                      shape={item.shape}
                      metal={item.metal}
                      metalColor={item.metalColor}
                      birthstoneIndex={item.birthstoneIndex}
                      size={200}
                    />
                  </div>
                  <div className={styles.cardDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Shape</span>
                      <span className={styles.detailValue}>{itemTitle(item.shape, item.productType)}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Metal</span>
                      <span className={styles.detailValue}>{metalLine}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Birthstone</span>
                      <span className={styles.detailValue}>{BIRTHSTONE_NAMES[item.birthstoneIndex]}</span>
                    </div>
                    <div className={`${styles.detailRow} ${styles.detailRowPrice}`}>
                      <span className={styles.detailLabel}>Price</span>
                      <span className={styles.priceValue}>{fmt(item.price)}</span>
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(idx)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          <Link to="/collection" className={styles.addAnotherLink}>
            + Add another piece
          </Link>
        </div>

        {/* Right — order summary */}
        <div className={styles.right}>
          <div className={styles.summary}>
            <p className={styles.summaryTitle}>Order Summary</p>
            {items.map((item, idx) => (
              <div key={idx} className={styles.summaryRow}>
                <span>{itemTitle(item.shape, item.productType)}</span>
                <span>{fmt(item.price)}</span>
              </div>
            ))}
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span className={styles.summaryMuted}>Complimentary</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
          </div>

          <button
            className={styles.ctaBtn}
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </button>

          <p className={styles.secureNote}>
            Secured by Stripe · 256-bit TLS encryption
          </p>
        </div>

      </div>
    </main>
  )
}
