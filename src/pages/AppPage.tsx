import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './AppPage.module.css'
import { APP_MEDIA } from '../lib/assets'
import { usePageMeta } from '../lib/usePageMeta'

const SETUP_STEPS = [
  {
    number: '01',
    title: 'Install the Tijoray app',
    body: 'The official iPhone and Android links will appear on this page when the store listings are live.',
  },
  {
    number: '02',
    title: 'Sign in and verify your number',
    body: 'Use the account connected to your gift. A one-time code confirms that the mobile number belongs to you.',
  },
  {
    number: '03',
    title: 'Tap your Tijoray piece',
    body: 'Open the app and hold the back of your compatible phone against the tap point shown in the on-screen guide.',
  },
  {
    number: '04',
    title: 'Open the memory collection',
    body: 'The app checks your piece and account online, then opens the memories and provenance available to you.',
  },
]

export default function AppPage() {
  const [previewFailed, setPreviewFailed] = useState(false)
  usePageMeta('The Tijoray App', 'Tijoray app availability, planned phone compatibility and the verified-account setup needed to open a piece.')

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>The Tijoray App</p>
        <h1 className={styles.title}>One tap opens what was made for you.</h1>
        <p className={styles.lede}>
          The Tijoray app is not yet available in the Apple App Store or Google Play.
          These buttons will activate only when the official listings are live.
        </p>
        <div className={styles.status} role="status">Store launch in preparation</div>
      </section>

      <section className={styles.downloadSection} aria-labelledby="download-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Official Downloads</p>
          <h2 id="download-title">Coming soon</h2>
          <p>Do not install a similarly named app. We will link directly to the verified Tijoray listings here.</p>
        </div>
        <div className={styles.storeGrid}>
          <button className={styles.storeButton} type="button" disabled aria-disabled="true">
            <span className={styles.storeKicker}>iPhone app</span>
            <strong>Apple App Store</strong>
            <span className={styles.storeStatus}>Not yet live</span>
          </button>
          <button className={styles.storeButton} type="button" disabled aria-disabled="true">
            <span className={styles.storeKicker}>Android app</span>
            <strong>Google Play</strong>
            <span className={styles.storeStatus}>Not yet live</span>
          </button>
        </div>
      </section>

      <section className={styles.previewSection} aria-labelledby="preview-title">
        <div className={styles.previewCopy}>
          <p className={styles.eyebrow}>Pre-release Preview</p>
          <h2 id="preview-title">Your collection, in one place.</h2>
          <p>
            The app brings each authenticated Tijoray piece, its memories and its certificate into one private collection. This image is from the current development build, so the final release interface may change.
          </p>
        </div>
        <div className={styles.previewPhone}>
          {previewFailed ? (
            <div className={styles.previewPlaceholder} role="img" aria-label="Tijoray collection app preview temporarily unavailable">
              <strong>Tijoray</strong>
              <span>App preview temporarily unavailable</span>
            </div>
          ) : (
            <img
              src={APP_MEDIA.pieceScreen}
              alt="Tijoray app collection screen showing an authenticated square birthstone pendant"
              loading="lazy"
              onError={() => setPreviewFailed(true)}
            />
          )}
        </div>
      </section>

      <section className={styles.compatibilitySection} aria-labelledby="compatibility-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Compatibility</p>
          <h2 id="compatibility-title">What you will need</h2>
          <p>Final device and operating-system support will be confirmed after release testing.</p>
        </div>
        <div className={styles.compatibilityGrid}>
          <article className={styles.compatibilityCard}>
            <h3>iPhone</h3>
            <p>Planned for NFC-capable iPhones. The exact supported iPhone and iOS versions are still being verified.</p>
          </article>
          <article className={styles.compatibilityCard}>
            <h3>Android</h3>
            <p>Planned for Android phones with NFC enabled. The exact supported models and Android versions are still being verified.</p>
          </article>
          <article className={styles.compatibilityCard}>
            <h3>Account and internet</h3>
            <p>A verified Tijoray account and an internet connection are required to check access and load online memories.</p>
          </article>
          <article className={styles.compatibilityCard}>
            <h3>The jewelry</h3>
            <p>The NFC component inside a Tijoray piece is passive. It needs no pairing, battery, or charging.</p>
          </article>
        </div>
      </section>

      <section className={styles.setupSection} aria-labelledby="setup-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>First Use</p>
          <h2 id="setup-title">From download to reveal</h2>
        </div>
        <ol className={styles.steps}>
          {SETUP_STEPS.map(step => (
            <li key={step.number} className={styles.step}>
              <span className={styles.stepNumber}>{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.helpSection}>
        <p className={styles.eyebrow}>Need help?</p>
        <h2>We will help you find the tap point.</h2>
        <p>Phone NFC antennas sit in different places. The released app will show positioning guidance for supported devices.</p>
        <div className={styles.actions}>
          <Link to="/technology" className={styles.primaryAction}>See How It Works</Link>
          <Link to="/contact" className={styles.secondaryAction}>Contact the Atelier</Link>
        </div>
      </section>
    </main>
  )
}
