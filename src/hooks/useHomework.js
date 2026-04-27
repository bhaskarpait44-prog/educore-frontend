import { useCallback, useEffect, useMemo, useState } from 'react'
import * as teacherApi from '@/api/teacherApi'
import { getSubjects } from '@/api/classApi'

const useHomework = () => {
  const [assignments, setAssignments] = useState([])
  const [subjectsByClass, setSubjectsByClass] = useState({})
  const [homework, setHomework] = useState([])
  const [loadingBase, setLoadingBase] = useState(true)
  const [loadingHomework, setLoadingHomework] = useState(true)
  const [savingHomework, setSavingHomework] = useState(false)
  const [submissionDrawer, setSubmissionDrawer] = useState({
    loading: false,
    homework: null,
    submissions: [],
    summary: null,
  })

  const loadAssignments = useCallback(async () => {
    const res = await teacherApi.getTeacherMyClasses()
    const myClass = res?.data?.my_class || []
    const subjectClasses = res?.data?.subject_classes || []
    const rows = [...myClass, ...subjectClasses]
    setAssignments(rows)
    return rows
  }, [])

  const loadHomework = useCallback(async () => {
    setLoadingHomework(true)
    try {
      const res = await teacherApi.getTeacherHomework()
      const rows = res?.data?.homework || []
      setHomework(rows)
      return rows
    } finally {
      setLoadingHomework(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoadingBase(true)
      try {
        const [assignmentRows, homeworkRows] = await Promise.all([
          loadAssignments(),
          loadHomework(),
        ])

        if (!active) return
        setAssignments(assignmentRows)
        setHomework(homeworkRows)
      } finally {
        if (active) setLoadingBase(false)
      }
    }

    load().catch(() => {
      if (active) setLoadingBase(false)
      if (active) setLoadingHomework(false)
    })

    return () => { active = false }
  }, [loadAssignments, loadHomework])

  const sections = useMemo(() => {
    const map = new Map()
    assignments.forEach((assignment) => {
      const key = `${assignment.class_id}:${assignment.section_id}`
      if (!map.has(key)) {
        map.set(key, {
          value: key,
          label: `${assignment.class_name} ${assignment.section_name}`,
          class_id: assignment.class_id,
          section_id: assignment.section_id,
          class_name: assignment.class_name,
          section_name: assignment.section_name,
          is_class_teacher: Boolean(assignment.is_class_teacher),
        })
      } else if (assignment.is_class_teacher) {
        map.set(key, { ...map.get(key), is_class_teacher: true })
      }
    })
    return [...map.values()]
  }, [assignments])

  const getClassSubjects = useCallback(async (classId) => {
    if (!classId) return []
    if (subjectsByClass[classId]) return subjectsByClass[classId]
    const res = await getSubjects(classId)
    const rows = Array.isArray(res?.data) ? res.data : (res?.data?.subjects || [])
    setSubjectsByClass((prev) => ({ ...prev, [classId]: rows }))
    return rows
  }, [subjectsByClass])

  const getSectionSubjects = useCallback(async ({ classId, sectionId, isClassTeacher }) => {
    if (!classId || !sectionId) return []

    if (isClassTeacher) {
      const rows = await getClassSubjects(classId)
      return rows.map((subject) => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
      }))
    }

    return assignments
      .filter((assignment) =>
        String(assignment.class_id) === String(classId) &&
        String(assignment.section_id) === String(sectionId) &&
        assignment.subject_id
      )
      .map((assignment) => ({
        id: assignment.subject_id,
        name: assignment.subject_name,
        code: assignment.subject_code,
      }))
  }, [assignments, getClassSubjects])

  const saveHomework = useCallback(async (payload, homeworkId = null) => {
    setSavingHomework(true)
    try {
      const res = homeworkId
        ? await teacherApi.updateTeacherHomework(homeworkId, payload)
        : await teacherApi.createTeacherHomework(payload)
      await loadHomework()
      return res?.data
    } finally {
      setSavingHomework(false)
    }
  }, [loadHomework])

  const cancelHomework = useCallback(async (homeworkId) => {
    setSavingHomework(true)
    try {
      const res = await teacherApi.deleteTeacherHomework(homeworkId)
      await loadHomework()
      return res?.data
    } finally {
      setSavingHomework(false)
    }
  }, [loadHomework])

  const loadSubmissions = useCallback(async (homeworkId) => {
    setSubmissionDrawer((prev) => ({ ...prev, loading: true }))
    try {
      const res = await teacherApi.getTeacherHomeworkSubmissions(homeworkId)
      const payload = {
        loading: false,
        homework: res?.data?.homework || null,
        submissions: res?.data?.submissions || [],
        summary: res?.data?.summary || null,
      }
      setSubmissionDrawer(payload)
      return payload
    } catch (error) {
      setSubmissionDrawer((prev) => ({ ...prev, loading: false }))
      throw error
    }
  }, [])

  const gradeSubmission = useCallback(async (homeworkId, payload) => {
    const res = await teacherApi.gradeTeacherHomework(homeworkId, payload)
    await loadSubmissions(homeworkId)
    await loadHomework()
    return res?.data
  }, [loadHomework, loadSubmissions])

  const submitSubmission = useCallback(async (homeworkId, payload) => {
    const res = await teacherApi.submitTeacherHomework(homeworkId, payload)
    await loadSubmissions(homeworkId)
    await loadHomework()
    return res?.data
  }, [loadHomework, loadSubmissions])

  const sendReminder = useCallback(async (homeworkId) => {
    const res = await teacherApi.remindTeacherHomework(homeworkId)
    await loadHomework()
    return res?.data
  }, [loadHomework])

  const clearSubmissions = useCallback(() => {
    setSubmissionDrawer({
      loading: false,
      homework: null,
      submissions: [],
      summary: null,
    })
  }, [])

  return {
    assignments,
    sections,
    homework,
    loadingBase,
    loadingHomework,
    savingHomework,
    submissionDrawer,
    getSectionSubjects,
    loadHomework,
    saveHomework,
    cancelHomework,
    loadSubmissions,
    clearSubmissions,
    submitSubmission,
    gradeSubmission,
    sendReminder,
  }
}

export default useHomework
