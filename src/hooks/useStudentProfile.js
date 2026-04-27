import { useCallback, useEffect, useState } from 'react'
import * as studentApi from '@/api/studentApi'

const useStudentProfile = () => {
  const [profile, setProfile] = useState(null)
  const [sharedRemarks, setSharedRemarks] = useState([])
  const [achievements, setAchievements] = useState([])
  const [correctionRequests, setCorrectionRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const [profileRes, requestsRes] = await Promise.all([
        studentApi.getStudentProfile(),
        studentApi.getStudentCorrectionRequests(),
      ])
      setProfile(profileRes?.data?.profile || null)
      setSharedRemarks(profileRes?.data?.shared_remarks || [])
      setAchievements(profileRes?.data?.achievements || [])
      setCorrectionRequests(requestsRes?.data?.requests || [])
      setLoading(false)
      return profileRes?.data
    } catch (err) {
      setError(err?.message || 'Unable to load profile.')
      setLoading(false)
      throw err
    }
  }, [])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  const submitCorrectionRequest = useCallback(async (payload) => {
    setSaving(true)
    try {
      const res = await studentApi.createStudentCorrectionRequest(payload)
      await load()
      setSaving(false)
      return res?.data
    } catch (err) {
      setSaving(false)
      throw err
    }
  }, [load])

  const submitPasswordChange = useCallback(async (payload) => {
    setSaving(true)
    try {
      const res = await studentApi.changeStudentPassword(payload)
      setSaving(false)
      return res?.data
    } catch (err) {
      setSaving(false)
      throw err
    }
  }, [])

  return {
    profile,
    sharedRemarks,
    achievements,
    correctionRequests,
    loading,
    saving,
    error,
    reload: load,
    submitCorrectionRequest,
    submitPasswordChange,
  }
}

export default useStudentProfile
