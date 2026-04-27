import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpenCheck, ClipboardCheck, RefreshCw, School2, Users } from 'lucide-react'
import * as teacherApi from '@/api/teacherApi'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { ROUTES } from '@/constants/app'

const TeacherMyClasses = () => {
  usePageTitle('My Classes')

  const navigate = useNavigate()
  const { toastError } = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [payload, setPayload] = useState({ my_class: [], subject_classes: [] })

  const loadClasses = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await teacherApi.getTeacherMyClasses()
      setPayload({
        my_class: res?.data?.my_class || [],
        subject_classes: res?.data?.subject_classes || [],
      })
    } catch (error) {
      toastError(error?.response?.data?.message || 'Unable to load assigned classes.')
    } finally {
      if (silent) setRefreshing(false)
      else setLoading(false)
    }
  }

  useEffect(() => {
    loadClasses()
  }, [])

  const myClassAssignments = payload.my_class || []
  const subjectAssignments = payload.subject_classes || []
  const subjectSectionMap = useMemo(() => {
    const map = new Map()

    subjectAssignments.forEach((assignment) => {
      const key = `${assignment.class_id}:${assignment.section_id}`
      if (!map.has(key)) {
        map.set(key, [])
      }

      if (assignment.subject_id) {
        map.get(key).push({
          id: assignment.subject_id,
          name: assignment.subject_name,
          code: assignment.subject_code,
        })
      }
    })

    return map
  }, [subjectAssignments])

  const classAssignmentsWithSubjects = useMemo(() => (
    myClassAssignments.map((assignment) => ({
      ...assignment,
      subjects: subjectSectionMap.get(`${assignment.class_id}:${assignment.section_id}`) || [],
    }))
  ), [myClassAssignments, subjectSectionMap])

  const subjectSections = useMemo(() => {
    const map = new Map()

    subjectAssignments.forEach((assignment) => {
      const key = `${assignment.class_id}:${assignment.section_id}`
      if (!map.has(key)) {
        map.set(key, {
          ...assignment,
          subjects: [],
        })
      }

      if (assignment.subject_id) {
        map.get(key).subjects.push({
          id: assignment.subject_id,
          name: assignment.subject_name,
          code: assignment.subject_code,
        })
      }
    })

    return [...map.values()].sort((a, b) => {
      const classCompare = String(a.class_name || '').localeCompare(String(b.class_name || ''))
      if (classCompare !== 0) return classCompare
      return String(a.section_name || '').localeCompare(String(b.section_name || ''))
    })
  }, [subjectAssignments])

  const summary = useMemo(() => ({
    totalSections: myClassAssignments.length + subjectSections.length,
    classTeacherSections: myClassAssignments.length,
    subjectTeacherSections: subjectSections.length,
    totalSubjects: subjectAssignments.length,
  }), [myClassAssignments.length, subjectSections.length, subjectAssignments.length])

  const hasAssignments = summary.totalSections > 0

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.16), rgba(20, 184, 166, 0.08) 55%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: '#0f766e' }}>
              Teacher Portal
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-text-primary)' }}>
              My Classes
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
              This page shows only the classes and sections currently assigned to you. Admin-only class management is hidden from the teacher portal.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadClasses(true)}
            disabled={loading || refreshing}
            className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Assigned Sections" value={summary.totalSections} tone="#0f766e" />
          <SummaryCard label="Class Teacher" value={summary.classTeacherSections} tone="#10b981" />
          <SummaryCard label="Subject Sections" value={summary.subjectTeacherSections} tone="#0284c7" />
          <SummaryCard label="Assigned Subjects" value={summary.totalSubjects} tone="#f59e0b" />
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {[...Array(4)].map((_, index) => (
            <AssignmentSkeleton key={index} />
          ))}
        </div>
      ) : !hasAssignments ? (
        <EmptyState
          icon={School2}
          title="No class assignments found"
          description="You do not have any active class or subject assignments in the current session yet."
        />
      ) : (
        <>
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Class Teacher Sections
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Full-section responsibility for attendance, student follow-up, and overview.
                </p>
              </div>
              <Badge variant="green">{myClassAssignments.length} section(s)</Badge>
            </div>

            {myClassAssignments.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No class teacher assignment"
                description="You are not marked as class teacher for any section right now."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {classAssignmentsWithSubjects.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    variant="class_teacher"
                    navigate={navigate}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Subject Teacher Sections
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Sections where you teach one or more assigned subjects.
                </p>
              </div>
              <Badge variant="blue">{subjectSections.length} section(s)</Badge>
            </div>

            {subjectSections.length === 0 ? (
              <EmptyState
                icon={BookOpenCheck}
                title="No subject assignments"
                description="You are not assigned to any section as a subject teacher right now."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {subjectSections.map((assignment) => (
                  <AssignmentCard
                    key={`${assignment.class_id}-${assignment.section_id}`}
                    assignment={assignment}
                    variant="subject_teacher"
                    navigate={navigate}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

const SummaryCard = ({ label, value, tone }) => (
  <div
    className="rounded-[24px] border p-4"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
      {label}
    </p>
    <p className="mt-2 text-2xl font-bold" style={{ color: tone }}>
      {value || 0}
    </p>
  </div>
)

const AssignmentCard = ({ assignment, variant, navigate }) => {
  const studentsMarked = assignment.today_attendance_marked ? 'Marked' : 'Pending'
  const attendanceTone = assignment.today_attendance_marked ? '#10b981' : '#ef4444'
  const canMarkAttendance = variant === 'class_teacher'
  const canEnterMarks = Boolean(assignment.subjects?.length)
  const openAttendance = () => navigate(ROUTES.TEACHER_ATTENDANCE_MARK, {
    state: {
      class_id: String(assignment.class_id),
      section_id: String(assignment.section_id),
      subject_id: '',
      assignment_role: 'class_teacher',
    },
  })

  return (
    <article
      className="rounded-[26px] border p-5"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {assignment.class_name} {assignment.section_name}
            </h3>
            <Badge variant={variant === 'class_teacher' ? 'green' : 'blue'}>
              {variant === 'class_teacher' ? 'Class Teacher' : 'Subject Teacher'}
            </Badge>
          </div>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {variant === 'class_teacher'
              ? 'You can manage the full section as the assigned class teacher.'
              : 'You can work only within your assigned subjects for this section.'}
          </p>
        </div>

        <div className="rounded-2xl px-3 py-2 text-right" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-muted)' }}>
            Today Attendance
          </p>
          <p className="mt-1 text-sm font-semibold" style={{ color: attendanceTone }}>
            {studentsMarked}
          </p>
        </div>
      </div>

      {assignment.subjects?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {assignment.subjects.map((subject) => (
            <Badge key={subject.id || `${subject.name}-${subject.code}`} variant="blue">
              {subject.name}{subject.code ? ` (${subject.code})` : ''}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Students" value={assignment.student_count} tone="#0f766e" />
        <MiniStat label="Attendance" value={`${Number(assignment.attendance_rate || 0).toFixed(0)}%`} tone="#0284c7" />
        <MiniStat label="Below 75%" value={assignment.below_75_count} tone="#ef4444" />
        <MiniStat label="Fee Due" value={assignment.fee_defaulters_count} tone="#f59e0b" />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <QuickAction
          icon={ClipboardCheck}
          label={canMarkAttendance ? 'Mark Attendance' : 'Class Teacher Only'}
          onClick={openAttendance}
          disabled={!canMarkAttendance}
        />
        {variant !== 'class_teacher' ? (
          <QuickAction
            icon={BookOpenCheck}
            label={canEnterMarks ? 'Enter Marks' : 'Subject Teacher Only'}
            disabled={!canEnterMarks}
            onClick={() => navigate(ROUTES.TEACHER_MARKS_ENTER, {
              state: {
                class_id: String(assignment.class_id),
                section_id: String(assignment.section_id),
                subject_id: assignment.subjects?.length
                  ? String(assignment.subjects[0].id)
                  : '',
                assignment_role: canEnterMarks ? 'subject_teacher' : variant,
              },
            })}
          />
        ) : null}
        <QuickAction
          icon={Users}
          label="View Students"
          onClick={() => navigate(ROUTES.TEACHER_STUDENTS, {
            state: {
              class_id: String(assignment.class_id),
              section_id: String(assignment.section_id),
            },
          })}
        />
      </div>
    </article>
  )
}

const MiniStat = ({ label, value, tone }) => (
  <div className="rounded-2xl px-3 py-3" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
    <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-muted)' }}>
      {label}
    </p>
    <p className="mt-1 text-base font-semibold" style={{ color: tone }}>
      {value ?? 0}
    </p>
  </div>
)

const QuickAction = ({ icon: Icon, label, onClick, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex min-h-10 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <Icon size={16} style={{ color: '#0f766e' }} />
    {label}
  </button>
)

const AssignmentSkeleton = () => (
  <div
    className="rounded-[26px] border p-5 animate-pulse"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <div className="h-6 w-40 rounded-lg" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    <div className="mt-3 h-4 w-56 rounded-lg" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="h-16 rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
      ))}
    </div>
    <div className="mt-5 flex gap-3">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="h-10 w-32 rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
      ))}
    </div>
  </div>
)

export default TeacherMyClasses
