// src/components/ui/ProtectedRoute.jsx
// Wraps routes that require authentication and optional role check

import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import { ROUTES } from '@/constants/app'

/**
 * @param {{ children: ReactNode, roles?: string[] }} props
 * roles — if provided, user must have one of these roles
 */
const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, hasRole } = useAuth()
  const location = useLocation()

  // Not logged in → redirect to login, preserve intended path
  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        state={{ from: location.pathname }}
        replace
      />
    )
  }

  // Role check
  if (roles.length > 0 && !hasRole(...roles)) {
    return (
      <Navigate to={ROUTES.DASHBOARD} replace />
    )
  }

  return children
}

export default ProtectedRoute
