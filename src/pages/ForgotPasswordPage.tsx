import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import styles from './AuthPage.module.css'

export default function ForgotPasswordPage() {
  const [email,      setEmail]      = useState('')
  const [error,      setError]      = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sentTo,     setSentTo]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Valid email required')
      return
    }

    setSubmitting(true)
    setError('')

    const { error: apiErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSubmitting(false)

    if (apiErr) {
      setError(apiErr.message)
      return
    }
    setSentTo(email.trim())
  }

  if (sentTo) {
    return (
      <main className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>Reset your password</p>
          <h1 className={styles.title}>Check your email</h1>
          <p className={styles.verifyBody}>
            If an account exists for <strong>{sentTo}</strong>, we've sent a link
            to reset your password. The link expires after a short while, so use
            it soon.
          </p>
          <p className={styles.switchText}>
            Remembered it after all?{' '}
            <Link to="/login" className={styles.switchLink}>Sign in</Link>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Reset your password</p>
        <h1 className={styles.title}>Forgot your <em>password?</em></h1>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email" type="email" autoComplete="email"
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
            />
            {error && <span className={styles.errorMsg}>{error}</span>}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <p className={styles.switchText}>
          Back to{' '}
          <Link to="/login" className={styles.switchLink}>Sign in</Link>
        </p>
      </div>
    </main>
  )
}
