import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import styles from './AuthPage.module.css'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = (location.state as { from?: string })?.from ?? '/'

  const [form,       setForm]       = useState({ email: '', password: '' })
  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [apiError,   setApiError]   = useState('')
  const [submitting, setSubmitting] = useState(false)

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
        <h1 className={styles.title}>Sign in to <em>Arcana</em></h1>

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
        </form>

        <p className={styles.switchText}>
          Don't have an account?{' '}
          <Link to="/signup" className={styles.switchLink}>Create one</Link>
        </p>
      </div>
    </main>
  )
}
