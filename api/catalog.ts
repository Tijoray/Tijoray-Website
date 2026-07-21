import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getCatalog } from '../lib/catalog-store.js'

/**
 * Public, read-only catalog endpoint. Serves the live catalog document (or the
 * code default when nothing is stored yet) so the site can render prices, copy,
 * availability, models, and gem materials from the DB. No auth — this is public
 * product data. Cached at the edge for a minute; admin saves take effect on the
 * next revalidation.
 */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const { doc, version, updatedAt, isDefault } = await getCatalog()
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return res.status(200).json({ doc, version, updatedAt, isDefault })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load catalog'
    console.error('[api/catalog]', message)
    return res.status(500).json({ error: message })
  }
}

export const config = { runtime: 'nodejs' }
