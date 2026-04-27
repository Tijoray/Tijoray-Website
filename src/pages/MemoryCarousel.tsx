import { useState, useEffect } from 'react'
import type { MessageItem, MessageItemType } from '../lib/supabase'
import styles from './MemoryCarousel.module.css'

const LABEL: Record<MessageItemType, string> = {
  photo: 'Photo', video: 'Video', audio: 'Audio', voice_note: 'Voice Note',
  note: 'Note', spotify: 'Song', google_maps: 'Place',
}

function TypeIcon({ type, size = 16 }: { type: MessageItemType; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (type === 'photo')      return <svg {...p}><rect x="2" y="4" width="16" height="12" rx="2"/><circle cx="10" cy="10" r="3"/><path d="M7 4l1.5-2h3L13 4"/></svg>
  if (type === 'video')      return <svg {...p}><rect x="2" y="5" width="11" height="10" rx="2"/><path d="M13 8l5-3v10l-5-3V8z"/></svg>
  if (type === 'audio')      return <svg {...p}><path d="M9 4l-5 4H2a1 1 0 00-1 1v2a1 1 0 001 1h2l5 4V4z"/><path d="M15 8a4 4 0 010 4M18 6a7 7 0 010 8"/></svg>
  if (type === 'voice_note') return <svg {...p}><rect x="7" y="2" width="6" height="10" rx="3"/><path d="M4 10a6 6 0 0012 0M10 16v2M7 18h6"/></svg>
  if (type === 'note')       return <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"/><path d="M8 8h4M8 12h2"/></svg>
  if (type === 'spotify')    return <svg {...p}><circle cx="10" cy="10" r="8"/><path d="M6 12.5c2.5-1 5-1 7.5 0M5.5 9.5C9 8 12 8 15 9.5M7 6.5c2-1 4.5-1 6.5 0"/></svg>
  if (type === 'google_maps')return <svg {...p}><path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z"/><circle cx="10" cy="8" r="2"/></svg>
  return null
}

/* ── Fetches a signed URL, reports media orientation ── */
function CardMedia({
  fileKey, type, token, onOrientation,
}: {
  fileKey: string
  type: MessageItemType
  token: string
  onOrientation?: (landscape: boolean) => void
}) {
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

  if (err) return <p className={styles.cardMeta}>Could not load file</p>
  if (!src)  return <div className={styles.loadingBox}><div className={styles.spinner}/></div>

  if (type === 'photo') return (
    <img
      src={src}
      alt=""
      className={styles.fillMedia}
      onLoad={e => {
        const img = e.currentTarget
        onOrientation?.(img.naturalWidth > img.naturalHeight)
      }}
    />
  )
  if (type === 'video') return (
    <video
      src={src}
      className={styles.fillMedia}
      onLoadedMetadata={e => {
        const v = e.currentTarget
        onOrientation?.(v.videoWidth > v.videoHeight)
      }}
      controls
    />
  )
  if (type === 'audio' || type === 'voice_note') return (
    <div className={styles.audioCard}>
      <div className={styles.audioWave}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={styles.audioBar} style={{ '--h': `${20 + Math.sin(i * 1.3) * 60}%` } as React.CSSProperties}/>
        ))}
      </div>
      <audio src={src} controls className={styles.audioEl}/>
    </div>
  )
  return null
}

/* ── Map card — OSM iframe with warm CSS filter ── */
function MapCard({ content }: { content: string }) {
  const parsed = (() => { try { return JSON.parse(content) } catch { return null } })()
  if (!parsed?.lat || !parsed?.lon) return (
    <div className={styles.contentCard}>
      <span className={styles.contentIcon}><TypeIcon type="google_maps" size={28}/></span>
      <p className={styles.linkText}>{content.replace('https://', '')}</p>
    </div>
  )

  const { lat, lon, name } = parsed
  const delta = 0.012
  const bbox = `${+lon - delta},${+lat - delta},${+lon + delta},${+lat + delta}`
  // No &marker= — we render our own themed pin over the iframe center
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`
  const shortName = (name as string).split(',').slice(0, 3).join(', ')

  return (
    <div className={styles.mapWrap}>
      <iframe
        src={src}
        className={styles.mapFrame}
        title={shortName}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        sandbox="allow-scripts allow-same-origin"
      />

      {/* Custom rose pin centered over the location (always the bbox center) */}
      <div className={styles.mapPinIcon} aria-hidden="true">
        <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="#B97A6A"/>
          <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" stroke="#4A2326" strokeWidth="1.5"/>
          <circle cx="14" cy="14" r="5" fill="#fff" opacity="0.9"/>
        </svg>
      </div>

      {/* Place name label at bottom */}
      <div className={styles.mapLabel}>
        <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
          <path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z"/>
        </svg>
        <span>{shortName}</span>
      </div>
    </div>
  )
}

/* ── Single card ── */
function MemoryCard({
  item, token, position,
}: {
  item: MessageItem
  token: string | null
  position: number // -2, -1, 0, 1, 2
}) {
  const [landscape, setLandscape] = useState(false)
  const isCenter = position === 0
  const isFile = !!item.file_url

  // Determine position class
  let posClass = styles.cardFar
  if (position === 0)         posClass = styles.cardCenter
  else if (position === -1)   posClass = styles.cardLeft
  else if (position === 1)    posClass = styles.cardRight
  else if (position <= -2)    posClass = styles.cardFarLeft
  else if (position >= 2)     posClass = styles.cardFarRight

  const cardClass = [
    styles.card,
    posClass,
    landscape && isFile ? styles.cardLandscape : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={cardClass}>
      {/* Media fill */}
      {isFile && token ? (
        <CardMedia
          fileKey={item.file_url!}
          type={item.type}
          token={token}
          onOrientation={setLandscape}
        />
      ) : item.type === 'google_maps' && item.content ? (
        <MapCard content={item.content}/>
      ) : (
        <div className={styles.contentCard}>
          <span className={styles.contentIcon}><TypeIcon type={item.type} size={28}/></span>
          {item.type === 'note' && item.content ? (
            <p className={styles.noteText}>{item.content}</p>
          ) : (
            <p className={styles.linkText}>{item.content?.replace('https://', '') ?? ''}</p>
          )}
        </div>
      )}

      {/* Overlay label (center only, skip for maps which have their own label) */}
      {isCenter && item.type !== 'google_maps' && (
        <div className={styles.overlay}>
          <p className={styles.overlayTitle}>{item.title ?? LABEL[item.type]}</p>
          <span className={styles.overlayBadge}>
            <TypeIcon type={item.type} size={11}/>
            {LABEL[item.type]}
          </span>
        </div>
      )}
    </div>
  )
}

/* ── Main export ── */
interface MemoryCarouselProps {
  items: MessageItem[]
  token: string | null
  activeIndex: number
  onIndexChange: (i: number) => void
}

export default function MemoryCarousel({ items, token, activeIndex, onIndexChange }: MemoryCarouselProps) {
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--border-soft)' }}>
          <rect x="3" y="3" width="18" height="14" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8 21h8M12 17v4"/>
        </svg>
        <p className={styles.emptyText}>Your memories will appear here</p>
        <p className={styles.emptyMeta}>Add a memory using the panel on the left</p>
      </div>
    )
  }

  const prev = () => onIndexChange((activeIndex - 1 + items.length) % items.length)
  const next = () => onIndexChange((activeIndex + 1) % items.length)

  return (
    <div className={styles.wrap}>
      {/* Coverflow stage */}
      <div className={styles.stage}>
        {items.map((item, i) => {
          const pos = i - activeIndex
          if (Math.abs(pos) > 2) return null
          return (
            <div
              key={item.id}
              className={styles.slot}
              onClick={() => pos !== 0 && onIndexChange(i)}
              style={{ cursor: pos !== 0 ? 'pointer' : 'default' }}
            >
              <MemoryCard item={item} token={token} position={pos}/>
            </div>
          )
        })}

        {/* Arrow buttons */}
        {items.length > 1 && (
          <>
            <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={prev} aria-label="Previous">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 4l-6 6 6 6"/>
              </svg>
            </button>
            <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={next} aria-label="Next">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 4l6 6-6 6"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {items.length > 1 && (
        <div className={styles.dots}>
          {items.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
              onClick={() => onIndexChange(i)}
              aria-label={`Memory ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
