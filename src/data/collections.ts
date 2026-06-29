/**
 * Collections = the DESIGN/THEME axis of the catalog (Birthstone, Diamond,
 * Initial Letter …). Orthogonal to product type: one collection spans many forms,
 * one form hosts many collections.
 *
 * A collection owns the *design choice* the customer makes and how it is realised
 * in 3D — and that is NOT always a gemstone:
 *
 *   • Birthstone / Diamond → designKind 'gemstone', applicator 'gem-material'
 *     (the chosen variant tints/sets a gem in the design slot).
 *   • Initial Letter       → designKind 'glyph',    applicator 'letter-glyph'
 *     (the chosen letter loads a glyph mesh into the design slot).
 *
 * `designApplicator` is a string id resolved to a real DesignApplicator in the
 * 3D layer, keeping three.js out of the data graph.
 */
import { STONES } from './catalog'

export type CollectionId   = 'birthstone' | 'diamond' | 'initial-letter'
export type DesignKind     = 'gemstone' | 'glyph'
export type DesignApplicatorId = 'gem-material' | 'letter-glyph'

/** One selectable design variant (a stone, a letter, …). */
export interface DesignOption {
  /** Stable value persisted in the cart (stone index, letter, …). */
  value:  string | number
  label:  string
  /** UI swatch colour for gemstone collections. */
  swatch?: string
  /** Secondary caption (e.g. month name) where relevant. */
  caption?: string
}

export interface Collection {
  id:     CollectionId
  /** Display number, e.g. "01". */
  number: string
  name:   string
  tagline: string
  designKind: DesignKind
  designApplicator: DesignApplicatorId
  /** Step label in the configurator, e.g. "Birthstone" / "Initial". */
  designLabel: string
  designOptions: DesignOption[]
  available: boolean
}

/* ── Birthstone — gemstone applicator, variants from the stone catalog ── */
export const BIRTHSTONE: Collection = {
  id:     'birthstone',
  number: '01',
  name:   'The Birthstone Collection',
  tagline: 'Twelve stones. Twelve months.',
  designKind: 'gemstone',
  designApplicator: 'gem-material',
  designLabel: 'Birthstone',
  designOptions: STONES.map((s, i) => ({
    value:   i,
    label:   s.name,
    swatch:  s.color,
    caption: s.month,
  })),
  available: true,
}

/* ── Diamond — gemstone applicator, single fixed clear stone for now ── */
export const DIAMOND: Collection = {
  id:     'diamond',
  number: '02',
  name:   'The Diamond Collection',
  tagline: 'One stone. Endless clarity.',
  designKind: 'gemstone',
  designApplicator: 'gem-material',
  designLabel: 'Diamond',
  designOptions: [],   // populated when the collection's stone spec is finalised
  available: false,
}

/* ── Initial Letter — glyph applicator, variants A–Z (a letter mesh, not a gem) ── */
const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))

export const INITIAL_LETTER: Collection = {
  id:     'initial-letter',
  number: '03',
  name:   'The Initial Collection',
  tagline: 'A single letter, carried close.',
  designKind: 'glyph',
  designApplicator: 'letter-glyph',
  designLabel: 'Initial',
  designOptions: LETTERS.map(l => ({ value: l, label: l })),
  available: false,
}

export const COLLECTIONS: Record<CollectionId, Collection> = {
  'birthstone':     BIRTHSTONE,
  'diamond':        DIAMOND,
  'initial-letter': INITIAL_LETTER,
}
