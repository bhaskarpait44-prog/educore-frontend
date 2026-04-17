// src/pages/attendance/AttendanceReportPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { Search, TrendingUp, Calendar, AlertTriangle, X } from 'lucide-react'
import { getStudents } from '@/api/students'
import useAttendanceStore from '@/store/attendanceStore'
import useSessionStore from '@/store/sessionStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import ProgressBar from '@/components/ui/ProgressBar'
import Badge from '@/components/ui/Badge'
import { debounce, formatDate } from '@/utils/helpers'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const AttendanceReportPage = () => {
  usePageTitle('Attendance Report')
  const { toastError } = useToast()
  const { studentSummary, studentRecords, isLoading, fetchStudentAttendance } = useAttendanceStore()
  const { currentSession } = useSessionStore()

  const [search,   setSearch]   = useState('')
  const [results,  setResults]  = useState([])
  const [selected, setSelected] = useState(null)
  const [searching,setSearching]= useState(false)

  const doSearch = useCallback(
    debounce(async (q) => {
      if (!q.trim()) { setResults([]); return }
      setSearching(true)
      try {
        const res = await getStudents({ search: q, perPage: 10 })
        const data = Array.isArray(res.data) ? res.data : (res.data?.students || [])
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400),
    []
  )

  useEffect(() => { doSearch(search) }, [search])

  const selectStudent = (student) => {
    setSelected(student)
    setResults([])
    setSearch(student.first_name + ' ' + student.last_name)
    if (student.current_enrollment?.id) {
      fetchStudentAttendance(student.current_enrollment.id)
        .catch(() => toastError('Failed to load attendance'))
    }
  }

  // Build month-wise breakdown from records
  const monthBreakdown = () => {
    const map = {}
    studentRecords.forEach(r => {
      const m = new Date(r.date).getMonth()
      if (!map[m]) map[m] = { present: 0, absent: 0, late: 0, half_day: 0, holiday: 0, total: 0 }
      map[m][r.status] = (map[m][r.status] || 0) + 1
      if (r.status !== 'holiday') map[m].total++
    })
    return map
  }

  const breakdown = monthBreakdown()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Attendance Report
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          Search a student to view their attendance summary
        </p>
      </div>

      {/* ── Search box ─────────────────────────────────────────────────── */}
      <div className="relative">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <Search size={18} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search student by name or admission number…"
            value={search}
            onChange={e => { setSearch(e.target.value); if (!e.target.value) setSelected(null) }}
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: 'var(--color-text-primary)' }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setSelected(null); setResults([]) }}>
              <X size={16} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {results.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-2xl shadow-xl z-20 overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            {results.map(s => (
              <button
                key={s.id}
                onClick={() => selectStudent(s)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: 'var(--color-brand)' }}
                >
                  {s.first_name?.[0]}{s.last_name?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {s.first_name} {s.last_name}
                  </p>
                  <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                    {s.admission_no}
                    {s.current_enrollment && ` · ${s.current_enrollment.class}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────── */}
      {selected && studentSummary && (
        <>
          {/* Student identity bar */}
          <div
            className="flex items-center gap-4 p-4 rounded-2xl"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shrink-0"
              style={{ backgroundColor: 'var(--color-brand)' }}
            >
              {selected.first_name?.[0]}{selected.last_name?.[0]}
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {selected.first_name} {selected.last_name}
              </p>
              <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                {selected.admission_no}
              </p>
            </div>
            {studentSummary.percentage < 75 && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
              >
                <AlertTriangle size={15} />
                Below 75%
              </div>
            )}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Working Days',    value: studentSummary.workingDays    || 0, color: 'var(--color-text-primary)' },
              { label: 'Present',         value: studentSummary.presentCount   || 0, color: '#16a34a' },
              { label: 'Absent',          value: studentSummary.absentCount    || 0, color: '#dc2626' },
              { label: 'Late',            value: studentSummary.lateCount      || 0, color: '#d97706' },
            ].map(card => (
              <div
                key={card.label}
                className="p-4 rounded-2xl text-center"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{card.label}</p>
              </div>
            ))}
          </div>

          {/* Percentage bar */}
          <div
            className="p-5 rounded-2xl"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Overall Attendance
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {studentSummary.joinedDate && `From ${formatDate(studentSummary.joinedDate)}`}
              </p>
            </div>
            <ProgressBar value={studentSummary.percentage || 0} size="lg" />
          </div>

          {/* Month-wise breakdown */}
          {Object.keys(breakdown).length > 0 && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div
                className="px-5 py-3.5"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Month-wise Breakdown
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {['Month','Working Days','Present','Absent','Late','Half Day','%'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(breakdown).map(([m, data], i, arr) => {
                      const effective = (data.present || 0) + (data.late || 0) + (data.half_day || 0) * 0.5
                      const pct       = data.total > 0 ? (effective / data.total * 100).toFixed(1) : '—'
                      const pctNum    = parseFloat(pct)
                      const pctColor  = pctNum >= 75 ? '#16a34a' : pctNum >= 50 ? '#d97706' : '#dc2626'

                      return (
                        <tr
                          key={m}
                          style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                        >
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {MONTHS[m]}
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{data.total}</td>
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: '#16a34a' }}>{data.present || 0}</td>
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: '#dc2626' }}>{data.absent  || 0}</td>
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: '#d97706' }}>{data.late    || 0}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: '#2563eb' }}>{data.half_day || 0}</td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold" style={{ color: pctColor }}>{pct}%</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state — no student selected */}
      {!selected && (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl text-center"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <TrendingUp size={36} className="mb-3" style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Search for a student above
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Their attendance summary and month-wise report will appear here
          </p>
        </div>
      )}
    </div>
  )
}

export default AttendanceReportPage