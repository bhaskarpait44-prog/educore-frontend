// src/components/ui/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { ROUTES } from '@/constants/app'

/**
 * Wraps routes that require authentication.
 * Redirects to /login with the intended path saved in state.
 *
 * @param {{ children: ReactNode, roles?: string[] }} props
 */
const ProtectedRoute = ({ children, roles = [] }) => {
  const { token, user } = useAuthStore()
  const location        = useLocation()

  // 1. Not authenticated → redirect to login
  if (!token) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        state={{ from: location.pathname }}
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