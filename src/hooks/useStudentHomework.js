import { useCallback, useEffect, useMemo, useState } from 'react'
import * as studentApi from '@/api/studentApi'
import { isStudentPortalSetupError } from '@/utils/studentPortal'

const useStudentHomework = () => {
  const [homework, setHomework] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [selectedHomework, setSelectedHomework] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async ({ silent = false } = {}) => {
    setError(null)
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const [homeworkRes, submissionsRes] = await Promise.all([
        studentApi.getStudentHomework(),
        studentApi.getStudentHomeworkSubmissions(),
      ])
      setHomework(homeworkRes?.data?.homework || [])
      setSubmissions(submissionsRes?.data?.submissions || [])
      setLoading(false)
      setRefreshing(false)
    } catch (err) {
      if (isStudentPortalSetupError(err)) {
        setHomework([])
        setSubmissions([])
        setLoading(false)
        setRefreshing(false)
        return null
      }

      setError(err?.message || 'Unable to load homework.')
      setLoading(false)
      setRefreshing(false)
      throw err
    }
  }, [])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  const openHomework = useCallback(async (homeworkId) => {
    setDetailLoading(true)
    try {
      const res = await studentApi.getStudentHomeworkDetail(homeworkId)
      setSelectedHomework(res?.data || null)
      setDetailLoading(false)
      return res?.data || null
    } catch (err) {
      setDetailLoading(false)
      throw err
    }
  }, [])

  const submitHomework = useCallback(async (homeworkId, payload) => {
    setSubmitting(true)
    try {
      const res = await studentApi.submitStudentHomework(homeworkId, payload)
      const detail = await studentApi.getStudentHomeworkDetail(homeworkId)
      setSelectedHomework(detail?.data || null)
      await load({ silent: true })
      setSubmitting(false)
      return res?.data || null
    } catch (err) {
      setSubmitting(false)
      throw err
    }
  }, [load])

  return {
    homework,
    submissions,
    selectedHomework,
    loading,
    refreshing,
    detailLoading,
    submitting,
    error,
    refresh: () => load({ silent: true }),
    openHomework,
    closeHomework: () => setSelectedHomework(null),
    submitHomework,
    subjects: useMemo(
      () => [...new Map(homework.map((item) => [item.subject_name, item.subject_name])).values()],
      [homework]
    ),
  }
}

export default useStudentHomework
