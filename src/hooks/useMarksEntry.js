import { useCallback, useEffect, useMemo, useState } from 'react'
import * as teacherApi from '@/api/teacherApi'
import { getExamSubjects } from '@/api/exams'

const useMarksEntry = () => {
  const [assignments, setAssignments] = useState([])
  const [exams, setExams] = useState([])
  const [subjectsByExam, setSubjectsByExam] = useState({})
  const [loadingBase, setLoadingBase] = useState(true)
  const [loadingEntry, setLoadingEntry] = useState(false)
  const [saving, setSaving] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [entryPayload, setEntryPayload] = useState(null)
  const [summaryPayload, setSummaryPayload] = useState(null)
  const [baseError, setBaseError] = useState('')

  useEffect(() => {
    let active = true

    const loadBase = async () => {
      setLoadingBase(true)
      setBaseError('')
      try {
        const [classesRes, examsRes] = await Promise.all([
          teacherApi.getTeacherMyClasses(),
          teacherApi.getTeacherMarksExams(),
        ])

        if (!active) return

        const subjectClasses = classesRes?.data?.subject_classes || []
        const subjectOnlyAssignments = subjectClasses.filter((assignment) => assignment.subject_id)
        setAssignments(subjectOnlyAssignments)
        setExams(examsRes?.data?.exams || [])
      } catch (error) {
        if (!active) return
        setAssignments([])
        setExams([])
        setBaseError(error?.message || 'Unable to load subject-teacher marks assignments.')
      } finally {
        if (active) setLoadingBase(false)
      }
    }

    loadBase()

    return () => { active = false }
  }, [])

  const uniqueSections = useMemo(() => {
    const map = new Map()
    assignments.forEach((assignment) => {
      const key = `${assignment.class_id}:${assignment.section_id}`
      if (!map.has(key)) {
        map.set(key, {
          class_id: assignment.class_id,
          section_id: assignment.section_id,
          class_name: assignment.class_name,
          section_name: assignment.section_name,
          is_class_teacher: assignment.is_class_teacher,
        })
      }
    })
    return [...map.values()]
  }, [assignments])

  const subjectAssignments = useMemo(() => (
    assignments.filter((assignment) => !assignment.is_class_teacher && assignment.subject_id)
  ), [assignments])

  const getExamConfiguredSubjects = useCallback(async (examId) => {
    if (!examId) return []
    if (subjectsByExam[examId]) return subjectsByExam[examId]
    const res = await getExamSubjects(examId)
    const subjects = Array.isArray(res?.data) ? res.data : (res?.data?.subjects || [])
    setSubjectsByExam((prev) => ({ ...prev, [examId]: subjects }))
    return subjects
  }, [subjectsByExam])

  const getAvailableSubjects = useCallback(async ({ examId, classId, sectionId }) => {
    const assignedSubjects = subjectAssignments
      .filter((assignment) =>
        String(assignment.class_id) === String(classId) &&
        String(assignment.section_id) === String(sectionId) &&
        assignment.subject_id
      )
      .map((assignment) => ({
        id: Number(assignment.subject_id),
        name: assignment.subject_name,
        code: assignment.subject_code,
        subject_type: assignment.subject_type || null,
        combined_total_marks: assignment.combined_total_marks || null,
        combined_passing_marks: assignment.combined_passing_marks || null,
        theory_total_marks: assignment.theory_total_marks || null,
        theory_passing_marks: assignment.theory_passing_marks || null,
        practical_total_marks: assignment.practical_total_marks || null,
        practical_passing_marks: assignment.practical_passing_marks || null,
      }))

    if (!examId) return assignedSubjects

    let configuredSubjects = []
    try {
      configuredSubjects = await getExamConfiguredSubjects(examId)
    } catch {
      configuredSubjects = []
    }

    if (!configuredSubjects.length) return assignedSubjects

    const configuredMap = new Map(
      configuredSubjects.map((subject) => [
        Number(subject.subject_id || subject.id),
        {
          id: Number(subject.subject_id || subject.id),
          name: subject.name,
          code: subject.code,
          subject_type: subject.subject_type,
          combined_total_marks: subject.combined_total_marks,
          combined_passing_marks: subject.combined_passing_marks,
          theory_total_marks: subject.theory_total_marks,
          theory_passing_marks: subject.theory_passing_marks,
          practical_total_marks: subject.practical_total_marks,
          practical_passing_marks: subject.practical_passing_marks,
        },
      ])
    )

    const filteredAssignedSubjects = assignedSubjects
      .filter((subject) => configuredMap.has(Number(subject.id)))
      .map((subject) => configuredMap.get(Number(subject.id)) || subject)

    return filteredAssignedSubjects.length ? filteredAssignedSubjects : assignedSubjects
  }, [getExamConfiguredSubjects, subjectAssignments])

  const loadEntry = useCallback(async (params) => {
    setLoadingEntry(true)
    try {
      const res = await teacherApi.getTeacherMarksEntry(params)
      const data = res?.data || null
      setEntryPayload(data)
      return data
    } finally {
      setLoadingEntry(false)
    }
  }, [])

  const saveEntry = useCallback(async (payload, bulk = false) => {
    setSaving(true)
    try {
      const res = bulk
        ? await teacherApi.bulkSaveTeacherMarks(payload)
        : await teacherApi.saveTeacherMark(payload)
      return res?.data
    } finally {
      setSaving(false)
    }
  }, [])

  const submitForReview = useCallback(async (payload) => {
    setSaving(true)
    try {
      const res = await teacherApi.submitTeacherMarks(payload)
      return res?.data
    } finally {
      setSaving(false)
    }
  }, [])

  const loadSummary = useCallback(async (params) => {
    setSummaryLoading(true)
    try {
      const res = await teacherApi.getTeacherMarksSummary(params)
      const data = res?.data || null
      setSummaryPayload(data)
      return data
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  return {
    assignments,
    uniqueSections,
    exams,
    baseError,
    loadingBase,
    loadingEntry,
    saving,
    summaryLoading,
    entryPayload,
    summaryPayload,
    getAvailableSubjects,
    loadEntry,
    saveEntry,
    submitForReview,
    loadSummary,
  }
}

export default useMarksEntry
