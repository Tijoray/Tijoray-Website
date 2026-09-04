import type { Shape, Metal, MetalColor } from '../data/catalog'

/**
 * Shared configurator state: sensible opening defaults, shareable URLs, and the
 * one-line descriptions shown under each step.
 *
 * The descriptions were previously hover-only tooltips, which meant they were
 * invisible on touch (most of our traffic) and undiscovered on desktop. They
 * now render as a caption for whatever the shopper has selected.
 */

export const SHAPES: Shape[]      = ['square', 'circle', 'heart', 'pear']
export const METALS: Metal[]      = ['silver', '10k', '18k']
export const METAL_COLORS: MetalColor[] = ['white', 'gold', 'rose']

export interface DesignConfig {
  shape:      Shape
  metal:      Metal
  metalColor: MetalColor
  birthstone: number
}

/**
 * Opening metal. Set to the entry metal so the price a shopper first sees
 * matches the "From $399" promise on the card that brought them here — landing
 * on 18K showed $1,299 and read as a bait-and-switch. Change this one constant
 * to open on an aspirational configuration instead.
 */
const DEFAULT_METAL: Metal = 'silver'

/** The current month's stone is a better opening guess than a fixed January. */
export function defaultDesign(): DesignConfig {
  return {
    shape:      'square',
    metal:      DEFAULT_METAL,
    metalColor: DEFAULT_METAL === 'silver' ? 'white' : 'gold',
    birthstone: new Date().getMonth(),
  }
}

/* ── Shareable design links ──────────────────────────────
 * Gifting runs on hints, so a configuration has to survive being sent to
 * someone. These params round-trip the whole design through the URL. */

export function readDesign(params: URLSearchParams): DesignConfig {
  const base = defaultDesign()
  const shape = params.get('shape') as Shape | null
  const metal = params.get('metal') as Metal | null
  const color = params.get('color') as MetalColor | null
  // Number(null) and Number('') are both 0, which would silently pin a bare
  // URL to January instead of falling through to the current month.
  const rawStone = params.get('stone')
  const stone = rawStone === null || rawStone.trim() === '' ? NaN : Number(rawStone)

  return {
    shape:      shape && SHAPES.includes(shape) ? shape : base.shape,
    metal:      metal && METALS.includes(metal) ? metal : base.metal,
    metalColor: color && METAL_COLORS.includes(color) ? color : base.metalColor,
    birthstone: Number.isInteger(stone) && stone >= 0 && stone <= 11 ? stone : base.birthstone,
  }
}

export function writeDesign(c: DesignConfig): URLSearchParams {
  return new URLSearchParams({
    shape: c.shape, metal: c.metal, color: c.metalColor, stone: String(c.birthstone),
  })
}

/* ── Step captions ───────────────────────────────────── */

export const SHAPE_NOTES: Record<Shape, string> = {
  square: 'Clean architectural lines.',
  circle: 'A symbol of continuity, with no beginning and no end.',
  heart:  'Wears its meaning openly.',
  pear:   'Tapers to a single point of light.',
}

export const BRACELET_SHAPE_NOTES: Record<Shape, string> = {
  square: 'Step-cut facets and clean architectural lines.',
  circle: 'A symbol of continuity, with no beginning and no end.',
  heart:  'Wears its meaning openly.',
  pear:   'Tapers to a single point of light.',
}

export const METAL_NOTES: Record<Metal, string> = {
  silver: 'Sterling silver. Classic, refined, and the easiest way in.',
  '10k':  '41.7% pure gold. The harder, more scratch-resistant of the two golds.',
  '18k':  '75% pure gold. Softer and warmer in colour, and the mark of a true heirloom.',
}

export const METAL_COLOR_NOTES: Record<MetalColor, string> = {
  white: 'A cool, platinum-like tone.',
  gold:  'Classic warmth.',
  rose:  "Copper's blush with gold's richness.",
}
