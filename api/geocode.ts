import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Server-side address lookup.
 *
 * The browser used to call nominatim.openstreetmap.org directly, which handed
 * a customer's IP address — and the address they were typing, keystroke by
 * keystroke, on the sign-up form — to a third party we had not disclosed.
 * Routing it here means OpenStreetMap sees this server and nothing about the
 * person at the keyboard.
 *
 * It also lets us meet Nominatim's usage policy, which requires a User-Agent
 * that identifies the application and a contact address. That policy also asks
 * that autocomplete-style querying be avoided, so this is a stopgap: a paid
 * geocoder is the right answer once there is volume to justify it.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const UA = 'Tijoray/1.0 (+https://tijoray.com; support@tijoray.com)'

/** Answers repeated prefixes from memory — a debounced field asks the same
 *  question many times, and Nominatim asks callers not to hammer it. */
const cache = new Map<string, { at: number; body: unknown }>()
const TTL_MS = 10 * 60 * 1000
const MAX_ENTRIES = 500

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  const details = req.query.details === '1' ? '1' : '0'
  if (q.length < 3)  return res.status(200).json([])
  if (q.length > 200) return res.status(400).json({ error: 'Query too long' })

  const key = `${details}:${q.toLowerCase()}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) {
    res.setHeader('Cache-Control', 'private, max-age=600')
    return res.status(200).json(hit.body)
  }

  const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=${details}`

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en', Referer: 'https://tijoray.com' },
    })
    if (!upstream.ok) return res.status(200).json([])

    const body = await upstream.json()

    if (cache.size >= MAX_ENTRIES) cache.clear()
    cache.set(key, { at: Date.now(), body })

    res.setHeader('Cache-Control', 'private, max-age=600')
    return res.status(200).json(body)
  } catch {
    // A geocoder outage must not block sign-up — the address fields are
    // editable by hand, so an empty suggestion list is the right failure.
    return res.status(200).json([])
  }
}
