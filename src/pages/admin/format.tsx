import type { ReactNode } from 'react'
import styles from './admin.module.css'
import {
  SHAPE_LABELS, METAL_LABELS_LONG, METAL_COLOR_LABELS_LONG,
  STONE_NAMES, PRODUCT_TYPE_LABELS, METAL_PRICES_CENTS,
  type Shape, type Metal, type MetalColor,
} from '../../data/catalog'
import type { PieceConfig } from '../../lib/adminApi'

export const money = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100)

/** Best-effort price of a piece from its chosen metal (matches the checkout pricing). */
export const estCents = (config: PieceConfig | null): number => {
  const metal = config?.metal as Metal | undefined
  return (metal && METAL_PRICES_CENTS[metal]) || 0
}

export const date = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

export const dateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'

/** Decode a piece config into a human summary, e.g. "18k White Gold · Heart Pendant · Ruby". */
export function describeConfig(config: PieceConfig | null, productType?: string | null): string {
  if (!config) return productType ? (PRODUCT_TYPE_LABELS[productType] ?? productType) : 'Piece'
  const pt = config.productType ?? productType ?? 'pendant'
  const productLabel = PRODUCT_TYPE_LABELS[pt] ?? 'Pendant'

  // Bracelet 'square' key is an asscher cut.
  const shape = config.shape as Shape | undefined
  const shapeLabel = shape
    ? (pt === 'bracelet' && shape === 'square' ? 'Asscher' : (SHAPE_LABELS[shape] ?? shape))
    : ''

  const metal = config.metal as Metal | undefined
  const metalColor = config.metalColor as MetalColor | undefined
  const metalLine = metal
    ? (metal === 'steel'
        ? METAL_LABELS_LONG[metal]
        : `${metalColor ? METAL_COLOR_LABELS_LONG[metalColor] + ' ' : ''}${METAL_LABELS_LONG[metal]}`)
    : ''

  const stone = typeof config.birthstoneIndex === 'number' ? STONE_NAMES[config.birthstoneIndex] : ''

  return [metalLine, [shapeLabel, productLabel].filter(Boolean).join(' '), stone]
    .filter(Boolean).join(' · ')
}

export function StatusPill({ status }: { status: string | null }) {
  const s = status ?? 'crafting'
  const cls =
    s === 'shipped' ? styles.pillShipped :
    s === 'delivered' ? styles.pillDelivered :
    styles.pillCrafting
  return <span className={`${styles.pill} ${cls}`}>{s}</span>
}

export function Pill({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'warn' }) {
  return <span className={`${styles.pill} ${tone === 'warn' ? styles.pillWarn : styles.pillMuted}`}>{children}</span>
}
