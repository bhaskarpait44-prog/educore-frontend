// src/store/useAccountantStore.js
import { create } from 'zustand'

const useAccountantStore = create((set, get) => ({
  // Dashboard
  dashboardData        : null,
  dashboardSummary     : null,
  dashboardTodayStats  : null,
  dashboardTransactions: [],
  dashboardTasks       : [],
  dashboardWeekTrend   : [],
  dashboardLastRefreshedAt: null,

  // Students
  students        : [],
  selectedStudent : null,
  studentFeeDetail: null,

  // Receipts
  receipts        : [],
  selectedReceipt : null,

  // Defaulters
  defaulters      : [],

  // Profile
  accountantProfile        : null,
  accountantProfileActivity: null,

  // State flags
  isLoading         : false,
  isSaving          : false,
  isDashboardLoading: false,
  error             : null,

  // Setters
  setLoading       : b   => set({ isLoading: b }),
  setSaving        : b   => set({ isSaving: b }),
  setDashboardLoading : b => set({ isDashboardLoading: b }),
  setError         : e   => set({ error: e }),
  setDashboard     : (payload) => set({
    dashboardData           : payload,
    dashboardSummary        : payload?.summary || null,
    dashboardTodayStats     : payload?.todayStats || null,
    dashboardTransactions   : payload?.transactions || [],
    dashboardTasks          : payload?.tasks || [],
    dashboardWeekTrend      : payload?.weekTrend || [],
    dashboardLastRefreshedAt: payload?.lastRefreshedAt || null,
  }),
  setDashboardTransactions: (transactions, lastRefreshedAt = null) => set({
    dashboardTransactions,
    dashboardLastRefreshedAt: lastRefreshedAt || new Date().toISOString(),
  }),
  setDashboardLastRefreshedAt: (value) => set({ dashboardLastRefreshedAt: value }),
  setStudents      : s   => set({ students: s }),
  setSelectedStudent: s  => set({ selectedStudent: s }),
  setStudentFeeDetail: d => set({ studentFeeDetail: d }),
  setReceipts      : r   => set({ receipts: r }),
  setSelectedReceipt: r  => set({ selectedReceipt: r }),
  setDefaulters    : d   => set({ defaulters: d }),
  setAccountantProfile: p => set({ accountantProfile: p }),
  setAccountantProfileActivity: a => set({ accountantProfileActivity: a }),

  clearStudentData: () => set({ selectedStudent: null, studentFeeDetail: null }),
}))

export default useAccountantStore
