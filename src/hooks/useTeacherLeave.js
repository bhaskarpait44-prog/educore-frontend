import { useCallback, useEffect, useMemo, useState } from 'react'
import * as teacherApi from '@/api/teacherApi'

const useTeacherLeave = () => {
  const [balances, setBalances] = useState([])
  const [applications, setApplications] = useState([])
  const [session, setSession] = useState(null)
  const [workingDays, setWorkingDays] = useState(null)
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [balanceRes, applicationRes] = await Promise.all([
        teacherApi.getTeacherLeaveBalance(),
        teacherApi.getTeacherLeaveApplications(),
      ])

      setBalances(balanceRes?.data?.balances || [])
      setSession(balanceRes?.data?.session || null)
      setWorkingDays(balanceRes?.data?.working_days || null)
      setHolidays(balanceRes?.data?.holidays || [])
      setApplications(applicationRes?.data?.applications || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load().catch(() => setLoading(false))
  }, [load])

  const applyLeave = useCallback(async (payload) => {
    setSaving(true)
    try {
      const res = await teacherApi.applyTeacherLeave(payload)
      await load()
      return res?.data
    } finally {
      setSaving(false)
    }
  }, [load])

  const cancelLeave = useCallback(async (leaveId) => {
    setSaving(true)
    try {
      const res = await teacherApi.cancelTeacherLeave(leaveId)
      await load()
      return res?.data
    } finally {
      setSaving(false)
    }
  }, [load])

  const stats = useMemo(() => applications.reduce((acc, application) => {
    acc.total += 1
    if (application.status === 'pending') acc.pending += 1
    if (application.status === 'approved') acc.approved += 1
    if (application.status === 'rejected') acc.rejected += 1
    return acc
  }, { total: 0, pending: 0, approved: 0, rejected: 0 }), [applications])

  return {
    balances,
    applications,
    session,
    workingDays,
    holidays,
    loading,
    saving,
    stats,
    reload: load,
    applyLeave,
    cancelLeave,
  }
}

export default useTeacherLeave
