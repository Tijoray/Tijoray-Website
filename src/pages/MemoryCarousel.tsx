import { useState, useEffect } from 'react'
import type { MessageItem, MessageItemType } from '../lib/supabase'
import styles from './MemoryCarousel.module.css'

/* ── Type icons (SVG, color-matched) ── */
function TypeIcon({ type, size = 16 }: { type: MessageItemType; size?: number }) {
  const props = { width: size, height: size, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (type === 'photo') return (
    <svg {...props}><rect x="2" y="4" width="16" height="12" rx="2"/><circle cx="10" cy="10" r="3"/><path d="M7 4l1.5-2h3L13 4"/></svg>
  )
  if (type === 'video') return (
    <svg {...props}><rect x="2" y="5" width="11" height="10" rx="2"/><path d="M13 8l5-3v10l-5-3V8z"/></svg>
  )
  if (type === 'audio') return (
    <svg {...props}><path d="M9 4l-5 4H2a1 1 0 00-1 1v2a1 1 0 001 1h2l5 4V4z"/><path d="M15 8a4 4 0 010 4M18 6a7 7 0 010 8"/></svg>
  )
  if (type === 'voice_note') return (
    <svg {...props}><rect x="7" y="2" width="6" height="10" rx="3"/><path d="M4 10a6 6 0 0012 0M10 16v2M7 18h6"/></svg>
  )
  if (type === 'note') return (
    <svg {...props}><path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"/><path d="M8 8h4M8 12h2"/></svg>
  )
  if (type === 'spotify') return (
    <svg {...props}><circle cx="10" cy="10" r="8"/><path d="M6 12.5c2.5-1 5-1 7.5 0M5.5 9.5C9 8 12 8 15 9.5M7 6.5c2-1 4.5-1 6.5 0"/></svg>
  )
  if (type === 'google_maps') return (
    <svg {...props}><path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z"/><circle cx="10" cy="8" r="2"/></svg>
  )
  return null
}

/* ── SignedMedia (local copy for carousel cards) ── */
function CardMedia({ fileKey, type, token }: { fileKey: string; type: MessageItemType; token: string }) {
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
  if (!src) return <div className={styles.cardLoading}><div className={styles.cardSpinner}/></div>

  if (type === 'photo') return <img src={src} alt="" className={styles.cardMedia}/>
  if (type === 'video') return <video src={src} controls className={styles.cardMedia}/>
  if (type === 'audio' || type === 'voice_note') return <audio src={src} controls className={styles.cardAudio}/>
  return null
}

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
        <div className={styles.emptyIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="14" rx="2"/>
            <circle cx="12" cy="10" r="3"/>
            <path d="M8 21h8M12 17v4"/>
          </svg>
        </div>
        <p className={styles.emptyText}>Your memories will appear here</p>
        <p className={styles.emptyMeta}>Add a memory using the panel on the left</p>
      </div>
    )
  }

  const item = items[activeIndex] ?? items[0]
  const LABEL: Record<MessageItemType, string> = {
    photo: 'Photo', video: 'Video', audio: 'Audio', voice_note: 'Voice Note',
    note: 'Note', spotify: 'Song', google_maps: 'Place',
  }

  return (
    <div className={styles.wrap}>
      {/* Card */}
      <div className={styles.cardWrap}>
        {items.length > 1 && (
          <button
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={() => onIndexChange((activeIndex - 1 + items.length) % items.length)}
            aria-label="Previous memory"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 4l-6 6 6 6"/>
            </svg>
          </button>
        )}

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.cardEyebrow}>
              {item.title ?? LABEL[item.type]}
            </p>
            <span className={styles.cardTypeIcon}>
              <TypeIcon type={item.type} size={14}/>
            </span>
          </div>

          <div className={styles.cardBody}>
            {item.file_url && token ? (
              <CardMedia fileKey={item.file_url} type={item.type} token={token}/>
            ) : item.type === 'note' && item.content ? (
              <p className={styles.cardNote}>{item.content}</p>
            ) : item.type === 'spotify' && item.content ? (
              <div className={styles.cardLink}>
                <TypeIcon type="spotify" size={20}/>
                <span className={styles.cardLinkText}>{item.content.replace('https://', '')}</span>
              </div>
            ) : item.type === 'google_maps' && item.content ? (
              <div className={styles.cardLink}>
                <TypeIcon type="google_maps" size={20}/>
                <span className={styles.cardLinkText}>{item.content.replace('https://', '')}</span>
              </div>
            ) : null}
          </div>

          <p className={styles.cardCounter}>{activeIndex + 1} / {items.length}</p>
        </div>

        {items.length > 1 && (
          <button
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={() => onIndexChange((activeIndex + 1) % items.length)}
            aria-label="Next memory"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 4l6 6-6 6"/>
            </svg>
          </button>
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
