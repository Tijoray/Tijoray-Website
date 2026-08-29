import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { needsProfileCompletion, isEmailConfirmed } from '../lib/profile'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  // An unconfirmed address gets no further than this. Signup already blocks
  // one route in by withholding the session, but that is one route of several
  // — this catches a session however it was obtained. Google and Apple assert
  // the address themselves, so OAuth users are already confirmed and pass
  // straight through.
  if (!isEmailConfirmed(user)) {
    return <Navigate to="/verify-email" state={{ from: location.pathname }} replace />
  }

  // Google/Apple users skip the from-scratch signup form, so we force them to
  // add a phone number and shipping address before reaching protected pages.
  if (needsProfileCompletion(user)) {
    return <Navigate to="/complete-profile" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
