import { create } from 'zustand'
import * as studentApi from '@/api/studentApi'
import { isStudentPortalSetupError } from '@/utils/studentPortal'

const useStudentStore = create((set) => ({
  dashboard: null,
  todaySchedule: [],
  upcomingEvents: [],
  achievements: [],
  loading: false,
  refreshing: false,
  error: null,
  offline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  lastLoadedAt: null,

  setOffline: (offline) => set({ offline }),

  clearDashboard: () => set({
    dashboard: null,
    todaySchedule: [],
    upcomingEvents: [],
    achievements: [],
    loading: false,
    refreshing: false,
    error: null,
    lastLoadedAt: null,
  }),

  fetchDashboard: async ({ silent = false } = {}) => {
    set((state) => ({
      loading: silent ? state.loading : true,
      refreshing: silent,
      error: null,
    }))

    try {
      const [dashboardRes, scheduleRes, eventsRes, achievementsRes] = await Promise.all([
        studentApi.getStudentDashboard(),
        studentApi.getStudentTodaySchedule(),
        studentApi.getStudentUpcomingEvents(),
        studentApi.getStudentAchievements(),
      ])

      set({
        dashboard: dashboardRes?.data || null,
        todaySchedule: scheduleRes?.data?.schedule || dashboardRes?.data?.today_schedule || [],
        upcomingEvents: eventsRes?.data?.events || dashboardRes?.data?.upcoming_events || [],
        achievements: achievementsRes?.data?.achievements || dashboardRes?.data?.achievements || [],
        loading: false,
        refreshing: false,
        error: null,
        lastLoadedAt: new Date().toISOString(),
      })

      return dashboardRes?.data || null
    } catch (error) {
      if (isStudentPortalSetupError(error)) {
        set({
          dashboard: null,
          todaySchedule: [],
          upcomingEvents: [],
          achievements: [],
          loading: false,
          refreshing: false,
          error: null,
          lastLoadedAt: new Date().toISOString(),
        })
        return null
      }

      set({
        loading: false,
        refreshing: false,
        error: error?.message || 'Unable to load the student dashboard.',
      })
      throw error
    }
  },
}))

export default useStudentStore
