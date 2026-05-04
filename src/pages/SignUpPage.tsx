import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PhoneInput from '../components/PhoneInput'
import { isValidEmail, isValidPhone } from '../lib/validation'
import styles from './AuthPage.module.css'

type Step = 'form' | 'verify-email'

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

export default function SignUpPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [step,       setStep]       = useState<Step>('form')
  const [sentTo,     setSentTo]     = useState('')
  const [form,       setForm]       = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [apiError,   setApiError]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  async function handleGoogle() {
    setGoogleBusy(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/portal` },
    })
  }

  // Redirect once logged in (e.g. after email confirmation)
  useEffect(() => {
    if (!loading && user) navigate('/portal', { replace: true })
  }, [user, loading, navigate])

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (!form.email.trim() || !isValidEmail(form.email)) {
      errs.email = 'Valid email required'
    }
    if (form.phone.trim() && !isValidPhone(form.phone)) {
      errs.phone = 'Enter a valid phone number'
    }
    if (form.password.length < 8) errs.password = 'At least 8 characters'
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setApiError('')

    const { data, error } = await supabase.auth.signUp({
      email:    form.email,
      password: form.password,
      options: {
        data:            { name: form.name, phone: form.phone },
        emailRedirectTo: `${window.location.origin}/portal`,
      },
    })

    if (error) {
      setApiError(error.message)
      setSubmitting(false)
      return
    }

    if (data.session) {
      // Email confirmation disabled — user is immediately logged in
      navigate('/portal', { replace: true })
    } else {
      // Email confirmation required
      setSentTo(form.email)
      setStep('verify-email')
    }
  }

  if (loading) return null

  if (step === 'verify-email') {
    return (
      <main className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.verifyIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <p className={styles.eyebrow}>Almost there</p>
          <h1 className={styles.title}>Check your email</h1>
          <p className={styles.verifyBody}>
            We sent a confirmation link to <strong>{sentTo}</strong>. Click it to activate your account, then you'll be taken straight to your portal.
          </p>
          <p className={styles.verifyNote}>
            Didn't receive it? Check your spam folder, or{' '}
            <button className={styles.resendBtn} onClick={() => setStep('form')}>
              try a different email
            </button>.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Create your account</p>
        <h1 className={styles.title}>Join <em>Tijoray</em></h1>

        <button
          type="button"
          className={styles.googleBtn}
          onClick={handleGoogle}
          disabled={googleBusy}
        >
          <GoogleIcon />
          {googleBusy ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <div className={styles.divider}><span>or</span></div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">Full Name</label>
            <input
              id="name" type="text" autoComplete="name"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(v => ({ ...v, name: '' })) }}
            />
            {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email" type="email" autoComplete="email"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              value={form.email}
              onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(v => ({ ...v, email: '' })) }}
            />
            {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
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

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              id="password" type="password" autoComplete="new-password"
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
              id="confirm" type="password" autoComplete="new-password"
              className={`${styles.input} ${errors.confirm ? styles.inputError : ''}`}
              value={form.confirm}
              onChange={e => { setForm(f => ({ ...f, confirm: e.target.value })); setErrors(v => ({ ...v, confirm: '' })) }}
            />
            {errors.confirm && <span className={styles.errorMsg}>{errors.confirm}</span>}
          </div>

          {apiError && <p className={styles.apiError}>{apiError}</p>}

          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" className={styles.switchLink}>Sign in</Link>
        </p>
      </div>
    </main>
  )
}
