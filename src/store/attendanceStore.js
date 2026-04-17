// src/store/attendanceStore.js
import { create } from 'zustand'
import * as api from '@/api/attendance'

const useAttendanceStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────
  classAttendance   : [],   // students + today's status for mark page
  sessionReport     : [],   // all students × all dates for register
  studentSummary    : null, // single student summary
  studentRecords    : [],   // individual student daily records
  isLoading         : false,
  isSaving          : false,
  error             : null,

  // ── Mark attendance (bulk) ──────────────────────────────────────────────
  markBulk: async (data) => {
    set({ isSaving: true })
    try {
      const res = await api.markBulk(data)
      set({ isSaving: false })
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Override single record ──────────────────────────────────────────────
  overrideAttendance: async (id, data) => {
    set({ isSaving: true })
    try {
      const res = await api.overrideAttendance(id, data)
      set({ isSaving: false })
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Fetch session-wide report (register view) ───────────────────────────
  fetchSessionReport: async (sessionId, params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getSessionReport(sessionId, params)
      const rows = res.data || []
      set({ sessionReport: rows, isLoading: false })
      return rows
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  // ── Fetch single student attendance ────────────────────────────────────
  fetchStudentAttendance: async (enrollmentId, params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getEnrollmentAttendance(enrollmentId, params)
      const payload = res.data || {}
      set({
        studentRecords : payload.records || [],
        studentSummary : payload.summary || null,
        isLoading      : false,
      })
      return payload
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  clearStudentData: () => set({ studentRecords: [], studentSummary: null }),
}))

export default useAttendanceStore