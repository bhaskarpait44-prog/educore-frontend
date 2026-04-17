// src/hooks/useAuth.js
// Convenience hook — wraps authStore, provides role helpers

import useAuthStore from '@/store/authStore'
import { ROLES } from '@/constants/app'

const useAuth = () => {
  const store = useAuthStore()

  return {
    // State
    user           : store.user,
    token          : store.token,
    isLoading      : store.isLoading,
    error          : store.error,
    isAuthenticated: !!store.token,

    // Role checks
    isAdmin      : store.user?.role === ROLES.ADMIN,
    isTeacher    : store.user?.role === ROLES.TEACHER,
    isAccountant : store.user?.role === ROLES.ACCOUNTANT,
    isStaff      : store.user?.role === ROLES.STAFF,

    // Role-based permission helper
    hasRole: (...roles) => roles.includes(store.user?.role),

    // Actions
    login     : store.login,
    logout    : store.logout,
    clearError: store.clearError,
  }
}

export default useAuth
