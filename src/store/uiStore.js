// src/store/uiStore.js
// Global UI state - theme, sidebar, toasts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from 'react-hot-toast'

const useUiStore = create(
  persist(
    (set, get) => ({
      // Theme
      theme: 'light',   // 'light' | 'dark'

      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light'
        // Apply class to <html> element immediately
        document.documentElement.classList.toggle('dark', next === 'dark')
        set({ theme: next })
      },

      initTheme: () => {
        const { theme } = get()
        document.documentElement.classList.toggle('dark', theme === 'dark')
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
