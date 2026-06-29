/**
 * Product types = the FORM axis of the catalog (pendant, bracelet, ring …).
 *
 * A product type owns its physical 3D form: the GLB body parts, the form options
 * the customer picks (pendant shape, bracelet size), and the id of the
 * AssemblyStrategy that knows how to build/frame it. It is collection-agnostic —
 * the same pendant form hosts the Birthstone, Diamond, or Initial collections.
 *
 * This is a pure data/UI module (no three.js) so it stays cheap to import. The
 * `assembly` field is a string id resolved to a real AssemblyStrategy in the 3D
 * layer; that keeps three.js out of the data graph.
 */
import { ASSETS } from '../lib/assets'
import type { Shape } from './catalog'
import { SHAPE_LABELS } from './catalog'

export type ProductTypeId = 'pendant' | 'bracelet'

/* ── Shared pendant 3D model paths ─────────────────────── */
export const CHAIN_PATH = ASSETS.chain

export const PENDANT_PATHS: Record<Shape, string> = {
  square: ASSETS.pendantSquare,
  circle: ASSETS.pendantCircle,
  heart:  ASSETS.pendantHeart,
  pear:   ASSETS.pendantPear,
}

/** A single form option (e.g. a pendant silhouette). */
export interface FormOption {
  value: Shape
  label: string
}

export interface ProductType {
  id:    ProductTypeId
  /** Display label, e.g. "Pendant". */
  label: string
  /** Lowercase noun for prose, e.g. "pendant". */
  noun:  string
  /** AssemblyStrategy id resolved in the 3D layer. */
  assembly: string
  /** Form options the customer chooses (empty if the form has none). */
  formOptions: FormOption[]
  /** Shape → GLB body model. */
  models: Partial<Record<Shape, string>>
  /** Optional shared sub-assembly model (e.g. the pendant chain). */
  chain?: string
  /** Whether this form is live or still in development. */
  available: boolean
}

const PENDANT_SHAPES: Shape[] = ['square', 'circle', 'heart', 'pear']

export const PENDANT: ProductType = {
  id:       'pendant',
  label:    'Pendant',
  noun:     'pendant',
  assembly: 'pendant-on-chain',
  formOptions: PENDANT_SHAPES.map(s => ({ value: s, label: SHAPE_LABELS[s] })),
  models:   PENDANT_PATHS,
  chain:    CHAIN_PATH,
  available: true,
}

// Form scaffold for the next product type. The 3D assembly + GLB are added in the
// product-type build-out; modelled here so the matrix and UI can reference it.
export const BRACELET: ProductType = {
  id:       'bracelet',
  label:    'Bracelet',
  noun:     'bracelet',
  assembly: 'bracelet-band',
  formOptions: [],
  models:   {},
  available: false,
}

export const PRODUCT_TYPES: Record<ProductTypeId, ProductType> = {
  pendant:  PENDANT,
  bracelet: BRACELET,
}
