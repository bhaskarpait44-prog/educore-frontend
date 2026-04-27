import { create } from 'zustand'
import * as teacherApi from '@/api/teacherApi'

const useTeacherStore = create((set) => ({
  dashboard: null,
  schedule: [],
  pendingTasks: [],
  recentActivity: [],
  loading: false,
  refreshing: false,
  error: null,
  lastLoadedAt: null,
  offline: typeof navigator !== 'undefined' ? !navigator.onLine : false,

  setOffline: (offline) => set({ offline }),

  clearTeacherDashboard: () => set({
    dashboard: null,
    schedule: [],
    pendingTasks: [],
    recentActivity: [],
    loading: false,
    refreshing: false,
    error: null,
    lastLoadedAt: null,
  }),

  fetchTeacherDashboard: async ({ silent = false } = {}) => {
    set((state) => ({
      loading: silent ? state.loading : true,
      refreshing: silent,
      error: null,
    }))

    try {
      const [dashboardRes, scheduleRes, tasksRes, activityRes] = await Promise.all([
        teacherApi.getTeacherDashboard(),
        teacherApi.getTeacherTodaySchedule(),
        teacherApi.getTeacherPendingTasks(),
        teacherApi.getTeacherRecentActivity(),
      ])

      set({
        dashboard: dashboardRes?.data || null,
        schedule: scheduleRes?.data?.schedule || dashboardRes?.data?.today_schedule || [],
        pendingTasks: tasksRes?.data?.tasks || [],
        recentActivity: activityRes?.data?.activity || dashboardRes?.data?.recent_activity || [],
        loading: false,
        refreshing: false,
        error: null,
        lastLoadedAt: new Date().toISOString(),
      })

      return dashboardRes?.data || null
    } catch (error) {
      set({
        loading: false,
        refreshing: false,
        error: error?.message || 'Unable to load dashboard.',
      })
      throw error
    }
  },
}))

export default useTeacherStore
