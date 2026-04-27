// src/store/studentStore.js
import { create } from 'zustand'
import * as studentsApi from '@/api/students'

const useStudentStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────
  students      : [],
  selectedStudent: null,
  auditLogs     : [],
  history       : null,
  pagination    : { page: 1, perPage: 20, total: 0, totalPages: 1 },
  isLoading     : false,
  isSaving      : false,
  error         : null,

  // ── Fetch list ──────────────────────────────────────────────────────────
  fetchStudents: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const res = await studentsApi.getStudents(params)
      // Support both paginated and plain array responses
      const data     = res.data
      const students = Array.isArray(data) ? data : (data.students || data.data || [])
      const meta     = data.meta || data.pagination || {}
      set({
        students,
        pagination: {
          page      : meta.page       || params.page || 1,
          perPage   : meta.perPage    || params.perPage || 20,
          total     : meta.total      || students.length,
          totalPages: meta.totalPages || 1,
        },
        isLoading: false,
      })
      return students
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  // ── Fetch single ────────────────────────────────────────────────────────
  fetchStudent: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const res = await studentsApi.getStudent(id)
      set({ selectedStudent: res.data, isLoading: false })
      return res.data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  // ── Create student (admission) ──────────────────────────────────────────
  createStudent: async (data) => {
    set({ isSaving: true })
    try {
      const res = await studentsApi.createStudent(data)
      set(s => ({ students: [res.data, ...s.students], isSaving: false }))
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  deleteStudent: async (id, data) => {
    set({ isSaving: true })
    try {
      await studentsApi.deleteStudent(id, data)
      set(s => ({
        students       : s.students.filter(student => student.id !== Number(id)),
        selectedStudent: s.selectedStudent?.id === Number(id) ? null : s.selectedStudent,
        isSaving      : false,
      }))
      return { success: true }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message, errors: err.errors || [] }
    }
  },

  // ── Update identity ─────────────────────────────────────────────────────
  updateIdentity: async (id, data) => {
    set({ isSaving: true })
    try {
      const res = await studentsApi.updateIdentity(id, data)
      set(s => ({
        isSaving       : false,
        selectedStudent: s.selectedStudent
          ? { ...s.selectedStudent, ...res.data }
          : s.selectedStudent,
      }))
      return { success: true }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Update profile ──────────────────────────────────────────────────────
  updateProfile: async (id, data) => {
    set({ isSaving: true })
    try {
      const res = await studentsApi.updateProfile(id, data)
      set(s => ({
        isSaving       : false,
        selectedStudent: s.selectedStudent
          ? { ...s.selectedStudent, ...res.data.new_version }
          : s.selectedStudent,
      }))
      return { success: true }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Fetch history ───────────────────────────────────────────────────────
  fetchHistory: async (id) => {
    set({ isLoading: true })
    try {
      const res = await studentsApi.getHistory(id)
      set({ history: res.data, isLoading: false })
      return res.data
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  // ── Fetch audit log ─────────────────────────────────────────────────────
  fetchAuditLog: async (table, id) => {
    set({ isLoading: true })
    try {
      const res = await studentsApi.getAuditLog(table, id)
      const logs = res.data?.logs || res.data || []
      set({ auditLogs: logs, isLoading: false })
      return logs
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  clearSelected: () => set({ selectedStudent: null, history: null, auditLogs: [] }),
}))

export default useStudentStore
