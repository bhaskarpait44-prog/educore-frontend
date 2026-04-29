// src/pages/attendance/MarkAttendancePage.jsx
import { useState, useEffect } from 'react'
import { CheckCircle, Send, RefreshCw, Users } from 'lucide-react'
import { getClasses, getClassOptions, getSections } from '@/api/classApi'
import { getClassAttendance } from '@/api/attendance'
import useAttendanceStore from '@/store/attendanceStore'
import useSessionStore from '@/store/sessionStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { cn, formatDate } from '@/utils/helpers'

const STATUS_OPTIONS = [
  { key: 'present',  label: 'P', fullLabel: 'Present',  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { key: 'absent',   label: 'A', fullLabel: 'Absent',   color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { key: 'late',     label: 'L', fullLabel: 'Late',     color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { key: 'half_day', label: 'H', fullLabel: 'Half Day', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
]

const today = () => new Date().toISOString().split('T')[0]

const MarkAttendancePage = () => {
  usePageTitle('Mark Attendance')
  const { toastSuccess, toastError } = useToast()
  const { markBulk, isSaving } = useAttendanceStore()
  const { currentSession, fetchCurrentSession } = useSessionStore()

  const [classes,    setClasses]    = useState([])
  const [sections,   setSections]   = useState([])
  const [classId,    setClassId]    = useState('')
  const [sectionId,  setSectionId]  = useState('')
  const [date,       setDate]       = useState(today())
  const [students,   setStudents]   = useState([])   // { enrollment_id, name, roll_number }
  const [statuses,   setStatuses]   = useState({})   // { enrollment_id: 'present' | ... }
  const [alreadyMarked, setAlreadyMarked] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)

  // Load classes
  useEffect(() => {
    if (!currentSession?.id) {
      fetchCurrentSession?.().catch(() => {})
    }
  }, [currentSession?.id, fetchCurrentSession])

  useEffect(() => {
    getClasses()
      .then(r => setClasses(getClassOptions(r)))
      .catch(() => {})
  }, [])

  // Load sections when class changes
  useEffect(() => {
    if (!classId) { setSections([]); setSectionId(''); return }
    getSections(classId)
      .then(r => setSections((r.data || []).map(s => ({ value: String(s.id), label: `Section ${s.name}` }))))
      .catch(() => {})
  }, [classId])

  // Load students + check if already marked
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

      setAlreadyMarked(!!payload.already_marked)

      const studentList = studentRows.map((row) => ({
        enrollment_id : row.enrollment_id,
        name          : `${row.first_name || ''} ${row.last_name || ''}`.trim(),
        roll_number   : row.roll_number,
        currentStatus : row.status || 'present',
      }))

      if (studentList.length === 0) {
        throw new Error('No students found for the selected class and section.')
      }

      setStudents(studentList)

      // Init statuses
      const init = {}
      studentList.forEach(s => { init[s.enrollment_id] = s.currentStatus })
      setStatuses(init)
    } catch (err) {
      toastError(err?.message || 'Failed to load students')
    } finally {
      setLoadingStudents(false)
    }
  }

  const setStatus = (enrollmentId, status) => {
    setStatuses(prev => ({ ...prev, [enrollmentId]: status }))
  }

  // Mark all present
  const markAllPresent = () => {
    const all = {}
    students.forEach(s => { all[s.enrollment_id] = 'present' })
    setStatuses(all)
  }

  const handleSubmit = async () => {
    if (students.length === 0 || !classId || !sectionId) return
    const records = students.map(s => ({
      enrollment_id: s.enrollment_id,
      status       : statuses[s.enrollment_id] || 'present',
    }))

    const result = await markBulk({
      session_id : currentSession?.id,
      class_id   : classId,
      section_id : sectionId,
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

  const counts = Object.values(statuses).reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Mark Attendance
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          Daily roll call — {formatDate(date)}
        </p>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div
        className="p-5 rounded-2xl space-y-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Class"
            options={classes}
            value={classId}
            onChange={e => { setClassId(e.target.value); setSectionId(''); setStudents([]) }}
          />
          <Select
            label="Section"
            options={sections}
            value={sectionId}
            onChange={e => { setSectionId(e.target.value); setStudents([]) }}
            disabled={!classId}
            placeholder={!classId ? 'Select class first' : 'Select section'}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Date
            </label>
            <input
              type="date"
              value={date}
              max={today()}
              onChange={e => { setDate(e.target.value); setStudents([]) }}
              className="px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-surface)',
                border         : '1.5px solid var(--color-border)',
                color          : 'var(--color-text-primary)',
              }}
              onFocus={e  => e.target.style.borderColor = 'var(--color-brand)'}
              onBlur={e   => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            icon={Users}
            onClick={loadStudents}
            loading={loadingStudents}
            disabled={!classId || !sectionId}
          >
            Load Students
          </Button>

          {alreadyMarked && !submitted && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
              style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}
            >
              <CheckCircle size={14} />
              Already marked today — changes will override
            </div>
          )}

          {submitted && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
              style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}
            >
              <CheckCircle size={14} />
              Attendance submitted
            </div>
          )}
        </div>
      </div>

      {/* ── Student list ────────────────────────────────────────────────── */}
      {students.length > 0 && (
        <>
          {/* Summary + bulk actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              {STATUS_OPTIONS.map(s => (
                <span key={s.key} className="flex items-center gap-1.5 text-xs" style={{ color: s.color }}>
                  <span className="font-bold text-sm">{counts[s.key] || 0}</span>
                  {s.fullLabel}
                </span>
              ))}
            </div>
            <button
              onClick={markAllPresent}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--color-brand)', border: '1px solid var(--color-brand)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eff6ff'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <RefreshCw size={12} /> Mark All Present
            </button>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            {students.map((student, i) => (
              <StudentAttendanceRow
                key={student.enrollment_id}
                student={student}
                status={statuses[student.enrollment_id] || 'present'}
                onStatusChange={(s) => setStatus(student.enrollment_id, s)}
                isLast={i === students.length - 1}
              />
            ))}
          </div>

          {/* Submit button */}
          <div className="flex justify-end">
            <Button
              icon={Send}
              onClick={handleSubmit}
              loading={isSaving}
              size="lg"
            >
              Submit Attendance ({students.length} students)
            </Button>
          </div>
        </>
      )}

      {/* Empty state when no class selected */}
      {students.length === 0 && !loadingStudents && classId && sectionId && (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <Users size={32} className="mb-3" style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Click "Load Students" to fetch the class list
          </p>
        </div>
      )}
    </div>
  )
}

// ── Single student row ────────────────────────────────────────────────────
const StudentAttendanceRow = ({ student, status, onStatusChange, isLast }) => {
  const currentCfg = STATUS_OPTIONS.find(s => s.key === status) || STATUS_OPTIONS[0]

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 transition-colors"
      style={{
        borderBottom       : isLast ? 'none' : '1px solid var(--color-border)',
        borderLeft         : `4px solid ${currentCfg.color}`,
      }}
    >
      {/* Roll number */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
        style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}
      >
        {student.roll_number || '—'}
      </div>

      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ backgroundColor: 'var(--color-brand)' }}
      >
        {student.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
      </div>

      {/* Name */}
      <p className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
        {student.name}
      </p>

      {/* Status toggles */}
      <div className="flex items-center gap-1.5 shrink-0">
        {STATUS_OPTIONS.map(opt => {
          const isSelected = status === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => onStatusChange(opt.key)}
              title={opt.fullLabel}
              className={cn(
                'w-9 h-9 rounded-xl text-xs font-bold transition-all duration-150',
                'border-2',
                isSelected ? 'scale-110' : 'hover:scale-105',
              )}
              style={{
                backgroundColor : isSelected ? opt.color : 'transparent',
                borderColor     : isSelected ? opt.color : 'var(--color-border)',
                color           : isSelected ? '#fff'    : 'var(--color-text-muted)',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MarkAttendancePage
