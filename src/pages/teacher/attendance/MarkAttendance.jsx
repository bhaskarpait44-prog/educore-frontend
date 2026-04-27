import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useAttendance from '@/hooks/useAttendance'
import AttendanceMarker from '@/components/teacher/AttendanceMarker'
import EmptyState from '@/components/ui/EmptyState'
import { ROUTES } from '@/constants/app'

const MarkAttendance = () => {
  usePageTitle('Mark Attendance')

  const navigate = useNavigate()
  const location = useLocation()
  const { toastSuccess, toastError } = useToast()
  const {
    classTeacherAssignments,
    todaySchedule,
    loadingAssignments,
    markingContext,
    setMarkingContext,
    studentPayload,
    loadingStudents,
    savingAttendance,
    loadStudents,
    submitAttendance,
  } = useAttendance()
  const [showNextPrompt, setShowNextPrompt] = useState(false)
  const autoLoadKeyRef = useRef('')

  useEffect(() => {
    const incoming = location.state
    if (!incoming?.class_id || !incoming?.section_id || loadingAssignments) return

    const match = classTeacherAssignments.find((assignment) =>
      String(assignment.class_id) === String(incoming.class_id) &&
      String(assignment.section_id) === String(incoming.section_id)
    )

    if (!match) return

    setMarkingContext((prev) => ({
      ...prev,
      class_id: String(match.class_id),
      section_id: String(match.section_id),
      subject_id: '',
      assignment_role: 'class_teacher',
    }))
  }, [location.state, loadingAssignments, classTeacherAssignments, setMarkingContext])

  useEffect(() => {
    if (loadingAssignments) return
    if (markingContext.assignment_role !== 'class_teacher') return
    if (!markingContext.class_id || !markingContext.section_id || !markingContext.date) return

    const match = classTeacherAssignments.find((assignment) =>
      String(assignment.class_id) === String(markingContext.class_id) &&
      String(assignment.section_id) === String(markingContext.section_id)
    )

    if (!match) return

    const nextKey = `${markingContext.class_id}:${markingContext.section_id}:${markingContext.date}`
    if (autoLoadKeyRef.current === nextKey) return

    autoLoadKeyRef.current = nextKey
    loadStudents({
      class_id: String(markingContext.class_id),
      section_id: String(markingContext.section_id),
      date: markingContext.date,
    }).catch((error) => {
      autoLoadKeyRef.current = ''
      toastError(error?.message || 'Failed to load students.')
    })
  }, [
    loadingAssignments,
    classTeacherAssignments,
    markingContext.assignment_role,
    markingContext.class_id,
    markingContext.section_id,
    markingContext.date,
    loadStudents,
    toastError,
  ])

  const nextPending = useMemo(() => {
    const pendingSchedule = todaySchedule.find((item) =>
      item.status !== 'done' &&
      !(
        String(item.class_id) === String(markingContext.class_id) &&
        String(item.section_id) === String(markingContext.section_id)
      )
    )

    if (!pendingSchedule) return null

    return classTeacherAssignments.find((assignment) =>
      String(assignment.class_id) === String(pendingSchedule.class_id) &&
      String(assignment.section_id) === String(pendingSchedule.section_id)
    ) || null
  }, [todaySchedule, classTeacherAssignments, markingContext.class_id, markingContext.section_id])

  return (
    <div className="space-y-5 pb-24">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Mark Attendance
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Only assigned class teachers can mark daily attendance for a section. Subject teachers cannot submit attendance from this page.
        </p>
      </section>

      {(!loadingAssignments && classTeacherAssignments.length === 0) ? (
        <EmptyState
          title="No class teacher assignment"
          description="You can view attendance reports and registers for your sections, but only class teachers can mark daily attendance."
        />
      ) : (
        <AttendanceMarker
          assignments={classTeacherAssignments}
          context={markingContext}
          setContext={setMarkingContext}
          payload={studentPayload}
          loadingStudents={loadingStudents || loadingAssignments}
          savingAttendance={savingAttendance}
          onLoad={async (params) => {
            try {
              await loadStudents(params)
            } catch (error) {
              toastError(error?.message || 'Failed to load students.')
            }
          }}
          onSubmit={async (payload) => {
            try {
              await submitAttendance(payload)
              await loadStudents({
                class_id: String(markingContext.class_id),
                section_id: String(markingContext.section_id),
                date: markingContext.date,
              })
              toastSuccess('Attendance submitted successfully.')
              setShowNextPrompt(true)
            } catch (error) {
              toastError(error?.message || 'Attendance submission failed.')
            }
          }}
        />
      )}

      {showNextPrompt && nextPending && (
        <section
          className="rounded-[28px] border p-5"
          style={{ borderColor: '#10b98155', backgroundColor: 'rgba(16, 185, 129, 0.10)' }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                You have another class pending
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Mark attendance next for {nextPending.class_name} {nextPending.section_name}
                {nextPending.subject_name ? ` | ${nextPending.subject_name}` : ''}.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowNextPrompt(false)}
                className="min-h-11 rounded-2xl px-4 text-sm font-semibold"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
              >
                Later
              </button>
              <button
                type="button"
                onClick={() => {
                  setMarkingContext((prev) => ({
                    ...prev,
                    class_id: String(nextPending.class_id),
                    section_id: String(nextPending.section_id),
                    subject_id: nextPending.subject_id ? String(nextPending.subject_id) : '',
                    assignment_role: nextPending.is_class_teacher ? 'class_teacher' : 'subject_teacher',
                  }))
                  setShowNextPrompt(false)
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold"
                style={{ backgroundColor: '#10b981', color: '#fff' }}
              >
                Yes
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      )}

      {!showNextPrompt && studentPayload?.students?.length > 0 && (
        <section
          className="rounded-[28px] border p-4"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Need a monthly grid or reports after this? Open the register or reports pages directly from the attendance menu.
            </p>
            <div className="ml-auto hidden gap-2 sm:flex">
              <button
                type="button"
                onClick={() => navigate(ROUTES.TEACHER_ATTENDANCE_REGISTER)}
                className="min-h-10 rounded-2xl px-4 text-sm font-semibold"
                style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.TEACHER_ATTENDANCE_REPORTS)}
                className="min-h-10 rounded-2xl px-4 text-sm font-semibold"
                style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
              >
                Reports
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default MarkAttendance
