import styles from './PrivacyPage.module.css'

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.eyebrow}>Legal</p>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: 27 May 2026</p>
      </div>

      <div className={styles.content}>

        <div className={styles.section}>
          <h2>Who we are</h2>
          <p>Tijoray ("we", "us", "our") operates tijoray.com and the Tijoray vault platform. Our registered correspondence address is available on request at <a href="mailto:support@tijoray.com">support@tijoray.com</a>.</p>
        </div>

        <div className={styles.section}>
          <h2>What we collect</h2>
          <p>We collect information you give us directly when you:</p>
          <ul>
            <li>Create an account — name, email address, and password (stored as a hashed credential via Supabase Auth)</li>
            <li>Place an order — billing details, shipping address, and payment information (processed by Stripe; we never store raw card numbers)</li>
            <li>Upload content to your vault — photos, videos, voice notes, and written messages you choose to store</li>
            <li>Contact us — name, email, and message content submitted via our contact form</li>
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
          <h2>How we store and protect your data</h2>
          <p>Account data and vault metadata are stored in Supabase (EU region). Vault media files are stored in Cloudflare R2 with private-access controls. All data in transit is encrypted via TLS. Vault contents are encrypted at rest with AES-256.</p>
          <p><strong>Your vault is yours alone.</strong> Memories and media you upload — photos, videos, voice notes, and written messages — are encrypted on your device before they are uploaded, and decryption keys are issued only to the sender and recipient of a piece after their identity is verified. Our staff and support tools hold no such key and cannot display the contents of your vault.</p>
          <p>We retain your data for as long as your account is active. If you delete your account, your vault contents and personal data are permanently deleted within 30 days.</p>
        </div>

        <div className={styles.section}>
          <h2>Third-party services</h2>
          <p>We share limited data with the following processors, each bound by a data processing agreement:</p>
          <ul>
            <li><strong>Stripe</strong> — payment processing</li>
            <li><strong>Supabase</strong> — database and authentication</li>
            <li><strong>Cloudflare R2</strong> — media file storage</li>
            <li><strong>Resend</strong> — transactional email</li>
            <li><strong>Vercel</strong> — hosting and edge infrastructure</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>Cookies</h2>
          <p>We use only essential cookies: a session token to keep you logged in, and Stripe's fraud-prevention cookies during checkout. We do not use advertising or profiling cookies.</p>
        </div>

        <div className={styles.section}>
          <h2>Your rights</h2>
          <p>You have the right to access, correct, export, or delete your personal data at any time. You can manage most data directly in your account settings. For anything else — including full account deletion — email <a href="mailto:support@tijoray.com">support@tijoray.com</a> and we will respond within 30 days.</p>
          <p>If you are in the UK or EU, you also have the right to lodge a complaint with your local data protection authority.</p>
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
