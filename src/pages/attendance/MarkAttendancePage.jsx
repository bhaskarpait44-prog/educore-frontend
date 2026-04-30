import { useMemo, useState, useEffect } from 'react'
import { CheckCircle2, RefreshCw, Send, Users } from 'lucide-react'
import { getClasses, getClassOptions, getSections } from '@/api/classApi'
import { getClassAttendance } from '@/api/attendance'
import useAttendanceStore from '@/store/attendanceStore'
import useSessionStore from '@/store/sessionStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { AttendanceMetric, AttendanceSection } from './AttendanceShell'
import { cn, formatDate, getInitials } from '@/utils/helpers'

const STATUS_OPTIONS = [
  { key: 'present', label: 'P', fullLabel: 'Present', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badge: 'green' },
  { key: 'absent', label: 'A', fullLabel: 'Absent', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', badge: 'red' },
  { key: 'late', label: 'L', fullLabel: 'Late', color: '#d97706', bg: '#fffbeb', border: '#fde68a', badge: 'yellow' },
  { key: 'half_day', label: 'H', fullLabel: 'Half Day', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', badge: 'blue' },
]

const today = () => new Date().toISOString().split('T')[0]

const MarkAttendancePage = () => {
  usePageTitle('Mark Attendance')
  const { toastSuccess, toastError } = useToast()
  const { markBulk, isSaving } = useAttendanceStore()
  const { currentSession, fetchCurrentSession } = useSessionStore()

  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [date, setDate] = useState(today())
  const [students, setStudents] = useState([])
  const [statuses, setStatuses] = useState({})
  const [alreadyMarked, setAlreadyMarked] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!currentSession?.id) {
      fetchCurrentSession?.().catch(() => {})
    }
  }, [currentSession?.id, fetchCurrentSession])

  useEffect(() => {
    getClasses()
      .then((response) => setClasses(getClassOptions(response)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!classId) {
      setSections([])
      setSectionId('')
      return
    }

    getSections(classId)
      .then((response) => setSections((response.data || []).map((section) => ({ value: String(section.id), label: `Section ${section.name}` }))))
      .catch(() => {})
  }, [classId])

  const loadStudents = async () => {
    if (!sectionId) return
    if (!currentSession?.id) {
      toastError('No active session found. Please activate a session first.')
      return
    }

    setLoadingStudents(true)
    setStudents([])
    setAlreadyMarked(false)
    setSubmitted(false)

    try {
      const classAttendanceRes = await getClassAttendance({
        session_id: currentSession.id,
        class_id: classId,
        section_id: sectionId,
        date,
      })

      const payload = classAttendanceRes?.data || {}
      const studentRows = payload.students || []

      setAlreadyMarked(Boolean(payload.already_marked))

      const studentList = studentRows.map((row) => ({
        enrollment_id: row.enrollment_id,
        name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
        roll_number: row.roll_number,
        currentStatus: row.status || 'present',
      }))

      if (studentList.length === 0) {
        throw new Error('No students found for the selected class and section.')
      }

      setStudents(studentList)

      const initialStatuses = {}
      studentList.forEach((student) => {
        initialStatuses[student.enrollment_id] = student.currentStatus
      })
      setStatuses(initialStatuses)
    } catch (error) {
      toastError(error?.message || 'Failed to load students')
    } finally {
      setLoadingStudents(false)
    }
  }

  const setStatus = (enrollmentId, status) => {
    setStatuses((previous) => ({ ...previous, [enrollmentId]: status }))
  }

  const markAllPresent = () => {
    const nextStatuses = {}
    students.forEach((student) => {
      nextStatuses[student.enrollment_id] = 'present'
    })
    setStatuses(nextStatuses)
  }

  const handleSubmit = async () => {
    if (students.length === 0 || !classId || !sectionId) return

    const records = students.map((student) => ({
      enrollment_id: student.enrollment_id,
      status: statuses[student.enrollment_id] || 'present',
    }))

    const result = await markBulk({
      session_id: currentSession?.id,
      class_id: classId,
      section_id: sectionId,
      date,
      records,
    })

    if (result.success) {
      toastSuccess(`Attendance marked for ${students.length} students`)
      setSubmitted(true)
      setAlreadyMarked(true)
      loadStudents()
    } else {
      toastError(result.message || 'Failed to submit attendance')
    }
  }

  const counts = useMemo(
    () => Object.values(statuses).reduce((accumulator, status) => {
      accumulator[status] = (accumulator[status] || 0) + 1
      return accumulator
    }, {}),
    [statuses],
  )

  const selectedClassLabel = classes.find((item) => item.value === classId)?.label || 'No class selected'
  const selectedSectionLabel = sections.find((item) => item.value === sectionId)?.label || 'No section selected'

  return (
    <div className="space-y-6">
      <AttendanceSection
        title="Mark Attendance"
        action={(
          <Button
            icon={Users}
            onClick={loadStudents}
            loading={loadingStudents}
            disabled={!classId || !sectionId}
          >
            Load Students
          </Button>
        )}
      >
        <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Class"
              options={classes}
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value)
                setSectionId('')
                setStudents([])
              }}
            />
            <Select
              label="Section"
              options={sections}
              value={sectionId}
              onChange={(event) => {
                setSectionId(event.target.value)
                setStudents([])
              }}
              disabled={!classId}
              placeholder={!classId ? 'Select class first' : 'Select section'}
            />
            <Input
              label="Date"
              type="date"
              value={date}
              max={today()}
              onChange={(event) => {
                setDate(event.target.value)
                setStudents([])
              }}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <AttendanceMetric label="Session" value={currentSession?.name || '--'} />
            <AttendanceMetric label="Students" value={students.length} />
            <AttendanceMetric label="Present" value={counts.present || 0} tone="success" />
            <AttendanceMetric label="Absent" value={counts.absent || 0} tone="danger" />
          </div>
        </div>

        {(alreadyMarked || submitted) ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {alreadyMarked && !submitted ? (
              <Badge variant="yellow" size="md">Attendance already exists for this date. New submission will replace it.</Badge>
            ) : null}
            {submitted ? (
              <Badge variant="green" size="md">Attendance submitted successfully.</Badge>
            ) : null}
          </div>
        ) : null}
      </AttendanceSection>

      {students.length > 0 ? (
        <AttendanceSection
          title={`${selectedClassLabel} • ${selectedSectionLabel} • ${formatDate(date)}`}
          action={(
            <>
              <Button variant="outline" icon={RefreshCw} onClick={markAllPresent}>
                Mark All Present
              </Button>
              <Button icon={Send} onClick={handleSubmit} loading={isSaving}>
                Submit Attendance
              </Button>
            </>
          )}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((status) => (
              <Badge key={status.key} variant={status.badge} size="md">
                {status.fullLabel}: {counts[status.key] || 0}
              </Badge>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
            {students.map((student, index) => (
              <StudentAttendanceRow
                key={student.enrollment_id}
                student={student}
                status={statuses[student.enrollment_id] || 'present'}
                onStatusChange={(status) => setStatus(student.enrollment_id, status)}
                isLast={index === students.length - 1}
              />
            ))}
          </div>
        </AttendanceSection>
      ) : null}

      {students.length === 0 && !loadingStudents && classId && sectionId ? (
        <AttendanceSection>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center" style={{ borderColor: 'var(--color-border)' }}>
            <Users size={34} style={{ color: 'var(--color-text-muted)', opacity: 0.5 }} />
            <p className="mt-4 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>No roster loaded</p>
          </div>
        </AttendanceSection>
      ) : null}
    </div>
  )
}

const StudentAttendanceRow = ({ student, status, onStatusChange, isLast }) => {
  const currentStatus = STATUS_OPTIONS.find((option) => option.key === status) || STATUS_OPTIONS[0]

  return (
    <div
      className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
        borderLeft: `4px solid ${currentStatus.color}`,
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-bold"
          style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
        >
          {student.roll_number || '--'}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: 'var(--color-brand)' }}
        >
          {getInitials(student.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {student.name}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Roll no. {student.roll_number || 'Not assigned'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((option) => {
          const isSelected = status === option.key

          return (
            <button
              key={option.key}
              onClick={() => onStatusChange(option.key)}
              title={option.fullLabel}
              className={cn(
                'inline-flex h-10 min-w-[44px] items-center justify-center rounded-2xl border px-3 text-xs font-semibold transition-all duration-150',
                isSelected ? 'shadow-sm' : 'hover:-translate-y-0.5',
              )}
              style={{
                backgroundColor: isSelected ? option.color : option.bg,
                borderColor: isSelected ? option.color : option.border,
                color: isSelected ? '#fff' : option.color,
              }}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MarkAttendancePage
