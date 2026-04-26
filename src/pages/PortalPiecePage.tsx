import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Piece, Message, MessageItem, MessageItemType } from '../lib/supabase'
import styles from './PortalPiecePage.module.css'

/* ── Types ── */
type UploadState = 'idle' | 'uploading' | 'done' | 'error'

type PendingItem = {
  type: MessageItemType
  title: string
  content: string   // for note/spotify/maps
  file:    File | null
  state:   UploadState
  error:   string
}

const ITEM_TYPES: { type: MessageItemType; label: string; icon: string; accept?: Record<string, string[]>; isFile: boolean }[] = [
  { type: 'photo',      label: 'Photo',       icon: '🖼',  accept: { 'image/*': [] },                                      isFile: true  },
  { type: 'video',      label: 'Video',       icon: '🎬',  accept: { 'video/*': [] },                                      isFile: true  },
  { type: 'audio',      label: 'Audio',       icon: '🎵',  accept: { 'audio/*': [] },                                      isFile: true  },
  { type: 'voice_note', label: 'Voice Note',  icon: '🎙',  accept: { 'audio/*': [] },                                      isFile: true  },
  { type: 'note',       label: 'Note',        icon: '✍️', isFile: false },
  { type: 'spotify',    label: 'Spotify',     icon: '🎧', isFile: false },
  { type: 'google_maps',label: 'Place',       icon: '📍', isFile: false },
]

function blank(type: MessageItemType): PendingItem {
  return { type, title: '', content: '', file: null, state: 'idle', error: '' }
}

/* ── Upload helper — returns R2 key (not a public URL) ── */
async function uploadFile(
  file: File,
  pieceId: string,
  token: string,
): Promise<string> {
  const res = await fetch('/api/s3-presign', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      filename:    file.name,
      contentType: file.type,
      pieceId,
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Could not get upload URL')
  }
  const { uploadUrl, fileKey, contentType, maxBytes } = await res.json()

  if (file.size > maxBytes) {
    throw new Error(`File is too large (max ${Math.round(maxBytes / 1024 / 1024)}MB)`)
  }

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type':        contentType,
      'Content-Disposition': 'attachment',
    },
    body: file,
  })
  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => '')
    throw new Error(`Upload failed (${uploadRes.status}): ${errText.slice(0, 140)}`)
  }

  return fileKey
}

/* ── SignedMedia — fetches a short-lived presigned URL then renders the media ── */
function SignedMedia({ fileKey, type, token }: { fileKey: string; type: MessageItemType; token: string }) {
  const [src, setSrc] = useState<string | null>(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/file-serve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ key: fileKey }),
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(({ signedUrl }) => { if (!cancelled) setSrc(signedUrl) })
      .catch(() => { if (!cancelled) setErr(true) })
    return () => { cancelled = true }
  }, [fileKey, token])

  if (err) return <p className={styles.itemMeta}>Could not load file</p>
  if (!src) return <p className={styles.itemMeta}>Loading…</p>

  if (type === 'photo') return <img src={src} alt="" className={styles.mediaPreview} />
  if (type === 'video') return <video src={src} controls className={styles.mediaPreview} />
  if (type === 'audio' || type === 'voice_note') return <audio src={src} controls className={styles.mediaPreview} />
  return <p className={styles.itemMeta}>File ready</p>
}

/* ── FileZone sub-component ── */
function FileZone({
  accept,
  onFile,
  file,
}: {
  accept: Record<string, string[]>
  onFile: (f: File) => void
  file: File | null
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles: 1,
    onDrop: ([f]) => { if (f) onFile(f) },
  })
  return (
    <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}>
      <input {...getInputProps()} />
      {file ? (
        <p className={styles.dropzoneFile}>{file.name}</p>
      ) : (
        <p className={styles.dropzoneHint}>
          {isDragActive ? 'Drop it here' : 'Drag & drop or click to select'}
        </p>
      )}
    </div>
  )
}

/* ── Main page ── */
export default function PortalPiecePage() {
  const { pieceId } = useParams<{ pieceId: string }>()
  const { user }    = useAuth()

  const [piece,    setPiece]    = useState<Piece | null>(null)
  const [message,  setMessage]  = useState<Message | null>(null)
  const [items,    setItems]    = useState<MessageItem[]>([])
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [token,    setToken]    = useState<string | null>(null)

  const [activeType, setActiveType]   = useState<MessageItemType>('photo')
  const [pending,    setPending]      = useState<PendingItem>(blank('photo'))
  const [saving,     setSaving]       = useState(false)

  // Voice recording
  const [recording,  setRecording]  = useState(false)
  const [audioBlob,  setAudioBlob]  = useState<Blob | null>(null)
  const mediaRecRef  = useRef<MediaRecorder | null>(null)
  const chunksRef    = useRef<Blob[]>([])

  useEffect(() => {
    if (!pieceId || !user) return
    Promise.all([
      supabase.auth.getSession(),
      supabase.from('Pieces').select('*').eq('id', pieceId).eq('sender_id', user.id).single(),
      supabase.from('Messages').select('*').eq('piece_id', pieceId).single(),
    ]).then(([{ data: sessionData }, { data: p, error: pErr }, { data: m }]) => {
      setToken(sessionData.session?.access_token ?? null)
      if (pErr || !p) { setNotFound(true); setLoading(false); return }
      setPiece(p)
      setMessage(m ?? null)
      if (m) {
        supabase
          .from('Message_Items')
          .select('*')
          .eq('message_id', m.id)
          .order('created_at')
          .then(({ data }) => setItems(data ?? []))
      }
      setLoading(false)
    })
  }, [pieceId, user])

  function switchType(type: MessageItemType) {
    setActiveType(type)
    setPending(blank(type))
    setAudioBlob(null)
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const rec = new MediaRecorder(stream)
    chunksRef.current = []
    rec.ondataavailable = e => chunksRef.current.push(e.data)
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setAudioBlob(blob)
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
      setPending(p => ({ ...p, file }))
    }
    rec.start()
    mediaRecRef.current = rec
    setRecording(true)
  }

  function stopRecording() {
    mediaRecRef.current?.stop()
    mediaRecRef.current?.stream.getTracks().forEach(t => t.stop())
    setRecording(false)
  }

  async function handleAdd() {
    if (!message || !user || !pieceId) return
    const typeDef = ITEM_TYPES.find(t => t.type === activeType)!
    setSaving(true)
    setPending(p => ({ ...p, state: 'uploading', error: '' }))

    try {
      let fileUrl: string | null = null

      if (typeDef.isFile && pending.file) {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        if (!token) throw new Error('Not authenticated')
        fileUrl = await uploadFile(pending.file, pieceId, token)
      }

      const { data: newItem, error } = await supabase
        .from('Message_Items')
        .insert({
          message_id: message.id,
          type:       activeType,
          title:      pending.title || null,
          file_url:   fileUrl,
          content:    (!typeDef.isFile && pending.content) ? pending.content : null,
        })
        .select('*')
        .single()

      if (error) throw new Error(error.message)
      setItems(prev => [...prev, newItem])
      setPending(blank(activeType))
      setAudioBlob(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setPending(p => ({ ...p, state: 'error', error: msg }))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(itemId: string) {
    await supabase.from('Message_Items').delete().eq('id', itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  if (loading) return (
    <main className={styles.page}>
      <div className={styles.loading}><div className={styles.spinner} /></div>
    </main>
  )

  if (notFound) return (
    <main className={styles.page}>
      <div className={styles.notFound}>
        <p>Piece not found or you don't have access.</p>
        <Link to="/portal" className={styles.backLink}>← Back to portal</Link>
      </div>
    </main>
  )

  return (
    <main className={styles.page}>
      <div className={styles.inner}>

        {/* Header */}
        <header className={styles.header}>
          <Link to="/portal" className={styles.backLink}>← Portal</Link>
          <div>
            <p className={styles.eyebrow}>Memory Builder</p>
            <h1 className={styles.title}>{piece?.collection ?? 'Your Pendant'}</h1>
          </div>
        </header>

        <div className={styles.layout}>

          {/* Left — add form */}
          <div className={styles.addPanel}>
            <p className={styles.panelLabel}>Add a memory</p>

            {/* Type tabs */}
            <div className={styles.typeTabs} role="tablist">
              {ITEM_TYPES.map(t => (
                <button
                  key={t.type}
                  role="tab"
                  aria-selected={activeType === t.type}
                  className={`${styles.typeTab} ${activeType === t.type ? styles.typeTabActive : ''}`}
                  onClick={() => switchType(t.type)}
                >
                  <span className={styles.typeIcon}>{t.icon}</span>
                  <span className={styles.typeLabel}>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Title field */}
            <div className={styles.field}>
              <label className={styles.label}>Title <span className={styles.optional}>(optional)</span></label>
              <input
                className={styles.input}
                value={pending.title}
                onChange={e => setPending(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Our first dance"
              />
            </div>

            {/* Type-specific input */}
            {activeType === 'voice_note' ? (
              <div className={styles.field}>
                <label className={styles.label}>Recording</label>
                {!audioBlob ? (
                  <button
                    type="button"
                    className={`${styles.recordBtn} ${recording ? styles.recordBtnActive : ''}`}
                    onClick={recording ? stopRecording : startRecording}
                  >
                    {recording ? '⏹ Stop' : '⏺ Record'}
                  </button>
                ) : (
                  <div className={styles.audioPreview}>
                    <audio controls src={URL.createObjectURL(audioBlob)} />
                    <button
                      type="button"
                      className={styles.rerecordBtn}
                      onClick={() => { setAudioBlob(null); setPending(p => ({ ...p, file: null })) }}
                    >
                      Re-record
                    </button>
                  </div>
                )}
              </div>
            ) : ITEM_TYPES.find(t => t.type === activeType)?.isFile ? (
              <div className={styles.field}>
                <label className={styles.label}>File</label>
                <FileZone
                  accept={ITEM_TYPES.find(t => t.type === activeType)?.accept ?? {}}
                  file={pending.file}
                  onFile={f => setPending(p => ({ ...p, file: f }))}
                />
              </div>
            ) : (
              <div className={styles.field}>
                <label className={styles.label}>
                  {activeType === 'note' ? 'Message' : activeType === 'spotify' ? 'Spotify URL' : 'Google Maps URL'}
                </label>
                {activeType === 'note' ? (
                  <textarea
                    className={styles.textarea}
                    rows={5}
                    value={pending.content}
                    onChange={e => setPending(p => ({ ...p, content: e.target.value }))}
                    placeholder="Write something meaningful…"
                  />
                ) : (
                  <input
                    className={styles.input}
                    type="url"
                    value={pending.content}
                    onChange={e => setPending(p => ({ ...p, content: e.target.value }))}
                    placeholder={activeType === 'spotify' ? 'https://open.spotify.com/track/…' : 'https://maps.google.com/…'}
                  />
                )}
              </div>
            )}

            {pending.error && <p className={styles.fieldError}>{pending.error}</p>}

            <button
              className={styles.addBtn}
              disabled={saving || (
                ITEM_TYPES.find(t => t.type === activeType)?.isFile
                  ? !pending.file
                  : activeType !== 'voice_note' && !pending.content.trim()
              )}
              onClick={handleAdd}
            >
              {saving ? 'Saving…' : 'Add to Memory'}
            </button>
          </div>

          {/* Right — existing items */}
          <div className={styles.itemsPanel}>
            <p className={styles.panelLabel}>
              {items.length === 0 ? 'No memories yet' : `${items.length} memor${items.length === 1 ? 'y' : 'ies'}`}
            </p>

            {items.length === 0 ? (
              <p className={styles.emptyItems}>
                Add photos, voice notes, songs, and more using the panel on the left.
              </p>
            ) : (
              <ul className={styles.itemList}>
                {items.map(item => (
                  <li key={item.id} className={styles.item}>
                    <div className={styles.itemIcon}>
                      {ITEM_TYPES.find(t => t.type === item.type)?.icon ?? '📎'}
                    </div>
                    <div className={styles.itemBody}>
                      <p className={styles.itemTitle}>
                        {item.title ?? ITEM_TYPES.find(t => t.type === item.type)?.label}
                      </p>
                      {item.file_url && token
                        ? <SignedMedia fileKey={item.file_url} type={item.type} token={token} />
                        : <p className={styles.itemMeta}>
                            {item.type === 'note' && item.content
                              ? item.content.slice(0, 80) + (item.content.length > 80 ? '…' : '')
                              : item.content?.slice(0, 60)}
                          </p>
                      }
                    </div>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(item.id)}
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}
