import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpenCheck, ClipboardCheck, RefreshCw, School2, Users } from 'lucide-react'
import * as teacherApi from '@/api/teacherApi'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { ROUTES } from '@/constants/app'

// ─── Page ────────────────────────────────────────────────────────────────────

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

  useEffect(() => { loadClasses() }, [])

  const myClassAssignments = payload.my_class || []
  const subjectAssignments = payload.subject_classes || []

  const subjectSectionMap = useMemo(() => {
    const map = new Map()
    subjectAssignments.forEach((a) => {
      const key = `${a.class_id}:${a.section_id}`
      if (!map.has(key)) map.set(key, [])
      if (a.subject_id) map.get(key).push({ id: a.subject_id, name: a.subject_name, code: a.subject_code })
    })
    return map
  }, [subjectAssignments])

  const classAssignmentsWithSubjects = useMemo(() =>
    myClassAssignments.map((a) => ({
      ...a,
      subjects: subjectSectionMap.get(`${a.class_id}:${a.section_id}`) || [],
    })),
  [myClassAssignments, subjectSectionMap])

  const subjectSections = useMemo(() => {
    const map = new Map()
    subjectAssignments.forEach((a) => {
      const key = `${a.class_id}:${a.section_id}`
      if (!map.has(key)) map.set(key, { ...a, subjects: [] })
      if (a.subject_id) map.get(key).subjects.push({ id: a.subject_id, name: a.subject_name, code: a.subject_code })
    })
    return [...map.values()].sort((a, b) => {
      const cc = String(a.class_name || '').localeCompare(String(b.class_name || ''))
      return cc !== 0 ? cc : String(a.section_name || '').localeCompare(String(b.section_name || ''))
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
    <div className="space-y-6">

      {/* ── Header ── */}
      <section className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#0f766e' }}>
              Teacher Portal
            </p>
            <h1 className="mt-1.5 text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-text-primary)' }}>
              My Classes
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Shows only the classes and sections currently assigned to you.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadClasses(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 self-start rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Assigned Sections" value={summary.totalSections}   color="#0f766e" />
          <StatCard label="Class Teacher"      value={summary.classTeacherSections} color="#10b981" />
          <StatCard label="Subject Sections"   value={summary.subjectTeacherSections} color="#0284c7" />
          <StatCard label="Assigned Subjects"  value={summary.totalSubjects}  color="#f59e0b" />
        </div>
      </section>

      {/* ── Body ── */}
      {loading ? (
        <SkeletonGrid />
      ) : !hasAssignments ? (
        <EmptyState
          icon={School2}
          title="No class assignments found"
          description="You don't have any active class or subject assignments in the current session yet."
        />
      ) : (
        <>
          <ClassSection
            title="Class Teacher Sections"
            description="Full responsibility — attendance, student follow-up, and section overview."
            badgeVariant="green"
            count={myClassAssignments.length}
            emptyIcon={Users}
            emptyTitle="No class teacher assignment"
            emptyDesc="You are not marked as class teacher for any section right now."
          >
            {classAssignmentsWithSubjects.map((a) => (
              <AssignmentCard key={a.id} assignment={a} variant="class_teacher" navigate={navigate} />
            ))}
          </ClassSection>

          <ClassSection
            title="Subject Teacher Sections"
            description="Sections where you teach one or more assigned subjects."
            badgeVariant="blue"
            count={subjectSections.length}
            emptyIcon={BookOpenCheck}
            emptyTitle="No subject assignments"
            emptyDesc="You are not assigned to any section as a subject teacher right now."
          >
            {subjectSections.map((a) => (
              <AssignmentCard
                key={`${a.class_id}-${a.section_id}`}
                assignment={a}
                variant="subject_teacher"
                navigate={navigate}
              />
            ))}
          </ClassSection>
        </>
      )}
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

const ClassSection = ({
  title, description, badgeVariant, count,
  emptyIcon, emptyTitle, emptyDesc, children,
}) => (
  <section className="space-y-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h2>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {description}
        </p>
      </div>
      <Badge variant={badgeVariant} className="shrink-0 mt-0.5">
        {count} section{count !== 1 ? 's' : ''}
      </Badge>
    </div>

    {count === 0 ? (
      <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDesc} />
    ) : (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {children}
      </div>
    )}
  </section>
)

// ─── Assignment card ──────────────────────────────────────────────────────────

const AssignmentCard = ({ assignment, variant, navigate }) => {
  const isClassTeacher = variant === 'class_teacher'
  const attendanceMarked = assignment.today_attendance_marked
  const canMarkAttendance = isClassTeacher
  const canEnterMarks = Boolean(assignment.subjects?.length)

  const openAttendance = () =>
    navigate(ROUTES.TEACHER_ATTENDANCE_MARK, {
      state: {
        class_id: String(assignment.class_id),
        section_id: String(assignment.section_id),
        subject_id: '',
        assignment_role: 'class_teacher',
      },
    })

  const openMarks = () =>
    navigate(ROUTES.TEACHER_MARKS_ENTER, {
      state: {
        class_id: String(assignment.class_id),
        section_id: String(assignment.section_id),
        subject_id: assignment.subjects?.length ? String(assignment.subjects[0].id) : '',
        assignment_role: canEnterMarks ? 'subject_teacher' : variant,
      },
    })

  const openStudents = () =>
    navigate(ROUTES.TEACHER_STUDENTS, {
      state: {
        class_id: String(assignment.class_id),
        section_id: String(assignment.section_id),
      },
    })

  return (
    <article
      className="rounded-2xl border p-5"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      {/* Card header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {assignment.class_name} {assignment.section_name}
            </h3>
            <Badge variant={isClassTeacher ? 'green' : 'blue'}>
              {isClassTeacher ? 'Class Teacher' : 'Subject Teacher'}
            </Badge>
          </div>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {isClassTeacher
              ? 'Manage the full section — attendance and student oversight.'
              : 'Work within your assigned subjects for this section.'}
          </p>
        </div>

        {/* Attendance pill */}
        <div
          className="rounded-xl px-3 py-2 text-right"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Today
          </p>
          <p className="mt-0.5 text-xs font-semibold" style={{ color: attendanceMarked ? '#10b981' : '#ef4444' }}>
            {attendanceMarked ? 'Marked' : 'Pending'}
          </p>
        </div>
      </div>

      {/* Subject badges */}
      {assignment.subjects?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {assignment.subjects.map((s) => (
            <Badge key={s.id || `${s.name}-${s.code}`} variant="blue">
              {s.name}{s.code ? ` (${s.code})` : ''}
            </Badge>
          ))}
        </div>
      ) : null}

      {/* Mini stats */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <MiniStat label="Students"  value={assignment.student_count}                                color="#0f766e" />
        <MiniStat label="Att. rate" value={`${Number(assignment.attendance_rate || 0).toFixed(0)}%`} color="#0284c7" />
        <MiniStat label="Below 75%" value={assignment.below_75_count}                               color="#ef4444" />
        <MiniStat label="Fee due"   value={assignment.fee_defaulters_count}                         color="#f59e0b" />
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <ActionBtn
          icon={ClipboardCheck}
          label={canMarkAttendance ? 'Mark Attendance' : 'Class Teacher Only'}
          onClick={openAttendance}
          disabled={!canMarkAttendance}
        />
        {!isClassTeacher && (
          <ActionBtn
            icon={BookOpenCheck}
            label={canEnterMarks ? 'Enter Marks' : 'No Subjects'}
            onClick={openMarks}
            disabled={!canEnterMarks}
          />
        )}
        <ActionBtn icon={Users} label="View Students" onClick={openStudents} />
      </div>
    </article>
  )
}

// ─── Small components ─────────────────────────────────────────────────────────

const StatCard = ({ label, value, color }) => (
  <div
    className="rounded-xl border p-4"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
      {label}
    </p>
    <p className="mt-2 text-2xl font-bold" style={{ color }}>
      {value ?? 0}
    </p>
  </div>
)

const MiniStat = ({ label, value, color }) => (
  <div
    className="rounded-xl px-3 py-2.5"
    style={{ backgroundColor: 'var(--color-surface-raised)' }}
  >
    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
      {label}
    </p>
    <p className="mt-1 text-sm font-semibold" style={{ color }}>
      {value ?? 0}
    </p>
  </div>
)

const ActionBtn = ({ icon: Icon, label, onClick, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <Icon size={13} style={{ color: disabled ? 'var(--color-text-muted)' : '#0f766e' }} />
    {label}
  </button>
)

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonGrid = () => (
  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="animate-pulse rounded-2xl border p-5"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex justify-between gap-3">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 rounded-lg" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
            <div className="h-3 w-48 rounded-lg" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          </div>
          <div className="h-12 w-20 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className="h-14 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="h-8 w-28 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          ))}
        </div>
      </div>
    ))}
  </div>
)

export default TeacherMyClasses