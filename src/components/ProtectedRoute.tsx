import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { needsProfileCompletion } from '../lib/profile'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  // Google/Apple users skip the from-scratch signup form, so we force them to
  // add a phone number and shipping address before reaching protected pages.
  if (needsProfileCompletion(user)) {
    return <Navigate to="/complete-profile" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
