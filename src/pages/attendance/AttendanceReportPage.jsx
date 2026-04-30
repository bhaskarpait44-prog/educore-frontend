import { useState, useEffect, useCallback, useMemo } from 'react'
import { AlertTriangle, Search, TrendingUp, X } from 'lucide-react'
import { getStudents } from '@/api/students'
import useAttendanceStore from '@/store/attendanceStore'
import useSessionStore from '@/store/sessionStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import ProgressBar from '@/components/ui/ProgressBar'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { AttendanceMetric, AttendanceSection } from './AttendanceShell'
import { debounce, formatDate, getInitials } from '@/utils/helpers'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const AttendanceReportPage = () => {
  usePageTitle('Attendance Report')
  const { toastError } = useToast()
  const { studentSummary, studentRecords, isLoading, fetchStudentAttendance, clearStudentData } = useAttendanceStore()
  const { currentSession } = useSessionStore()

  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [searching, setSearching] = useState(false)

  const doSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setResults([])
        return
      }

      setSearching(true)
      try {
        const response = await getStudents({ search: query, perPage: 10 })
        const data = Array.isArray(response.data) ? response.data : (response.data?.students || [])
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400),
    [],
  )

  useEffect(() => {
    doSearch(search)
  }, [search, doSearch])

  const selectStudent = (student) => {
    setSelected(student)
    setResults([])
    setSearch(`${student.first_name} ${student.last_name}`)

    if (student.current_enrollment?.id) {
      fetchStudentAttendance(student.current_enrollment.id).catch(() => toastError('Failed to load attendance'))
    }
  }

  const resetSearch = () => {
    setSearch('')
    setSelected(null)
    setResults([])
    clearStudentData()
  }

  const breakdown = useMemo(() => {
    const monthMap = {}

    studentRecords.forEach((record) => {
      const month = new Date(record.date).getMonth()
      if (!monthMap[month]) {
        monthMap[month] = { present: 0, absent: 0, late: 0, half_day: 0, holiday: 0, total: 0 }
      }

      monthMap[month][record.status] = (monthMap[month][record.status] || 0) + 1
      if (record.status !== 'holiday') {
        monthMap[month].total += 1
      }
    })

    return monthMap
  }, [studentRecords])

  const atRisk = (studentSummary?.percentage || 0) < 75

  return (
    <div className="space-y-6">
      <AttendanceSection title="Attendance Report">
        <div className="relative">
          <Input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              if (!event.target.value) {
                setSelected(null)
                clearStudentData()
              }
            }}
            placeholder="Search by student name or admission number"
            icon={Search}
            className="pr-10"
          />

          {search ? (
            <button
              onClick={resetSearch}
              className="absolute right-3 top-[38px] -translate-y-1/2 rounded-full p-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X size={15} />
            </button>
          ) : null}

          {results.length > 0 ? (
            <div
              className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border shadow-xl"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              {results.map((student) => (
                <button
                  key={student.id}
                  onClick={() => selectStudent(student)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: 'var(--color-brand)' }}
                  >
                    {getInitials(`${student.first_name || ''} ${student.last_name || ''}`)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {student.admission_no}
                      {student.current_enrollment ? ` | ${student.current_enrollment.class}` : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {searching ? (
          <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Searching students...
          </p>
        ) : null}
      </AttendanceSection>

      {selected && studentSummary ? (
        <>
          <AttendanceSection>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-semibold text-white"
                  style={{ backgroundColor: 'var(--color-brand)' }}
                >
                  {getInitials(`${selected.first_name} ${selected.last_name}`)}
                </div>
                <div>
                  <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {selected.first_name} {selected.last_name}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {selected.admission_no}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Joined {formatDate(studentSummary.joinedDate)}
                  </p>
                </div>
              </div>

              {atRisk ? (
                <div className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>
                  <AlertTriangle size={16} />
                  Attendance is below the 75% threshold
                </div>
              ) : (
                <Badge variant="green" size="md">Attendance is within the safe range</Badge>
              )}
            </div>
          </AttendanceSection>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <AttendanceMetric label="Session" value={currentSession?.name || '--'} />
            <AttendanceMetric label="Working Days" value={studentSummary.workingDays || 0} />
            <AttendanceMetric label="Present" value={studentSummary.presentCount || 0} tone="success" />
            <AttendanceMetric label="Absent" value={studentSummary.absentCount || 0} tone="danger" />
            <AttendanceMetric label="Late" value={studentSummary.lateCount || 0} tone="warning" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
            <AttendanceSection title="Overall Attendance">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Percentage
                  </p>
                  <p className="text-sm font-semibold" style={{ color: atRisk ? '#dc2626' : '#15803d' }}>
                    {(studentSummary.percentage || 0).toFixed(1)}%
                  </p>
                </div>
                <ProgressBar value={studentSummary.percentage || 0} size="lg" />
              </div>
            </AttendanceSection>

            {Object.keys(breakdown).length > 0 ? (
              <AttendanceSection title="Monthly List">
                <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                          {['Month', 'Working Days', 'Present', 'Absent', 'Late', 'Half Day', '%'].map((heading) => (
                            <th
                              key={heading}
                              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(breakdown).map(([month, data], index, array) => {
                          const effective = (data.present || 0) + (data.late || 0) + (data.half_day || 0) * 0.5
                          const pct = data.total > 0 ? (effective / data.total) * 100 : null
                          const pctColor = (pct || 0) >= 75 ? '#16a34a' : (pct || 0) >= 50 ? '#d97706' : '#dc2626'

                          return (
                            <tr
                              key={month}
                              style={{ borderBottom: index < array.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                            >
                              <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                {MONTHS[month]}
                              </td>
                              <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                {data.total}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium" style={{ color: '#16a34a' }}>
                                {data.present || 0}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium" style={{ color: '#dc2626' }}>
                                {data.absent || 0}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium" style={{ color: '#d97706' }}>
                                {data.late || 0}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium" style={{ color: '#2563eb' }}>
                                {data.half_day || 0}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold" style={{ color: pctColor }}>
                                {pct === null ? '--' : `${pct.toFixed(1)}%`}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </AttendanceSection>
            ) : null}
          </div>
        </>
      ) : null}

      {!selected ? (
        <AttendanceSection>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-20 text-center" style={{ borderColor: 'var(--color-border)' }}>
            <TrendingUp size={36} style={{ color: 'var(--color-text-muted)', opacity: 0.45 }} />
            <p className="mt-4 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Search student</p>
          </div>
        </AttendanceSection>
      ) : null}

      {selected && isLoading ? (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Loading attendance report...
        </p>
      ) : null}
    </div>
  )
}

export default AttendanceReportPage
