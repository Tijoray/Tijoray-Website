import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import styles from './AuthPage.module.css'

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 814 1000" aria-hidden="true" fill="#fff">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.4-150.3-109.9C87.5 714.7 48 582.2 48 455.8c0-219.9 143.5-336.3 285.6-336.3 75.3 0 138 49.4 184.9 49.4 44.9 0 115.4-52.3 202.4-52.3zm-37.8-196.7c-31.7 36.5-81 64.6-144.5 64.6-9 0-18-.6-27-1.9-3.9-42.9 14.3-88.9 44.6-120.5 31.7-34.3 83.3-61.4 140.5-66.3 3.2 10.3 4.5 20.7 4.5 30.4 0 40.2-17.5 83.3-18.1 93.7z"/>
    </svg>
  )
}

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

export default function LoginPage() {
  const { user, loading } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = (location.state as { from?: string })?.from ?? '/'

  const [form,       setForm]       = useState({ email: '', password: '' })
  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [apiError,   setApiError]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [appleBusy,  setAppleBusy]  = useState(false)

  async function handleApple() {
    setAppleBusy(true)
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}${from}` },
    })
  }

  async function handleGoogle() {
    setGoogleBusy(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${from}` },
    })
  }

  // Redirect once logged in
  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true })
  }, [user, loading, from, navigate])

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Valid email required'
    }
    if (!form.password) errs.password = 'Required'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setApiError('')

    const { error } = await supabase.auth.signInWithPassword({
      email:    form.email,
      password: form.password,
    })

    if (error) {
      setApiError(
        error.message === 'Invalid login credentials'
          ? 'Incorrect email or password.'
          : error.message
      )
      setSubmitting(false)
    }
    // On success, the useEffect above fires and redirects
  }

  if (loading) return null

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Welcome back</p>
        <h1 className={styles.title}>Sign in to <em>Tijoray</em></h1>

        <button
          type="button"
          className={styles.appleBtn}
          onClick={handleApple}
          disabled={appleBusy}
        >
          <AppleIcon />
          {appleBusy ? 'Redirecting…' : 'Continue with Apple'}
        </button>

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
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              id="password" type="password" autoComplete="current-password"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              value={form.password}
              onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(v => ({ ...v, password: '' })) }}
            />
            {errors.password && <span className={styles.errorMsg}>{errors.password}</span>}
          </div>

          {apiError && <p className={styles.apiError}>{apiError}</p>}

          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>

          <p className={styles.switchText}>
            <Link to="/forgot-password" className={styles.switchLink}>Forgot your password?</Link>
          </p>
        </form>

        <p className={styles.switchText}>
          Don't have an account?{' '}
          <Link to="/signup" className={styles.switchLink}>Create one</Link>
        </p>
      </div>
    </main>
  )
}
