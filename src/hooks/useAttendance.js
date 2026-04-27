import { useCallback, useEffect, useMemo, useState } from 'react'
import * as teacherApi from '@/api/teacherApi'

const todayString = () => new Date().toISOString().slice(0, 10)

const useAttendance = () => {
  const [assignments, setAssignments] = useState([])
  const [classTeacherAssignments, setClassTeacherAssignments] = useState([])
  const [subjectAssignments, setSubjectAssignments] = useState([])
  const [attendanceStatus, setAttendanceStatus] = useState([])
  const [todaySchedule, setTodaySchedule] = useState([])
  const [loadingAssignments, setLoadingAssignments] = useState(true)
  const [markingContext, setMarkingContext] = useState({
    class_id: '',
    section_id: '',
    subject_id: '',
    assignment_role: '',
    date: todayString(),
  })
  const [studentPayload, setStudentPayload] = useState(null)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [savingAttendance, setSavingAttendance] = useState(false)
  const [registerData, setRegisterData] = useState(null)
  const [loadingRegister, setLoadingRegister] = useState(false)
  const [reportData, setReportData] = useState({
    summary: [],
    belowThreshold: [],
    chronicAbsentees: [],
  })
  const [loadingReports, setLoadingReports] = useState(false)

  useEffect(() => {
    let active = true

    const loadBase = async () => {
      setLoadingAssignments(true)
      try {
        const [classesResult, statusResult, scheduleResult] = await Promise.allSettled([
          teacherApi.getTeacherMyClasses(),
          teacherApi.getTeacherAttendanceStatus(),
          teacherApi.getTeacherTodaySchedule(),
        ])

        if (!active) return

        const classesRes = classesResult.status === 'fulfilled' ? classesResult.value : null
        const statusRes = statusResult.status === 'fulfilled' ? statusResult.value : null
        const scheduleRes = scheduleResult.status === 'fulfilled' ? scheduleResult.value : null

        const myClass = classesRes?.data?.my_class || []
        const subjectClasses = classesRes?.data?.subject_classes || []
        const merged = [...myClass, ...subjectClasses]

        setClassTeacherAssignments(myClass)
        setSubjectAssignments(subjectClasses)
        setAssignments(merged)
        setAttendanceStatus(statusRes?.data?.classes || [])
        setTodaySchedule(scheduleRes?.data?.schedule || [])

        const currentPeriod = (scheduleRes?.data?.schedule || []).find((item) => item.status === 'current')
        const nextPeriod = currentPeriod || (scheduleRes?.data?.schedule || [])[0]
        const classTeacherDefault = myClass[0]
        const fallback = classTeacherDefault || nextPeriod || merged[0]

        if (fallback) {
          setMarkingContext((prev) => ({
            ...prev,
            class_id: String(fallback.class_id || ''),
            section_id: String(fallback.section_id || ''),
            subject_id: fallback.subject_id ? String(fallback.subject_id) : '',
            assignment_role: fallback.is_class_teacher ? 'class_teacher' : 'subject_teacher',
          }))
        }
      } finally {
        if (active) setLoadingAssignments(false)
      }
    }

    loadBase().catch(() => {
      if (active) setLoadingAssignments(false)
    })

    return () => { active = false }
  }, [])

  const sectionStatusMap = useMemo(() => {
    const map = new Map()
    attendanceStatus.forEach((row) => {
      map.set(`${row.class_id}:${row.section_id}`, row)
    })
    return map
  }, [attendanceStatus])

  const assignmentOptions = useMemo(() => (
    assignments.map((assignment) => {
      const status = sectionStatusMap.get(`${assignment.class_id}:${assignment.section_id}`)
      return {
        ...assignment,
        status,
      }
    })
  ), [assignments, sectionStatusMap])

  const findClassTeacherAssignment = useCallback((classId, sectionId) => (
    classTeacherAssignments.find((item) =>
      String(item.class_id) === String(classId) &&
      String(item.section_id) === String(sectionId)
    )
  ), [classTeacherAssignments])

  const loadStudents = useCallback(async (payload) => {
    setLoadingStudents(true)
    setStudentPayload(null)
    try {
      const assignment = findClassTeacherAssignment(payload?.class_id, payload?.section_id)

      const buildFallbackData = async (baseData = null) => {
        if (!assignment?.id) return baseData

        const fallbackRes = await teacherApi.getTeacherMyClassOverview(assignment.id)
        const fallbackStudents = fallbackRes?.data?.students || []
        if (fallbackStudents.length === 0) return baseData

        return {
          ...(baseData || {}),
          access: { allowed: true, isClassTeacher: true, isSubjectTeacher: false },
          date: payload?.date || todayString(),
          class_id: Number(payload.class_id),
          section_id: Number(payload.section_id),
          subject_id: null,
          is_holiday: baseData?.is_holiday || false,
          holiday: baseData?.holiday || null,
          already_marked: baseData?.already_marked || false,
          requires_reason: baseData?.requires_reason || (payload?.date || todayString()) < todayString(),
          students: fallbackStudents.map((student) => ({
            enrollment_id: student.enrollment_id,
            roll_number: student.roll_number,
            student_id: student.student_id,
            first_name: student.first_name,
            last_name: student.last_name,
            photo_path: null,
            attendance_id: null,
            status: 'present',
            override_reason: null,
          })),
        }
      }

      let data = null

      if (assignment?.id) {
        data = await buildFallbackData(null)
      }

      try {
        const res = await teacherApi.getTeacherAttendanceStudents(payload)
        const apiData = res?.data || null
        data = (apiData?.students || []).length > 0
          ? apiData
          : await buildFallbackData(apiData || data)
      } catch (error) {
        data = await buildFallbackData(data)
        if (!data) throw error
      }

      if ((data?.students || []).length === 0) {
        data = await buildFallbackData(data)
      }

      setStudentPayload(data)
      return data
    } finally {
      setLoadingStudents(false)
    }
  }, [findClassTeacherAssignment])

  const submitAttendance = useCallback(async (payload) => {
    setSavingAttendance(true)
    try {
      const res = await teacherApi.bulkMarkTeacherAttendance(payload)
      return res?.data
    } finally {
      setSavingAttendance(false)
    }
  }, [])

  const overrideAttendance = useCallback((id, payload) => (
    teacherApi.updateTeacherAttendance(id, payload).then((res) => res?.data)
  ), [])

  const loadRegister = useCallback(async (params) => {
    setLoadingRegister(true)
    try {
      const res = await teacherApi.getTeacherAttendanceRegister(params)
      const data = res?.data || null
      setRegisterData(data)
      return data
    } finally {
      setLoadingRegister(false)
    }
  }, [])

  const loadReports = useCallback(async ({ summaryParams, thresholdParams, chronicParams }) => {
    setLoadingReports(true)
    try {
      const [summaryRes, thresholdRes, chronicRes] = await Promise.all([
        teacherApi.getTeacherAttendanceSummary(summaryParams),
        teacherApi.getTeacherAttendanceBelowThreshold(thresholdParams),
        teacherApi.getTeacherAttendanceChronicAbsentees(chronicParams),
      ])

      const data = {
        summary: summaryRes?.data?.students || [],
        belowThreshold: thresholdRes?.data?.students || [],
        chronicAbsentees: chronicRes?.data?.students || [],
        meta: {
          from: summaryRes?.data?.from || summaryParams?.from,
          to: summaryRes?.data?.to || summaryParams?.to,
          threshold: thresholdRes?.data?.threshold || thresholdParams?.threshold,
        },
      }

      setReportData(data)
      return data
    } finally {
      setLoadingReports(false)
    }
  }, [])

  return {
    assignments,
    assignmentOptions,
    classTeacherAssignments,
    subjectAssignments,
    todaySchedule,
    attendanceStatus,
    loadingAssignments,
    markingContext,
    setMarkingContext,
    studentPayload,
    loadingStudents,
    savingAttendance,
    loadStudents,
    submitAttendance,
    overrideAttendance,
    registerData,
    loadingRegister,
    loadRegister,
    reportData,
    loadingReports,
    loadReports,
  }
}

export default useAttendance
