import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import PhoneInput from '../components/PhoneInput'
import { isValidEmail, isValidPhone } from '../lib/validation'
import styles from './SettingsPage.module.css'

type Status = { type: 'success' | 'error'; msg: string } | null

export default function SettingsPage() {
  const { user } = useAuth()

  // ── Profile state ──────────────────────────────────────────
  const [profile, setProfile] = useState({
    name:  (user?.user_metadata?.name  as string) ?? '',
    phone: (user?.user_metadata?.phone as string) ?? '',
    email: user?.email ?? '',
  })
  const [profileErrors,  setProfileErrors]  = useState<Record<string, string>>({})
  const [profileStatus,  setProfileStatus]  = useState<Status>(null)
  const [profileSaving,  setProfileSaving]  = useState(false)

  // ── Password state ─────────────────────────────────────────
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwStatus,  setPwStatus]  = useState<Status>(null)
  const [pwSaving,  setPwSaving]  = useState(false)
  const [pwErrors,  setPwErrors]  = useState<Record<string, string>>({})

  // ── Save profile ───────────────────────────────────────────
  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!profile.email.trim() || !isValidEmail(profile.email)) {
      errs.email = 'Valid email required'
    }
    if (profile.phone.trim() && !isValidPhone(profile.phone)) {
      errs.phone = 'Enter a valid phone number'
    }
    if (Object.keys(errs).length) { setProfileErrors(errs); return }

    setProfileErrors({})
    setProfileSaving(true)
    setProfileStatus(null)

    const updates: Parameters<typeof supabase.auth.updateUser>[0] = {
      data: { name: profile.name.trim(), phone: profile.phone.trim() },
    }
    if (profile.email.trim() !== user?.email) {
      updates.email = profile.email.trim()
    }

    const { error } = await supabase.auth.updateUser(updates)
    setProfileSaving(false)

    if (error) {
      setProfileStatus({ type: 'error', msg: error.message })
    } else {
      setProfileStatus({
        type: 'success',
        msg: profile.email.trim() !== user?.email
          ? 'Details updated. Check your new email address to confirm the change.'
          : 'Details updated successfully.',
      })
    }
  }

  // ── Save password ──────────────────────────────────────────
  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!pw.current.trim()) errs.current = 'Required'
    if (pw.next.length < 8)  errs.next    = 'At least 8 characters'
    if (pw.confirm !== pw.next) errs.confirm = 'Passwords do not match'
    if (Object.keys(errs).length) { setPwErrors(errs); return }

    setPwSaving(true)
    setPwStatus(null)
    setPwErrors({})

    // Re-authenticate with current password first
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email:    user?.email ?? '',
      password: pw.current,
    })

    if (signInErr) {
      setPwSaving(false)
      setPwErrors({ current: 'Incorrect password' })
      return
    }

    const { error } = await supabase.auth.updateUser({ password: pw.next })
    setPwSaving(false)

    if (error) {
      setPwStatus({ type: 'error', msg: error.message })
    } else {
      setPwStatus({ type: 'success', msg: 'Password updated successfully.' })
      setPw({ current: '', next: '', confirm: '' })
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>

        <header className={styles.header}>
          <p className={styles.eyebrow}>Account</p>
          <h1 className={styles.title}>Settings</h1>
        </header>

        <div className={styles.sections}>

          {/* ── Profile ─────────────────────────────────────── */}
          <section className={styles.card}>
            <p className={styles.cardTitle}>Personal Details</p>
            <form onSubmit={handleProfileSave} noValidate>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="name">Full Name</label>
                  <input
                    id="name" type="text" autoComplete="name"
                    className={styles.input}
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="phone">Phone</label>
                  <PhoneInput
                    id="phone"
                    value={profile.phone}
                    onChange={v => { setProfile(p => ({ ...p, phone: v })); setProfileErrors(e => ({ ...e, phone: '' })) }}
                    error={!!profileErrors.phone}
                  />
                  {profileErrors.phone && <span className={styles.errorMsg}>{profileErrors.phone}</span>}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">Email Address</label>
                <input
                  id="email" type="email" autoComplete="email"
                  className={`${styles.input} ${profileErrors.email ? styles.inputError : ''}`}
                  value={profile.email}
                  onChange={e => { setProfile(p => ({ ...p, email: e.target.value })); setProfileErrors(er => ({ ...er, email: '' })) }}
                />
                {profileErrors.email
                  ? <span className={styles.errorMsg}>{profileErrors.email}</span>
                  : <span className={styles.hint}>Changing your email will send a confirmation to the new address.</span>
                }
              </div>

              {profileStatus && (
                <p className={`${styles.statusMsg} ${styles[profileStatus.type]}`}>
                  {profileStatus.msg}
                </p>
              )}

              <button type="submit" className={styles.saveBtn} disabled={profileSaving}>
                {profileSaving ? 'Saving…' : 'Save Details'}
              </button>
            </form>
          </section>

          {/* ── Password ─────────────────────────────────────── */}
          <section className={styles.card}>
            <p className={styles.cardTitle}>Change Password</p>
            <form onSubmit={handlePasswordSave} noValidate>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="current">Current Password</label>
                <input
                  id="current" type="password" autoComplete="current-password"
                  className={`${styles.input} ${pwErrors.current ? styles.inputError : ''}`}
                  value={pw.current}
                  onChange={e => { setPw(p => ({ ...p, current: e.target.value })); setPwErrors(v => ({ ...v, current: '' })) }}
                />
                {pwErrors.current && <span className={styles.errorMsg}>{pwErrors.current}</span>}
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="next">New Password</label>
                  <input
                    id="next" type="password" autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    className={`${styles.input} ${pwErrors.next ? styles.inputError : ''}`}
                    value={pw.next}
                    onChange={e => { setPw(p => ({ ...p, next: e.target.value })); setPwErrors(v => ({ ...v, next: '' })) }}
                  />
                  {pwErrors.next && <span className={styles.errorMsg}>{pwErrors.next}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="confirm">Confirm New Password</label>
                  <input
                    id="confirm" type="password" autoComplete="new-password"
                    className={`${styles.input} ${pwErrors.confirm ? styles.inputError : ''}`}
                    value={pw.confirm}
                    onChange={e => { setPw(p => ({ ...p, confirm: e.target.value })); setPwErrors(v => ({ ...v, confirm: '' })) }}
                  />
                  {pwErrors.confirm && <span className={styles.errorMsg}>{pwErrors.confirm}</span>}
                </div>
              </div>

              {pwStatus && (
                <p className={`${styles.statusMsg} ${styles[pwStatus.type]}`}>
                  {pwStatus.msg}
                </p>
              )}

              <button type="submit" className={styles.saveBtn} disabled={pwSaving}>
                {pwSaving ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </section>

        </div>
      </div>
    </main>
  )
}
