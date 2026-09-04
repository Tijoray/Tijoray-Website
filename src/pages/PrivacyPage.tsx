import styles from './PrivacyPage.module.css'
import { LEGAL_NAME, SUPPORT_EMAIL } from '../lib/brand'

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.eyebrow}>Legal</p>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: 28 August 2026</p>
      </div>

      <div className={styles.content}>

        <div className={styles.section}>
          <h2>Who we are</h2>
          <p>Tijoray ("we", "us", "our") is an operating name of {LEGAL_NAME}, and operates tijoray.com and the Tijoray vault platform. Our registered correspondence address is available on request at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
        </div>

        <div className={styles.section}>
          <h2>What we collect</h2>
          <p>We collect information you give us directly when you:</p>
          <ul>
            <li>Create an account: name, email address, and password (stored as a hashed credential via Supabase Auth)</li>
            <li>Verify a mobile number: the number you type into the Tijoray app or this site, which is what links a piece to your account</li>
            <li>Place an order: billing details, shipping address, and payment information (processed by Stripe; we never store raw card numbers)</li>
            <li>Upload content to your vault: photos, videos, voice notes, and written messages you choose to store</li>
            <li>Contact us: name, email, and message content submitted via our contact form</li>
          </ul>
          <p>We also collect limited technical data automatically: IP address, browser type, pages visited, and referring URL via server logs and Vercel Analytics. We do not use third-party advertising trackers.</p>
        </div>

        <div className={styles.section}>
          <h2>How we use your data</h2>
          <ul>
            <li>To fulfill and ship your order</li>
            <li>To operate your digital vault and authenticate NFC tap events</li>
            <li>To send transactional emails (order confirmation, shipping updates) via Resend</li>
            <li>To respond to support enquiries</li>
            <li>To improve site performance using aggregated, anonymised analytics</li>
          </ul>
          <p>We do not sell your personal data. We do not use your vault contents for any purpose other than storing and serving them back to you.</p>
        </div>

        <div className={styles.section}>
          <h2>Mobile numbers and text messages</h2>
          <p>A mobile number is only ever collected from you directly: you enter your own number in the Tijoray app or on this site and ask us to send a code. We never buy, rent, or import numbers from anyone else.</p>
          <p>We use the number for two things. The first is a one-time passcode confirming the number is yours, which is how a piece bought for you is matched to your account. The second is occasional service notifications about the delivery and servicing of the piece you own. We send no marketing or promotional text messages.</p>
          <p>Message frequency varies. Message and data rates may apply. Reply STOP to any message to opt out, or HELP for help. Carriers are not liable for delayed or undelivered messages.</p>
          <p><strong>No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.</strong> All of the categories described elsewhere in this policy exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.</p>
          <p>Our messaging provider transmits these messages on our behalf and processes your number only for that purpose.</p>
        </div>

        <div className={styles.section}>
          <h2>How we store and protect your data</h2>
          <p>Account data and vault metadata are stored in Supabase (EU region). Vault media files are stored in Cloudflare R2 with private-access controls. All data in transit is encrypted via TLS. Vault contents are encrypted at rest with AES-256.</p>
          <p><strong>How the encryption actually works.</strong> Memories and media you upload, including photos, videos, voice notes and written messages, are encrypted in your browser before they leave your device. What we receive and store is ciphertext.</p>
          <p>Every piece has its own encryption key. We hold those keys in escrow: each one is wrapped under a master key held on our servers, and released only to the sender and the recipient of that piece once their identity is verified. <strong>This is not end-to-end encryption.</strong> Because we hold the master key, we are technically capable of decrypting vault contents, and we would do so if legally compelled. We do not do so otherwise, no customer-support or administrative tool in our systems displays vault contents, and access to the master key is limited to the engineers who operate our production environment.</p>
          <p>We chose key escrow deliberately rather than by omission. It is what allows a piece to be given to someone else, handed on to the next generation, or recovered after a lost phone. None of that is possible when the only copy of a key lives on one device. We would rather describe that trade-off accurately than claim a guarantee we cannot keep.</p>
        </div>

        <div className={styles.section}>
          <h2>Third-party services</h2>
          <p>We share limited data with the following processors, each bound by a data processing agreement:</p>
          <ul>
            <li><strong>Stripe</strong> (US): payment processing and fraud prevention at checkout</li>
            <li><strong>Supabase</strong> (EU region): database and authentication</li>
            <li><strong>Cloudflare R2</strong>: encrypted media file storage</li>
            <li><strong>Resend</strong> (US): transactional email</li>
            <li><strong>Vonage</strong> (US): delivery of verification codes and service notifications by SMS. Numbers are passed to Vonage solely to send the message you asked for, and are not used by Vonage for its own purposes</li>
            <li><strong>Vercel</strong> (US): hosting, edge infrastructure, and cookieless analytics</li>
            <li><strong>Google</strong>: Sign in with Google, if you choose it, and web font delivery</li>
            <li><strong>Apple</strong>: Sign in with Apple, if you choose it</li>
            <li><strong>OpenStreetMap Foundation</strong>: address lookup. When you type an address during sign-up, the text is sent through our servers to OpenStreetMap's geocoder to offer suggestions. Your IP address is not passed on.</li>
            <li><strong>CARTO</strong>: map tiles, loaded only when you open a memory that has a location attached</li>
          </ul>
          <p>Transfers outside the UK and EEA to the processors above are made under the UK and EU Standard Contractual Clauses, or the EU–US and UK–US Data Privacy Framework where the recipient is certified.</p>
        </div>

        <div className={styles.section}>
          <h2>Cookies</h2>
          <p>We use no advertising or profiling cookies, and our analytics are cookieless. What we do store on your device is a small set of items needed to keep you signed in, remember your cart, and remember interface choices you have already made.</p>
          <p>Each item is listed individually, with its name, purpose, and whether it is strictly necessary, on our <a href="/cookies">Cookies and storage</a> page.</p>
        </div>

        <div className={styles.section}>
          <h2>Your rights</h2>
          <p>You have the right to access, correct, export, or delete your personal data, and to object to or restrict how we process it.</p>
          <p>Your account settings let you change your name, phone number, email address, and password directly. Everything else, such as a copy of your data, deletion of your account, or any other request, is handled by email: write to <a href="mailto:support@tijoray.com">support@tijoray.com</a> and we will respond within 30 days. We are building a self-service export; until it ships, we assemble it by hand on request.</p>
          <p>If you are in the UK or EU, you also have the right to lodge a complaint with your local data protection authority.</p>
        </div>

        <div className={styles.section}>
          <h2>Age</h2>
          <p>Tijoray is sold to adults. You must be 18 or over to buy a piece or hold an account, and we do not knowingly collect personal data from children.</p>
          <p>Vault content is a separate matter: pieces are often given between family members, and the photographs, recordings and messages placed inside them frequently show children. That content is uploaded by the adult account holder, who is responsible for having the right to share it. If you believe content depicting a child has been uploaded without the right to do so, write to <a href="mailto:support@tijoray.com">support@tijoray.com</a> and we will act on it.</p>
        </div>

        <div className={styles.section}>
          <h2>How long we keep things</h2>
          <p>Vault contents and account data are kept while your account is open. If you delete your account, they are permanently deleted within 30 days.</p>
          <p>Order and payment records are kept for seven years after the order, because tax and accounting law requires it. Support correspondence is kept for two years. Server logs containing IP addresses are kept for 30 days.</p>
        </div>

        <div className={styles.section}>
          <h2>If something goes wrong</h2>
          <p>If a breach occurs that is likely to result in a risk to your rights and freedoms, we will report it to the relevant supervisory authority within 72 hours of becoming aware of it, and tell affected customers directly without undue delay where the risk is high. Given how our encryption works, described above, we would not claim that encrypted vault contents are beyond reach in a breach that also reached our key material, and we would notify accordingly.</p>
        </div>

        <div className={styles.section}>
          <h2>If an account holder dies</h2>
          <p>A Tijoray piece is made to be handed on, and an account can outlive the person who opened it. If you are an executor or next of kin, write to <a href="mailto:support@tijoray.com">support@tijoray.com</a>. On satisfactory proof of death and of your authority, we will transfer the piece and its vault to the person entitled to it, or provide a copy of the contents, as instructed.</p>
        </div>

        <div className={styles.section}>
          <h2>Changes to this policy</h2>
          <p>If we make material changes we will update the date at the top of this page and, where appropriate, notify you by email. Continued use of Tijoray after changes constitutes acceptance.</p>
        </div>

        <div className={styles.section}>
          <h2>Contact</h2>
          <p>Questions about this policy: <a href="mailto:support@tijoray.com">support@tijoray.com</a></p>
        </div>

      </div>
    </div>
  )
}
