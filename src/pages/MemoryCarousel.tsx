import { useState, useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import type { MessageItem, MessageItemType } from '../lib/supabase'
import MemoryIcon from '../components/MemoryIcon'
import styles from './MemoryCarousel.module.css'
import { useMediaSrc, mimeForItem } from '../lib/media'

const LABEL: Record<MessageItemType, string> = {
  photo: 'Photo', video: 'Video', audio: 'Audio', voice_note: 'Voice Note',
  note: 'Note', spotify: 'Song', google_maps: 'Place',
}


/* ── Fetches a signed URL, reports media orientation ── */
function CardMedia({
  fileKey, type, token, pieceId, mime, onOrientation,
}: {
  fileKey: string
  type: MessageItemType
  token: string
  pieceId: string | null
  mime?: string
  onOrientation?: (landscape: boolean) => void
}) {
  // Stored objects are fetched and decrypted into an object URL rather than
  // handed to the browser as a signed link — the bytes are a container no
  // <img> or <video> would understand.
  const { src, error: err } = useMediaSrc(fileKey, token, pieceId, {
    mime: mimeForItem(type, mime ? { mime } : null),
  })

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

/* ── Leaflet map with custom rose marker ── */
const PIN_SVG = `
  <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
      fill="#B97A6A" stroke="#4A2326" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="5" fill="white" opacity="0.9"/>
  </svg>
`.trim()

function LeafletMapInner({ lat, lon }: { lat: number; lon: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Dynamic import so Leaflet's window references don't break SSR/Vite build
    import('leaflet').then(L => {
      // Import Leaflet CSS once
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id   = 'leaflet-css'
        link.rel  = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      const map = L.map(containerRef.current!, {
        center:             [lat, lon],
        zoom:               15,
        zoomControl:        false,
        attributionControl: false,
        dragging:           true,
        scrollWheelZoom:    false,  // off — avoids hijacking page scroll
        doubleClickZoom:    true,
        touchZoom:          true,
        keyboard:           false,
      })

      // CartoDB Positron — clean, minimal, no API key required
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom:    19,
      }).addTo(map)

      // Custom rose/burgundy pin
      const icon = L.divIcon({
        html:       PIN_SVG,
        className:  '',          // removes Leaflet's default white box
        iconSize:   [28, 36],
        iconAnchor: [14, 36],    // tip of pin at exact coords
      })

      L.marker([lat, lon], { icon }).addTo(map)
      mapRef.current = map
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [lat, lon])

  return <div ref={containerRef} className={styles.leafletContainer}/>
}

function MapCard({ content }: { content: string }) {
  const parsed = (() => { try { return JSON.parse(content) } catch { return null } })()
  if (!parsed?.lat || !parsed?.lon) return (
    <div className={styles.contentCard}>
      <span className={styles.contentIcon}><MemoryIcon type="google_maps" size={28}/></span>
      <p className={styles.linkText}>{content.replace('https://', '')}</p>
    </div>
  )

  const { lat, lon, name } = parsed
  const shortName = (name as string).split(',').slice(0, 3).join(', ')

  return (
    <div className={styles.mapWrap}>
      <LeafletMapInner lat={+lat} lon={+lon}/>
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
  item, token, pieceId, position,
}: {
  item: MessageItem
  token: string | null
  pieceId: string | null
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

  const isMap = item.type === 'google_maps'
  const cardClass = [
    styles.card,
    posClass,
    (landscape && isFile) || isMap ? styles.cardLandscape : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={cardClass}>
      {/* Media fill */}
      {isFile && token ? (
        <CardMedia
          fileKey={item.file_url!}
          type={item.type}
          token={token}
          pieceId={pieceId}
          mime={item.mime}
          onOrientation={setLandscape}
        />
      ) : item.type === 'google_maps' && item.content ? (
        <MapCard content={item.content}/>
      ) : (
        <div className={styles.contentCard}>
          <span className={styles.contentIcon}><MemoryIcon type={item.type} size={28}/></span>
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
            <MemoryIcon type={item.type} size={11}/>
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
  /// Needed to look up the piece's data key. The carousel receives items whose
  /// text is already decrypted, but media is fetched lazily per card and so
  /// has to be able to reach the key itself.
  pieceId: string | null
  activeIndex: number
  onIndexChange: (i: number) => void
}

export default function MemoryCarousel({ items, token, pieceId, activeIndex, onIndexChange }: MemoryCarouselProps) {
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

  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    swipeStartRef.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const start = swipeStartRef.current
    swipeStartRef.current = null
    if (!start || items.length < 2) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next()
      else prev()
    }
  }

  return (
    <div className={styles.wrap}>
      {/* Coverflow stage */}
      <div
        className={styles.stage}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        style={{ touchAction: 'pan-y' }}
      >
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
              <MemoryCard item={item} token={token} pieceId={pieceId} position={pos}/>
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
