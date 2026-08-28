import styles from './PrivacyPage.module.css'

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.eyebrow}>Legal</p>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.updated}>Last updated: 27 May 2026</p>
      </div>

      <div className={styles.content}>

        <div className={styles.section}>
          <h2>Acceptance</h2>
          <p>By accessing tijoray.com or placing an order, you agree to these Terms. If you do not agree, do not use the site. These Terms form a binding contract between you and Tijoray.</p>
        </div>

        <div className={styles.section}>
          <h2>Products and orders</h2>
          <p>All pieces are handcrafted to order. Lead times are 10–14 business days from payment confirmation. We reserve the right to cancel any order and issue a full refund if we are unable to fulfill it for any reason.</p>
          <p>Product images and 3D previews are representative. Slight variations in stone color, metal finish, and proportions are inherent to handcrafted jewelry and are not grounds for return.</p>
        </div>

        <div className={styles.section}>
          <h2>Payments</h2>
          <p>All prices are in USD. Payment is processed securely by Stripe. By placing an order you authorise Stripe to charge the amount shown at checkout. We do not store payment card details.</p>
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
          <h2>NFC and hardware</h2>
          <p>The NFC chip embedded in your piece is passive: it has no battery, needs no charging, and does not depend on our service to remain physically intact. It is a physical component subject to normal wear and is rated for decades of typical use. Tijoray is not responsible for damage caused by physical impact, exposure to extreme conditions, or tampering. Tampering with the chip voids any warranty.</p>
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
