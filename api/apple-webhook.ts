import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { createVerify, createPublicKey } from 'crypto'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface AppleJWK {
  kty: string
  kid: string
  alg: string
  n: string
  e: string
}

interface AppleTokenPayload {
  iss: string
  aud: string
  exp: number
  iat: number
  jti: string
  events: string
}

interface AppleEvent {
  type: 'email-disabled' | 'email-enabled' | 'consent-revoked' | 'account-delete'
  sub: string
  email?: string
  is_private_email?: string
  event_time: number
}

async function verifyAppleJWT(token: string): Promise<AppleTokenPayload> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid JWT format')

  const [headerB64, payloadB64, signatureB64] = parts
  const header = JSON.parse(
    Buffer.from(headerB64, 'base64url').toString(),
  ) as { kid: string; alg: string }

  if (header.alg !== 'RS256') throw new Error('Unexpected JWT algorithm')

  const keysRes = await fetch('https://appleid.apple.com/auth/keys')
  const { keys } = (await keysRes.json()) as { keys: AppleJWK[] }
  const jwk = keys.find(k => k.kid === header.kid)
  if (!jwk) throw new Error(`No Apple public key for kid: ${header.kid}`)

  const publicKey = createPublicKey({ key: jwk as Parameters<typeof createPublicKey>[0], format: 'jwk' })

  const verifier = createVerify('RSA-SHA256')
  verifier.update(`${headerB64}.${payloadB64}`)
  const valid = verifier.verify(publicKey, Buffer.from(signatureB64, 'base64url'))
  if (!valid) throw new Error('JWT signature invalid')

  const payload = JSON.parse(
    Buffer.from(payloadB64, 'base64url').toString(),
  ) as AppleTokenPayload

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp < now) throw new Error('JWT expired')
  if (payload.iss !== 'https://appleid.apple.com') throw new Error('Invalid issuer')

  const expectedAud = process.env.APPLE_BUNDLE_ID
  if (expectedAud && payload.aud !== expectedAud) throw new Error('Invalid audience')

  return payload
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const jwtToken = req.body?.payload
  if (!jwtToken || typeof jwtToken !== 'string') {
    return res.status(400).json({ error: 'Missing payload field' })
  }

  let tokenPayload: AppleTokenPayload
  try {
    tokenPayload = await verifyAppleJWT(jwtToken)
  } catch (err) {
    console.error('Apple JWT verification failed:', err)
    return res.status(400).json({ error: 'Invalid payload' })
  }

  let event: AppleEvent
  try {
    event = JSON.parse(tokenPayload.events) as AppleEvent
  } catch {
    return res.status(400).json({ error: 'Malformed events claim' })
  }

  console.log(`Apple notification: type=${event.type} sub=${event.sub}`)

  if (event.type === 'consent-revoked' || event.type === 'account-delete') {
    // Requires the get_user_id_by_apple_sub SQL function — see README comment below
    const { data: userId, error: rpcErr } = await supabase.rpc('get_user_id_by_apple_sub', {
      apple_sub: event.sub,
    })

    if (rpcErr || !userId) {
      console.error('Could not resolve user for Apple sub:', event.sub, rpcErr)
    } else {
      const { error: deleteErr } = await supabase.auth.admin.deleteUser(userId as string)
      if (deleteErr) {
        console.error('Failed to delete Supabase user:', deleteErr)
      } else {
        console.log(`Deleted user ${userId} on Apple ${event.type}`)
      }
    }
  }

  // email-disabled / email-enabled are informational only —
  // Supabase Apple provider handles relay address changes automatically.

  return res.status(200).json({ received: true })
}

/*
 * Run this once in Supabase SQL Editor to enable user lookup by Apple sub:
 *
 * CREATE OR REPLACE FUNCTION public.get_user_id_by_apple_sub(apple_sub TEXT)
 * RETURNS UUID
 * LANGUAGE sql
 * SECURITY DEFINER
 * AS $$
 *   SELECT user_id FROM auth.identities
 *   WHERE provider = 'apple' AND provider_id = apple_sub
 *   LIMIT 1;
 * $$;
 */

export const config = {
  runtime: 'nodejs',
}
