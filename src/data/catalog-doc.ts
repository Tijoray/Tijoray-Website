/**
 * The catalog DOCUMENT — the runtime, DB-backed shape of the product catalog.
 *
 * This is the single serialisable form of everything the admin "Catalog" screen
 * edits and that `/api/catalog` serves: products (with per-product × metal
 * pricing), product types, collections, metals, metal colours, and stones/gem
 * materials. It is stored as one jsonb row in `Catalog_Config` (see migration
 * 0005) and falls back to `buildDefaultCatalog()` when that row is absent.
 *
 * PURITY CONTRACT: like `catalog.ts`, this module must import ONLY pure data
 * modules (no `import.meta.env`, no assets.ts, no three.js), because it is
 * imported by both the frontend and the Vercel serverless functions. Model/image
 * URLs are built from an `assetBase` argument passed by the caller (the frontend
 * passes VITE_ASSETS_BASE_URL; the server passes process.env.VITE_ASSETS_BASE_URL).
 */
import type { Shape, Metal, MetalColor, GemProps, GemThumbProps } from './catalog.js'
import {
  STONES, METAL_PRICES_CENTS, METAL_LABELS_SHORT, METAL_LABELS_LONG,
  METAL_COLOR_LABELS_SHORT, METAL_COLOR_LABELS_LONG, METAL_COLOR_HEX,
  ROUGHNESS, SHAPE_LABELS,
} from './catalog.js'
import { COLLECTIONS } from './collections.js'

/* ── Document shape ──────────────────────────────────────────── */

export type CatalogProduct = {
  id:            string
  route:         string
  collectionId:  string
  productTypeId: string
  name:          string
  cardImage:     string
  cardDetail:    string
  /** "From" price in whole dollars (display only). */
  priceFrom:     number
  /** Per-metal charged price in CENTS — the money path (checkout reads this). */
  prices:        Record<Metal, number>
  /** Per-shape GLB overrides (resolved URLs). Empty => use the product type's models. */
  models:        Partial<Record<Shape, string>>
  available:     boolean
}

export type CatalogProductType = {
  id:          string
  label:       string
  noun:        string
  /** AssemblyStrategy id resolved in the 3D layer (must exist in code). */
  assembly:    string
  available:   boolean
  formOptions: { value: Shape; label: string }[]
  models:      Partial<Record<Shape, string>>
  chain?:      string
}

export type CatalogCollection = {
  id:               string
  number:           string
  name:             string
  tagline:          string
  description:      string
  designKind:       string
  /** DesignApplicator id resolved in the 3D layer (must exist in code). */
  designApplicator: string
  designLabel:      string
  designOptions:    { value: string | number; label: string; swatch?: string; caption?: string }[]
  /** Decorative month/stone chip strip on the collection-list header. */
  chips?:           { month: string; stone: string; color: string }[]
  available:        boolean
}

export type CatalogMetal      = { id: Metal;      label: string; labelLong: string; roughness: number }
export type CatalogMetalColor = { id: MetalColor; label: string; labelLong: string; hex: string }

export type CatalogStone = {
  month:   string
  name:    string
  dbName:  string
  color:   string
  meaning: string
  gem:      GemProps
  gemThumb: GemThumbProps
}

export type CatalogDoc = {
  version:      number
  products:     CatalogProduct[]
  productTypes: CatalogProductType[]
  collections:  CatalogCollection[]
  metals:       CatalogMetal[]
  metalColors:  CatalogMetalColor[]
  stones:       CatalogStone[]
}

/* ── Default document (seed + fallback), built from the code constants ──────── */

const METALS: Metal[]        = ['silver', '10k', '18k']
const METAL_COLORS: MetalColor[] = ['white', 'gold', 'rose']
const PENDANT_SHAPES:  Shape[] = ['square', 'circle', 'heart', 'pear']
const BRACELET_SHAPES: Shape[] = ['square', 'circle', 'heart', 'pear']

// Bare asset paths (mirror src/lib/assets.ts) — assetBase is applied below.
const M = {
  chain:          '/assets/3d/chain.glb',
  pendantSquare:  '/assets/3d/pendant-asscher.glb',
  pendantCircle:  '/assets/3d/pendant-circle.glb',
  pendantHeart:   '/assets/3d/pendant-heart.glb',
  pendantPear:    '/assets/3d/pendant-pear.glb',
  braceletChain:  '/assets/3d/bracelet-chain.glb',
  braceletSquare: '/assets/3d/bracelet-asscher.glb',
  braceletCircle: '/assets/3d/bracelet-circle.glb',
  braceletHeart:  '/assets/3d/bracelet-heart.glb',
  braceletPear:   '/assets/3d/bracelet-pear.glb',
  cardPendant:    '/assets/v2/jewelry/birthstone-pendant.webp',
  cardBracelet:   '/assets/v2/jewelry/birthstone-bracelet.webp',
}

const BRACELET_SHAPE_LABELS: Record<Shape, string> = {
  square: 'Asscher', circle: 'Circle', heart: 'Heart', pear: 'Pear',
}

/** Build the default catalog document from the code constants, resolving asset URLs. */
export function buildDefaultCatalog(assetBase = ''): CatalogDoc {
  const a = (p: string) => `${assetBase.replace(/\/$/, '')}${p}`
  const allMetalPrices = (): Record<Metal, number> => ({ ...METAL_PRICES_CENTS })

  const pendantModels:  Partial<Record<Shape, string>> = {
    square: a(M.pendantSquare), circle: a(M.pendantCircle), heart: a(M.pendantHeart), pear: a(M.pendantPear),
  }
  const braceletModels: Partial<Record<Shape, string>> = {
    square: a(M.braceletSquare), circle: a(M.braceletCircle), heart: a(M.braceletHeart), pear: a(M.braceletPear),
  }

  return {
    version: 1,

    products: [
      {
        id: 'birthstone-pendant', route: '/products/birthstone-pendant',
        collectionId: 'birthstone', productTypeId: 'pendant',
        name: 'Birthstone Pendant', priceFrom: 399,
        prices: allMetalPrices(),
        cardImage: a(M.cardPendant),
        cardDetail:
          'Available in square, circle, heart, and pear silhouettes. Set in ' +
          'silver, 10K, or 18K gold — with your chosen birthstone at the center.',
        models: {}, available: true,
      },
      {
        id: 'birthstone-bracelet', route: '/products/birthstone-bracelet',
        collectionId: 'birthstone', productTypeId: 'bracelet',
        name: 'Birthstone Bracelet', priceFrom: 399,
        prices: allMetalPrices(),
        cardImage: a(M.cardBracelet),
        cardDetail:
          'The same craft, the same vault — worn around the wrist. Available in ' +
          'asscher, circle, heart, and pear stations, set in silver, 10K, or 18K gold.',
        models: {}, available: true,
      },
    ],

    productTypes: [
      {
        id: 'pendant', label: 'Pendant', noun: 'pendant', assembly: 'pendant-on-chain',
        available: true,
        formOptions: PENDANT_SHAPES.map(s => ({ value: s, label: SHAPE_LABELS[s] })),
        models: pendantModels, chain: a(M.chain),
      },
      {
        id: 'bracelet', label: 'Bracelet', noun: 'bracelet', assembly: 'bracelet-band',
        available: true,
        formOptions: BRACELET_SHAPES.map(s => ({ value: s, label: BRACELET_SHAPE_LABELS[s] })),
        models: braceletModels, chain: a(M.braceletChain),
      },
    ],

    collections: Object.values(COLLECTIONS).map(c => ({
      id: c.id, number: c.number, name: c.name, tagline: c.tagline, description: c.description,
      designKind: c.designKind, designApplicator: c.designApplicator, designLabel: c.designLabel,
      designOptions: c.designOptions, chips: c.chips, available: c.available,
    })),

    metals: METALS.map(id => ({
      id, label: METAL_LABELS_SHORT[id], labelLong: METAL_LABELS_LONG[id], roughness: ROUGHNESS[id],
    })),

    metalColors: METAL_COLORS.map(id => ({
      id, label: METAL_COLOR_LABELS_SHORT[id], labelLong: METAL_COLOR_LABELS_LONG[id], hex: METAL_COLOR_HEX[id],
    })),

    stones: STONES.map(s => ({
      month: s.month, name: s.name, dbName: s.dbName, color: s.color, meaning: s.meaning,
      gem: s.gem, gemThumb: s.gemThumb,
    })),
  }
}

/* ── Lightweight lookups (used by checkout + the site) ───────────────────────── */

/** Find a product by its collection × product-type pairing (how a cart item identifies it). */
export function findProduct(doc: CatalogDoc, collectionId: string, productTypeId: string): CatalogProduct | undefined {
  return doc.products.find(p => p.collectionId === collectionId && p.productTypeId === productTypeId)
}

/** Charged price (cents) for a product × metal, falling back to the code default. */
export function priceCents(doc: CatalogDoc, collectionId: string, productTypeId: string, metal: Metal): number {
  const p = findProduct(doc, collectionId, productTypeId)
  return p?.prices?.[metal] ?? METAL_PRICES_CENTS[metal] ?? 129900
}
