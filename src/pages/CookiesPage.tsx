import styles from './PrivacyPage.module.css'
import { usePageMeta } from '../lib/usePageMeta'

/**
 * Cookies and storage disclosure.
 *
 * PECR and the ePrivacy Directive attach to storing or reading anything on a
 * visitor's device, not to the word "cookie" — so localStorage is listed here
 * on the same footing. Every row was taken from the code; if you add storage,
 * add it here in the same commit.
 */

type Row = { name: string; setter: string; kind: string; purpose: string; necessary: boolean; note?: string }

const STORAGE: Row[] = [
  {
    name: 'sb-…-auth-token', setter: 'Supabase', kind: 'Local storage',
    purpose: 'Keeps you signed in between visits, so you are not asked for your password on every page.',
    necessary: true,
  },
  {
    name: 'tijoray_cart', setter: 'Tijoray', kind: 'Local storage',
    purpose: 'Remembers the pieces you have configured so your cart survives a refresh.',
    necessary: true,
  },
  {
    name: 'tijoray_checkout_draft', setter: 'Tijoray', kind: 'Session storage',
    purpose: 'Keeps non-secret checkout fields through sign-in or email verification in this browser tab. Passwords are never stored.',
    necessary: true,
  },
  {
    name: 'tijoray_checkout_promo', setter: 'Tijoray', kind: 'Session storage',
    purpose: 'Keeps the promo code you entered through sign-in or email verification in this browser tab.',
    necessary: true,
  },
  {
    name: 'mb_tutorial_seen', setter: 'Tijoray', kind: 'Local storage',
    purpose: 'Remembers that you have already seen the walkthrough for adding a memory, so it is not shown again.',
    necessary: false,
  },
  {
    name: 'mb_rec_dismissed', setter: 'Tijoray', kind: 'Local storage',
    purpose: 'Remembers that you dismissed the prompt to record a voice note.',
    necessary: false,
  },
  {
    name: '__stripe_mid, __stripe_sid', setter: 'Stripe', kind: 'Cookie',
    purpose: 'Fraud prevention while you are paying. Set by Stripe on the checkout page.',
    necessary: true,
  },
]

const SENDERS = [
  { who: 'Vercel Analytics', when: 'Every page view',
    what: 'Page path, referrer and IP address. No cookie is set and no profile is built; the figures we see are aggregated.' },
  { who: 'Google Fonts', when: 'Every page view',
    what: 'IP address and browser details, in order to serve the two typefaces the site is set in.' },
  { who: 'OpenStreetMap', when: 'Typing an address at sign-up',
    what: 'The address text you are typing, sent via our own servers so that your IP address is not passed on.' },
  { who: 'CARTO', when: 'Opening a memory with a location',
    what: 'IP address and the map tiles requested, in order to draw the map.' },
  { who: 'Stripe', when: 'Checkout',
    what: 'IP address, billing and payment details, in order to take the payment.' },
]

export default function CookiesPage() {
  usePageMeta('Cookies & Storage', 'Every cookie and item of browser storage Tijoray uses, what each is for, and which are strictly necessary.')

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.eyebrow}>Legal</p>
        <h1 className={styles.title}>Cookies and storage</h1>
        <p className={styles.updated}>Last updated: 5 September 2026</p>
      </div>

      <div className={styles.content}>

        <div className={styles.section}>
          <h2>The short version</h2>
          <p>We use no advertising cookies, no profiling cookies, and no third-party trackers. Our analytics do not use cookies at all. What we store on your device is the handful of items below: enough to keep you signed in, hold your cart and checkout progress, and remember interface choices you have already made.</p>
          <p>The law here covers anything stored on or read from your device, not only cookies, so browser local storage is listed on the same footing.</p>
        </div>

        <div className={styles.section}>
          <h2>What we store on your device</h2>
          <ul className={styles.itemList}>
            {STORAGE.map(r => (
              <li key={r.name} className={styles.item}>
                <div className={styles.itemHead}>
                  <span className={styles.itemName}>{r.name}</span>
                  <span className={r.necessary ? styles.pillNeeded : styles.pillOptional}>
                    {r.necessary ? 'Strictly necessary' : 'Preference'}
                  </span>
                </div>
                <p className={styles.itemMeta}>{r.kind} · set by {r.setter}</p>
                <p className={styles.itemPurpose}>{r.purpose}</p>
              </li>
            ))}
          </ul>
          <p>The two marked as preferences only record a choice you have already made. Clearing your browser storage removes them; the walkthrough and the prompt will simply appear again.</p>
        </div>

        <div className={styles.section}>
          <h2>Where your browser sends data</h2>
          <p>These set nothing on your device, but loading a page contacts them, and a request always carries your IP address. We list them so the picture is complete.</p>
          <ul className={styles.itemList}>
            {SENDERS.map(r => (
              <li key={r.who} className={styles.item}>
                <div className={styles.itemHead}>
                  <span className={styles.itemName}>{r.who}</span>
                  <span className={styles.pillWhen}>{r.when}</span>
                </div>
                <p className={styles.itemPurpose}>{r.what}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.section}>
          <h2>Managing it</h2>
          <p>Every browser lets you clear or block cookies and site data, usually under Privacy settings. Blocking the items marked strictly necessary will sign you out and empty your cart, but nothing will break permanently.</p>
          <p>If we ever add storage that is not strictly necessary, an advertising pixel for example, we will ask for your consent before setting it, and this page will say so first.</p>
        </div>

        <div className={styles.section}>
          <h2>Contact</h2>
          <p>Questions about this page: <a href="mailto:support@tijoray.com">support@tijoray.com</a>. See also our <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms of Service</a>.</p>
        </div>

      </div>
    </div>
  )
}
