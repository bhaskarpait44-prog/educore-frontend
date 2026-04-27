// src/store/auditStore.js
import { create } from 'zustand'
import * as api from '@/api/audit'

const useAuditStore = create((set, get) => ({
  logs          : [],
  selectedLog   : null,
  recordHistory : [],
  adminActivity : null,
  admins        : [],
  pagination    : { page: 1, perPage: 30, total: 0, totalPages: 1 },
  isLoading     : false,
  error         : null,

  // ── Fetch paginated audit logs ──────────────────────────────────────
  fetchLogs: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const res  = await api.getAuditLogs(params)
      const data = res.data
      // Handle { logs: [], total: N } or plain array
      const logs = Array.isArray(data) ? data
                 : (data?.logs || data?.data || [])
      const meta = data?.meta || data?.pagination || {}

      set({
        logs,
        pagination: {
          page      : Number(meta.page)       || Number(params.page) || 1,
          perPage   : Number(meta.perPage)    || Number(params.limit) || 30,
          total     : Number(meta.total || data?.total) || logs.length,
          totalPages: Number(meta.totalPages) || Math.ceil((data?.total || logs.length) / (params.limit || 30)) || 1,
        },
        isLoading: false,
      })
      return logs
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  // ── Fetch single log detail ─────────────────────────────────────────
  fetchDetail: async (id) => {
    set({ isLoading: true })
    try {
      const res = await api.getAuditDetail(id)
      set({ selectedLog: res.data, isLoading: false })
      return res.data
    } catch (err) {
      set({ isLoading: false }); throw err
    }
  },

  // ── Fetch history for one record (student, invoice, etc.) ───────────
  fetchRecordHistory: async (table, recordId) => {
    set({ isLoading: true, recordHistory: [] })
    try {
      const res  = await api.getRecordHistory(table, recordId)
      const logs = res.data?.logs || res.data || []
      set({ recordHistory: logs, isLoading: false })
      return logs
    } catch (err) {
      set({ isLoading: false }); throw err
    }
  },

  // ── Fetch admin activity ────────────────────────────────────────────
  fetchAdminActivity: async (adminId, params = {}) => {
    set({ isLoading: true, adminActivity: null })
    try {
      const res = await api.getAdminActivity(adminId, params)
      set({ adminActivity: res.data, isLoading: false })
      return res.data
    } catch (err) {
      set({ isLoading: false }); throw err
    }
  },

  // ── Fetch admin list for dropdown ───────────────────────────────────
  fetchAdmins: async () => {
    try {
      const res   = await api.getAdmins()
      const users = Array.isArray(res.data) ? res.data : (res.data?.users || res.data?.data || [])
      set({ admins: users })
      return users
    } catch { return [] }
  },

  clearSelected: () => set({ selectedLog: null }),
}))

export default useAuditStore