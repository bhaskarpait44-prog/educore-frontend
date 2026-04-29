// src/hooks/useAuth.js
// Convenience hook - wraps authStore, provides role helpers

import { useShallow } from 'zustand/react/shallow'
import useAuthStore from '@/store/authStore'
import { ROLES } from '@/constants/app'

const useAuth = () => {
  const store = useAuthStore(useShallow((state) => ({
    user        : state.user,
    token       : state.token,
    isLoading   : state.isLoading,
    error       : state.error,
    login       : state.login,
    loginStudent: state.loginStudent,
    logout      : state.logout,
    clearError  : state.clearError,
  })))

  return {
    user           : store.user,
    token          : store.token,
    isLoading      : store.isLoading,
    error          : store.error,
    isAuthenticated: !!store.token,

    isAdmin      : store.user?.role === ROLES.ADMIN,
    isTeacher    : store.user?.role === ROLES.TEACHER,
    isStaff      : store.user?.role === ROLES.STAFF,
    isStudent    : store.user?.role === ROLES.STUDENT,

    hasRole: (...roles) => roles.includes(store.user?.role),

    login       : store.login,
    loginStudent: store.loginStudent,
    logout      : store.logout,
    clearError  : store.clearError,
  }
}

export default useAuth
