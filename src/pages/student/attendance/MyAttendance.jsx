import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CircleAlert,
  Download,
  List,
  RefreshCw,
  Search,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import AttendanceRing from '@/components/student/AttendanceRing'
import AttendanceCalendar from '@/components/student/AttendanceCalendar'
import AttendanceTrend from '@/components/student/AttendanceTrend'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useStudentAttendance from '@/hooks/useStudentAttendance'
import { formatDate, formatPercent } from '@/utils/helpers'

const filterOptions = [
  { key: 'all', label: 'All' },
  { key: 'present', label: 'P' },
  { key: 'absent', label: 'A' },
  { key: 'late', label: 'L' },
  { key: 'half_day', label: 'H' },
  { key: 'holiday', label: 'Off' },
]

const MyAttendance = () => {
  usePageTitle('My Attendance')

  const { toastError, toastInfo, toastSuccess } = useToast()
  const {
    attendance,
    summary,
    trend,
    selectedMonth,
    loading,
    refreshing,
    exporting,
    error,
    changeMonth,
    refresh,
    exportAttendance,
    availableMonths,
  } = useStudentAttendance()

  const [viewMode, setViewMode] = useState('calendar')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchRange, setSearchRange] = useState({ from: '', to: '' })
  const [selectedRecord, setSelectedRecord] = useState(null)

  const records = attendance?.records || []
  const monthSummary = attendance?.monthly_summary || {}
  const overallSummary = summary || attendance?.summary || {}

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (statusFilter !== 'all' && record.status !== statusFilter) return false
      if (searchRange.from && record.date < searchRange.from) return false
      if (searchRange.to && record.date > searchRange.to) return false
      return true
    })
  }, [records, statusFilter, searchRange.from, searchRange.to])

  const miniStats = [
    { key: 'present', label: 'Present', value: overallSummary.present_days || 0, tone: '#16a34a' },
    { key: 'absent', label: 'Absent', value: overallSummary.absent_days || 0, tone: '#ef4444' },
    { key: 'late', label: 'Late', value: overallSummary.late_days || 0, tone: '#d97706' },
    { key: 'half', label: 'Half Day', value: overallSummary.half_days || 0, tone: '#2563eb' },
  ]

  const handleRefresh = async () => {
    toastInfo('Refreshing attendance')
    try {
      await refresh()
    } catch {}
  }

  const handleExport = async () => {
    try {
      const data = await exportAttendance()
      if (!data) return

      const printWindow = window.open('', '_blank', 'noopener,noreferrer')
      if (!printWindow) {
        toastError('Unable to open print window.')
        return
      }

      const rows = (data.records || [])
        .map((record) => `
          <tr>
            <td>${formatDate(record.date, 'short')}</td>
            <td>${labelFromStatus(record.status)}</td>
            <td>${record.method || '-'}</td>
          </tr>
        `)
        .join('')

      printWindow.document.write(`
        <html>
          <head>
            <title>Attendance Report</title>
            <style>
              * { box-sizing: border-box; }
              body { font-family: Arial, sans-serif; color: #111827; padding: 24px; }
              h1, h2, p { margin: 0; }
              .header { margin-bottom: 18px; }
              .meta { margin-top: 8px; color: #475569; font-size: 12px; line-height: 1.6; }
              .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
              .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; }
              .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
              .value { font-size: 22px; font-weight: 700; margin-top: 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 18px; }
              th, td { border: 1px solid #cbd5e1; padding: 10px; font-size: 12px; text-align: left; }
              th { background: #f8fafc; }
              @media print { body { padding: 16px; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Attendance Report</h1>
              <div class="meta">
                <p>Student: ${data.student?.name || '-'}</p>
                <p>Admission No: ${data.student?.admission_no || '-'}</p>
                <p>Class: ${data.student?.class_name || '-'} ${data.student?.section_name || ''}</p>
                <p>Session: ${data.student?.session_name || '-'}</p>
              </div>
            </div>
            <div class="summary">
              <div class="card"><div class="label">Attendance</div><div class="value">${formatPercent(data.summary?.percentage || 0, 0)}</div></div>
              <div class="card"><div class="label">Present</div><div class="value">${data.summary?.present_days || 0}</div></div>
              <div class="card"><div class="label">Absent</div><div class="value">${data.summary?.absent_days || 0}</div></div>
              <div class="card"><div class="label">Working Days</div><div class="value">${data.summary?.working_days || 0}</div></div>
            </div>
            <table>
              <thead>
                <tr><th>Date</th><th>Status</th><th>Marked By</th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      toastSuccess('Attendance report opened for print/PDF.')
    } catch (err) {
      toastError(err?.message || 'Unable to export attendance.')
    }
  }

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.10), rgba(124,58,237,0.08) 55%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--student-accent)' }}>
              Attendance Overview
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">My Attendance</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
              Track your monthly attendance, check marked dates, and keep an eye on your trend over the last six months.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleRefresh} loading={refreshing} icon={RefreshCw}>
              Refresh
            </Button>
            <Button onClick={handleExport} loading={exporting} icon={Download}>
              Download PDF
            </Button>
          </div>
        </div>
      </section>

      {Number(overallSummary.percentage || 0) < 75 && (
        <section
          className="rounded-[24px] border px-4 py-4 sm:px-5"
          style={{ borderColor: '#fca5a5', backgroundColor: 'rgba(239,68,68,0.08)' }}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
              <CircleAlert size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                Your attendance is {formatPercent(overallSummary.percentage || 0, 0)}.
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Minimum required is 75%. You need to attend {overallSummary.days_needed_for_minimum || 0} more consecutive day(s) to reach 75%. Please inform your parents and speak to your class teacher.
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(320px,0.86fr)_minmax(0,1.14fr)]">
        <section
          className="rounded-[28px] border p-5"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          {loading && !summary ? (
            <AttendanceSummarySkeleton />
          ) : (
            <>
              <AttendanceRing
                percentage={overallSummary.percentage || 0}
                band={overallSummary.band}
                workingDays={overallSummary.working_days || 0}
                presentDays={overallSummary.present_days || 0}
                absentDays={overallSummary.absent_days || 0}
              />

              <div className="mt-5 grid grid-cols-2 gap-3">
                {miniStats.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-[22px] border px-4 py-4"
                    style={{ borderColor: `${item.tone}22`, backgroundColor: `${item.tone}10` }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: item.tone }}>
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">{item.value}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section
          className="rounded-[28px] border p-5"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Select Month</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Tap a month to see its detailed attendance record
              </p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {availableMonths.map((item) => {
              const active = item.month === selectedMonth.month && item.year === selectedMonth.year
              return (
                <button
                  key={`${item.year}-${item.month}`}
                  type="button"
                  onClick={() => changeMonth(item.month, item.year)}
                  className="rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition"
                  style={{
                    backgroundColor: active ? 'var(--student-accent)' : 'var(--color-surface-raised)',
                    color: active ? '#fff' : 'var(--color-text-secondary)',
                    border: `1px solid ${active ? 'var(--student-accent)' : 'var(--color-border)'}`,
                  }}
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
              style={toggleStyle(viewMode === 'calendar')}
            >
              <CalendarDays size={16} />
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
              style={toggleStyle(viewMode === 'list')}
            >
              <List size={16} />
              List
            </button>
          </div>

          {viewMode === 'list' && (
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setStatusFilter(option.key)}
                    className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
                    style={{
                      backgroundColor: statusFilter === option.key ? 'var(--student-accent)' : 'var(--color-surface-raised)',
                      color: statusFilter === option.key ? '#fff' : 'var(--color-text-secondary)',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="relative">
                  <span className="sr-only">From date</span>
                  <input
                    type="date"
                    value={searchRange.from}
                    onChange={(event) => setSearchRange((prev) => ({ ...prev, from: event.target.value }))}
                    className="w-full rounded-2xl border px-3 py-2.5 text-sm"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                  />
                </label>
                <label className="relative">
                  <span className="sr-only">To date</span>
                  <input
                    type="date"
                    value={searchRange.to}
                    onChange={(event) => setSearchRange((prev) => ({ ...prev, to: event.target.value }))}
                    className="w-full rounded-2xl border px-3 py-2.5 text-sm"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                  />
                </label>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="space-y-5">
        {loading && !attendance ? (
          <AttendanceBodySkeleton />
        ) : records.length > 0 ? (
          <>
            {viewMode === 'calendar' ? (
              <AttendanceCalendar
                month={selectedMonth.month}
                year={selectedMonth.year}
                records={records}
                today={attendance?.today || new Date().toISOString().slice(0, 10)}
                onSelectDate={setSelectedRecord}
              />
            ) : (
              <ListView records={filteredRecords} />
            )}

            <section
              className="rounded-[28px] border p-5"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Monthly Summary
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <SummaryTile label="Working Days" value={monthSummary.working_days || 0} />
                <SummaryTile label="Present" value={monthSummary.present_days || 0} tone="#16a34a" />
                <SummaryTile label="Absent" value={monthSummary.absent_days || 0} tone="#ef4444" />
                <SummaryTile label="Late" value={monthSummary.late_days || 0} tone="#d97706" />
                <SummaryTile label="This Month" value={formatPercent(monthSummary.percentage || 0, 0)} tone="#6d28d9" />
              </div>
            </section>

            <AttendanceTrend data={trend} />
          </>
        ) : (
          <EmptyState
            icon={Search}
            title="No attendance records for this month"
            description="Try another month or refresh to check if new records were added."
            action={
              <Button variant="secondary" onClick={handleRefresh} icon={RefreshCw}>
                Refresh Attendance
              </Button>
            }
          />
        )}
      </section>

      <Modal
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title="Attendance Detail"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <DetailRow label="Date" value={formatDate(selectedRecord.date, 'long')} />
            <DetailRow label="Status" value={labelFromStatus(selectedRecord.status)} />
            <DetailRow label="Marked by" value={selectedRecord.marked_by_name || selectedRecord.method || '-'} />
            <DetailRow label="Time" value={selectedRecord.marked_at ? formatTime(selectedRecord.marked_at) : '-'} />
            <DetailRow label="Note" value={selectedRecord.override_reason || 'No note provided.'} />
          </div>
        )}
      </Modal>
    </div>
  )
}

const ListView = ({ records }) => (
  <section
    className="overflow-hidden rounded-[28px] border"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead style={{ backgroundColor: 'var(--color-surface-raised)' }}>
          <tr>
            {['Date', 'Day', 'Status', 'Marked By', 'Time'].map((head) => (
              <th key={head} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id || record.date} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
              <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{formatDate(record.date, 'short')}</td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">{new Date(record.date).toLocaleDateString('en-IN', { weekday: 'long' })}</td>
              <td className="px-4 py-3">
                <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={statusBadgeStyle(record.status)}>
                  {labelFromStatus(record.status)}
                </span>
              </td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">{record.marked_by_name || record.method || '-'}</td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">{record.marked_at ? formatTime(record.marked_at) : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
)

const SummaryTile = ({ label, value, tone = 'var(--color-text-primary)' }) => (
  <div
    className="rounded-[22px] border px-4 py-4"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
  >
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-2 text-2xl font-bold" style={{ color: tone }}>{value}</p>
  </div>
)

const DetailRow = ({ label, value }) => (
  <div
    className="rounded-2xl border px-4 py-3"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
  >
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-1 text-sm text-[var(--color-text-primary)]">{value}</p>
  </div>
)

const AttendanceSummarySkeleton = () => (
  <div className="animate-pulse">
    <div className="mx-auto h-36 w-36 rounded-full bg-[var(--color-surface-raised)]" />
    <div className="mt-6 grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-[22px] bg-[var(--color-surface-raised)] p-6" />
      ))}
    </div>
  </div>
)

const AttendanceBodySkeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="rounded-[28px] bg-[var(--color-surface-raised)] p-10" />
    <div className="rounded-[28px] bg-[var(--color-surface-raised)] p-10" />
    <div className="rounded-[28px] bg-[var(--color-surface-raised)] p-10" />
  </div>
)

function toggleStyle(active) {
  return {
    backgroundColor: active ? 'var(--student-accent)' : 'var(--color-surface-raised)',
    color: active ? '#fff' : 'var(--color-text-secondary)',
    border: `1px solid ${active ? 'var(--student-accent)' : 'var(--color-border)'}`,
  }
}

function labelFromStatus(status) {
  return String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function statusBadgeStyle(status) {
  if (status === 'present') return { backgroundColor: '#dcfce7', color: '#15803d' }
  if (status === 'absent') return { backgroundColor: '#fee2e2', color: '#dc2626' }
  if (status === 'late') return { backgroundColor: '#fef3c7', color: '#b45309' }
  if (status === 'half_day') return { backgroundColor: '#dbeafe', color: '#1d4ed8' }
  return { backgroundColor: '#e5e7eb', color: '#6b7280' }
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

export default MyAttendance
