// src/store/attendanceStore.js
import { create } from 'zustand'
import * as api from '@/api/attendance'

const useAttendanceStore = create((set) => ({
  classAttendance   : [],
  sessionReport     : [],
  studentSummary    : null,
  studentRecords    : [],
  isLoading         : false,
  isSaving          : false,
  error             : null,

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

  fetchClassRegister: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getClassRegister(params)
      const rows = res.data?.students || []
      set({ sessionReport: rows, isLoading: false })
      return rows
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  fetchStudentAttendance: async (enrollmentId, params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getEnrollmentAttendance(enrollmentId, params)
      const payload = res.data || {}
      set({
        studentRecords: payload.records || [],
        studentSummary: payload.summary || null,
        isLoading: false,
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
