import { useCallback, useEffect, useMemo, useState } from 'react'
import * as teacherApi from '@/api/teacherApi'

const useTeacherNotices = () => {
  const [assignments, setAssignments] = useState([])
  const [notices, setNotices] = useState([])
  const [loadingBase, setLoadingBase] = useState(true)
  const [loadingNotices, setLoadingNotices] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadAssignments = useCallback(async () => {
    const res = await teacherApi.getTeacherMyClasses()
    const rows = [...(res?.data?.my_class || []), ...(res?.data?.subject_classes || [])]
    setAssignments(rows)
    return rows
  }, [])

  const loadNotices = useCallback(async (params = {}) => {
    setLoadingNotices(true)
    try {
      const res = await teacherApi.getTeacherNotices(params)
      const rows = res?.data?.notices || []
      setNotices(rows)
      return rows
    } finally {
      setLoadingNotices(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoadingBase(true)
      try {
        const [assignmentRows, noticeRows] = await Promise.all([
          loadAssignments(),
          loadNotices(),
        ])
        if (!active) return
        setAssignments(assignmentRows)
        setNotices(noticeRows)
      } finally {
        if (active) setLoadingBase(false)
      }
    }

    load().catch(() => {
      if (active) {
        setLoadingBase(false)
        setLoadingNotices(false)
      }
    })

    return () => { active = false }
  }, [loadAssignments, loadNotices])

  const classTeacherSections = useMemo(() => {
    const map = new Map()
    assignments
      .filter((assignment) => assignment.is_class_teacher)
      .forEach((assignment) => {
        const key = `${assignment.class_id}:${assignment.section_id}`
        if (!map.has(key)) {
          map.set(key, {
            value: key,
            label: `${assignment.class_name} ${assignment.section_name}`,
            class_id: assignment.class_id,
            section_id: assignment.section_id,
          })
        }
      })
    return [...map.values()]
  }, [assignments])

  const assignedSections = useMemo(() => {
    const map = new Map()
    assignments.forEach((assignment) => {
      const key = `${assignment.class_id}:${assignment.section_id}`
      if (!map.has(key)) {
        map.set(key, {
          value: key,
          label: `${assignment.class_name} ${assignment.section_name}`,
          class_id: assignment.class_id,
          section_id: assignment.section_id,
        })
      }
    })
    return [...map.values()]
  }, [assignments])

  const subjectTeacherSections = useMemo(() => {
    return assignments
      .filter((assignment) => !assignment.is_class_teacher && assignment.subject_id)
      .map((assignment) => ({
        value: `${assignment.class_id}:${assignment.section_id}:${assignment.subject_id}`,
        label: `${assignment.class_name} ${assignment.section_name} - ${assignment.subject_name}`,
        class_id: assignment.class_id,
        section_id: assignment.section_id,
        subject_id: assignment.subject_id,
      }))
  }, [assignments])

  const saveNotice = useCallback(async (payload, noticeId = null) => {
    setSaving(true)
    try {
      const res = noticeId
        ? await teacherApi.updateTeacherNotice(noticeId, payload)
        : await teacherApi.createTeacherNotice(payload)
      await loadNotices()
      return res?.data
    } finally {
      setSaving(false)
    }
  }, [loadNotices])

  const markAsRead = useCallback(async (noticeId) => {
    const res = await teacherApi.markTeacherNoticeRead(noticeId)
    setNotices((prev) => prev.map((notice) => (
      Number(notice.id) === Number(noticeId)
        ? { ...notice, is_read: true, read_count: Number(notice.read_count || 0) + 1 }
        : notice
    )))
    return res?.data
  }, [])

  return {
    assignments,
    notices,
    loadingBase,
    loadingNotices,
    saving,
    classTeacherSections,
    assignedSections,
    subjectTeacherSections,
    loadNotices,
    saveNotice,
    markAsRead,
  }
}

export default useTeacherNotices
