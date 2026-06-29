import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import PendantThumbnail from '../components/PendantThumbnail'
import PhoneInput from '../components/PhoneInput'
import { isValidEmail, isValidPhone } from '../lib/validation'
import { SHAPE_LABELS } from '../data/catalog'
import { PRODUCT_TYPES } from '../data/product-types'
import styles from './CheckoutPage.module.css'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
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
  const [googleBusy, setGoogleBusy] = useState(false)

  async function handleGoogle() {
    setGoogleBusy(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/checkout` },
    })
  }

  useEffect(() => {
    if (!authLoading && items.length === 0) navigate('/cart', { replace: true })
  }, [items, authLoading, navigate])

  if (authLoading || items.length === 0) return null

  const total = items.reduce((sum, i) => sum + i.price, 0)

  function validate() {
    const errs: Record<string, string> = {}
    if (!user) {
      if (!form.name.trim()) errs.name = 'Required'
      if (!form.email.trim() || !isValidEmail(form.email)) {
        errs.email = 'Valid email required'
      }
      if (form.phone.trim() && !isValidPhone(form.phone)) {
        errs.phone = 'Enter a valid phone number'
      }
      if (form.password.length < 8) errs.password = 'At least 8 characters'
      if (form.confirm !== form.password) errs.confirm = 'Passwords do not match'
    }
    if (!form.recipientName.trim()) errs.recipientName = 'Required'
    if (!form.recipientPhone.trim()) {
      errs.recipientPhone = 'Required'
    } else if (!isValidPhone(form.recipientPhone)) {
      errs.recipientPhone = 'Enter a valid phone number'
    }
    return errs
  }

  async function proceedToStripe(accessToken: string) {
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        items,
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
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('Session expired. Please sign in again.')
        await proceedToStripe(session.access_token)
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
        await proceedToStripe(data.session.access_token)
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

              <div className={styles.recipientCard}>
                <p className={styles.recipientHeading}>Gifting this to someone special?</p>
                <p className={styles.recipientBody}>
                  Tell us who this piece is for. We'll ship directly to them and send an invitation to their memory portal once it arrives — no spoilers.
                </p>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="recipientName">Recipient's Name</label>
                    <input
                      id="recipientName" name="recipientName" type="text"
                      className={`${styles.input} ${errors.recipientName ? styles.inputError : ''}`}
                      value={form.recipientName}
                      onChange={e => { setForm(f => ({ ...f, recipientName: e.target.value })); setErrors(v => ({ ...v, recipientName: '' })) }}
                    />
                    {errors.recipientName && <span className={styles.errorMsg}>{errors.recipientName}</span>}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="recipientPhone">Recipient's Phone</label>
                    <PhoneInput
                      id="recipientPhone"
                      value={form.recipientPhone}
                      onChange={v => { setForm(f => ({ ...f, recipientPhone: v })); setErrors(e => ({ ...e, recipientPhone: '' })) }}
                      error={!!errors.recipientPhone}
                    />
                    {errors.recipientPhone && <span className={styles.errorMsg}>{errors.recipientPhone}</span>}
                  </div>
                </div>

                <p className={styles.recipientShippingNote}>
                  Their shipping address will be collected on the next screen.
                </p>
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

              <button
                type="button"
                className={styles.googleBtn}
                onClick={handleGoogle}
                disabled={googleBusy}
              >
                <GoogleIcon />
                {googleBusy ? 'Redirecting…' : 'Continue with Google'}
              </button>

              <div className={styles.orDivider}><span>or create an account</span></div>

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
                    <PhoneInput
                      id="phone"
                      value={form.phone}
                      onChange={v => { setForm(f => ({ ...f, phone: v })); setErrors(e => ({ ...e, phone: '' })) }}
                      error={!!errors.phone}
                    />
                    {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
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

                <div className={styles.recipientCard}>
                  <p className={styles.recipientHeading}>Gifting this to someone special?</p>
                  <p className={styles.recipientBody}>
                    Tell us who this piece is for. We'll ship directly to them and send an invitation to their memory portal once it arrives — no spoilers.
                  </p>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="recipientName">Recipient's Name</label>
                      <input
                        id="recipientName" name="recipientName" type="text"
                        className={`${styles.input} ${errors.recipientName ? styles.inputError : ''}`}
                        value={form.recipientName}
                        onChange={e => { setForm(f => ({ ...f, recipientName: e.target.value })); setErrors(v => ({ ...v, recipientName: '' })) }}
                      />
                      {errors.recipientName && <span className={styles.errorMsg}>{errors.recipientName}</span>}
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="recipientPhone2">Recipient's Phone</label>
                      <PhoneInput
                        id="recipientPhone2"
                        value={form.recipientPhone}
                        onChange={v => { setForm(f => ({ ...f, recipientPhone: v })); setErrors(e => ({ ...e, recipientPhone: '' })) }}
                        error={!!errors.recipientPhone}
                      />
                      {errors.recipientPhone && <span className={styles.errorMsg}>{errors.recipientPhone}</span>}
                    </div>
                  </div>

                  <p className={styles.recipientShippingNote}>
                    Their shipping address will be collected on the next screen.
                  </p>
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
                  <p className={styles.summaryItemName}>{SHAPE_LABELS[item.shape]} {PRODUCT_TYPES[item.productType]?.label ?? 'Pendant'}</p>
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
