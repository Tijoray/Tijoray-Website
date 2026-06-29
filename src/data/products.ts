/**
 * Products = the cells of the Collection × Product-Type matrix.
 *
 * Each product is one buyable configurator: a collection (theme/design) realised
 * in a product type (form), at a route, with a starting price and its GLB models.
 * Adding a product = adding an entry here (plus its models, and — only for a brand
 * new product type or collection — one AssemblyStrategy or DesignApplicator).
 *
 * The configurator composes a product's options from BOTH axes:
 *   form options  (product type)  +  design options (collection)  +  metal (shared)
 */
import { asset } from '../lib/assets'
import type { CollectionId } from './collections'
import { COLLECTIONS } from './collections'
import type { ProductTypeId } from './product-types'
import { PRODUCT_TYPES } from './product-types'
import type { Shape } from './catalog'

export interface Product {
  /** Stable id / url slug, e.g. "birthstone-pendant". */
  id:            string
  route:         string
  collectionId:  CollectionId
  productTypeId: ProductTypeId
  /** Card/heading name, e.g. "Birthstone Pendant". */
  name:          string
  /** "From" price shown on cards. */
  priceFrom:     number
  /** Card image (collection-list page). */
  cardImage:     string
  /** Per-cell GLB overrides (defaults to the product type's models). */
  models?:       Partial<Record<Shape, string>>
  /** Live vs "coming soon". */
  available:     boolean
}

export const PRODUCTS: Product[] = [
  {
    id:            'birthstone-pendant',
    route:         '/products/birthstone-pendant',
    collectionId:  'birthstone',
    productTypeId: 'pendant',
    name:          'Birthstone Pendant',
    priceFrom:     1299,
    cardImage:     asset('/assets/jewelry/birthstone-pendant.png'),
    available:     true,
  },
  {
    id:            'birthstone-bracelet',
    route:         '/products/birthstone-bracelet',
    collectionId:  'birthstone',
    productTypeId: 'bracelet',
    name:          'Birthstone Bracelet',
    priceFrom:     0,
    cardImage:     asset('/assets/jewelry/birthstone-bracelet.png'),
    available:     false,
  },
]

export function productByRoute(route: string): Product | undefined {
  return PRODUCTS.find(p => p.route === route)
}

export function productById(id: string): Product | undefined {
  return PRODUCTS.find(p => p.id === id)
}

/** Resolve a product's models, falling back to its product type's defaults. */
export function modelsFor(product: Product): Partial<Record<Shape, string>> {
  return product.models ?? PRODUCT_TYPES[product.productTypeId].models
}

/** Convenience: the collection + product-type a product is composed from. */
export function compositionOf(product: Product) {
  return {
    collection:  COLLECTIONS[product.collectionId],
    productType: PRODUCT_TYPES[product.productTypeId],
  }
}
