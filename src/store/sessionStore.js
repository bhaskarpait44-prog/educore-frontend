// src/store/sessionStore.js
import { create } from 'zustand'
import * as api from '@/api/sessions'

const useSessionStore = create((set, get) => ({
  sessions       : [],
  currentSession : null,
  selectedSession: null,
  isLoading      : false,
  isSaving       : false,
  error          : null,

  // ── Fetch all sessions ──────────────────────────────────────────────
  fetchSessions: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getSessions(params)
      set({ sessions: res.data, isLoading: false })
      return res.data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  // ── Fetch current session ───────────────────────────────────────────
  fetchCurrentSession: async () => {
    try {
      const res = await api.getCurrentSession()
      set({ currentSession: res.data })
      return res.data
    } catch {
      // Not critical — silently fail
    }
  },

  // ── Fetch single session ────────────────────────────────────────────
  fetchSession: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getSession(id)
      set({ selectedSession: res.data, isLoading: false })
      return res.data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  // ── Create session ──────────────────────────────────────────────────
  createSession: async (data) => {
    set({ isSaving: true })
    try {
      const res = await api.createSession(data)
      // Prepend to list
      set(s => ({ sessions: [res.data, ...s.sessions], isSaving: false }))
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Activate session ────────────────────────────────────────────────
  activateSession: async (id) => {
    set({ isSaving: true })
    try {
      const res = await api.activateSession(id)
      // Update in list + set as current
      set(s => ({
        isSaving       : false,
        currentSession : res.data,
        sessions       : s.sessions.map(sess =>
          sess.id === id
            ? { ...sess, status: 'active', is_current: true }
            : { ...sess, is_current: false, status: sess.status === 'active' ? 'closed' : sess.status }
        ),
        selectedSession: s.selectedSession?.id === id
          ? { ...s.selectedSession, status: 'active', is_current: true }
          : s.selectedSession,
      }))
      return { success: true }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Add holiday ─────────────────────────────────────────────────────
  addHoliday: async (sessionId, data) => {
    set({ isSaving: true })
    try {
      const res = await api.addHoliday(sessionId, data)
      // Append holiday to selected session
      set(s => ({
        isSaving       : false,
        selectedSession: s.selectedSession
          ? {
              ...s.selectedSession,
              holidays: [...(s.selectedSession.holidays || []), res.data?.holiday],
            }
          : s.selectedSession,
      }))
      return { success: true }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  clearSelected: () => set({ selectedSession: null }),
}))

export default useSessionStore