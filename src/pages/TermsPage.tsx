import styles from './PrivacyPage.module.css'
import { LEGAL_NAME, SUPPORT_EMAIL } from '../lib/brand'

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.eyebrow}>Legal</p>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.updated}>Last updated: 5 September 2026</p>
      </div>

      <div className={styles.content}>

        <div className={styles.section}>
          <h2>Acceptance</h2>
          <p>By accessing tijoray.com or placing an order, you agree to these Terms. If you do not agree, do not use the site. These Terms form a binding contract between you and Tijoray, an operating name of {LEGAL_NAME}.</p>
        </div>

        <div className={styles.section}>
          <h2>Who may use Tijoray</h2>
          <p>You must be 18 or over to place an order or hold an account. A piece may of course be given to someone younger, but the account, the payment, and the responsibility for what is uploaded remain the adult purchaser's.</p>
          <p>You are responsible for the content you place in a vault, and for having the right to share it, including where it shows other people. You must not upload content you do not have permission to use.</p>
        </div>

        <div className={styles.section}>
          <h2>Products and orders</h2>
          <p>All pieces are handcrafted to order. Lead times are 10–14 business days from payment confirmation. We reserve the right to cancel any order and issue a full refund if we are unable to fulfill it for any reason.</p>
          <p>That lead time is the time before dispatch, not an arrival estimate. Complimentary shipping is currently available to addresses in Canada, the United States, the United Kingdom and Australia. Transit time is additional.</p>
          <p>Product images and 3D previews are representative. Slight variations in stone color, metal finish, and proportions are inherent to handcrafted jewelry and are not grounds for return.</p>
        </div>

        <div className={styles.section}>
          <h2>Payments</h2>
          <p>All prices are in USD. Payment is processed securely by Stripe. By placing an order you authorise Stripe to charge the amount shown at checkout. We do not store payment card details.</p>
        </div>

        <div className={styles.section}>
          <h2>SMS terms</h2>
          <p>Tijoray, also known as {LEGAL_NAME}, operates the text message programs described here.</p>
          <p><strong>Gift recipient details.</strong> A buyer may provide an intended recipient's mobile number at checkout so the piece can later be matched to the person who verifies that number. Providing it does not verify the recipient or subscribe them to marketing.</p>
          <p><strong>Account verification.</strong> When you enter your own mobile number in the Tijoray app and ask us to send a code, we send a one-time passcode so you can confirm the number is yours. Confirming the number is what links a piece bought for you to your account.</p>
          <p><strong>Account notifications.</strong> Customers who have confirmed a mobile number may also receive occasional service notifications about the delivery and servicing of the piece they own.</p>
          <p>Message frequency varies; typically one verification message per sign-up. Message and data rates may apply. Reply STOP to cancel at any time, or reply HELP for help; you can also reach us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Carriers are not liable for any delays or undelivered messages.</p>
          <p>We send no marketing or promotional text messages on these programs. No mobile information will be shared with third parties or affiliates for marketing or promotional purposes; see our <a href="/privacy">Privacy Policy</a>.</p>
        </div>

        <div className={styles.section}>
          <h2>Returns and refunds</h2>
          <p>Because each piece is made to order, we do not accept returns for change of mind. If your piece arrives damaged or with a manufacturing defect, contact us at <a href="mailto:support@tijoray.com">support@tijoray.com</a> within 14 days of delivery with photographs and we will arrange a replacement or full refund.</p>
        </div>

        <div className={styles.section}>
          <h2>Digital vault</h2>
          <p>Your vault is provided as a service bundled with your piece. You retain full ownership of all content you upload. You grant Tijoray a limited licence to store, serve, and display that content solely for the purpose of operating your vault.</p>
          <p>You must not upload content that is unlawful, infringing, abusive, or obscene. We reserve the right to remove content or suspend accounts that violate this requirement.</p>
          <p>We make reasonable efforts to keep the vault service available and your data safe, but we do not guarantee uninterrupted access. We are not liable for data loss caused by events outside our reasonable control.</p>
        </div>

        <div className={styles.section}>
          <h2>Service continuity and closure</h2>
          <p>The vault service, the Tijoray app, and the servers and storage behind them are owned and operated by Tijoray. Reading the memories stored against your piece depends on that service continuing to run.</p>
          <p>We intend to keep it running for as long as we reasonably can, and we will make reasonable efforts to do so. We do not guarantee it indefinitely, we make no commitment that the service will remain available for any particular period, and nothing elsewhere on this site should be read as such a commitment.</p>
          <p>If we decide to close the service, we will give you reasonable advance notice and make the full contents of your vault available to download in a standard, openly readable format before access ends. What you upload remains yours, and a closure on our part will not take it from you.</p>
        </div>

        <div className={styles.section}>
          <h2>Passing a piece on</h2>
          <p>A piece and its vault can be transferred to another person. Contact us and, once both parties are identified, we will move the vault and its provenance record to the new owner.</p>
          <p>If an account holder dies, an executor or next of kin may contact us with proof of death and of their authority, and we will transfer the piece and its vault to the person entitled to it or provide a copy of the contents.</p>
        </div>

        <div className={styles.section}>
          <h2>NFC and hardware</h2>
          <p>The NFC chip embedded in your piece is passive: it has no battery and needs no charging. It is a physical component subject to normal wear. Reading online memories depends on the Tijoray app and service. Tijoray is not responsible for damage caused by physical impact, exposure to extreme conditions, or tampering.</p>
        </div>

        <div className={styles.section}>
          <h2>Intellectual property</h2>
          <p>All designs, imagery, copy, and software on tijoray.com are the property of Tijoray and may not be reproduced without written permission.</p>
        </div>

        <div className={styles.section}>
          <h2>Limitation of liability</h2>
          <p>To the extent permitted by law, Tijoray's total liability to you for any claim arising from these Terms or your use of our products and services shall not exceed the amount you paid for the relevant order. We are not liable for indirect, consequential, or incidental losses.</p>
        </div>

        <div className={styles.section}>
          <h2>Governing law</h2>
          <p>These Terms are governed by the laws of England and Wales. Disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales, except where mandatory consumer protection laws in your country provide otherwise.</p>
        </div>

        <div className={styles.section}>
          <h2>Changes to these Terms</h2>
          <p>We may update these Terms from time to time. Material changes will be communicated by updating the date above. Continued use of Tijoray after changes constitutes acceptance.</p>
        </div>

        <div className={styles.section}>
          <h2>Contact</h2>
          <p>Questions about these Terms: <a href="mailto:support@tijoray.com">support@tijoray.com</a></p>
        </div>

      </div>
    </div>
  )
}
