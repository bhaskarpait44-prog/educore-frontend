import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, CalendarDays, CheckCircle2, Clock3, Loader2, Search, Send, Users,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'
import { cn } from '@/utils/helpers'

const STATUS_OPTIONS = [
  { key: 'present', label: 'P', full: 'Present', tone: '#10b981', bg: 'rgba(16, 185, 129, 0.14)' },
  { key: 'absent', label: 'A', full: 'Absent', tone: '#ef4444', bg: 'rgba(239, 68, 68, 0.14)' },
  { key: 'late', label: 'L', full: 'Late', tone: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)' },
  { key: 'half_day', label: 'H', full: 'Half Day', tone: '#3b82f6', bg: 'rgba(59, 130, 246, 0.14)' },
]

const AttendanceMarker = ({
  assignments = [],
  context,
  setContext,
  payload,
  loadingStudents,
  savingAttendance,
  onLoad,
  onSubmit,
}) => {
  const [query, setQuery] = useState('')
  const [records, setRecords] = useState({})
  const [reason, setReason] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submittingConfirm, setSubmittingConfirm] = useState(false)

  useEffect(() => {
    const next = {}
    ;(payload?.students || []).forEach((student) => {
      next[student.enrollment_id] = {
        status: student.status || 'present',
        note: '',
        name: `${student.first_name} ${student.last_name}`,
        roll_number: student.roll_number,
      }
    })
    setRecords(next)
    setReason('')
    setQuery('')
    setSubmittingConfirm(false)
  }, [payload])

  const selectedAssignment = useMemo(() => (
    assignments.find((assignment) =>
      String(assignment.class_id) === String(context.class_id) &&
      String(assignment.section_id) === String(context.section_id) &&
      String(assignment.subject_id || '') === String(context.subject_id || '') &&
      (assignment.is_class_teacher ? 'class_teacher' : 'subject_teacher') === context.assignment_role
    ) || null
  ), [assignments, context])

  const filteredStudents = useMemo(() => {
    const students = payload?.students || []
    if (!query.trim()) return students
    const q = query.trim().toLowerCase()
    return students.filter((student) => (
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(q) ||
      String(student.roll_number || '').toLowerCase().includes(q)
    ))
  }, [payload, query])

  const counts = useMemo(() => {
    const initial = { present: 0, absent: 0, late: 0, half_day: 0 }
    Object.values(records).forEach((record) => {
      initial[record.status] = (initial[record.status] || 0) + 1
    })
    return initial
  }, [records])

  const assignmentChoices = assignments.map((assignment) => ({
    value: `${assignment.is_class_teacher ? 'class_teacher' : 'subject_teacher'}:${assignment.class_id}:${assignment.section_id}:${assignment.subject_id || ''}`,
    label: assignment.is_class_teacher
      ? `${assignment.class_name} ${assignment.section_name} | Class Teacher`
      : `${assignment.class_name} ${assignment.section_name} | ${assignment.subject_name}`,
  }))

  const subjectChoices = assignments
    .filter((assignment) =>
      String(assignment.class_id) === String(context.class_id) &&
      String(assignment.section_id) === String(context.section_id) &&
      !assignment.is_class_teacher
    )
    .map((assignment) => ({
      value: String(assignment.subject_id),
      label: assignment.subject_name,
    }))

  const hasStudents = (payload?.students || []).length > 0
  const hasLoadedPayload = !!payload
  const needsReason = !!payload?.requires_reason
  const canSubmit = hasStudents && (!needsReason || reason.trim())

  const handleConfirmSubmit = async () => {
    if (!canSubmit || submittingConfirm || savingAttendance) return

    setSubmittingConfirm(true)
    try {
      await onSubmit(submitPayload())
      setConfirmOpen(false)
    } finally {
      setSubmittingConfirm(false)
    }
  }

  const handleAssignmentChange = (value) => {
    const [role, classId, sectionId, subjectId] = value.split(':')
    setContext((prev) => ({
      ...prev,
      assignment_role: role,
      class_id: classId,
      section_id: sectionId,
      subject_id: role === 'class_teacher' ? '' : subjectId || '',
    }))
  }

  const handleLoad = () => {
    const params = {
      class_id: context.class_id,
      section_id: context.section_id,
      date: context.date,
    }
    if (context.assignment_role !== 'class_teacher' && context.subject_id) {
      params.subject_id = context.subject_id
    }
    onLoad(params)
  }

  const setStatusForStudent = (enrollmentId, status) => {
    setRecords((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        status,
      },
    }))
  }

  const bulkSet = (status) => {
    setRecords((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], status }
      })
      return next
    })
  }

  const submitPayload = () => ({
    class_id: Number(context.class_id),
    section_id: Number(context.section_id),
    date: context.date,
    ...(context.assignment_role !== 'class_teacher' && context.subject_id ? { subject_id: Number(context.subject_id) } : {}),
    ...(reason.trim() ? { reason: reason.trim() } : {}),
    records: Object.entries(records).map(([enrollmentId, record]) => ({
      enrollment_id: Number(enrollmentId),
      status: record.status,
    })),
  })

  const absentStudents = Object.entries(records)
    .filter(([, record]) => record.status === 'absent')
    .map(([, record]) => record.name)
  const lateStudents = Object.entries(records)
    .filter(([, record]) => record.status === 'late')
    .map(([, record]) => record.name)

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <Select
            label="Assigned Class"
            value={`${context.assignment_role}:${context.class_id}:${context.section_id}:${context.subject_id || ''}`}
            onChange={(e) => handleAssignmentChange(e.target.value)}
            options={assignmentChoices}
            placeholder="Select assigned class"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Date
            </label>
            <input
              type="date"
              value={context.date}
              onChange={(e) => setContext((prev) => ({ ...prev, date: e.target.value }))}
              className="min-h-11 rounded-xl px-4 text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          {context.assignment_role !== 'class_teacher' ? (
            <Select
              label="Subject"
              value={context.subject_id}
              onChange={(e) => setContext((prev) => ({ ...prev, subject_id: e.target.value }))}
              options={subjectChoices}
              placeholder="Select subject"
            />
          ) : (
            <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-muted)' }}>
                Attendance Mode
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Full Day Attendance
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Class teacher access is active for this section.
              </p>
            </div>
          )}

          <div className="flex items-end">
            <Button
              fullWidth
              icon={Users}
              loading={loadingStudents}
              disabled={!context.class_id || !context.section_id || (context.assignment_role !== 'class_teacher' && !context.subject_id)}
              onClick={handleLoad}
            >
              Load Students
            </Button>
          </div>
        </div>

        {selectedAssignment && (
          <div className="mt-4 flex flex-wrap gap-2">
            <InfoPill
              icon={selectedAssignment.is_class_teacher ? CalendarDays : Clock3}
              text={selectedAssignment.is_class_teacher ? 'Class teacher flow' : 'Subject teacher flow'}
            />
            <InfoPill text={`${selectedAssignment.student_count || 0} students`} />
            {selectedAssignment.subject_name && !selectedAssignment.is_class_teacher && (
              <InfoPill text={selectedAssignment.subject_name} />
            )}
          </div>
        )}
      </section>

      {payload?.already_marked && (
        <Banner
          tone="#f59e0b"
          icon={AlertTriangle}
          title="Attendance already marked for this class and date"
          message="You are editing existing records. Any changes will be logged in the audit trail."
        />
      )}

      {payload?.is_holiday && (
        <Banner
          tone="#ef4444"
          icon={CalendarDays}
          title={`Holiday detected: ${payload?.holiday?.name || 'Holiday'}`}
          message="Please double-check before submitting attendance for a holiday date."
        />
      )}

      {needsReason && (
        <section
          className="rounded-[28px] border p-4"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <label className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Edit reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Reason is required for past-date marking or attendance edits."
            className="mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </section>
      )}

      {!loadingStudents && hasLoadedPayload && !hasStudents && (
        <EmptyState
          icon={Users}
          title="No students found for this class"
          description="No active enrolled students were found for the selected assigned class and section on the current session."
        />
      )}

      {hasStudents && (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATUS_OPTIONS.map((option) => (
              <div
                key={option.key}
                className="rounded-[24px] border p-4"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-muted)' }}>
                  {option.full}
                </p>
                <p className="mt-2 text-2xl font-bold" style={{ color: option.tone }}>
                  {counts[option.key] || 0}
                </p>
              </div>
            ))}
          </section>

          <section
            className="rounded-[28px] border p-5 sm:p-6"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                <BulkButton label="Mark All Present" tone="#10b981" onClick={() => bulkSet('present')} />
                <BulkButton label="Mark All Absent" tone="#ef4444" onClick={() => bulkSet('absent')} />
                <BulkButton label="Reset All" tone="#0f766e" onClick={() => bulkSet('present')} />
              </div>

              <div className="relative w-full lg:max-w-sm">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or roll number"
                  className="min-h-11 w-full rounded-2xl pl-9 pr-4 text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1.5px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {filteredStudents.map((student) => {
                const studentName = `${student.first_name} ${student.last_name}`
                const currentStatus = records[student.enrollment_id]?.status || 'present'
                const config = STATUS_OPTIONS.find((option) => option.key === currentStatus) || STATUS_OPTIONS[0]

                return (
                  <div
                    key={student.enrollment_id}
                    className="rounded-[24px] border p-4"
                    style={{
                      borderColor: currentStatus === 'present' ? 'var(--color-border)' : `${config.tone}55`,
                      backgroundColor: 'var(--color-surface)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold"
                        style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
                      >
                        {student.roll_number || '--'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {studentName}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {student.attendance_id ? 'Existing attendance loaded' : 'Defaulted to present'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {STATUS_OPTIONS.map((option) => {
                        const selected = currentStatus === option.key
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => setStatusForStudent(student.enrollment_id, option.key)}
                            className={cn(
                              'min-h-11 rounded-2xl border text-sm font-bold transition',
                              selected && 'scale-[1.02]'
                            )}
                            style={{
                              borderColor: selected ? option.tone : 'var(--color-border)',
                              backgroundColor: selected ? option.tone : 'transparent',
                              color: selected ? '#fff' : option.tone,
                            }}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {!filteredStudents.length && (
                <div className="rounded-3xl border border-dashed p-8 text-center" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    No students matched your search
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Try a different name or roll number.
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <div className="sticky bottom-3 z-20">
        <div
          className="rounded-[28px] border p-4 shadow-xl backdrop-blur"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'color-mix(in srgb, var(--color-surface) 92%, transparent)',
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              <span>{counts.present || 0} Present</span>
              <span>{counts.absent || 0} Absent</span>
              <span>{counts.late || 0} Late</span>
              <span>{counts.half_day || 0} Half Day</span>
            </div>

            <Button
              icon={savingAttendance ? Loader2 : Send}
              loading={savingAttendance}
              disabled={!canSubmit}
              onClick={() => setConfirmOpen(true)}
            >
              Submit Attendance
            </Button>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <section
          className="rounded-[28px] border p-5 shadow-xl"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Confirm Attendance Submission
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Review the class, date, and counts below before saving attendance.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-muted)' }}>
                  Class
                </p>
                <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {selectedAssignment ? `${selectedAssignment.class_name} ${selectedAssignment.section_name}` : '--'}
                </p>
              </div>

              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-muted)' }}>
                  Date
                </p>
                <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {context.date}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STATUS_OPTIONS.map((option) => (
                <div
                  key={option.key}
                  className="rounded-2xl border p-3"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
                >
                  <p className="text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-muted)' }}>
                    {option.full}
                  </p>
                  <p className="mt-1 text-lg font-bold" style={{ color: option.tone }}>
                    {counts[option.key] || 0}
                  </p>
                </div>
              ))}
            </div>

            {absentStudents.length > 0 && (
              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: '#ef444455', backgroundColor: 'rgba(239, 68, 68, 0.06)' }}
              >
                <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Absent Students ({absentStudents.length})
                </p>
                <div className="mt-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto pr-1">
                  {absentStudents.map((name) => (
                    <span
                      key={`absent-${name}`}
                      className="rounded-full px-3 py-1.5 text-xs font-medium"
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#b91c1c' }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {lateStudents.length > 0 && (
              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: '#f59e0b55', backgroundColor: 'rgba(245, 158, 11, 0.06)' }}
              >
                <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Late Students ({lateStudents.length})
                </p>
                <div className="mt-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto pr-1">
                  {lateStudents.map((name) => (
                    <span
                      key={`late-${name}`}
                      className="rounded-full px-3 py-1.5 text-xs font-medium"
                      style={{ backgroundColor: 'rgba(245, 158, 11, 0.14)', color: '#b45309' }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                Go Back
              </Button>
              <Button
                icon={CheckCircle2}
                loading={submittingConfirm || savingAttendance}
                disabled={!canSubmit || submittingConfirm || savingAttendance}
                onClick={handleConfirmSubmit}
              >
                Confirm and Submit
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

const BulkButton = ({ label, tone, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="min-h-11 rounded-2xl px-4 text-sm font-semibold transition hover:-translate-y-0.5"
    style={{ backgroundColor: `${tone}16`, color: tone }}
  >
    {label}
  </button>
)

const Banner = ({ tone, icon: Icon, title, message }) => (
  <div
    className="rounded-[28px] border px-4 py-3"
    style={{ borderColor: `${tone}45`, backgroundColor: `${tone}12` }}
  >
    <div className="flex items-start gap-3">
      <Icon size={18} style={{ color: tone }} />
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
      </div>
    </div>
  </div>
)

const InfoPill = ({ icon: Icon, text }) => (
  <span
    className="inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold"
    style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
  >
    {Icon ? <Icon size={14} /> : null}
    {text}
  </span>
)

export default AttendanceMarker
