// src/components/ui/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import useAuthStore from '@/store/authStore'
import { ROUTES } from '@/constants/app'

/**
 * Wraps routes that require authentication.
 * Redirects to /login with the intended path saved in state.
 *
 * @param {{ children: ReactNode, roles?: string[] }} props
 */
const ProtectedRoute = ({ children, roles = [] }) => {
  const { token, user, isHydrated } = useAuthStore(useShallow((state) => ({
    token      : state.token,
    user       : state.user,
    isHydrated : state.isHydrated,
  })))
  const location        = useLocation()

  // Wait for store to rehydrate from localStorage before checking auth
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: 'var(--color-bg)' }}>
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  // 1. Not authenticated → redirect to login
  if (!token) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        state={{ from: `${location.pathname}${location.search || ''}` }}
        replace
      />
    )
  }

  // 2. Role check — redirect to dashboard if not allowed
  if (roles.length > 0 && user && !roles.includes(user.role)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return children
}

export default ProtectedRoute
