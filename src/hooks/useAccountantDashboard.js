import { useEffect } from 'react'
import useAccountantStore from '@/store/useAccountantStore'

const useAccountantDashboard = (params = {}) => {
  const {
    dashboard,
    todayStats,
    recentTransactions,
    pendingTasks,
    weekTrend,
    isLoading,
    error,
    fetchDashboardBundle,
  } = useAccountantStore()

  useEffect(() => {
    fetchDashboardBundle(params).catch(() => {})
    const timer = window.setInterval(() => fetchDashboardBundle(params).catch(() => {}), 60_000)
    return () => window.clearInterval(timer)
  }, [JSON.stringify(params)])

  return {
    dashboard,
    todayStats,
    recentTransactions,
    pendingTasks,
    weekTrend,
    isLoading,
    error,
    refresh: () => fetchDashboardBundle(params),
  }
}

export default useAccountantDashboard
