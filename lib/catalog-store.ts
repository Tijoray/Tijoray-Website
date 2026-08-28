/**
 * Server-side access to the DB-backed catalog document (Catalog_Config, one
 * 'live' row). Read falls back to code defaults when the row is absent, so the
 * site and checkout work before the first admin save. Server-only (service-role).
 */
import { admin } from './admin.js'
import { buildDefaultCatalog, type CatalogDoc } from '../src/data/catalog-doc.js'
import type { Metal } from '../src/data/catalog.js'

const ASSET_BASE = (process.env.VITE_ASSETS_BASE_URL ?? '').replace(/\/$/, '')

export type CatalogLoad = {
  doc:        CatalogDoc
  version:    number
  updatedAt:  string | null
  updatedBy:  string | null
  /** True when no DB row exists yet (doc is the code default). */
  isDefault:  boolean
}

/** Load the live catalog document, or the code default if none is stored. */
export async function getCatalog(): Promise<CatalogLoad> {
  const { data, error } = await admin
    .from('Catalog_Config').select('data, version, updated_at, updated_by').eq('id', 'live').maybeSingle()

  if (error) {
    console.error('[catalog] load failed, using default:', error.message)
    return { doc: buildDefaultCatalog(ASSET_BASE), version: 0, updatedAt: null, updatedBy: null, isDefault: true }
  }
  if (!data) {
    return { doc: buildDefaultCatalog(ASSET_BASE), version: 0, updatedAt: null, updatedBy: null, isDefault: true }
  }
  return {
    doc: data.data as CatalogDoc,
    version: data.version ?? 1,
    updatedAt: data.updated_at ?? null,
    updatedBy: data.updated_by ?? null,
    isDefault: false,
  }
}

/** Structural validation — throws a human-readable error on the first problem. */
export function validateCatalog(doc: unknown): asserts doc is CatalogDoc {
  const d = doc as CatalogDoc
  if (!d || typeof d !== 'object') throw new Error('Catalog must be an object')
  for (const key of ['products', 'productTypes', 'collections', 'metals', 'stones'] as const) {
    if (!Array.isArray(d[key])) throw new Error(`Catalog.${key} must be an array`)
  }
  const METALS: Metal[] = ['silver', '10k', '18k']
  for (const p of d.products) {
    if (!p.id) throw new Error('Every product needs an id')
    if (!p.collectionId || !p.productTypeId) throw new Error(`Product "${p.id}" needs collectionId + productTypeId`)
    if (!p.prices || typeof p.prices !== 'object') throw new Error(`Product "${p.id}" is missing a prices map`)
    for (const m of METALS) {
      const v = p.prices[m]
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
        throw new Error(`Product "${p.id}" has an invalid ${m} price (must be a non-negative number of cents)`)
      }
    }
  }
}

export type SaveResult = { version: number; updatedAt: string }

/**
 * Persist the catalog document. `expectedVersion` guards against clobbering a
 * concurrent edit: pass the version you loaded; if the stored row moved on, the
 * save is rejected. Pass 0/undefined to seed the first row.
 */
export async function saveCatalog(doc: CatalogDoc, actorEmail: string, expectedVersion?: number): Promise<SaveResult> {
  validateCatalog(doc)

  const { data: current } = await admin
    .from('Catalog_Config').select('version').eq('id', 'live').maybeSingle()
  const currentVersion = current?.version ?? 0

  if (expectedVersion != null && expectedVersion !== currentVersion) {
    throw new Error(`Catalog changed since you loaded it (yours: v${expectedVersion}, current: v${currentVersion}). Reload and reapply.`)
  }

  const nextVersion = currentVersion + 1
  const updatedAt = new Date().toISOString()
  const payload = { ...doc, version: nextVersion }

  const { error } = await admin.from('Catalog_Config').upsert({
    id: 'live', data: payload, version: nextVersion, updated_at: updatedAt, updated_by: actorEmail,
  })
  if (error) throw error

  return { version: nextVersion, updatedAt }
}
