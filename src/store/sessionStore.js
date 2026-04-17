// src/store/sessionStore.js
// Current academic session — used everywhere (attendance, fees, exams)

import { create } from 'zustand'
import { getCurrentSession, getSessions } from '@/api/sessions'

const useSessionStore = create((set) => ({
  // ── State ───────────────────────────────────────────────────────────
  currentSession : null,
  sessions       : [],
  isLoading      : false,
  error          : null,

  // ── Actions ─────────────────────────────────────────────────────────

  fetchCurrentSession: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await getCurrentSession()
      set({ currentSession: res.data, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  fetchSessions: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await getSessions()
      set({ sessions: res.data, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  setCurrentSession: (session) => set({ currentSession: session }),
}))

export default useSessionStore
