// src/store/uiStore.js
// Global UI state - theme, sidebar, toasts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from 'react-hot-toast'

const useUiStore = create(
  persist(
    (set, get) => ({
      // Theme
      theme: 'system',   // 'light' | 'dark' | 'system'

      setTheme: (theme) => {
        set({ theme })
        get().applyTheme()
      },

      toggleTheme: () => {
        const themes = ['light', 'dark', 'system']
        const current = get().theme
        const next = themes[(themes.indexOf(current) + 1) % themes.length]
        get().setTheme(next)
      },

      applyTheme: () => {
        const { theme } = get()
        let isDark = theme === 'dark'

        if (theme === 'system') {
          isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        }

        document.documentElement.classList.toggle('dark', isDark)
        
        // Also update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]')
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', isDark ? '#0f172a' : '#f8fafc')
        }
      },

      initTheme: () => {
        get().applyTheme()

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const listener = () => {
          if (get().theme === 'system') {
            get().applyTheme()
          }
        }

        mediaQuery.addEventListener('change', listener)
        return () => mediaQuery.removeEventListener('change', listener)
      },

      // Sidebar
      sidebarCollapsed: false,

      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setSidebarCollapsed: (value) =>
        set({ sidebarCollapsed: value }),

      // Toast notifications
      toast: ({ message, type = 'info', duration = 4000 }) => {
        if (type === 'warning') {
          return toast(message, {
            duration,
            icon: '!',
          })
        }

        const variant = toast[type] || toast
        return variant(message, { duration })
      },

      removeToast: (id) => toast.dismiss(id),

      // Convenience helpers
      toastSuccess: (message) => get().toast({ message, type: 'success' }),
      toastError: (message) => get().toast({ message, type: 'error', duration: 6000 }),
      toastWarning: (message) => get().toast({ message, type: 'warning' }),
      toastInfo: (message) => get().toast({ message, type: 'info' }),
    }),
    {
      name: 'educore_ui',
      // Only persist theme and sidebar state - not toasts
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)

export default useUiStore
