import { useEffect, useRef } from 'react'
import useStudentStore from '@/store/useStudentStore'

const AUTO_REFRESH_MS = 5 * 60 * 1000

const useStudentDashboard = () => {
  const {
    dashboard,
    todaySchedule,
    upcomingEvents,
    achievements,
    loading,
    refreshing,
    error,
    offline,
    lastLoadedAt,
    fetchDashboard,
    clearDashboard,
    setOffline,
  } = useStudentStore()

  const timerRef = useRef(null)

  useEffect(() => {
    fetchDashboard().catch(() => {})

    timerRef.current = window.setInterval(() => {
      fetchDashboard({ silent: true }).catch(() => {})
    }, AUTO_REFRESH_MS)

    const handleOnline = () => {
      setOffline(false)
      fetchDashboard({ silent: true }).catch(() => {})
    }

    const handleOffline = () => setOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearDashboard()
    }
  }, [fetchDashboard, clearDashboard, setOffline])

  return {
    dashboard,
    todaySchedule,
    upcomingEvents,
    achievements,
    loading,
    refreshing,
    error,
    offline,
    lastLoadedAt,
    refresh: () => fetchDashboard({ silent: true }),
  }
}

export default useStudentDashboard
