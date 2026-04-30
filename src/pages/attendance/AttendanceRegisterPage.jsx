import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, FileSpreadsheet, FileText } from 'lucide-react'
import { getClasses, getClassOptions, getSections } from '@/api/classApi'
import useAttendanceStore from '@/store/attendanceStore'
import useSessionStore from '@/store/sessionStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import AttendanceOverrideModal from './AttendanceOverrideModal'
import { AttendanceMetric, AttendanceSection } from './AttendanceShell'
import { cn, labelFromKey } from '@/utils/helpers'

const STATUS_CELL = {
  present: { label: 'P', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', badge: 'green' },
  absent: { label: 'A', bg: '#fef2f2', color: '#dc2626', border: '#fecaca', badge: 'red' },
  late: { label: 'L', bg: '#fffbeb', color: '#d97706', border: '#fde68a', badge: 'yellow' },
  half_day: { label: 'H', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', badge: 'blue' },
  holiday: { label: '-', bg: '#f1f5f9', color: '#94a3b8', border: '#e2e8f0', badge: 'grey' },
  none: { label: '.', bg: 'transparent', color: '#cbd5e1', border: 'transparent', badge: 'grey' },
}

const AttendanceRegisterPage = ({ mode = 'register' }) => {
  usePageTitle('Attendance Register')
  const { toastError } = useToast()
  const { sessionReport, isLoading, fetchClassRegister } = useAttendanceStore()
  const { sessions, currentSession, fetchSessions } = useSessionStore()
  const isOverrideMode = mode === 'override'

  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [override, setOverride] = useState(null)

  useEffect(() => {
    fetchSessions().catch(() => {})
    getClasses()
      .then((response) => setClasses(getClassOptions(response)))
      .catch(() => {})
  }, [fetchSessions])

  useEffect(() => {
    if (currentSession && !sessionId) {
      setSessionId(String(currentSession.id))
    }
  }, [currentSession, sessionId])

  useEffect(() => {
    if (!classId) {
      setSections([])
      return
    }

    getSections(classId)
      .then((response) => setSections((response.data || []).map((section) => ({ value: String(section.id), label: `Section ${section.name}` }))))
      .catch(() => {})
  }, [classId])

  useEffect(() => {
    if (!sessionId || !classId || !sectionId) return

    fetchClassRegister({
      session_id: sessionId,
      class_id: classId,
      section_id: sectionId,
      month: month + 1,
      year,
    }).catch((error) => toastError(error?.message || 'Failed to load attendance register.'))
  }, [sessionId, classId, sectionId, month, year, fetchClassRegister, toastError])

  const daysInMonth = useMemo(() => {
    const days = []
    const count = new Date(year, month + 1, 0).getDate()

    for (let day = 1; day <= count; day += 1) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dow = new Date(date).getDay()
      days.push({ date, day, isWeekend: dow === 0 || dow === 6 })
    }

    return days
  }, [month, year])

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })

  const attendanceLookup = useMemo(() => {
    const map = {}
    sessionReport.forEach((row) => {
      map[row.enrollment_id || row.id] = {}
      ;(row.attendance || []).forEach((attendance) => {
        map[row.enrollment_id || row.id][attendance.date] = attendance
      })
    })
    return map
  }, [sessionReport])

  const summary = useMemo(() => {
    const totals = { present: 0, absent: 0, late: 0, half_day: 0, holiday: 0 }

    sessionReport.forEach((row) => {
      ;(row.attendance || []).forEach((attendance) => {
        if (totals[attendance.status] !== undefined) {
          totals[attendance.status] += 1
        }
      })
    })

    return totals
  }, [sessionReport])

  const selectedClassLabel = classes.find((item) => item.value === classId)?.label || 'No class selected'
  const selectedSectionLabel = sections.find((item) => item.value === sectionId)?.label || 'No section selected'

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear((value) => value - 1)
      return
    }
    setMonth((value) => value - 1)
  }

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear((value) => value + 1)
      return
    }
    setMonth((value) => value + 1)
  }

  return (
    <div className="space-y-6">
      <AttendanceSection
        title={isOverrideMode ? 'Override Register' : 'Attendance Register'}
        action={(
          <>
            <Button variant="secondary" size="sm" icon={FileText}>Export PDF</Button>
            <Button variant="secondary" size="sm" icon={FileSpreadsheet}>Export Excel</Button>
          </>
        )}
      >
        <div className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-4">
            <Select
              label="Session"
              value={sessionId}
              onChange={(event) => setSessionId(event.target.value)}
              options={(sessions || []).map((session) => ({ value: String(session.id), label: session.name }))}
            />
            <Select
              label="Class"
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value)
                setSectionId('')
              }}
              options={classes}
              placeholder="Select class"
            />
            <Select
              label="Section"
              value={sectionId}
              onChange={(event) => setSectionId(event.target.value)}
              options={sections}
              disabled={!classId}
              placeholder="Select section"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Month</label>
              <div
                className="flex items-center gap-2 rounded-2xl border px-2 py-2"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                <button
                  onClick={prevMonth}
                  className="rounded-xl p-2 transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex-1 text-center">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {monthName}
                  </p>
                </div>
                <button
                  onClick={nextMonth}
                  className="rounded-xl p-2 transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <AttendanceMetric label="Students" value={sessionReport.length} />
            <AttendanceMetric label="Present" value={summary.present} tone="success" />
            <AttendanceMetric label="Absent" value={summary.absent} tone="danger" />
            <AttendanceMetric label="Late/Half" value={summary.late + summary.half_day} tone="warning" />
          </div>
        </div>
      </AttendanceSection>

      <AttendanceSection title={`${selectedClassLabel} • ${selectedSectionLabel} • ${monthName}`}>
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_CELL)
            .filter(([key]) => key !== 'none')
            .map(([key, config]) => (
              <Badge key={key} variant={config.badge} size="md">
                {config.label} {labelFromKey(key)}
              </Badge>
            ))}
        </div>
      </AttendanceSection>

      <AttendanceSection
        title="Calendar View"
      >
        {isLoading ? (
          <RegisterSkeleton />
        ) : (
          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
            <div className="overflow-x-auto">
              <table className="min-w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th
                      className="sticky left-0 z-10 min-w-44 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text-muted)',
                        borderRight: '1px solid var(--color-border)',
                      }}
                    >
                      Student
                    </th>
                    {daysInMonth.map(({ day, date, isWeekend }) => (
                      <th
                        key={date}
                        className="w-10 min-w-[40px] px-1 py-3 text-center text-xs font-semibold"
                        style={{
                          color: isWeekend ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                          backgroundColor: isWeekend ? 'var(--color-surface-raised)' : 'var(--color-surface)',
                        }}
                      >
                        {day}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessionReport.length === 0 ? (
                    <tr>
                      <td colSpan={daysInMonth.length + 2} className="px-6 py-20 text-center">
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          No register data available
                        </p>
                        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          Select a session, class, and section to load the monthly attendance register.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    sessionReport.map((row, rowIndex) => {
                      const enrollmentId = row.enrollment_id || row.id
                      const lookup = attendanceLookup[enrollmentId] || {}
                      const pct = parseFloat(row.percentage || row.attendance_percentage || 0)
                      const pctColor = pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'

                      return (
                        <tr
                          key={enrollmentId}
                          style={{ borderBottom: rowIndex < sessionReport.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                        >
                          <td
                            className="sticky left-0 z-10 px-4 py-3"
                            style={{
                              backgroundColor: 'var(--color-surface)',
                              borderRight: '1px solid var(--color-border)',
                            }}
                          >
                            <p className="max-w-40 truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                              {row.student_name}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              Roll {row.roll_number || '-'}
                            </p>
                          </td>

                          {daysInMonth.map(({ date, isWeekend }) => {
                            const record = lookup[date]
                            const status = record?.status || (isWeekend ? 'holiday' : 'none')
                            const config = STATUS_CELL[status] || STATUS_CELL.none

                            return (
                              <td
                                key={date}
                                className="px-1 py-1.5 text-center"
                                style={{ backgroundColor: isWeekend ? 'var(--color-surface-raised)' : 'transparent' }}
                              >
                                <button
                                  onClick={() => record && setOverride({ record, student: row })}
                                  disabled={!record}
                                  className={cn(
                                    'mx-auto flex h-8 w-8 items-center justify-center rounded-xl text-[10px] font-bold transition-all duration-100',
                                    record ? 'cursor-pointer hover:scale-105 hover:shadow-sm' : 'cursor-default',
                                  )}
                                  style={{
                                    backgroundColor: config.bg,
                                    color: config.color,
                                    border: `1px solid ${config.border}`,
                                  }}
                                  title={record ? `${row.student_name} - ${status} - Click to edit` : undefined}
                                >
                                  {config.label}
                                </button>
                              </td>
                            )
                          })}

                          <td className="px-3 py-3 text-center">
                            <span className="text-sm font-semibold" style={{ color: pctColor }}>
                              {pct.toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AttendanceSection>

      {override ? (
        <AttendanceOverrideModal
          open
          record={override.record}
          student={override.student}
          onClose={() => setOverride(null)}
          onSuccess={() => {
            setOverride(null)
            fetchClassRegister({
              session_id: sessionId,
              class_id: classId,
              section_id: sectionId,
              month: month + 1,
              year,
            })
          }}
        />
      ) : null}
    </div>
  )
}

const RegisterSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[...Array(5)].map((_, rowIndex) => (
      <div key={rowIndex} className="flex items-center gap-2">
        <div className="h-10 w-40 rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        {[...Array(15)].map((__, cellIndex) => (
          <div key={cellIndex} className="h-8 w-8 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        ))}
      </div>
    ))}
  </div>
)

export default AttendanceRegisterPage
