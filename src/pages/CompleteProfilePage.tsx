import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PhoneInput from '../components/PhoneInput'
import AddressAutocomplete from '../components/AddressAutocomplete'
import { isValidPhone } from '../lib/validation'
import {
  isOAuthUser, isProfileComplete, getMetaName, getMetaPhone, getMetaAddress,
  type Address,
} from '../lib/profile'
import styles from './AuthPage.module.css'

export default function CompleteProfilePage() {
  const { user, loading } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = (location.state as { from?: string })?.from ?? '/portal'

  const nameFromGoogle = getMetaName(user)

  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [address, setAddress] = useState<Address | null>(null)
  const [errors,  setErrors]  = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')
  const [saving,  setSaving]   = useState(false)

  // Hydrate from whatever the provider already gave us.
  useEffect(() => {
    if (!user) return
    setName(getMetaName(user))
    setPhone(getMetaPhone(user))
    setAddress(getMetaAddress(user))
  }, [user])

  // Guard: only OAuth users with an incomplete profile belong here.
  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/login', { replace: true }); return }
    if (!isOAuthUser(user) || isProfileComplete(user)) {
      navigate(from, { replace: true })
    }
  }, [user, loading, from, navigate])

  if (loading || !user) return null

  function validate() {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Required'
    if (!phone.trim()) {
      errs.phone = 'Required'
    } else if (!isValidPhone(phone)) {
      errs.phone = 'Enter a valid phone number'
    }
    if (!address) errs.address = 'Please select your address'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    setApiError('')

    // NOTE: phone is stored as-is for now. SMS OTP verification is pending —
    // once the SMS service is live, gate `phone_verified` here before saving.
    const { error } = await supabase.auth.updateUser({
      data: {
        name:    name.trim(),
        phone:   phone.trim(),
        address,
      },
    })

    if (error) {
      setApiError(error.message)
      setSaving(false)
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>One more step</p>
        <h1 className={styles.title}>Complete your <em>profile</em></h1>
        <p className={styles.verifyBody}>
          We just need a few details to set up your account and ship your pieces.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">Full Name</label>
            <input
              id="name" type="text" autoComplete="name"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              value={name}
              placeholder={nameFromGoogle ? '' : 'Your full name'}
              onChange={e => { setName(e.target.value); setErrors(v => ({ ...v, name: '' })) }}
            />
            {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">Phone Number</label>
            <PhoneInput
              id="phone"
              value={phone}
              onChange={v => { setPhone(v); setErrors(e => ({ ...e, phone: '' })) }}
              error={!!errors.phone}
            />
            {errors.phone
              ? <span className={styles.errorMsg}>{errors.phone}</span>
              : <span className={styles.optional}>We'll verify this by text once our SMS service is live.</span>
            }
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="address">Shipping Address</label>
            <AddressAutocomplete
              id="address"
              value={address}
              onChange={a => { setAddress(a); setErrors(e => ({ ...e, address: '' })) }}
              error={!!errors.address}
            />
            {errors.address && <span className={styles.errorMsg}>{errors.address}</span>}
          </div>

          {apiError && <p className={styles.apiError}>{apiError}</p>}

          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? 'Saving…' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </main>
  )
}
