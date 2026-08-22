// Envelope encryption for the website's serverless functions.
//
// The mirror of supabase/functions/_shared/envelope.ts in the app repo: same
// key hierarchy, same wrapping format, same table. Both have to agree, because
// a memory encrypted here is decrypted there. docs/ENCRYPTION.md in the app
// repo is the normative description; change it there first.

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export type KeyScope = 'message' | 'vault'

const KEK_VERSION = 1

function kekMaterial(version: number): Buffer {
  const raw = process.env[`TIJORAY_KEK_V${version}`]
  if (!raw) throw new Error(`Missing TIJORAY_KEK_V${version} in environment`)
  const bytes = Buffer.from(raw.trim(), 'base64')
  if (bytes.length !== 32) {
    throw new Error(
      `TIJORAY_KEK_V${version} must decode to 32 bytes, got ${bytes.length}`,
    )
  }
  return bytes
}

/// Ties a wrapped key to the exact row it belongs in, so one lifted from
/// another piece's row fails to unwrap rather than quietly decrypting the
/// wrong piece's media.
function wrapAad(pieceId: string, scope: KeyScope, version: number): Buffer {
  return Buffer.from(`${pieceId}|${scope}|v${version}`, 'utf8')
}

export function wrapDek(
  dek: Buffer,
  pieceId: string,
  scope: KeyScope,
  version = KEK_VERSION,
): string {
  const nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', kekMaterial(version), nonce)
  cipher.setAAD(wrapAad(pieceId, scope, version))
  const ct = Buffer.concat([cipher.update(dek), cipher.final()])
  return Buffer.concat([nonce, ct, cipher.getAuthTag()]).toString('base64')
}

export function unwrapDek(
  wrapped: string,
  pieceId: string,
  scope: KeyScope,
  version = KEK_VERSION,
): Buffer {
  const blob = Buffer.from(wrapped, 'base64')
  if (blob.length < 12 + 16) throw new Error('wrapped key is truncated')
  const nonce = blob.subarray(0, 12)
  const tag = blob.subarray(blob.length - 16)
  const ct = blob.subarray(12, blob.length - 16)
  const decipher = createDecipheriv('aes-256-gcm', kekMaterial(version), nonce)
  decipher.setAAD(wrapAad(pieceId, scope, version))
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()])
}

/// Returns the piece's data key for [scope], minting one on first use.
///
/// The gifter adding a memory and the giftee opening the app can land here at
/// the same instant. `on conflict do nothing` plus a re-read means the loser of
/// that race adopts the winner's key instead of overwriting it — an overwrite
/// would orphan everything already encrypted under the original.
export async function getOrCreatePieceDek(
  supabase: SupabaseClient,
  pieceId: string,
  scope: KeyScope,
): Promise<Buffer> {
  const existing = await supabase
    .from('Piece_Keys')
    .select('wrapped_dek, kek_version')
    .eq('piece_id', pieceId)
    .eq('scope', scope)
    .maybeSingle()
  if (existing.error) throw existing.error
  if (existing.data) {
    return unwrapDek(
      existing.data.wrapped_dek as string,
      pieceId,
      scope,
      existing.data.kek_version as number,
    )
  }

  const fresh = randomBytes(32)
  const inserted = await supabase
    .from('Piece_Keys')
    .insert({
      piece_id: pieceId,
      scope,
      wrapped_dek: wrapDek(fresh, pieceId, scope),
      kek_version: KEK_VERSION,
    })
    .select('wrapped_dek')
    .maybeSingle()

  if (inserted.error && inserted.error.code !== '23505') throw inserted.error
  if (!inserted.error && inserted.data) return fresh

  const winner = await supabase
    .from('Piece_Keys')
    .select('wrapped_dek, kek_version')
    .eq('piece_id', pieceId)
    .eq('scope', scope)
    .single()
  if (winner.error) throw winner.error
  return unwrapDek(
    winner.data.wrapped_dek as string,
    pieceId,
    scope,
    winner.data.kek_version as number,
  )
}
