// src/store/authStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/constants/app'
import * as authApi from '@/api/auth'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── State ─────────────────────────────────────────────────────────
      token        : null,
      refreshToken : null,
      user         : null,
      isLoading    : false,
      error        : null,

      // ── Actions ───────────────────────────────────────────────────────

      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const res = await authApi.login(credentials)
          const { token, refresh_token, user } = res.data

          // Persist tokens to localStorage for Axios interceptor
          localStorage.setItem(STORAGE_KEYS.TOKEN, token)
          if (refresh_token) {
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token)
          }

          set({
            token,
            refreshToken : refresh_token || null,
            user,
            isLoading    : false,
            error        : null,
          })

          return { success: true, user }
        } catch (err) {
          set({ isLoading: false, error: err.message || 'Login failed' })
          return { success: false, message: err.message }
        }
      },

      logout: () => {
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
        set({ token: null, refreshToken: null, user: null, error: null })
      },

      clearError: () => set({ error: null }),

      // Called by Axios interceptor after a successful silent refresh
      updateToken: (token, refreshToken) => {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token)
        if (refreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
        set({ token, refreshToken: refreshToken || get().refreshToken })
      },
    }),
    {
      name      : 'educore_auth',
      partialize: (state) => ({
        token       : state.token,
        refreshToken: state.refreshToken,
        user        : state.user,
      }),
    }
  )
)

export default useAuthStore
