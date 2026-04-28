// src/hooks/usePermissions.js
import { useMemo } from 'react'
import useAuthStore from '@/store/authStore'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from '@/utils/permissions'

/**
 * usePermissions()
 *
 * Returns memoized permission-checking helpers bound to the current user.
 *
 * Usage:
 *   const { can, canAny, canAll } = usePermissions()
 *   if (can('fees.waive')) { ... }
 */
const usePermissions = () => {
  const user = useAuthStore((state) => state.user)

  return useMemo(() => ({
    /** Check single permission */
    can: (permission) => hasPermission(user, permission),

    /** Check if user has at least one of the permissions */
    canAny: (permissions) => hasAnyPermission(user, permissions),

    /** Check if user has all of the permissions */
    canAll: (permissions) => hasAllPermissions(user, permissions),

    /** Current user's role */
    role: user?.role || null,

    /** Is the user an admin (bypasses all permission checks) */
    isAdmin: user?.role === 'admin',

    /** Is authenticated at all */
    isAuthenticated: !!user,

    /** Raw permissions array */
    permissions: user?.permissions || [],
  }), [user])
}

export default usePermissions
