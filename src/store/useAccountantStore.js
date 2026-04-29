import { create } from 'zustand'
import * as accountantApi from '@/api/accountantApi'

const useAccountantStore = create((set) => ({
  dashboard: null,
  todayStats: null,
  recentTransactions: [],
  pendingTasks: [],
  weekTrend: [],
  isLoading: false,
  error: null,

  fetchDashboardBundle: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const [dashboard, todayStats, recentTransactions, pendingTasks, weekTrend] = await Promise.all([
        accountantApi.getAccountantDashboard(params),
        accountantApi.getTodayStats(params),
        accountantApi.getRecentTransactions(params),
        accountantApi.getPendingTasks(params),
        accountantApi.getWeekTrend(params),
      ])

      set({
        dashboard: dashboard.data,
        todayStats: todayStats.data,
        recentTransactions: recentTransactions.data?.transactions || [],
        pendingTasks: pendingTasks.data?.tasks || [],
        weekTrend: weekTrend.data?.trend || [],
        isLoading: false,
      })
      return true
    } catch (error) {
      set({ error: error.message || 'Failed to load accountant dashboard', isLoading: false })
      throw error
    }
  },
}))

export default useAccountantStore
