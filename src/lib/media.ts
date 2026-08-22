import { useEffect, useState } from 'react'
import { decryptFile, pieceKeys } from './crypto'

/// Resolves a stored object into something an <img> or <video> can point at.
///
/// A stored object cannot be handed to the browser as a URL any more — the
/// bytes are a TJE1 container, and nothing but our own code can read them. So
/// it is fetched, decrypted in memory, and re-published as an object URL.
///
/// The object URL is revoked on unmount. Without that, scrolling a long reel
/// would pin every decrypted photo in memory for the life of the page.
export function useMediaSrc(
  fileKey: string | null,
  token: string | null,
  pieceId: string | null,
  opts: { mime?: string },
): { src: string | null; error: boolean } {
  const { mime } = opts
  const [src, setSrc] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!fileKey || !token) return
    let cancelled = false
    let objectUrl: string | null = null

    ;(async () => {
      try {
        const res = await fetch('/api/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: 'serve', key: fileKey }),
        })
        if (!res.ok) throw new Error('could not sign')
        const { signedUrl } = await res.json()
        if (!pieceId) throw new Error('missing piece for key lookup')

        const [bytesRes, keys] = await Promise.all([
          fetch(signedUrl),
          pieceKeys(pieceId, token),
        ])
        if (!bytesRes.ok) throw new Error('could not fetch')
        const plain = await decryptFile(await bytesRes.arrayBuffer(), keys.file)
        if (cancelled) return
        objectUrl = URL.createObjectURL(
          new Blob([plain as unknown as BlobPart], { type: mime ?? 'application/octet-stream' }),
        )
        setSrc(objectUrl)
      } catch {
        if (!cancelled) setError(true)
      }
    })()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [fileKey, token, pieceId, mime])

  return { src, error }
}

/// The MIME a decrypted blob should carry, taken from the item's encrypted
/// metadata when present and otherwise guessed from its kind. Getting this
/// wrong is not cosmetic — a <video> handed a blob typed
/// application/octet-stream refuses to play it.
export function mimeForItem(
  type: string,
  meta: { mime?: string } | null,
): string {
  if (meta?.mime) return meta.mime
  switch (type) {
    case 'photo': return 'image/jpeg'
    case 'video': return 'video/mp4'
    case 'audio':
    case 'voice_note': return 'audio/mpeg'
    default: return 'application/octet-stream'
  }
}
