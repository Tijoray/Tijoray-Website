import { useState } from 'react'
import styles from './TutorialModal.module.css'

const STEPS = [
  {
    eyebrow: 'Step 1 of 3',
    title: 'Choose your memory type',
    body: 'Select from photos, videos, audio recordings, voice notes, written messages, Spotify songs, or meaningful places — anything that tells your story.',
    visual: (
      <div className={styles.visualGrid}>
        {[
          { label: 'Photo', icon: (
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="16" height="12" rx="2"/>
              <circle cx="10" cy="10" r="3"/>
              <path d="M7 4l1.5-2h3L13 4"/>
            </svg>
          )},
          { label: 'Video', icon: (
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="11" height="10" rx="2"/>
              <path d="M13 8l5-3v10l-5-3V8z"/>
            </svg>
          )},
          { label: 'Voice', icon: (
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="7" y="2" width="6" height="10" rx="3"/>
              <path d="M4 10a6 6 0 0012 0M10 16v2M7 18h6"/>
            </svg>
          )},
          { label: 'Note', icon: (
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"/>
              <path d="M8 8h4M8 12h2"/>
            </svg>
          )},
        ].map(({ label, icon }) => (
          <div key={label} className={styles.visualTab}>
            <span className={styles.visualIcon}>{icon}</span>
            <span className={styles.visualLabel}>{label}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    eyebrow: 'Step 2 of 3',
    title: 'Upload or write',
    body: 'Drag and drop a file, record a voice note right in your browser, paste a Spotify or Google Maps link, or simply write a heartfelt message.',
    visual: (
      <div className={styles.visualForm}>
        <div className={styles.visualField}>
          <span className={styles.visualFieldLabel}>Title</span>
          <div className={styles.visualFieldInput}>Our first dance</div>
        </div>
        <div className={styles.visualDropzone}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          <span>Drag & drop or click to select</span>
        </div>
      </div>
    ),
  },
  {
    eyebrow: 'Step 3 of 3',
    title: 'Preview as your recipient',
    body: 'The carousel on the right shows exactly how your memories will appear when your loved one taps their piece. Drag to reorder anytime.',
    visual: (
      <div className={styles.visualCarousel}>
        <div className={styles.visualCard}>
          <span className={styles.visualCardEyebrow}>Our first dance</span>
          <div className={styles.visualCardMedia}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
              <rect x="3" y="3" width="18" height="14" rx="2"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
        <div className={styles.visualDots}>
          <span className={`${styles.visualDot} ${styles.visualDotActive}`}/>
          <span className={styles.visualDot}/>
          <span className={styles.visualDot}/>
        </div>
      </div>
    ),
  },
]

interface TutorialModalProps {
  onClose: () => void
}

export default function TutorialModal({ onClose }: TutorialModalProps) {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdrop} role="dialog" aria-modal="true" aria-label="Memory Builder guide">
      <div className={styles.card}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close tutorial">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M2 2l12 12M14 2L2 14"/>
          </svg>
        </button>

        <div className={styles.header}>
          <p className={styles.eyebrow}>{current.eyebrow}</p>
          <h2 className={styles.title}>{current.title}</h2>
        </div>

        <div className={styles.visual}>{current.visual}</div>

        <p className={styles.body}>{current.body}</p>

        <div className={styles.footer}>
          <div className={styles.dots}>
            {STEPS.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === step ? styles.dotActive : ''}`}
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
          <div className={styles.actions}>
            {step > 0 && (
              <button className={styles.btnSecondary} onClick={() => setStep(s => s - 1)}>
                Previous
              </button>
            )}
            {isLast ? (
              <button className={styles.btnPrimary} onClick={onClose}>
                Get Started
              </button>
            ) : (
              <button className={styles.btnPrimary} onClick={() => setStep(s => s + 1)}>
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
