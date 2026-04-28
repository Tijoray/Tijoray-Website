import { useState } from 'react'
import styles from './ContactPage.module.css'

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({})

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    // Clear individual error as user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  function validate() {
    const errs: typeof errors = {}
    if (!form.name.trim()) errs.name = 'Please enter your name.'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email address.'
    }
    if (!form.message.trim()) errs.message = 'Please tell us how we can help.'
    return errs
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    // TODO: connect to a backend service (Formspree, EmailJS, or a serverless function)
    // before going live — currently the message is not transmitted anywhere.
    setSubmitted(true)
  }

  return (
    <main className={styles.contact}>
      <div className={styles.inner}>

        {/* ── Left column ── */}
        <div className={styles.left}>
          <p className={styles.eyebrow}>Contact the Atelier</p>
          <h1 className={styles.title}>
            How may our<br />atelier <em>assist you</em>?
          </h1>
          <p className={styles.intro}>
            Every Tijoray piece begins with a conversation. Whether you have a
            question about a commission, the technology, or our process — we are
            here to listen.
          </p>
          <div className={styles.contactDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Email</span>
              <a href="mailto:curator@tijoray.com" className={styles.detailValue}>
                curator@tijoray.com
              </a>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Response</span>
              <span className={styles.detailValue}>Within 48 hours</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Appointments</span>
              <span className={styles.detailValue}>Available by request</span>
            </div>
          </div>
          <div className={styles.rule} />
          <p className={styles.footnote}>
            All correspondence is treated with the same care and discretion we
            bring to every piece we craft.
          </p>
        </div>

        {/* ── Right column — form ── */}
        <div className={styles.right}>
          {submitted ? (
            <div className={styles.confirmation}>
              <div className={styles.confirmIcon}>
                <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <circle cx="16" cy="16" r="15" stroke="var(--gold)" strokeWidth="1" />
                  <path d="M9 16l5 5 9-9" stroke="var(--gold)" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className={styles.confirmTitle}>Message received.</h2>
              <p className={styles.confirmBody}>
                Thank you, {form.name}. Our atelier will be in touch within 48 hours.
              </p>
              <button
                className={styles.confirmBack}
                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', message: '' }) }}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  placeholder="Your name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p id="name-error" className={styles.errorMsg} role="alert">{errors.name}</p>}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p id="email-error" className={styles.errorMsg} role="alert">{errors.email}</p>}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="message">How may our atelier assist you today?</label>
                <textarea
                  id="message"
                  name="message"
                  className={`${styles.textarea} ${errors.message ? styles.inputError : ''}`}
                  placeholder="Tell us about your enquiry…"
                  rows={6}
                  value={form.message}
                  onChange={handleChange}
                  aria-describedby={errors.message ? 'message-error' : undefined}
                  aria-invalid={!!errors.message}
                />
                {errors.message && <p id="message-error" className={styles.errorMsg} role="alert">{errors.message}</p>}
              </div>
              <button type="submit" className={styles.submit}>
                Send to the Atelier
              </button>
            </form>
          )}
        </div>

      </div>
    </main>
  )
}
