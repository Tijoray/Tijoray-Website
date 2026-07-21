import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Metal } from '../data/catalog'
import {
  buildDefaultCatalog, priceCents,
  type CatalogDoc, type CatalogProduct, type CatalogCollection,
} from '../data/catalog-doc'

/**
 * Runtime catalog for the public site. Seeded SYNCHRONOUSLY from the code
 * defaults (so first paint has real data and the site still works if the API is
 * down), then hydrated from /api/catalog on mount. Components read prices, copy,
 * availability, and collections from here so admin edits reflect on the store.
 */
type CatalogCtx = {
  doc: CatalogDoc
  /** True until the live document has been fetched (defaults are shown meanwhile). */
  loading: boolean
  getProduct: (collectionId: string, productType: string) => CatalogProduct | undefined
  /** Charged price in whole dollars for a product × metal (falls back to code default). */
  priceDollars: (collectionId: string, productType: string, metal: Metal) => number
  /** Collections that have at least one product, in product order. */
  collectionsWithProducts: () => CatalogCollection[]
  productsByCollection: (collectionId: string) => CatalogProduct[]
}

const ASSET_BASE = (import.meta.env.VITE_ASSETS_BASE_URL as string | undefined) ?? ''
const DEFAULT_DOC = buildDefaultCatalog(ASSET_BASE)

const CatalogContext = createContext<CatalogCtx | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [doc, setDoc] = useState<CatalogDoc>(DEFAULT_DOC)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetch('/api/catalog')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`catalog ${r.status}`))))
      .then((data: { doc?: CatalogDoc }) => { if (alive && data?.doc) setDoc(data.doc) })
      .catch(err => console.warn('[catalog] using code defaults —', err.message))
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const value: CatalogCtx = {
    doc,
    loading,
    getProduct: (collectionId, productType) =>
      doc.products.find(p => p.collectionId === collectionId && p.productTypeId === productType),
    priceDollars: (collectionId, productType, metal) =>
      priceCents(doc, collectionId, productType, metal) / 100,
    collectionsWithProducts: () => {
      const order: string[] = []
      const seen = new Set<string>()
      for (const p of doc.products) {
        if (!seen.has(p.collectionId)) { seen.add(p.collectionId); order.push(p.collectionId) }
      }
      return order
        .map(id => doc.collections.find(c => c.id === id))
        .filter((c): c is CatalogCollection => !!c)
    },
    productsByCollection: (collectionId) => doc.products.filter(p => p.collectionId === collectionId),
  }

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog(): CatalogCtx {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within a CatalogProvider')
  return ctx
}
