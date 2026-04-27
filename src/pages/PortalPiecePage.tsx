import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Piece, Message, MessageItem, MessageItemType } from '../lib/supabase'
import TutorialModal from './TutorialModal'
import MemoryCarousel from './MemoryCarousel'
import MemoryIcon from '../components/MemoryIcon'
import styles from './PortalPiecePage.module.css'

/* ── Types ── */
type UploadState = 'idle' | 'uploading' | 'done' | 'error'

type PendingItem = {
  type:    MessageItemType
  title:   string
  content: string
  file:    File | null
  state:   UploadState
  error:   string
}


const ITEM_TYPES: {
  type: MessageItemType
  label: string
  accept?: Record<string, string[]>
  isFile: boolean
}[] = [
  { type: 'photo',       label: 'Photo',      accept: { 'image/*': [] },  isFile: true  },
  { type: 'video',       label: 'Video',      accept: { 'video/*': [] },  isFile: true  },
  { type: 'audio',       label: 'Audio',      accept: { 'audio/*': [] },  isFile: true  },
  { type: 'voice_note',  label: 'Voice Note',                             isFile: true  },
  { type: 'note',        label: 'Note',                                   isFile: false },
  { type: 'spotify',     label: 'Spotify',                                isFile: false },
  { type: 'google_maps', label: 'Place',                                  isFile: false },
]

function blank(type: MessageItemType): PendingItem {
  return { type, title: '', content: '', file: null, state: 'idle', error: '' }
}

/* ── Upload helper ── */
async function uploadFile(file: File, pieceId: string, token: string): Promise<string> {
  const res = await fetch('/api/s3-presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ filename: file.name, contentType: file.type, pieceId }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Could not get upload URL')
  }
  const { uploadUrl, fileKey, contentType, maxBytes } = await res.json()
  if (file.size > maxBytes) throw new Error(`File is too large (max ${Math.round(maxBytes / 1024 / 1024)}MB)`)
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  })
  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => '')
    throw new Error(`Upload failed (${uploadRes.status}): ${errText.slice(0, 140)}`)
  }
  return fileKey
}

/* ── SignedMedia ── */
function SignedMedia({ fileKey, type, token }: { fileKey: string; type: MessageItemType; token: string }) {
  const [src, setSrc] = useState<string | null>(null)
  const [err, setErr] = useState(false)
  useEffect(() => {
    let cancelled = false
    fetch('/api/file-serve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ key: fileKey }),
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(({ signedUrl }) => { if (!cancelled) setSrc(signedUrl) })
      .catch(() => { if (!cancelled) setErr(true) })
    return () => { cancelled = true }
  }, [fileKey, token])

  if (err) return <span className={styles.thumbMeta}>—</span>
  if (!src) return <div className={styles.thumbSpinner}/>

  if (type === 'photo') return <img src={src} alt="" className={styles.thumbImg}/>
  if (type === 'video') return <video src={src} className={styles.thumbImg} muted/>
  return (
    <span className={styles.thumbIcon}>
      <MemoryIcon type={type} size={16}/>
    </span>
  )
}

/* ── FileZone ── */
function FileZone({ accept, onFile, file }: { accept: Record<string, string[]>; onFile: (f: File) => void; file: File | null }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept, maxFiles: 1, onDrop: ([f]) => { if (f) onFile(f) },
  })
  return (
    <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}>
      <input {...getInputProps()} />
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.dropzoneIcon}>
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
      </svg>
      {file
        ? <p className={styles.dropzoneFile}>{file.name}</p>
        : <p className={styles.dropzoneHint}>{isDragActive ? 'Drop it here' : 'Drag & drop or click to select'}</p>
      }
    </div>
  )
}

/* ── Location search (Nominatim, free, no key) ── */
type NominatimResult = { place_id: number; display_name: string; lat: string; lon: string }

function LocationSearch({ value, onChange }: { value: string; onChange: (json: string) => void }) {
  const [query,       setQuery]       = useState('')
  const [results,     setResults]     = useState<NominatimResult[]>([])
  const [open,        setOpen]        = useState(false)
  const [loading,     setLoading]     = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Parse existing value to show selected name
  const selected = (() => { try { return JSON.parse(value) } catch { return null } })()

  function search(q: string) {
    setQuery(q)
    onChange('') // clear selection while typing
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!q.trim()) { setResults([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=0`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data: NominatimResult[] = await res.json()
        setResults(data)
        setOpen(true)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }, 350)
  }

  function select(r: NominatimResult) {
    const short = r.display_name.split(',').slice(0, 3).join(',')
    setQuery(short)
    setOpen(false)
    onChange(JSON.stringify({ lat: r.lat, lon: r.lon, name: r.display_name }))
  }

  return (
    <div className={styles.locationWrap}>
      <div className={styles.locationInputWrap}>
        <svg className={styles.locationInputIcon} width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z"/><circle cx="10" cy="8" r="2"/>
        </svg>
        <input
          className={styles.locationInput}
          value={selected ? selected.name.split(',').slice(0, 3).join(',') : query}
          onChange={e => search(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true) }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search for a place…"
          autoComplete="off"
        />
        {loading && <div className={styles.locationSpinner}/>}
        {selected && (
          <button className={styles.locationClear} onClick={() => { setQuery(''); onChange(''); setResults([]) }} aria-label="Clear">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l12 12M14 2L2 14"/></svg>
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className={styles.locationDropdown}>
          {results.map(r => (
            <li key={r.place_id} className={styles.locationOption} onMouseDown={() => select(r)}>
              <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--rose)' }}>
                <path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z"/><circle cx="10" cy="8" r="2"/>
              </svg>
              <span>{r.display_name.split(',').slice(0, 4).join(', ')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ── sortItems helper ── */
function sortItems(items: MessageItem[]): MessageItem[] {
  return [...items].sort((a, b) => {
    if (a.sort_order != null && b.sort_order != null) return a.sort_order - b.sort_order
    if (a.sort_order != null) return -1
    if (b.sort_order != null) return 1
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}

/* ── Main page ── */
export default function PortalPiecePage() {
  const { pieceId } = useParams<{ pieceId: string }>()
  const { user }    = useAuth()

  const [piece,         setPiece]         = useState<Piece | null>(null)
  const [message,       setMessage]       = useState<Message | null>(null)
  const [items,         setItems]         = useState<MessageItem[]>([])
  const [loading,       setLoading]       = useState(true)
  const [notFound,      setNotFound]      = useState(false)
  const [token,         setToken]         = useState<string | null>(null)
  const [recipientName, setRecipientName] = useState<string | null>(null)

  const [activeType, setActiveType] = useState<MessageItemType>('photo')
  const [pending,    setPending]    = useState<PendingItem>(blank('photo'))
  const [saving,     setSaving]     = useState(false)

  // Carousel
  const [carouselIndex, setCarouselIndex] = useState(0)

  // Tutorial
  const [showTutorial, setShowTutorial] = useState(false)

  // Recommendation banner
  const [recDismissed, setRecDismissed] = useState(() =>
    !!localStorage.getItem('mb_rec_dismissed')
  )

  // Voice recording
  const [recording,  setRecording]  = useState(false)
  const [audioBlob,  setAudioBlob]  = useState<Blob | null>(null)
  const mediaRecRef  = useRef<MediaRecorder | null>(null)
  const chunksRef    = useRef<Blob[]>([])

  // Drag-and-drop reorder
  const dragSrcRef = useRef<number | null>(null)
  const itemsRef   = useRef<MessageItem[]>([])

  // Keep ref in sync so drag handlers always see latest order
  useEffect(() => { itemsRef.current = items }, [items])

  useEffect(() => {
    if (!localStorage.getItem('mb_tutorial_seen')) setShowTutorial(true)
  }, [])

  useEffect(() => {
    if (!pieceId || !user) return
    Promise.all([
      supabase.auth.getSession(),
      supabase.from('Pieces').select('*').eq('id', pieceId).eq('sender_id', user.id).single(),
      supabase.from('Messages').select('*').eq('piece_id', pieceId).single(),
    ]).then(([{ data: sessionData }, { data: p, error: pErr }, { data: m }]) => {
      const tok = sessionData.session?.access_token ?? null
      setToken(tok)
      if (pErr || !p) { setNotFound(true); setLoading(false); return }
      setPiece(p)
      setMessage(m ?? null)
      if (m) {
        supabase
          .from('Message_Items')
          .select('*')
          .eq('message_id', m.id)
          .order('sort_order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: true })
          .then(({ data }) => setItems(sortItems(data ?? [])))
      }
      // Fetch recipient name via API (requires service role, can't do client-side)
      if (tok) {
        fetch('/api/recipient-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
          body: JSON.stringify({ pieceId }),
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data?.name) setRecipientName(data.name) })
          .catch(() => {})
      }
      setLoading(false)
    })
  }, [pieceId, user])

  function closeTutorial() {
    localStorage.setItem('mb_tutorial_seen', '1')
    setShowTutorial(false)
  }

  function dismissRec() {
    localStorage.setItem('mb_rec_dismissed', '1')
    setRecDismissed(true)
  }

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
      setPending(p => ({ ...p, file: new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' }) }))
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
        const tok = sessionData.session?.access_token
        if (!tok) throw new Error('Not authenticated')
        fileUrl = await uploadFile(pending.file, pieceId, tok)
      }

      const nextOrder = items.length

      const { data: newItem, error } = await supabase
        .from('Message_Items')
        .insert({
          message_id: message.id,
          type:       activeType,
          title:      pending.title || null,
          file_url:   fileUrl,
          content:    (!typeDef.isFile && pending.content) ? pending.content : null,
          sort_order: nextOrder,
        })
        .select('*')
        .single()

      if (error) throw new Error(error.message)
      setItems(prev => sortItems([...prev, newItem]))
      setCarouselIndex(nextOrder)
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
    const item = items.find(i => i.id === itemId)
    if (item?.file_url && token) {
      await fetch('/api/file-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key: item.file_url }),
      })
    }
    await supabase.from('Message_Items').delete().eq('id', itemId)
    setItems(prev => {
      const next = sortItems(prev.filter(i => i.id !== itemId))
      setCarouselIndex(i => Math.min(i, Math.max(0, next.length - 1)))
      return next
    })
  }

  /* ── Drag reorder ── */
  function onDragStart(index: number) {
    dragSrcRef.current = index
  }

  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    const src = dragSrcRef.current
    if (src === null || src === index) return
    const next = [...itemsRef.current]
    const [moved] = next.splice(src, 1)
    next.splice(index, 0, moved)
    dragSrcRef.current = index
    itemsRef.current = next   // update ref immediately so next dragOver sees correct state
    setItems(next)
  }

  async function onDrop() {
    dragSrcRef.current = null
    const ordered = itemsRef.current.map((item, i) => ({ ...item, sort_order: i }))
    setItems(ordered)
    setCarouselIndex(0)
    // Persist — individual updates, not upsert, so no missing-column issues
    await Promise.all(
      ordered.map(item =>
        supabase.from('Message_Items').update({ sort_order: item.sort_order }).eq('id', item.id)
      )
    )
  }

  /* ── Render guards ── */
  if (loading) return (
    <main className={styles.page}>
      <div className={styles.loading}><div className={styles.spinner}/></div>
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

  const typeDef = ITEM_TYPES.find(t => t.type === activeType)!
  const isAddDisabled = saving || (
    typeDef.isFile ? !pending.file : activeType !== 'voice_note' && !pending.content.trim()
  )

  return (
    <>
      {showTutorial && <TutorialModal onClose={closeTutorial}/>}

      <main className={styles.page}>
        <div className={styles.inner}>

          {/* Header */}
          <header className={styles.header}>
            <Link to="/portal" className={styles.backLink}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 4l-6 6 6 6"/>
              </svg>
              Portal
            </Link>
            <div className={styles.headerText}>
              <p className={styles.eyebrow}>Memory Builder</p>
              <h1 className={styles.title}>{piece?.collection ?? 'Your Pendant'}</h1>
            </div>
            <button className={styles.helpBtn} onClick={() => setShowTutorial(true)} aria-label="Show tutorial">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 14v-4M10 7v-.5"/>
              </svg>
              How it works
            </button>
          </header>

          <div className={styles.layout}>

            {/* ── Left: Add form ── */}
            <div className={styles.addPanel}>
              <p className={styles.panelLabel}>Add a Memory</p>

              {/* Recommendation banner */}
              {items.length === 0 && !recDismissed && (
                <div className={styles.recBanner}>
                  <button className={styles.recClose} onClick={dismissRec} aria-label="Dismiss">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M2 2l12 12M14 2L2 14"/>
                    </svg>
                  </button>
                  <p className={styles.recTitle}>Start with a heartfelt message</p>
                  <p className={styles.recBody}>
                    "Happy Birthday", "I Love You", "Happy Anniversary" — your recipient will see it first.
                  </p>
                  <button className={styles.recBtn} onClick={() => { switchType('note'); dismissRec() }}>
                    Write a Note
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 10h10M12 6l4 4-4 4"/>
                    </svg>
                  </button>
                </div>
              )}

              {/* Type selector */}
              <div className={styles.typeTabs} role="tablist">
                {ITEM_TYPES.map(t => (
                  <button
                    key={t.type}
                    role="tab"
                    aria-selected={activeType === t.type}
                    className={`${styles.typeTab} ${activeType === t.type ? styles.typeTabActive : ''}`}
                    onClick={() => switchType(t.type)}
                  >
                    <span className={styles.typeTabIcon}>
                      <MemoryIcon type={t.type} size={18} active={activeType === t.type}/>
                    </span>
                    <span className={styles.typeLabel}>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Title */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Title <span className={styles.optional}>(optional)</span>
                </label>
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
                      {recording ? (
                        <>
                          <span className={styles.recordDot}/>
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="7" y="2" width="6" height="10" rx="3"/>
                            <path d="M4 10a6 6 0 0012 0M10 16v2M7 18h6"/>
                          </svg>
                          Start Recording
                        </>
                      )}
                    </button>
                  ) : (
                    <div className={styles.audioPreview}>
                      <audio controls src={URL.createObjectURL(audioBlob)} className={styles.audioPlayer}/>
                      <button type="button" className={styles.rerecordBtn}
                        onClick={() => { setAudioBlob(null); setPending(p => ({ ...p, file: null })) }}>
                        Re-record
                      </button>
                    </div>
                  )}
                </div>
              ) : typeDef.isFile ? (
                <div className={styles.field}>
                  <label className={styles.label}>File</label>
                  <FileZone
                    accept={typeDef.accept ?? {}}
                    file={pending.file}
                    onFile={f => setPending(p => ({ ...p, file: f }))}
                  />
                </div>
              ) : (
                <div className={styles.field}>
                  <label className={styles.label}>
                    {activeType === 'note' ? 'Message' : activeType === 'spotify' ? 'Spotify URL' : 'Location'}
                  </label>
                  {activeType === 'note' ? (
                    <textarea
                      className={styles.textarea}
                      rows={5}
                      value={pending.content}
                      onChange={e => setPending(p => ({ ...p, content: e.target.value }))}
                      placeholder="Write something meaningful…"
                    />
                  ) : activeType === 'google_maps' ? (
                    <LocationSearch
                      value={pending.content}
                      onChange={json => setPending(p => ({ ...p, content: json }))}
                    />
                  ) : (
                    <input
                      className={styles.input}
                      type="url"
                      value={pending.content}
                      onChange={e => setPending(p => ({ ...p, content: e.target.value }))}
                      placeholder="https://open.spotify.com/track/…"
                    />
                  )}
                </div>
              )}

              {pending.error && <p className={styles.fieldError}>{pending.error}</p>}

              <button className={styles.addBtn} disabled={isAddDisabled} onClick={handleAdd}>
                {saving ? (
                  <><div className={styles.btnSpinner}/> Saving…</>
                ) : (
                  <>
                    Add to Memory
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 4v12M4 10h12"/>
                    </svg>
                  </>
                )}
              </button>
            </div>

            {/* ── Right: Carousel + list ── */}
            <div className={styles.rightPanel}>

              {/* Carousel preview */}
              <div className={styles.previewSection}>
                <p className={styles.panelLabel}>
                  {recipientName ? `What ${recipientName.split(' ')[0]} will see` : 'Preview as Recipient'}
                </p>
                <MemoryCarousel
                  items={items}
                  token={token}
                  activeIndex={carouselIndex}
                  onIndexChange={setCarouselIndex}
                />
              </div>

              {/* Sortable item list */}
              {items.length > 0 && (
                <div className={styles.listSection}>
                  <div className={styles.listHeader}>
                    <p className={styles.panelLabel}>
                      Your Memories
                    </p>
                    <span className={styles.itemCount}>{items.length}</span>
                  </div>
                  <p className={styles.listHint}>Drag to reorder — the carousel updates automatically</p>

                  <ul className={styles.sortList}>
                    {items.map((item, i) => (
                      <li
                        key={item.id}
                        className={`${styles.sortItem} ${carouselIndex === i ? styles.sortItemActive : ''}`}
                        draggable
                        onDragStart={() => onDragStart(i)}
                        onDragOver={e => onDragOver(e, i)}
                        onDrop={onDrop}
                        onClick={() => setCarouselIndex(i)}
                      >
                        {/* Drag handle */}
                        <span className={styles.dragHandle} aria-hidden="true">
                          <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                            <circle cx="3" cy="3" r="1.5"/>
                            <circle cx="9" cy="3" r="1.5"/>
                            <circle cx="3" cy="8" r="1.5"/>
                            <circle cx="9" cy="8" r="1.5"/>
                            <circle cx="3" cy="13" r="1.5"/>
                            <circle cx="9" cy="13" r="1.5"/>
                          </svg>
                        </span>

                        {/* Thumbnail */}
                        <div className={styles.thumb}>
                          {item.file_url && token ? (
                            <SignedMedia fileKey={item.file_url} type={item.type} token={token}/>
                          ) : (
                            <span className={styles.thumbIcon}>
                              <MemoryIcon type={item.type} size={16}/>
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className={styles.sortItemBody}>
                          <p className={styles.sortItemTitle}>
                            {item.title ?? ITEM_TYPES.find(t => t.type === item.type)?.label}
                          </p>
                          {item.content && item.type === 'note' && (
                            <p className={styles.sortItemMeta}>
                              {item.content.slice(0, 50)}{item.content.length > 50 ? '…' : ''}
                            </p>
                          )}
                        </div>

                        {/* Type badge */}
                        <span className={styles.typeBadge}>
                          <MemoryIcon type={item.type} size={12}/>
                        </span>

                        {/* Delete */}
                        <button
                          className={styles.deleteBtn}
                          onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                          aria-label="Remove memory"
                        >
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 5l10 10M15 5L5 15"/>
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </>
  )
}
