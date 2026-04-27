import { useCallback, useEffect, useState } from 'react'
import * as teacherApi from '@/api/teacherApi'

const useTeacherProfile = () => {
  const [profile, setProfile] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [correctionRequests, setCorrectionRequests] = useState([])
  const [performanceSummary, setPerformanceSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await teacherApi.getTeacherProfile()
      setProfile(res?.data?.profile || null)
      setAssignments(res?.data?.assignments || [])
      setCorrectionRequests(res?.data?.correction_requests || [])
      setPerformanceSummary(res?.data?.performance_summary || null)
      return res?.data
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load().catch(() => setLoading(false))
  }, [load])

  const submitContactUpdate = useCallback(async (payload) => {
    setSaving(true)
    try {
      const res = await teacherApi.updateTeacherProfileContact(payload)
      await load()
      return res?.data
    } finally {
      setSaving(false)
    }
  }, [load])

  const submitPasswordChange = useCallback(async (payload) => {
    setSaving(true)
    try {
      const res = await teacherApi.changeTeacherPassword(payload)
      return res?.data
    } finally {
      setSaving(false)
    }
  }, [])

  const submitCorrectionRequest = useCallback(async (payload) => {
    setSaving(true)
    try {
      const res = await teacherApi.createTeacherCorrectionRequest(payload)
      await load()
      return res?.data
    } finally {
      setSaving(false)
    }
  }, [load])

  return {
    profile,
    assignments,
    correctionRequests,
    performanceSummary,
    loading,
    saving,
    reload: load,
    submitContactUpdate,
    submitPasswordChange,
    submitCorrectionRequest,
  }
}

export default useTeacherProfile
