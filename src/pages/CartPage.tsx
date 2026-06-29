import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import PendantThumbnail from '../components/PendantThumbnail'
import styles from './CartPage.module.css'
import {
  SHAPE_LABELS,
  METAL_LABELS_LONG       as METAL_LABELS,
  METAL_COLOR_LABELS_LONG as METAL_COLOR_LABELS,
  STONE_NAMES_SHORT       as BIRTHSTONE_NAMES,
} from '../data/catalog'

const fmt = (n: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(n)

export default function CartPage() {
  const { items, removeItem } = useCart()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.empty}>
          <p className={styles.eyebrow}>Your Cart</p>
          <h1 className={styles.title}>Nothing here yet</h1>
          <p className={styles.body}>Configure your pendant and add it to begin.</p>
          <Link to="/products/birthstone-pendant" className={styles.ctaBtn}>Design Your Pendant</Link>
        </div>
      </main>
    )
  }

  const total = items.reduce((sum, i) => sum + i.price, 0)

  return (
    <main className={styles.page}>
      <div className={styles.inner}>

        {/* Left — item list */}
        <div className={styles.left}>
          <p className={styles.eyebrow}>Your Cart</p>
          <h1 className={styles.title}>The <em>Tijoray</em> Pendant{items.length > 1 ? 's' : ''}</h1>

          <ul className={styles.itemList}>
            {items.map((item, idx) => {
              const metalLine = item.metal === 'steel'
                ? METAL_LABELS[item.metal]
                : `${METAL_COLOR_LABELS[item.metalColor]} ${METAL_LABELS[item.metal]}`

              return (
                <li key={idx} className={styles.card}>
                  <div className={styles.cardThumb}>
                    <PendantThumbnail
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
                      <span className={styles.detailValue}>{SHAPE_LABELS[item.shape]} Pendant</span>
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
                <span>{SHAPE_LABELS[item.shape]} Pendant</span>
                <span>{fmt(item.price)}</span>
              </div>
            ))}
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span className={styles.summaryMuted}>Calculated at checkout</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <span>Estimated Total</span>
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
