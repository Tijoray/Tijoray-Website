/**
 * Local dev API server — runs the /api/ handlers on port 3001.
 * Vite proxies /api/* to this server.
 * Usage: npx tsx api-server.ts
 */
import http from 'http'
import { URL } from 'url'

// Load env from .env.local
import { readFileSync } from 'fs'
try {
  const env = readFileSync('.env.local', 'utf8')
  for (const line of env.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^"|"$/g, '')
    if (key && !(key in process.env)) process.env[key] = val
  }
} catch { /* .env.local not found */ }

// Also expose VITE_ vars as regular vars for the API handlers
for (const [k, v] of Object.entries(process.env)) {
  if (k.startsWith('VITE_') && v) process.env[k.slice(5)] = v
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:3001`)
  const path = url.pathname

  // Collect body
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk)
  const rawBody = Buffer.concat(chunks)

  // Route to handler
  let handlerModule: { default: Function } | null = null
  if (path === '/api/create-checkout')  handlerModule = await import('./api/create-checkout.js')
  if (path === '/api/stripe-webhook')   handlerModule = await import('./api/stripe-webhook.js')
  if (path === '/api/s3-presign')       handlerModule = await import('./api/s3-presign.js')

  if (!handlerModule) {
    res.writeHead(404)
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  // Build a Vercel-compatible req/res shim
  // Stripe webhook handler needs the raw Buffer body for signature verification.
  // All other handlers get parsed JSON.
  let parsedBody: unknown = rawBody
  const ct = req.headers['content-type'] ?? ''
  const isWebhook = path === '/api/stripe-webhook'
  if (!isWebhook && ct.includes('application/json')) {
    try { parsedBody = JSON.parse(rawBody.toString()) } catch { parsedBody = {} }
  }

  const shimReq = Object.assign(req, {
    body:   parsedBody, // raw Buffer for webhook, parsed object for others
    query:  Object.fromEntries(url.searchParams),
  })

  const headers: Record<string, string> = {}
  const shimRes = {
    statusCode: 200,
    status(code: number) { this.statusCode = code; return this },
    setHeader(k: string, v: string) { headers[k] = v; return this },
    json(data: unknown) {
      res.writeHead(this.statusCode, { 'Content-Type': 'application/json', ...headers })
      res.end(JSON.stringify(data))
    },
    end(data?: string) {
      res.writeHead(this.statusCode, headers)
      res.end(data)
    },
  }

  try {
    await handlerModule.default(shimReq, shimRes as never)
  } catch (err) {
    console.error('Handler error:', err)
    res.writeHead(500)
    res.end(JSON.stringify({ error: 'Internal server error' }))
  }
})

server.listen(3001, () => {
  console.log('API server running on http://localhost:3001')
})
