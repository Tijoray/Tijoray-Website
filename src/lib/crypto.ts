// Client-side encryption for memories.
//
// Media bytes and the text that describes them are encrypted here, in the
// browser, before anything is sent. The server stores containers it cannot
// read. The formats — TJE1 for files, `tje1.` for text — are specified in
// docs/ENCRYPTION.md in the app repo, and lib/services/piece_crypto.dart there
// is the other implementation. All three have to agree.

const MAGIC = new Uint8Array([0x54, 0x4a, 0x45, 0x31]) // "TJE1"
const VERSION = 0x01
const ALG_AES_256_GCM = 0x01
const CHUNK_LOG2 = 20 // 1 MiB
const CHUNK_BYTES = 1 << CHUNK_LOG2
const HEADER_BYTES = 16
const TAG_BYTES = 16
const TEXT_PREFIX = 'tje1.'

export interface PieceKeys {
  file: CryptoKey
  text: CryptoKey
}

const keyCache = new Map<string, Promise<PieceKeys>>()

/// Fetches and caches the piece's data key, split into its two subkeys.
///
/// Cached for the life of the page: a memory reel is a dozen files and as many
/// captions, and asking the server for the same key a dozen times would be
/// both slow and a needlessly loud pattern in the logs.
export function pieceKeys(pieceId: string, token: string): Promise<PieceKeys> {
  const cached = keyCache.get(pieceId)
  if (cached) return cached
  const pending = fetchPieceKeys(pieceId, token).catch(err => {
    keyCache.delete(pieceId) // a failed fetch must not poison the cache
    throw err
  })
  keyCache.set(pieceId, pending)
  return pending
}

/// Drops cached keys. Called on sign-out so a shared machine does not leave
/// another account's keys sitting in memory.
export function forgetPieceKeys() {
  keyCache.clear()
}

async function fetchPieceKeys(pieceId: string, token: string): Promise<PieceKeys> {
  const res = await fetch('/api/piece-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ pieceId, scope: 'message' }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Could not obtain encryption key')
  }
  const { dek } = await res.json()
  return deriveKeys(base64ToBytes(dek))
}

/// Splits the piece key into one subkey for file bodies and one for text.
///
/// Separate subkeys mean a flaw in how one of the two formats uses its key
/// cannot be turned against the other, and it costs one HKDF call.
export async function deriveKeys(dek: Uint8Array): Promise<PieceKeys> {
  const master = await crypto.subtle.importKey('raw', bufferOf(dek), 'HKDF', false, [
    'deriveBits',
  ])
  const sub = async (info: string) => {
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(0),
        info: new TextEncoder().encode(info),
      },
      master,
      256,
    )
    return crypto.subtle.importKey('raw', bits, { name: 'AES-GCM' }, false, [
      'encrypt',
      'decrypt',
    ])
  }
  return {
    file: await sub('tijoray/file/v1'),
    text: await sub('tijoray/text/v1'),
  }
}

// ── Files ──────────────────────────────────────────────────────────────────

function header(noncePrefix: Uint8Array): Uint8Array {
  const h = new Uint8Array(HEADER_BYTES)
  h.set(MAGIC, 0)
  h[4] = VERSION
  h[5] = ALG_AES_256_GCM
  h[6] = CHUNK_LOG2
  h[7] = 0
  h.set(noncePrefix, 8)
  return h
}

function nonceFor(prefix: Uint8Array, index: number): Uint8Array<ArrayBuffer> {
  // Allocated over an explicit ArrayBuffer: a bare `new Uint8Array(n)` is typed
  // as possibly SharedArrayBuffer-backed, which WebCrypto does not accept.
  const n = new Uint8Array(new ArrayBuffer(12))
  n.set(prefix, 0)
  new DataView(n.buffer).setUint32(8, index, false)
  return n
}

/// Per-chunk associated data. The index stops chunks being reordered or moved
/// between files; the last-chunk flag stops truncation, where lopping off the
/// tail would otherwise yield a shorter but perfectly valid file.
function aadFor(h: Uint8Array, index: number, isLast: boolean): Uint8Array<ArrayBuffer> {
  const aad = new Uint8Array(new ArrayBuffer(8 + 4 + 1))
  aad.set(h.subarray(0, 8), 0)
  new DataView(aad.buffer).setUint32(8, index, false)
  aad[12] = isLast ? 1 : 0
  return aad
}

/// Encrypts a file into a TJE1 container.
///
/// Chunked rather than one-shot so the app can seek inside a video without
/// pulling and decrypting the whole thing first.
export async function encryptFile(file: Blob, key: CryptoKey): Promise<Blob> {
  const noncePrefix = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(8)))
  const h = header(noncePrefix)
  const parts: BlobPart[] = [bufferOf(h)]

  const chunkCount = Math.max(1, Math.ceil(file.size / CHUNK_BYTES))
  for (let i = 0; i < chunkCount; i++) {
    const slice = file.slice(i * CHUNK_BYTES, Math.min((i + 1) * CHUNK_BYTES, file.size))
    const plain = new Uint8Array(await slice.arrayBuffer())
    const sealed = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonceFor(noncePrefix, i),
        additionalData: aadFor(h, i, i === chunkCount - 1),
      },
      key,
      plain,
    )
    parts.push(sealed)
  }
  return new Blob(parts, { type: 'application/octet-stream' })
}

/// Decrypts a whole container back to bytes.
///
/// The website only ever renders small previews of what the gifter just
/// uploaded, so whole-file is fine here. The app streams instead — see the
/// decrypting proxy in piece_crypto.dart.
export async function decryptFile(cipher: ArrayBuffer, key: CryptoKey): Promise<Uint8Array> {
  const bytes = new Uint8Array(cipher)
  if (bytes.length < HEADER_BYTES) throw new Error('not an encrypted file')
  const h = bytes.subarray(0, HEADER_BYTES)
  for (let i = 0; i < MAGIC.length; i++) {
    if (h[i] !== MAGIC[i]) throw new Error('not an encrypted file')
  }
  if (h[4] !== VERSION || h[5] !== ALG_AES_256_GCM) {
    throw new Error('unsupported encryption version')
  }
  const chunkBytes = 1 << h[6]
  const noncePrefix = h.subarray(8, 16)
  const stride = chunkBytes + TAG_BYTES
  const body = bytes.subarray(HEADER_BYTES)
  const chunkCount = Math.max(1, Math.ceil(body.length / stride))

  const out: Uint8Array[] = []
  let total = 0
  for (let i = 0; i < chunkCount; i++) {
    const slice = body.subarray(i * stride, Math.min((i + 1) * stride, body.length))
    const plain = new Uint8Array(
      await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: nonceFor(noncePrefix, i),
          additionalData: aadFor(h, i, i === chunkCount - 1),
        },
        key,
        slice,
      ),
    )
    out.push(plain)
    total += plain.length
  }

  const joined = new Uint8Array(total)
  let at = 0
  for (const part of out) {
    joined.set(part, at)
    at += part.length
  }
  return joined
}

// ── Text ───────────────────────────────────────────────────────────────────

/// Encrypts a note, caption, place name or link for storage in a text column.
/// Empty and absent values stay as they are — encrypting "" would only
/// advertise that a field exists while telling a reader nothing.
export async function encryptText(
  value: string | null | undefined,
  key: CryptoKey,
): Promise<string | null> {
  if (value == null || value === '') return value ?? null
  const nonce = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)))
  const sealed = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce, additionalData: textAad() },
      key,
      new TextEncoder().encode(value),
    ),
  )
  return `${TEXT_PREFIX}${b64url(nonce)}.${b64url(sealed)}`
}

/// Decrypts a text column.
///
/// A value that is not in the encrypted form is rejected rather than passed
/// through. There is no plaintext era to be lenient about, so leniency here
/// would only ever hide a write path that had stopped encrypting — the one
/// failure this whole change exists to prevent, and the one that is invisible
/// if the reader shrugs and renders it.
export async function decryptText(
  value: string | null | undefined,
  key: CryptoKey,
): Promise<string | null> {
  if (value == null || value === '') return value ?? null
  if (!value.startsWith(TEXT_PREFIX)) throw new Error('value is not encrypted')
  const parts = value.slice(TEXT_PREFIX.length).split('.')
  if (parts.length !== 2) throw new Error('malformed encrypted text')
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unb64url(parts[0]), additionalData: textAad() },
    key,
    unb64url(parts[1]),
  )
  return new TextDecoder().decode(plain)
}

function textAad() {
  return new TextEncoder().encode('tje1-text')
}

// ── Encoding helpers ───────────────────────────────────────────────────────

// Uint8Array views can be windows onto a larger buffer; WebCrypto and Blob
// both take the whole underlying buffer unless given an exact copy.
function bufferOf(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
}

function b64url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function unb64url(s: string): Uint8Array<ArrayBuffer> {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const raw = atob(b64)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}
