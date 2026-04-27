import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as studentApi from '@/api/studentApi'
import { isStudentPortalSetupError } from '@/utils/studentPortal'

const getNowMonth = () => {
  const now = new Date()
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  }
}

const useStudentAttendance = () => {
  const [selectedMonth, setSelectedMonth] = useState(getNowMonth())
  const [attendance, setAttendance] = useState(null)
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)
  const selectedMonthRef = useRef(selectedMonth)

  useEffect(() => {
    selectedMonthRef.current = selectedMonth
  }, [selectedMonth])

  const loadAttendance = useCallback(async ({ silent = false, month, year } = {}) => {
    const currentMonth = selectedMonthRef.current
    const target = {
      month: month || currentMonth.month,
      year: year || currentMonth.year,
    }

    setError(null)
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const [attendanceRes, summaryRes, trendRes] = await Promise.all([
        studentApi.getStudentAttendance(target),
        studentApi.getStudentAttendanceSummary(),
        studentApi.getStudentAttendanceTrend(),
      ])

      setAttendance(attendanceRes?.data || null)
      setSummary(summaryRes?.data || null)
      setTrend(trendRes?.data?.trend || [])
      setSelectedMonth(target)
      setLoading(false)
      setRefreshing(false)

      return attendanceRes?.data || null
    } catch (err) {
      if (isStudentPortalSetupError(err)) {
        setAttendance({
          records: [],
          summary: null,
          selected_month: target,
          monthly_summary: {
            working_days: 0,
            present_days: 0,
            absent_days: 0,
            late_days: 0,
            half_days: 0,
            percentage: 0,
          },
        })
        setSummary({
          working_days: 0,
          present_days: 0,
          absent_days: 0,
          late_days: 0,
          half_days: 0,
          percentage: 0,
          band: 'low',
          days_needed_for_minimum: 0,
        })
        setTrend([])
        setSelectedMonth(target)
        setLoading(false)
        setRefreshing(false)
        return null
      }

      setError(err?.message || 'Unable to load attendance.')
      setLoading(false)
      setRefreshing(false)
      throw err
    }
  }, [])

  useEffect(() => {
    loadAttendance().catch(() => {})
  }, [loadAttendance])

  const changeMonth = useCallback((month, year) => {
    loadAttendance({ month, year }).catch(() => {})
  }, [loadAttendance])

  const exportAttendance = useCallback(async () => {
    setExporting(true)
    try {
      const res = await studentApi.getStudentAttendanceExport()
      setExporting(false)
      return res?.data || null
    } catch (err) {
      if (isStudentPortalSetupError(err)) {
        setExporting(false)
        return null
      }
      setExporting(false)
      throw err
    }
  }, [])

  return {
    attendance,
    summary,
    trend,
    selectedMonth,
    loading,
    refreshing,
    exporting,
    error,
    changeMonth,
    refresh: () => loadAttendance({ silent: true }),
    exportAttendance,
    availableMonths: useMemo(() => buildMonthOptions(selectedMonth.year), [selectedMonth.year]),
  }
}

function buildMonthOptions(year) {
  return Array.from({ length: 12 }).map((_, index) => {
    const date = new Date(year, index, 1)
    return {
      month: index + 1,
      year,
      label: date.toLocaleDateString('en-IN', { month: 'short' }),
      longLabel: date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    }
  })
}

export default useStudentAttendance
