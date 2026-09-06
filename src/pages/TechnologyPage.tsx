import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './TechnologyPage.module.css'
import { APP_MEDIA } from '../lib/assets'
import { useReveal } from '../lib/useReveal'
import { usePageMeta } from '../lib/usePageMeta'

const NFC_STEPS = [
  {
    num: '01',
    title: 'Tap Your Piece',
    desc: 'Install the Tijoray app, sign in to a verified account, and hold your jewelry to the back of a compatible phone. The jewelry needs no pairing, battery, or charging.',
    image: APP_MEDIA.tapPiece,
    imageAlt: 'Tijoray app screen prompting the owner to tap their piece to the back of their phone',
  },
  {
    num: '02',
    title: 'Identity Confirmed',
    desc: "Your piece's unique serial identity and account access are checked online before its memory collection opens.",
    image: APP_MEDIA.establishingConnection,
    imageAlt: 'Tijoray app establishing a connection with a scanned jewelry piece',
  },
  {
    num: '03',
    title: 'Your World Unlocks',
    desc: 'The full digital profile of your piece opens: provenance, stone data, personal memories, and the certificate that proves its origin.',
    image: APP_MEDIA.main,
    imageAlt: 'Authenticated Tijoray square pendant profile with memory, certificate and vault options',
  },
]

const APP_FEATURES = [
  {
    label: 'The Tijoray Experience',
    title: 'A message waiting inside your gift.',
    body: 'After purchase, add photographs, voice recordings and notes to the piece\'s encrypted online memory collection. When the recipient taps the jewelry with the Tijoray app, the collection opens for their authorized account.',
    pills: ['Photos & Video', 'Voice Messages', 'Personal Notes', 'Revealed on First Tap'],
    media: { kind: 'video' as const, src: APP_MEDIA.memories, alt: 'Tijoray app memory reveal from a gift giver' },
  },
  {
    label: 'Stone Intelligence',
    title: 'Every stone, documented.',
    body: 'Tap your piece and open its stone record. Stone type, cut, color and setting are recorded by the atelier when the piece is made and associated with its unique identity.',
    pills: ['Stone Type', 'Cut & Color', 'Setting', 'Atelier Record'],
    media: { kind: 'image' as const, src: APP_MEDIA.authenticity, alt: 'Tijoray Certificate of Authenticity screen showing recorded stone details' },
  },
  {
    label: 'Gold Composition',
    title: 'Know what you wear.',
    body: 'Every alloy in your Tijoray piece is catalogued for metal purity, color composition and total mass, then verified by the atelier before the piece ships.',
    pills: ['Metal Purity', 'Composition', 'Weight', 'Atelier Verified'],
    media: null,
  },
  {
    label: 'The Vault',
    title: 'A private archive with managed recovery.',
    body: 'Beyond the shared gift memories, the owner has a private area for photographs, recordings and documents. Access is restricted to the owner\'s verified account. Tijoray manages the recovery keys and can technically decrypt stored content; this is not end-to-end encryption.',
    pills: ['Personal Storage', 'Certificate Archive', 'Date Organized', 'Secure Access'],
    media: { kind: 'image' as const, src: APP_MEDIA.vault, alt: 'Tijoray Vault screen containing private photo, video and music memories' },
  },
]

const STATS = [
  { num: 'No Battery', label: 'Passive NFC Chip' },
  { num: 'Encrypted', label: 'Vault Storage' },
  { num: 'Verified', label: 'Provenance Record' },
]

function AppCapturePlaceholder({ label }: { label: string }) {
  return (
    <div className={styles.appCapturePlaceholder} role="img" aria-label={`Tijoray app preview for ${label}; current release capture pending`}>
      <span className={styles.placeholderBrand}>Tijoray</span>
      <span className={styles.placeholderMark} aria-hidden="true">T</span>
      <span className={styles.placeholderLabel}>{label}</span>
      <span className={styles.placeholderStatus}>Current app capture pending</span>
    </div>
  )
}

function AppCapture({
  label,
  src,
  alt,
  variant,
  kind = 'image',
}: {
  label: string
  src?: string
  alt?: string
  variant: 'flow' | 'feature'
  kind?: 'image' | 'video'
}) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) return <AppCapturePlaceholder label={label} />

  const className = variant === 'flow' ? styles.phoneImg : styles.featureMedia

  if (kind === 'video') {
    return (
      <video
        className={className}
        aria-label={alt}
        poster="/assets/app/memories-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        controls
        preload="metadata"
        onError={() => setFailed(true)}
      >
        <source src="/assets/app/memories.mp4" type="video/mp4" />
        <source src={src} type="video/quicktime" />
      </video>
    )
  }

  return <img className={className} src={src} alt={alt ?? label} loading="lazy" onError={() => setFailed(true)} />
}

export default function TechnologyPage() {
  usePageMeta('The Technology', 'How the Tijoray vault works: a passive NFC chip sealed into the piece, AES-256 encrypted memories, and a provenance record verified on every tap.')
  const reveal = useReveal(styles.inView)

  return (
    <main className={styles.technology}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>The Technology</p>
          <h1 className={styles.heroTitle}>
            The intelligence <em>within</em> your jewel.
          </h1>
          <p className={styles.heroSub}>
            Every Tijoray piece carries a concealed passive NFC chip containing its
            unique identity. One tap connects the Tijoray app to the piece record
            and encrypted memories stored in Tijoray's online service.
          </p>
        </div>
        <hr className={styles.heroRule} />
      </section>

      {/* ── NFC Flow ── */}
      <section className={`${styles.nfcSection} ${styles.fadeUp}`} ref={reveal}>
        <div className={styles.nfcInner}>
          <div className={styles.nfcHeader}>
            <p className={styles.eyebrow}>How It Works</p>
            <h2 className={styles.sectionTitle}>Three moments. One connection.</h2>
          </div>
          <div className={styles.nfcGrid}>
            {NFC_STEPS.map((step, i) => (
              <article
                key={step.num}
                className={`${styles.nfcCard} ${styles.fadeUp}`}
                ref={reveal}
                style={{ transitionDelay: `${i * 0.06}s` }}
              >
                <div className={styles.nfcStepNum}>{step.num}</div>
                <div className={styles.phoneFrame}>
                  <AppCapture label={step.title} src={step.image} alt={step.imageAlt} variant="flow" />
                </div>
                <h3 className={styles.nfcCardTitle}>{step.title}</h3>
                <p className={styles.nfcCardDesc}>{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── App Features ── */}
      <section className={styles.appSection}>
        <div className={styles.appInner}>
          <div className={`${styles.appHeader} ${styles.fadeUp}`} ref={reveal}>
            <p className={styles.eyebrow}>The App</p>
            <h2 className={styles.sectionTitle}>Your Digital Atelier</h2>
            <p className={styles.appHeaderSub}>
              Prepare the gift in your web memory portal after purchase. The recipient uses the Tijoray app, a verified account and internet access to open it.
            </p>
          </div>

          {APP_FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className={`${styles.featureRow} ${i % 2 !== 0 ? styles.featureReverse : ''} ${styles.fadeUp}`}
              ref={reveal}
            >
              <div className={styles.featurePhone}>
                <div className={styles.appPhoneFrame}>
                  <AppCapture
                    label={feature.title}
                    src={feature.media?.src}
                    alt={feature.media?.alt}
                    kind={feature.media?.kind}
                    variant="feature"
                  />
                </div>
              </div>
              <div className={styles.featureContent}>
                <p className={styles.featureLabel}>{feature.label}</p>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureBody}>{feature.body}</p>
                <div className={styles.pillsRow}>
                  {feature.pills.map(pill => (
                    <span key={pill} className={styles.pill}>{pill}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Provenance record ── */}
      <section className={`${styles.heritageSection} ${styles.fadeUp}`} ref={reveal}>
        <div className={styles.heritageInner}>
          <blockquote className={styles.heritageQuote}>
            "Every Tijoray piece is registered in our archive the moment it is
            made, with its stones, its alloy and its serial identity checked on
            every tap."
          </blockquote>
          <div className={styles.statGrid}>
            {STATS.map(stat => (
              <div key={stat.label} className={styles.statCard}>
                <div className={styles.statNum}>{stat.num}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={`${styles.ctaSection} ${styles.fadeUp}`} ref={reveal}>
        <div className={styles.ctaInner}>
          <p className={styles.eyebrow}>Begin</p>
          <h2 className={styles.ctaTitle}>
            Your piece is <em>waiting.</em>
          </h2>
          <div className={styles.ctaBtns}>
            <Link to="/collection" className={styles.btnPrimary}>Build Your Tijoray</Link>
            <Link to="/app" className={styles.btnSecondary}>App &amp; Compatibility</Link>
            <Link to="/contact" className={styles.btnSecondary}>Speak with the Atelier</Link>
          </div>
        </div>
      </section>

    </main>
  )
}
