import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { isEmailConfirmed } from '../lib/profile'
import styles from './AuthPage.module.css'

/** Seconds before another confirmation email may be requested. */
const RESEND_WAIT = 60

/**
 * Where a signed-in-but-unconfirmed session is parked until the address is
 * confirmed.
 *
 * The web confirms by link rather than by code — a browser can be sent back to
 * the page it came from, so the link is the shorter path, and it is the flow
 * SignUpPage already builds. (The app reads the `{{ .Token }}` code out of the
 * same email instead, because a link cannot re-enter a Flutter app without
 * Universal Links configured. One template carries both.)
 *
 * Reached from ProtectedRoute, so it handles the case SignUpPage's own inline
 * "check your email" step does not: a session that already exists and whose
 * address was never confirmed.
 */
export default function VerifyEmailPage() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/portal'

  const [secondsLeft, setSecondsLeft] = useState(0)
  const [sending,     setSending]     = useState(false)
  const [info,        setInfo]        = useState('')
  const [apiError,    setApiError]    = useState('')

  // Clicking the link in another tab confirms the address there; this tab
  // finds out through the auth state change and lets them straight through.
  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/login', { replace: true }); return }
    if (isEmailConfirmed(user)) navigate(from, { replace: true })
  }, [user, loading, from, navigate])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft])

  async function handleResend() {
    if (!user?.email || secondsLeft > 0) return
    setSending(true)
    setApiError('')
    setInfo('')

    const { error } = await supabase.auth.resend({
      type:  'signup',
      email: user.email,
      options: { emailRedirectTo: `${window.location.origin}${from}` },
    })

    setSending(false)
    if (error) {
      // GoTrue refuses an early resend with a 429 naming its own floor, which
      // may be longer than ours. Showing its message beats a button that comes
      // back and then fails again.
      setApiError(error.message)
      const wait = /(\d+)\s*second/.exec(error.message)
      if (wait) setSecondsLeft(Number(wait[1]))
      return
    }
    setInfo(`A new confirmation email is on its way to ${user.email}.`)
    setSecondsLeft(RESEND_WAIT)
  }

  /**
   * The way out for someone who mistyped their address at signup. Without it
   * this page is a dead end — the email goes to an inbox they cannot open.
   */
  async function handleSignOut() {
    await signOut()
    navigate('/signup', { replace: true })
  }

  if (loading || !user) return null

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.verifyIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <p className={styles.eyebrow}>One more step</p>
        <h1 className={styles.title}>Confirm your email</h1>
        <p className={styles.verifyBody}>
          We sent a confirmation link to <strong>{user.email}</strong>. Click it to
          activate your account &mdash; we'll bring you straight back here.
        </p>

        {info     && <p className={styles.verifyNote}>{info}</p>}
        {apiError && <p className={styles.apiError}>{apiError}</p>}

        <p className={styles.verifyNote}>
          Didn't receive it? Check your spam folder, or{' '}
          {secondsLeft > 0 ? (
            <>request a new one in {secondsLeft}s</>
          ) : (
            <button className={styles.resendBtn} onClick={handleResend} disabled={sending}>
              {sending ? 'sending…' : 'send it again'}
            </button>
          )}.
        </p>
        <p className={styles.verifyNote}>
          Wrong address?{' '}
          <button className={styles.resendBtn} onClick={handleSignOut}>
            sign out and start over
          </button>.
        </p>
      </div>
    </main>
  )
}
