// src/pages/attendance/AttendanceRegisterPage.jsx
import { useState, useEffect, useMemo } from 'react'
import { FileSpreadsheet, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { getClasses, getSections } from '@/api/classes'
import useAttendanceStore from '@/store/attendanceStore'
import useSessionStore from '@/store/sessionStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import AttendanceOverrideModal from './AttendanceOverrideModal'
import { cn } from '@/utils/helpers'

const STATUS_CELL = {
  present  : { label: 'P', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  absent   : { label: 'A', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  late     : { label: 'L', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  half_day : { label: 'H', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  holiday  : { label: '—', bg: '#f1f5f9', color: '#94a3b8', border: '#e2e8f0' },
  none     : { label: '·', bg: 'transparent', color: '#cbd5e1', border: 'transparent' },
}

const AttendanceRegisterPage = () => {
  usePageTitle('Attendance Register')
  const { toastError } = useToast()
  const { sessionReport, isLoading, fetchSessionReport } = useAttendanceStore()
  const { sessions, currentSession, fetchSessions } = useSessionStore()

  const [classes,    setClasses]    = useState([])
  const [sections,   setSections]   = useState([])
  const [sessionId,  setSessionId]  = useState('')
  const [classId,    setClassId]    = useState('')
  const [sectionId,  setSectionId]  = useState('')
  const [month,      setMonth]      = useState(new Date().getMonth())
  const [year,       setYear]       = useState(new Date().getFullYear())
  const [override,   setOverride]   = useState(null)  // { record, student }

  useEffect(() => {
    fetchSessions().catch(() => {})
    getClasses()
      .then(r => setClasses((r.data || []).map(c => ({ value: String(c.id), label: c.name }))))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (currentSession && !sessionId) setSessionId(String(currentSession.id))
  }, [currentSession])

  useEffect(() => {
    if (!classId) { setSections([]); return }
    getSections(classId)
      .then(r => setSections((r.data || []).map(s => ({ value: String(s.id), label: `Section ${s.name}` }))))
      .catch(() => {})
  }, [classId])

  useEffect(() => {
    if (!sessionId) return
    fetchSessionReport(sessionId, { class_id: classId, section_id: sectionId })
      .catch(() => toastError('Failed to load register'))
  }, [sessionId, classId, sectionId])

  // Generate days for the selected month
  const daysInMonth = useMemo(() => {
    const days = []
    const count = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= count; d++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dow  = new Date(date).getDay()
      days.push({ date, day: d, isWeekend: dow === 0 || dow === 6 })
    }
    return days
  }, [month, year])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })

  // Build lookup: student_id → date → record
  const attendanceLookup = useMemo(() => {
    const map = {}
    sessionReport.forEach(row => {
      map[row.enrollment_id || row.id] = {}
      ;(row.attendance || []).forEach(a => {
        map[row.enrollment_id || row.id][a.date] = a
      })
    })
    return map
  }, [sessionReport])

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Attendance Register
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Full calendar view · Click any cell to override
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={FileText}>Export PDF</Button>
          <Button variant="secondary" size="sm" icon={FileSpreadsheet}>Export Excel</Button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <Select
          label="Session"
          value={sessionId}
          onChange={e => setSessionId(e.target.value)}
          options={(sessions || []).map(s => ({ value: String(s.id), label: s.name }))}
        />
        <Select
          label="Class"
          value={classId}
          onChange={e => { setClassId(e.target.value); setSectionId('') }}
          options={classes}
          placeholder="All classes"
        />
        <Select
          label="Section"
          value={sectionId}
          onChange={e => setSectionId(e.target.value)}
          options={sections}
          disabled={!classId}
          placeholder="All sections"
        />
        {/* Month navigation */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Month</label>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="flex-1 text-center text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {monthName}
            </span>
            <button onClick={nextMonth} className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        {Object.entries(STATUS_CELL)
          .filter(([k]) => k !== 'none')
          .map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-5 h-5 rounded text-center text-xs font-bold flex items-center justify-center"
                style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
              >
                {cfg.label}
              </span>
              <span style={{ color: 'var(--color-text-muted)' }}>
                {key === 'half_day' ? 'Half Day' : key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
            </span>
          ))}
      </div>

      {/* ── Calendar grid ───────────────────────────────────────────────── */}
      {isLoading ? (
        <RegisterSkeleton />
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {/* Sticky student name column */}
                  <th
                    className="sticky left-0 z-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-40"
                    style={{
                      backgroundColor : 'var(--color-surface)',
                      color           : 'var(--color-text-muted)',
                      borderRight     : '1px solid var(--color-border)',
                    }}
                  >
                    Student
                  </th>
                  {daysInMonth.map(({ day, date, isWeekend }) => (
                    <th
                      key={date}
                      className="px-1 py-3 text-center text-xs font-semibold w-9 min-w-[36px]"
                      style={{
                        color           : isWeekend ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                        backgroundColor : isWeekend ? 'var(--color-surface-raised)' : 'var(--color-surface)',
                      }}
                    >
                      {day}
                    </th>
                  ))}
                  <th
                    className="px-3 py-3 text-center text-xs font-semibold"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessionReport.length === 0 ? (
                  <tr>
                    <td colSpan={daysInMonth.length + 2} className="py-16 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      No data. Select session, class, and section above.
                    </td>
                  </tr>
                ) : (
                  sessionReport.map((row, ri) => {
                    const enrollmentId = row.enrollment_id || row.id
                    const lookup       = attendanceLookup[enrollmentId] || {}
                    const pct          = parseFloat(row.percentage || 0)
                    const pctColor     = pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'

                    return (
                      <tr
                        key={enrollmentId}
                        style={{ borderBottom: ri < sessionReport.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                      >
                        {/* Sticky name cell */}
                        <td
                          className="sticky left-0 z-10 px-4 py-2.5"
                          style={{
                            backgroundColor : 'var(--color-surface)',
                            borderRight     : '1px solid var(--color-border)',
                          }}
                        >
                          <p className="text-sm font-medium truncate max-w-36" style={{ color: 'var(--color-text-primary)' }}>
                            {row.student_name}
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                            Roll {row.roll_number || '—'}
                          </p>
                        </td>

                        {/* Date cells */}
                        {daysInMonth.map(({ date, isWeekend }) => {
                          const record = lookup[date]
                          const status = record?.status || (isWeekend ? 'holiday' : 'none')
                          const cfg    = STATUS_CELL[status] || STATUS_CELL.none

                          return (
                            <td
                              key={date}
                              className="px-0.5 py-1 text-center"
                              style={{ backgroundColor: isWeekend ? 'var(--color-surface-raised)' : 'transparent' }}
                            >
                              <button
                                onClick={() => record && setOverride({ record, student: row })}
                                disabled={!record}
                                className={cn(
                                  'w-7 h-7 rounded text-[10px] font-bold mx-auto flex items-center justify-center',
                                  'transition-all duration-100',
                                  record ? 'cursor-pointer hover:scale-110 hover:shadow-sm' : 'cursor-default',
                                )}
                                style={{
                                  backgroundColor : cfg.bg,
                                  color           : cfg.color,
                                  border          : `1px solid ${cfg.border}`,
                                }}
                                title={record ? `${row.student_name} — ${status} — Click to override` : undefined}
                              >
                                {cfg.label}
                              </button>
                            </td>
                          )
                        })}

                        {/* Percentage */}
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-xs font-bold" style={{ color: pctColor }}>
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

      {/* Override modal */}
      {override && (
        <AttendanceOverrideModal
          open={true}
          record={override.record}
          student={override.student}
          onClose={() => setOverride(null)}
          onSuccess={() => {
            setOverride(null)
            fetchSessionReport(sessionId, { class_id: classId, section_id: sectionId })
          }}
        />
      )}
    </div>
  )
}

const RegisterSkeleton = () => (
  <div className="p-5 space-y-3 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-2">
        <div className="w-36 h-8 rounded-lg" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        {[...Array(15)].map((_, j) => (
          <div key={j} className="w-7 h-7 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        ))}
      </div>
    ))}
  </div>
)

export default AttendanceRegisterPage