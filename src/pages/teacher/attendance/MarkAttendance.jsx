import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, LayoutList, BarChart3 } from 'lucide-react'
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
    assignments,
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

    const match = assignments.find(
      (a) =>
        String(a.class_id) === String(incoming.class_id) &&
        String(a.section_id) === String(incoming.section_id)
    )
    if (!match) return

    setMarkingContext((prev) => ({
      ...prev,
      class_id: String(match.class_id),
      section_id: String(match.section_id),
      subject_id: match.subject_id ? String(match.subject_id) : '',
      assignment_role: match.is_class_teacher ? 'class_teacher' : 'subject_teacher',
    }))
  }, [location.state, loadingAssignments, assignments, setMarkingContext])

  useEffect(() => {
    if (loadingAssignments) return
    if (!markingContext.class_id || !markingContext.section_id || !markingContext.date) return

    const match = assignments.find(
      (a) =>
        String(a.class_id) === String(markingContext.class_id) &&
        String(a.section_id) === String(markingContext.section_id) &&
        (markingContext.assignment_role === 'class_teacher' ? a.is_class_teacher : String(a.subject_id || '') === String(markingContext.subject_id || ''))
    )
    if (!match) return

    const nextKey = `${markingContext.class_id}:${markingContext.section_id}:${markingContext.subject_id || ''}:${markingContext.date}`
    if (autoLoadKeyRef.current === nextKey) return

    autoLoadKeyRef.current = nextKey
    loadStudents({
      class_id: String(markingContext.class_id),
      section_id: String(markingContext.section_id),
      subject_id: markingContext.subject_id ? String(markingContext.subject_id) : undefined,
      date: markingContext.date,
    }).catch((error) => {
      autoLoadKeyRef.current = ''
      toastError(error?.message || 'Failed to load students.')
    })
  }, [
    loadingAssignments,
    assignments,
    markingContext.assignment_role,
    markingContext.class_id,
    markingContext.section_id,
    markingContext.subject_id,
    markingContext.date,
    loadStudents,
    toastError,
  ])

  const nextPending = useMemo(() => {
    const pendingSchedule = todaySchedule.find(
      (item) =>
        item.status !== 'done' &&
        !(
          String(item.class_id) === String(markingContext.class_id) &&
          String(item.section_id) === String(markingContext.section_id)
        )
    )
    if (!pendingSchedule) return null

    return (
      assignments.find(
        (a) =>
          String(a.class_id) === String(pendingSchedule.class_id) &&
          String(a.section_id) === String(pendingSchedule.section_id)
      ) || null
    )
  }, [todaySchedule, assignments, markingContext.class_id, markingContext.section_id])

  return (
    <div className="space-y-4 pb-24">

      {/* Empty state */}
      {!loadingAssignments && assignments.length === 0 && (
        <EmptyState
          title="No assigned classes"
          description="You can view attendance reports and registers for your sections once you are assigned to a class or subject."
        />
      )}

      {/* Attendance Marker */}
      {(loadingAssignments || assignments.length > 0) && (
        <AttendanceMarker
          assignments={assignments}
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
                subject_id: markingContext.subject_id ? String(markingContext.subject_id) : undefined,
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

      {/* Next pending class prompt */}
      {showNextPrompt && nextPending && (
        <div
          className="rounded-2xl p-4 sm:p-5"
          style={{
            border: '1px solid rgba(16,185,129,0.25)',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.05) 100%)',
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'rgba(16,185,129,0.15)' }}
              >
                <CheckCircle2 size={16} style={{ color: '#10b981' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Another class is pending
                </p>
                <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {nextPending.class_name} {nextPending.section_name}
                  {nextPending.subject_name ? ` · ${nextPending.subject_name}` : ''}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 gap-2 sm:ml-4">
              <button
                type="button"
                onClick={() => setShowNextPrompt(false)}
                className="min-h-10 rounded-xl px-4 text-sm font-medium transition-opacity hover:opacity-70"
                style={{
                  backgroundColor: 'var(--color-surface-raised)',
                  color: 'var(--color-text-secondary)',
                }}
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
                    assignment_role: nextPending.is_class_teacher
                      ? 'class_teacher'
                      : 'subject_teacher',
                  }))
                  setShowNextPrompt(false)
                }}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-opacity hover:opacity-85"
                style={{ backgroundColor: '#10b981', color: '#fff' }}
              >
                Mark now
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick navigation strip */}
      {!showNextPrompt && studentPayload?.students?.length > 0 && (
        <div
          className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
          style={{
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            View monthly data
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate(ROUTES.TEACHER_ATTENDANCE_REGISTER)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3.5 text-sm font-medium transition-opacity hover:opacity-75"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                color: 'var(--color-text-primary)',
              }}
            >
              <LayoutList size={14} />
              Register
            </button>
            <button
              type="button"
              onClick={() => navigate(ROUTES.TEACHER_ATTENDANCE_REPORTS)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3.5 text-sm font-medium transition-opacity hover:opacity-75"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                color: 'var(--color-text-primary)',
              }}
            >
              <BarChart3 size={14} />
              Reports
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MarkAttendance