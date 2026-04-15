import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import PendantThumbnail from '../components/PendantThumbnail'
import styles from './CheckoutPage.module.css'

const SHAPE_LABELS: Record<string, string> = {
  square: 'Square', circle: 'Circle', heart: 'Heart', pear: 'Pear',
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(n)

type Step = 'form' | 'verify-email'

export default function CheckoutPage() {
  const { items } = useCart()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [step,       setStep]       = useState<Step>('form')
  const [sentTo,     setSentTo]     = useState('')
  const [form,       setForm]       = useState({ name: '', email: '', phone: '', password: '', confirm: '', recipientName: '', recipientPhone: '' })
  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError,   setApiError]   = useState('')

  useEffect(() => {
    if (!authLoading && items.length === 0) navigate('/cart', { replace: true })
  }, [items, authLoading, navigate])

  if (authLoading || items.length === 0) return null

  const total = items.reduce((sum, i) => sum + i.price, 0)

  function validate() {
    const errs: Record<string, string> = {}
    if (!user) {
      if (!form.name.trim()) errs.name = 'Required'
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errs.email = 'Valid email required'
      }
      if (form.password.length < 8) errs.password = 'At least 8 characters'
      if (form.confirm !== form.password) errs.confirm = 'Passwords do not match'
    }
    return errs
  }

  async function proceedToStripe(userId: string) {
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        userId,
        recipientName:  form.recipientName.trim(),
        recipientPhone: form.recipientPhone.trim(),
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'Checkout creation failed. Please try again.')
    }
    const { sessionUrl } = await res.json()
    window.location.href = sessionUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setApiError('')

    try {
      if (user) {
        await proceedToStripe(user.id)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
        options: {
          data:            { name: form.name, phone: form.phone },
          emailRedirectTo: `${window.location.origin}/checkout`,
        },
      })

      if (error) throw new Error(error.message)

      if (data.session && data.user) {
        await proceedToStripe(data.user.id)
      } else {
        setSentTo(form.email)
        setStep('verify-email')
        setSubmitting(false)
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong.')
      setSubmitting(false)
    }
  }

  // ── Email verification screen ──────────────────────────────────────────────
  if (step === 'verify-email') {
    return (
      <main className={styles.page}>
        <div className={styles.verifyWrap}>
          <div className={styles.verifyIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <p className={styles.eyebrow}>One more step</p>
          <h1 className={styles.verifyTitle}>Check your email</h1>
          <p className={styles.verifyBody}>
            We sent a confirmation link to <strong>{sentTo}</strong>.
            Click it to verify your account, then return here to complete your purchase.
          </p>
          <p className={styles.verifyNote}>
            Didn't receive it? Check your spam folder, or{' '}
            <button className={styles.retryBtn} onClick={() => setStep('form')}>
              try again
            </button>.
          </p>
        </div>
      </main>
    )
  }

  // ── Main layout ────────────────────────────────────────────────────────────
  return (
    <main className={styles.page}>
      <div className={styles.inner}>

        {/* Left — account / auth */}
        <div>
          <p className={styles.eyebrow}>Checkout</p>
          <h1 className={styles.title}>
            {user ? 'Confirm your order' : 'Create your account'}
          </h1>

          {user ? (
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.loggedInBanner}>
                <p className={styles.loggedInMsg}>
                  Signed in as
                  <strong>{user.email}</strong>
                </p>
              </div>

              <div className={styles.sectionDivider}>
                <span className={styles.sectionLabel}>Gift Recipient</span>
              </div>

              <p className={styles.sectionNote}>
                Who is this pendant for? We'll invite them to access the memory portal after it arrives.
              </p>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="recipientName">Recipient's Name</label>
                  <input
                    id="recipientName" name="recipientName" type="text"
                    className={styles.input}
                    value={form.recipientName}
                    onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="recipientEmail">
                    Recipient's Email <span className={styles.optional}>(optional)</span>
                  </label>
                  <input
                    id="recipientPhone" name="recipientPhone" type="tel"
                    className={styles.input}
                    value={form.recipientPhone}
                    onChange={e => setForm(f => ({ ...f, recipientPhone: e.target.value }))}
                  />
                </div>
              </div>

              {apiError && <p className={styles.apiError}>{apiError}</p>}

              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Redirecting…' : 'Continue to Payment'}
              </button>
            </form>
          ) : (
            <>
              <p className={styles.formSub}>
                Your account unlocks your piece's memory portal — add photos, voice notes, and messages for the recipient after purchase.
              </p>

              <form className={styles.form} onSubmit={handleSubmit} noValidate>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="name">Full Name</label>
                    <input
                      id="name" name="name" type="text" autoComplete="name"
                      className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                      value={form.name}
                      onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(v => ({ ...v, name: '' })) }}
                    />
                    {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="phone">
                      Phone <span className={styles.optional}>(optional)</span>
                    </label>
                    <input
                      id="phone" name="phone" type="tel" autoComplete="tel"
                      className={styles.input}
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="email">Email</label>
                  <input
                    id="email" name="email" type="email" autoComplete="email"
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    value={form.email}
                    onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(v => ({ ...v, email: '' })) }}
                  />
                  {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="password">Password</label>
                    <input
                      id="password" name="password" type="password" autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                      value={form.password}
                      onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(v => ({ ...v, password: '' })) }}
                    />
                    {errors.password && <span className={styles.errorMsg}>{errors.password}</span>}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="confirm">Confirm Password</label>
                    <input
                      id="confirm" name="confirm" type="password" autoComplete="new-password"
                      className={`${styles.input} ${errors.confirm ? styles.inputError : ''}`}
                      value={form.confirm}
                      onChange={e => { setForm(f => ({ ...f, confirm: e.target.value })); setErrors(v => ({ ...v, confirm: '' })) }}
                    />
                    {errors.confirm && <span className={styles.errorMsg}>{errors.confirm}</span>}
                  </div>
                </div>

                <div className={styles.sectionDivider}>
                  <span className={styles.sectionLabel}>Gift Recipient</span>
                </div>

                <p className={styles.sectionNote}>
                  Who is this pendant for? We'll invite them to access the memory portal after it arrives.
                </p>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="recipientName">Recipient's Name</label>
                    <input
                      id="recipientName" name="recipientName" type="text"
                      className={styles.input}
                      value={form.recipientName}
                      onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="recipientPhone">
                      Recipient's Phone <span className={styles.optional}>(optional)</span>
                    </label>
                    <input
                      id="recipientPhone" name="recipientPhone" type="tel"
                      className={styles.input}
                      value={form.recipientPhone}
                      onChange={e => setForm(f => ({ ...f, recipientPhone: e.target.value }))}
                    />
                  </div>
                </div>

                {apiError && <p className={styles.apiError}>{apiError}</p>}

                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Please wait…' : 'Create Account & Continue'}
                </button>

                <p className={styles.signInPrompt}>
                  Already have an account?{' '}
                  <Link to="/login" state={{ from: '/checkout' }} className={styles.signInLink}>
                    Sign in
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>

        {/* Right — order summary */}
        <div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryTitle}>Order Summary</p>

            {items.map((item, idx) => (
              <div key={idx} className={styles.summaryItem}>
                <div className={styles.summaryThumb}>
                  <PendantThumbnail
                    shape={item.shape}
                    metal={item.metal}
                    metalColor={item.metalColor}
                    birthstoneIndex={item.birthstoneIndex}
                    size={64}
                  />
                </div>
                <div className={styles.summaryItemInfo}>
                  <p className={styles.summaryItemName}>{SHAPE_LABELS[item.shape]} Pendant</p>
                  <p className={styles.summaryItemSpec}>{item.specLine}</p>
                </div>
                <span className={styles.summaryItemPrice}>{fmt(item.price)}</span>
              </div>
            ))}

            <div className={styles.summaryRow} style={{ marginTop: 16 }}>
              <span>Shipping</span>
              <span className={styles.summaryMuted}>Calculated at checkout</span>
            </div>

            <div className={styles.summaryDivider} />

            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <span>Estimated Total</span>
              <span>{fmt(total)}</span>
            </div>
          </div>

          <p className={styles.secureNote}>Secured by Stripe · 256-bit TLS encryption</p>

          <Link to="/cart" className={styles.backLink}>← Edit cart</Link>
        </div>

      </div>
    </main>
  )
}
