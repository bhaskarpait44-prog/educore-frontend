import { useEffect, useRef } from 'react'
import useTeacherStore from '@/store/useTeacherStore'

const AUTO_REFRESH_MS = 5 * 60 * 1000

const useTeacherDashboard = () => {
  const {
    dashboard,
    schedule,
    pendingTasks,
    recentActivity,
    loading,
    refreshing,
    error,
    offline,
    lastLoadedAt,
    fetchTeacherDashboard,
    clearTeacherDashboard,
    setOffline,
  } = useTeacherStore()

  const timerRef = useRef(null)

  useEffect(() => {
    fetchTeacherDashboard().catch(() => {})

    timerRef.current = window.setInterval(() => {
      fetchTeacherDashboard({ silent: true }).catch(() => {})
    }, AUTO_REFRESH_MS)

    const handleOnline = () => {
      setOffline(false)
      fetchTeacherDashboard({ silent: true }).catch(() => {})
    }

    const handleOffline = () => setOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearTeacherDashboard()
    }
  }, [fetchTeacherDashboard, clearTeacherDashboard, setOffline])

  return {
    dashboard,
    schedule,
    pendingTasks,
    recentActivity,
    loading,
    refreshing,
    error,
    offline,
    lastLoadedAt,
    refresh: fetchTeacherDashboard,
  }
}

export default useTeacherDashboard
