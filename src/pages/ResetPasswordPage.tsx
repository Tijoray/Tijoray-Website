import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import styles from './AuthPage.module.css'

/**
 * Landing page for the Supabase recovery link. Following the emailed link signs
 * the user in with a temporary recovery session; this page lets them set the
 * new password against that session.
 */
export default function ResetPasswordPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [pw,         setPw]         = useState({ next: '', confirm: '' })
  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [apiError,   setApiError]   = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (pw.next.length < 8) errs.next = 'At least 8 characters'
    if (pw.confirm !== pw.next) errs.confirm = 'Passwords do not match'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setApiError('')

    const { error } = await supabase.auth.updateUser({ password: pw.next })
    setSubmitting(false)

    if (error) {
      setApiError(error.message)
      return
    }
    navigate('/portal', { replace: true })
  }

  if (loading) return null

  // No recovery session — the link was expired, already used, or opened in a
  // different browser than the email.
  if (!user) {
    return (
      <main className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>Reset your password</p>
          <h1 className={styles.title}>Link expired</h1>
          <p className={styles.verifyBody}>
            This reset link is no longer valid. Request a fresh one and open it
            in this browser.
          </p>
          <p className={styles.switchText}>
            <Link to="/forgot-password" className={styles.switchLink}>Request a new link</Link>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Reset your password</p>
        <h1 className={styles.title}>Choose a new <em>password</em></h1>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="next">New Password</label>
            <input
              id="next" type="password" autoComplete="new-password"
              placeholder="Min. 8 characters"
              className={`${styles.input} ${errors.next ? styles.inputError : ''}`}
              value={pw.next}
              onChange={e => { setPw(p => ({ ...p, next: e.target.value })); setErrors(v => ({ ...v, next: '' })) }}
            />
            {errors.next && <span className={styles.errorMsg}>{errors.next}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirm">Confirm New Password</label>
            <input
              id="confirm" type="password" autoComplete="new-password"
              className={`${styles.input} ${errors.confirm ? styles.inputError : ''}`}
              value={pw.confirm}
              onChange={e => { setPw(p => ({ ...p, confirm: e.target.value })); setErrors(v => ({ ...v, confirm: '' })) }}
            />
            {errors.confirm && <span className={styles.errorMsg}>{errors.confirm}</span>}
          </div>

          {apiError && <p className={styles.apiError}>{apiError}</p>}

          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Saving…' : 'Set New Password'}
          </button>
        </form>
      </div>
    </main>
  )
}
