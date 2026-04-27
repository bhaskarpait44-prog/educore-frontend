// src/store/dashboardStore.js
import { create } from 'zustand'
import { getAuditLogs } from '@/api/audit'

const useDashboardStore = create((set) => ({
  stats            : null,
  attendanceChart  : [],
  recentAdmissions : [],
  feeDefaulters    : [],
  recentAudit      : [],
  isLoading        : false,
  lastRefreshed    : null,
  error            : null,

  fetchAll: async () => {
    set({ isLoading: true, error: null })

    try {
      const [studentsRes, auditRes] = await Promise.allSettled([
        import('@/api/students').then((m) => m.getStudents({ perPage: 1 })),
        getAuditLogs({ limit: 5, page: 1 }),
      ])

      const studentsData = studentsRes.status === 'fulfilled' ? studentsRes.value?.data : null
      const auditData = auditRes.status === 'fulfilled' ? auditRes.value?.data : null

      const syntheticStats = {
        totalStudents  : studentsData?.pagination?.total || studentsData?.meta?.total || 0,
        studentTrend   : null,
        attendanceToday: { percentage: null, present: 0, absent: 0 },
        feeCollection  : { collected: 0, pending: 0, percentage: 0 },
        upcomingExams  : { count: 0, next: null },
      }

      const recentStudents = await import('@/api/students')
        .then((m) => m.getStudents({ perPage: 10, sort: 'created_at:desc' }))
        .then((r) => Array.isArray(r.data) ? r.data : r.data?.students || r.data?.data || [])
        .catch(() => [])

      set({
        stats           : syntheticStats,
        attendanceChart : [],
        recentAdmissions: recentStudents,
        feeDefaulters   : [],
        recentAudit     : auditData?.logs || (Array.isArray(auditData) ? auditData : []),
        isLoading       : false,
        lastRefreshed   : new Date(),
      })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  clearDashboard: () => set({
    stats: null,
    attendanceChart: [],
    recentAdmissions: [],
    feeDefaulters: [],
    recentAudit: [],
    lastRefreshed: null,
  }),
}))

export default useDashboardStore
