import { useCallback, useEffect, useMemo, useState } from 'react'
import * as studentApi from '@/api/studentApi'
import { isStudentPortalSetupError } from '@/utils/studentPortal'

const useStudentTimetable = () => {
  const [timetable, setTimetable] = useState([])
  const [todaySchedule, setTodaySchedule] = useState([])
  const [currentPeriod, setCurrentPeriod] = useState(null)
  const [nextPeriod, setNextPeriod] = useState(null)
  const [examSchedule, setExamSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async ({ silent = false } = {}) => {
    setError(null)
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const [weeklyRes, todayRes, currentRes, examsRes] = await Promise.all([
        studentApi.getStudentTimetable(),
        studentApi.getStudentTimetableToday(),
        studentApi.getStudentCurrentPeriod(),
        studentApi.getStudentExamSchedule(),
      ])

      setTimetable(weeklyRes?.data?.timetable || [])
      setTodaySchedule(todayRes?.data?.schedule || [])
      setCurrentPeriod(currentRes?.data?.current_period || null)
      setNextPeriod(currentRes?.data?.next_period || null)
      setExamSchedule(examsRes?.data?.exams || [])
      setLoading(false)
      setRefreshing(false)
    } catch (err) {
      if (isStudentPortalSetupError(err)) {
        setTimetable([])
        setTodaySchedule([])
        setCurrentPeriod(null)
        setNextPeriod(null)
        setExamSchedule([])
        setLoading(false)
        setRefreshing(false)
        return null
      }

      setError(err?.message || 'Unable to load timetable.')
      setLoading(false)
      setRefreshing(false)
      throw err
    }
  }, [])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  return {
    timetable,
    todaySchedule,
    currentPeriod,
    nextPeriod,
    examSchedule,
    loading,
    refreshing,
    error,
    refresh: () => load({ silent: true }),
    totalPeriods: useMemo(() => todaySchedule.length || timetable.length, [todaySchedule.length, timetable.length]),
  }
}

export default useStudentTimetable
