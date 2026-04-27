import { useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import * as api from '@/api/accountantApi'
import useAccountantStore from '@/store/useAccountantStore'
import useToast from '@/hooks/useToast'

const useAccountant = () => {
  const state = useAccountantStore(useShallow((store) => ({
    dashboardData            : store.dashboardData,
    dashboardSummary         : store.dashboardSummary,
    dashboardTodayStats      : store.dashboardTodayStats,
    dashboardTransactions    : store.dashboardTransactions,
    dashboardTasks           : store.dashboardTasks,
    dashboardWeekTrend       : store.dashboardWeekTrend,
    dashboardLastRefreshedAt : store.dashboardLastRefreshedAt,
    students                 : store.students,
    selectedStudent          : store.selectedStudent,
    studentFeeDetail         : store.studentFeeDetail,
    receipts                 : store.receipts,
    selectedReceipt          : store.selectedReceipt,
    defaulters               : store.defaulters,
    accountantProfile        : store.accountantProfile,
    accountantProfileActivity: store.accountantProfileActivity,
    isLoading                : store.isLoading,
    isSaving                 : store.isSaving,
    isDashboardLoading       : store.isDashboardLoading,
  })))

  const actions = useAccountantStore(useShallow((store) => ({
    setDashboardLoading      : store.setDashboardLoading,
    setDashboard             : store.setDashboard,
    setDashboardTransactions : store.setDashboardTransactions,
    setLoading               : store.setLoading,
    setStudents              : store.setStudents,
    setStudentFeeDetail      : store.setStudentFeeDetail,
    setSaving                : store.setSaving,
    setReceipts              : store.setReceipts,
    setSelectedReceipt       : store.setSelectedReceipt,
    setDefaulters            : store.setDefaulters,
    setAccountantProfile     : store.setAccountantProfile,
    setAccountantProfileActivity: store.setAccountantProfileActivity,
  })))
  const { toastSuccess, toastError } = useToast()

  const fetchDashboard = useCallback(async ({ silent = false } = {}) => {
    if (!silent) actions.setDashboardLoading(true)

    try {
      const { data } = await api.getDashboard()

      const payload = {
        summary         : data,
        todayStats      : data?.today_stats || {
          collection        : data?.today_collection || null,
          pending_today     : data?.pending_collection_today || null,
          month             : data?.month_so_far || null,
          session           : data?.session_overview || null,
          last_refreshed_at : data?.last_refreshed_at || new Date().toISOString(),
        },
        transactions    : Array.isArray(data?.transactions?.items) ? data.transactions.items : [],
        tasks           : Array.isArray(data?.pending_tasks?.tasks) ? data.pending_tasks.tasks : [],
        weekTrend       : Array.isArray(data?.week_trend?.items) ? data.week_trend.items : [],
        lastRefreshedAt : data?.last_refreshed_at || data?.today_stats?.last_refreshed_at || new Date().toISOString(),
      }

      actions.setDashboard(payload)
      return payload
    } catch (e) {
      toastError(e.message || 'Failed to load dashboard')
      throw e
    } finally {
      if (!silent) actions.setDashboardLoading(false)
    }
  }, [actions, toastError])

  const refreshDashboardTransactions = useCallback(async () => {
    try {
      const r = await api.getDashboardRecentTransactions()
      const items = Array.isArray(r.data?.items) ? r.data.items : []
      actions.setDashboardTransactions(items, new Date().toISOString())
      return items
    } catch (e) {
      toastError(e.message || 'Failed to refresh transaction feed')
      throw e
    }
  }, [actions, toastError])

  const fetchStudents = useCallback(async (params = {}) => {
    actions.setLoading(true)
    try {
      const r = await api.getStudentList(params)
      actions.setStudents(r.data.items || r.data.students || r.data || [])
      return r.data
    } catch (e) {
      toastError(e.message || 'Failed to load students')
      throw e
    } finally {
      actions.setLoading(false)
    }
  }, [actions, toastError])

  const fetchStudentFees = useCallback(async (id) => {
    actions.setLoading(true)
    try {
      const r = await api.getStudentFeeDetail(id)
      actions.setStudentFeeDetail(r.data)
      return r.data
    } catch (e) {
      toastError(e.message || 'Failed to load fee details')
      throw e
    } finally {
      actions.setLoading(false)
    }
  }, [actions, toastError])

  const searchStudents = useCallback(async (query) => {
    try {
      const r = await api.searchAccountantStudents({ q: query })
      return r.data?.items || []
    } catch (e) {
      toastError(e.message || 'Failed to search students')
      return []
    }
  }, [toastError])

  const fetchPendingInvoices = useCallback(async (id) => {
    try {
      const r = await api.getStudentPendingInvoices(id)
      return r.data
    } catch (e) {
      toastError(e.message || 'Failed to load pending invoices')
      throw e
    }
  }, [toastError])

  const collectFee = useCallback(async (data) => {
    actions.setSaving(true)
    try {
      const r = await api.collectFee(data)
      const receiptNo = r.data?.receipt?.receipt_no || r.data?.receipt_no || r.data?.payment?.paymentId || 'Generated'
      toastSuccess(`Payment of Rs ${data.amount} recorded. Receipt: ${receiptNo}`)
      return { success: true, data: r.data }
    } catch (e) {
      toastError(e.message || 'Payment failed')
      return { success: false, message: e.message }
    } finally {
      actions.setSaving(false)
    }
  }, [actions, toastError, toastSuccess])

  const waiveFee = useCallback(async (data) => {
    actions.setSaving(true)
    try {
      const r = await api.waiveFee(data)
      toastSuccess('Fee waived successfully')
      return { success: true, data: r.data }
    } catch (e) {
      toastError(e.message || 'Waiver failed')
      return { success: false, message: e.message }
    } finally {
      actions.setSaving(false)
    }
  }, [actions, toastError, toastSuccess])

  const fetchReceipts = useCallback(async (params = {}) => {
    actions.setLoading(true)
    try {
      const r = await api.listReceipts(params)
      actions.setReceipts(r.data.items || r.data.receipts || [])
      return r.data
    } catch (e) {
      toastError(e.message || 'Failed to load receipts')
      throw e
    } finally {
      actions.setLoading(false)
    }
  }, [actions, toastError])

  const fetchReceipt = useCallback(async (id) => {
    actions.setLoading(true)
    try {
      const r = await api.getReceipt(id)
      actions.setSelectedReceipt(r.data)
      return r.data
    } catch (e) {
      toastError(e.message || 'Receipt not found')
      throw e
    } finally {
      actions.setLoading(false)
    }
  }, [actions, toastError])

  const fetchDefaulters = useCallback(async (params = {}) => {
    actions.setLoading(true)
    try {
      const r = await api.getDefaulters(params)
      actions.setDefaulters(r.data.items || r.data.defaulters || [])
      return r.data
    } catch (e) {
      toastError(e.message || 'Failed to load defaulters')
      throw e
    } finally {
      actions.setLoading(false)
    }
  }, [actions, toastError])

  const sendReminder = useCallback(async (data) => {
    actions.setSaving(true)
    try {
      const r = await api.sendReminder(data)
      toastSuccess(`${r.data.sent} reminder(s) sent`)
      return { success: true, data: r.data }
    } catch (e) {
      toastError(e.message || 'Failed to send reminders')
      return { success: false, message: e.message }
    } finally {
      actions.setSaving(false)
    }
  }, [actions, toastError, toastSuccess])

  const fetchProfile = useCallback(async () => {
    actions.setLoading(true)
    try {
      const r = await api.getAccountantProfile()
      actions.setAccountantProfile(r.data)
      return r.data
    } catch (e) {
      toastError(e.message || 'Failed to load profile')
      throw e
    } finally {
      actions.setLoading(false)
    }
  }, [actions, toastError])

  const fetchProfileActivity = useCallback(async () => {
    try {
      const r = await api.getAccountantProfileActivity()
      actions.setAccountantProfileActivity(r.data)
      return r.data
    } catch (e) {
      toastError(e.message || 'Failed to load profile activity')
      throw e
    }
  }, [actions, toastError])

  const changePassword = useCallback(async (data) => {
    actions.setSaving(true)
    try {
      const r = await api.changeAccountantPassword(data)
      return { success: true, data: r.data }
    } catch (e) {
      toastError(e.message || 'Unable to change password')
      return { success: false, message: e.message }
    } finally {
      actions.setSaving(false)
    }
  }, [actions, toastError])

  return {
    dashboardData           : state.dashboardData,
    dashboardSummary        : state.dashboardSummary,
    dashboardTodayStats     : state.dashboardTodayStats,
    dashboardTransactions   : state.dashboardTransactions,
    dashboardTasks          : state.dashboardTasks,
    dashboardWeekTrend      : state.dashboardWeekTrend,
    dashboardLastRefreshedAt: state.dashboardLastRefreshedAt,
    students                : state.students,
    selectedStudent         : state.selectedStudent,
    studentFeeDetail        : state.studentFeeDetail,
    receipts                : state.receipts,
    selectedReceipt         : state.selectedReceipt,
    defaulters              : state.defaulters,
    accountantProfile       : state.accountantProfile,
    accountantProfileActivity: state.accountantProfileActivity,
    isLoading               : state.isLoading,
    isSaving                : state.isSaving,
    isDashboardLoading      : state.isDashboardLoading,

    fetchDashboard,
    refreshDashboardTransactions,
    fetchStudents,
    searchStudents,
    fetchPendingInvoices,
    fetchStudentFees,
    collectFee,
    waiveFee,
    fetchReceipts,
    fetchReceipt,
    fetchDefaulters,
    sendReminder,
    fetchProfile,
    fetchProfileActivity,
    changePassword,
  }
}

export default useAccountant
