/**
 * Single source of truth for product catalog data — stones, metals, shapes.
 *
 * IMPORTANT: this module is PURE DATA with no dependencies. It is imported by
 * both the frontend (`src/`) and the Vercel serverless functions (`api/`), so it
 * must NOT import anything that relies on `import.meta.env` or browser/Vite APIs
 * (e.g. `src/lib/assets.ts`). Asset/model paths live in `src/data/collection.ts`,
 * which is frontend-only.
 *
 * Database identity can differ from customer-facing copy and is preserved here
 * without exposing the internal value in carts, receipts, or certificates:
 *   • Metal labels  — short ("Silver") in the configurator vs long ("Sterling
 *     Silver") in the cart/checkout/receipt.
 *   • Metal colours — "Gold" in the configurator vs "Yellow" in cart/checkout/API.
 *   • Stone #5      — "Mother of Pearl" is the display name. The legacy "Pearl"
 *     value remains only as the Supabase `Stones` lookup key.
 *   • Gem material  — the configurator uses a richer material (iridescence,
 *     per-gem env intensity) than the static cart thumbnail. Both sets are kept.
 */

/* ── Types ─────────────────────────────────────────────── */
export type Shape      = 'square' | 'circle' | 'heart' | 'pear'
export type Metal      = 'silver' | '10k' | '18k'
export type MetalColor = 'white' | 'gold' | 'rose'

/** Physically-based gem material used by the interactive 3D configurator. */
export interface GemProps {
  color:               string
  ior:                 number
  transmission:        number
  thickness:           number
  roughness:           number
  clearcoat:           number
  clearcoatRoughness:  number
  envMapIntensity:     number
  attenuationColor:    string
  attenuationDistance: number
  iridescence:         number
  iridescenceIOR:      number
}

/** Simplified gem material used by the static cart/checkout thumbnail render. */
export interface GemThumbProps {
  color:               string
  ior:                 number
  transmission:        number
  thickness:           number
  roughness:           number
  clearcoat:           number
  clearcoatRoughness:  number
  attenuationColor:    string
  attenuationDistance: number
}

export interface Stone {
  /** Full month name — drives the configurator month grid. */
  month:   string
  /** Display name in the configurator (e.g. "Mother of Pearl"). */
  name:    string
  /** Stable internal name used for the Supabase Stones lookup. */
  dbName:  string
  /** UI swatch colour (CSS hex). */
  color:   string
  /** Short descriptive meaning shown on the product page. */
  meaning: string
  /** Configurator gem material. */
  gem:     GemProps
  /** Thumbnail gem material (static screenshot render). */
  gemThumb: GemThumbProps
}

/* ── Stones ────────────────────────────────────────────── */
// Order is significant — `birthstoneIndex` (0–11) indexes into this array
// everywhere in the app and is persisted in carts/orders.
export const STONES: Stone[] = [
  {
    month: 'January', name: 'Garnet', dbName: 'Garnet', color: '#9B1B30',
    meaning: 'Devotion and protection on new journeys.',
    gem:      { color: '#A01520', ior: 1.78, transmission: 0.70, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0,  envMapIntensity: 5.0, attenuationColor: '#C02030', attenuationDistance: 1.0, iridescence: 0,    iridescenceIOR: 1.3 },
    gemThumb: { color: '#A01520', ior: 1.78, transmission: 0.70, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0,  attenuationColor: '#C02030', attenuationDistance: 1.0 },
  },
  {
    month: 'February', name: 'Amethyst', dbName: 'Amethyst', color: '#9B59B6',
    meaning: 'Clarity of mind, sincerity, and inner peace.',
    gem:      { color: '#8B3FBB', ior: 1.54, transmission: 0.88, thickness: 0.4, roughness: 0.01, clearcoat: 1.0, clearcoatRoughness: 0.0,  envMapIntensity: 4.5, attenuationColor: '#A855CC', attenuationDistance: 1.5, iridescence: 0,    iridescenceIOR: 1.3 },
    gemThumb: { color: '#8B3FBB', ior: 1.54, transmission: 0.88, thickness: 0.4, roughness: 0.01, clearcoat: 1.0, clearcoatRoughness: 0.0,  attenuationColor: '#A855CC', attenuationDistance: 1.5 },
  },
  {
    month: 'March', name: 'Aquamarine', dbName: 'Aquamarine', color: '#7EC8C8',
    meaning: 'Courage, calm, and clarity in turbulent waters.',
    gem:      { color: '#7ECFE0', ior: 1.57, transmission: 0.93, thickness: 0.4, roughness: 0.01, clearcoat: 1.0, clearcoatRoughness: 0.0,  envMapIntensity: 4.5, attenuationColor: '#A0E0EE', attenuationDistance: 3.0, iridescence: 0,    iridescenceIOR: 1.3 },
    gemThumb: { color: '#7ECFE0', ior: 1.57, transmission: 0.93, thickness: 0.4, roughness: 0.01, clearcoat: 1.0, clearcoatRoughness: 0.0,  attenuationColor: '#A0E0EE', attenuationDistance: 3.0 },
  },
  {
    month: 'April', name: 'White Topaz', dbName: 'White Topaz', color: '#F2F2FF',
    meaning: 'Eternal love, strength, and invincibility.',
    gem:      { color: '#E8EEFF', ior: 1.62, transmission: 0.88, thickness: 0.4, roughness: 0.01, clearcoat: 1.0, clearcoatRoughness: 0.0,  envMapIntensity: 4.0, attenuationColor: '#F0F2FF', attenuationDistance: 4.0, iridescence: 0,    iridescenceIOR: 1.3 },
    gemThumb: { color: '#E8EEFF', ior: 1.62, transmission: 0.88, thickness: 0.4, roughness: 0.01, clearcoat: 1.0, clearcoatRoughness: 0.0,  attenuationColor: '#F0F2FF', attenuationDistance: 4.0 },
  },
  {
    month: 'May', name: 'Emerald', dbName: 'Emerald', color: '#2ECC71',
    meaning: 'Hope, rebirth, and the endurance of love.',
    gem:      { color: '#22873A', ior: 1.58, transmission: 0.62, thickness: 0.4, roughness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.05, envMapIntensity: 4.5, attenuationColor: '#38A850', attenuationDistance: 0.8, iridescence: 0,    iridescenceIOR: 1.3 },
    gemThumb: { color: '#22873A', ior: 1.58, transmission: 0.62, thickness: 0.4, roughness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.05, attenuationColor: '#38A850', attenuationDistance: 0.8 },
  },
  {
    // Keep the legacy DB identity stable while all customer-facing copy uses the
    // actual material name.
    month: 'June', name: 'Mother of Pearl', dbName: 'Pearl', color: '#F0EDE8',
    meaning: 'Purity and wisdom earned through experience.',
    gem:      { color: '#F5F3EF', ior: 1.53, transmission: 0.00, thickness: 0.5, roughness: 0.06, clearcoat: 0.95, clearcoatRoughness: 0.04, envMapIntensity: 3.5, attenuationColor: '#FFFFFF', attenuationDistance: 4.0, iridescence: 1.00, iridescenceIOR: 1.60 },
    gemThumb: { color: '#F5EFE0', ior: 1.53, transmission: 0.00, thickness: 0.5, roughness: 0.15, clearcoat: 0.7,  clearcoatRoughness: 0.10, attenuationColor: '#FFFFFF', attenuationDistance: 4.0 },
  },
  {
    month: 'July', name: 'Ruby', dbName: 'Ruby', color: '#CC0000',
    meaning: 'Passion, vitality, and the fire of commitment.',
    gem:      { color: '#B80010', ior: 1.77, transmission: 0.68, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0,  envMapIntensity: 5.0, attenuationColor: '#D81828', attenuationDistance: 1.0, iridescence: 0,    iridescenceIOR: 1.3 },
    gemThumb: { color: '#B80010', ior: 1.77, transmission: 0.68, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0,  attenuationColor: '#D81828', attenuationDistance: 1.0 },
  },
  {
    month: 'August', name: 'Peridot', dbName: 'Peridot', color: '#93C572',
    meaning: 'Strength, purpose, and a light that cannot be dimmed.',
    gem:      { color: '#7DC040', ior: 1.67, transmission: 0.85, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0,  envMapIntensity: 4.5, attenuationColor: '#A8D868', attenuationDistance: 2.0, iridescence: 0,    iridescenceIOR: 1.3 },
    gemThumb: { color: '#7DC040', ior: 1.67, transmission: 0.85, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0,  attenuationColor: '#A8D868', attenuationDistance: 2.0 },
  },
  {
    month: 'September', name: 'Sapphire', dbName: 'Sapphire', color: '#154EC1',
    meaning: 'Truth, loyalty, and the wisdom of the ages.',
    gem:      { color: '#1840C0', ior: 1.77, transmission: 0.65, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0,  envMapIntensity: 5.0, attenuationColor: '#2858E0', attenuationDistance: 1.2, iridescence: 0,    iridescenceIOR: 1.3 },
    gemThumb: { color: '#1840C0', ior: 1.77, transmission: 0.65, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0,  attenuationColor: '#2858E0', attenuationDistance: 1.2 },
  },
  {
    month: 'October', name: 'Pink Tourmaline', dbName: 'Pink Tourmaline', color: '#FF6EB4',
    meaning: 'Compassion, healing, and emotional depth.',
    gem:      { color: '#D85080', ior: 1.63, transmission: 0.80, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0,  envMapIntensity: 4.5, attenuationColor: '#F078A8', attenuationDistance: 1.8, iridescence: 0,    iridescenceIOR: 1.3 },
    gemThumb: { color: '#D85080', ior: 1.63, transmission: 0.80, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0,  attenuationColor: '#F078A8', attenuationDistance: 1.8 },
  },
  {
    month: 'November', name: 'Citrine', dbName: 'Citrine', color: '#E4A800',
    meaning: 'Joy, abundance, and the warmth of generosity.',
    gem:      { color: '#D4980A', ior: 1.54, transmission: 0.86, thickness: 0.4, roughness: 0.01, clearcoat: 1.0, clearcoatRoughness: 0.0,  envMapIntensity: 4.5, attenuationColor: '#F0B820', attenuationDistance: 2.0, iridescence: 0,    iridescenceIOR: 1.3 },
    gemThumb: { color: '#D4980A', ior: 1.54, transmission: 0.86, thickness: 0.4, roughness: 0.01, clearcoat: 1.0, clearcoatRoughness: 0.0,  attenuationColor: '#F0B820', attenuationDistance: 2.0 },
  },
  {
    month: 'December', name: 'Turquoise', dbName: 'Turquoise', color: '#3BC4C4',
    meaning: 'Protection, friendship, and good fortune.',
    gem:      { color: '#30AEAE', ior: 1.61, transmission: 0.00, thickness: 0.5, roughness: 0.35, clearcoat: 0.2, clearcoatRoughness: 0.30, envMapIntensity: 2.5, attenuationColor: '#FFFFFF', attenuationDistance: 4.0, iridescence: 0,    iridescenceIOR: 1.3 },
    gemThumb: { color: '#30AEAE', ior: 1.61, transmission: 0.00, thickness: 0.5, roughness: 0.35, clearcoat: 0.2, clearcoatRoughness: 0.30, attenuationColor: '#FFFFFF', attenuationDistance: 4.0 },
  },
]

/* ── Derived stone arrays (index-aligned with STONES) ──── */
/** Long display names — used by the configurator. */
export const STONE_NAMES       = STONES.map(s => s.name)
/** Internal database names. Never use these as customer-facing labels. */
export const STONE_NAMES_SHORT = STONES.map(s => s.dbName)
export const STONE_COLORS      = STONES.map(s => s.color)
export const STONE_MEANINGS    = STONES.map(s => s.meaning)
export const MONTH_NAMES       = STONES.map(s => s.month)
export const GEM_PROPS         = STONES.map(s => s.gem)
export const GEM_PROPS_THUMB   = STONES.map(s => s.gemThumb)

/* ── Metals ────────────────────────────────────────────── */
export const METAL_PRICES: Record<Metal, number> = {
  silver: 399, '10k': 799, '18k': 1299,
}

export const METAL_PRICES_CENTS: Record<Metal, number> = {
  silver: 39900, '10k': 79900, '18k': 129900,
}

/** Short labels — configurator option buttons. */
export const METAL_LABELS_SHORT: Record<Metal, string> = {
  silver: 'Silver', '10k': '10K Gold', '18k': '18K Gold',
}

/** Long labels — cart, checkout, and Stripe receipt. */
export const METAL_LABELS_LONG: Record<Metal, string> = {
  silver: 'Sterling Silver', '10k': '10K Gold', '18k': '18K Gold',
}

/** Short colour labels — configurator. */
export const METAL_COLOR_LABELS_SHORT: Record<MetalColor, string> = {
  white: 'White', gold: 'Gold', rose: 'Rose',
}

/** Long colour labels — cart, checkout, and Stripe receipt ("Gold" → "Yellow"). */
export const METAL_COLOR_LABELS_LONG: Record<MetalColor, string> = {
  white: 'White', gold: 'Yellow', rose: 'Rose',
}

/**
 * One human phrase for a metal + colour pair.
 *
 * Joining the two labels naively produces a stutter in the configurator's spec
 * line ("18K Gold · Gold"), so gold reads as a karat sandwich ("18K Yellow
 * Gold") and silver keeps its finish as a qualifier.
 */
export function metalPhrase(metal: Metal, color: MetalColor): string {
  if (metal === 'silver') {
    return color === 'white'
      ? METAL_LABELS_LONG.silver
      : `${METAL_COLOR_LABELS_LONG[color]}-Finished ${METAL_LABELS_LONG.silver}`
  }
  const karat = metal === '10k' ? '10K' : '18K'
  return `${karat} ${METAL_COLOR_LABELS_LONG[color]} Gold`
}

/** UI swatch colours for the metal-colour picker. Not used for rendering. */
export const METAL_COLOR_HEX: Record<MetalColor, string> = {
  white: '#D0CFCD', gold: '#D4AF37', rose: '#C4786A',
}

/**
 * 3D body colours. For a metal (metalness 1) the colour IS its reflectance, so
 * these are the sRGB specular colours of the real alloys, not swatch tints: the
 * studio HDRI supplies the darkening, and a darker base just reads as paint.
 */
export const METAL_RENDER_HEX: Record<MetalColor, string> = {
  white: '#F2F1EE', gold: '#FFDB91', rose: '#F2C1A8',
}

/** Polished-finish roughness. 18k takes the highest polish; silver the softest. */
export const ROUGHNESS: Record<Metal, number> = {
  silver: 0.20, '10k': 0.16, '18k': 0.12,
}


/* ── Shapes ────────────────────────────────────────────── */
export const SHAPE_LABELS: Record<Shape, string> = {
  square: 'Square', circle: 'Circle', heart: 'Heart', pear: 'Pear',
}

/* ── Product-type display labels ───────────────────────── */
// Pure data mirror of the product-type labels, safe to import from `api/`
// (the full product-types module pulls in assets.ts / import.meta.env).
export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  pendant: 'Pendant', bracelet: 'Bracelet',
}

/* ── Collection list page — decorative chip strip ──────── */
// Derived from the sellable catalog so discovery and purchase can never drift.
export const BIRTHSTONE_CHIPS = STONES.map(stone => ({
  month: stone.month.slice(0, 3),
  stone: stone.name,
  color: stone.color,
}))
