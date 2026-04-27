import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import * as attendanceApi from '@/api/attendance'
import useToast from '@/hooks/useToast'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate, formatPercent } from '@/utils/helpers'

const STATUS_VARIANT = {
  present: 'green',
  absent: 'red',
  late: 'yellow',
  half_day: 'blue',
  holiday: 'grey',
}

const SummaryCard = ({ label, value }) => (
  <div
    className="rounded-xl p-4"
    style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
  >
    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
      {label}
    </p>
    <p className="mt-1 text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
      {value}
    </p>
  </div>
)

const TabAttendance = ({ enrollmentId }) => {
  const { toastError } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    if (!enrollmentId) return

    const loadAttendance = async () => {
      setIsLoading(true)
      try {
        const res = await attendanceApi.getEnrollmentAttendance(enrollmentId)
        setRecords(Array.isArray(res?.data?.records) ? res.data.records : [])
        setSummary(res?.data?.summary || null)
      } catch (error) {
        setRecords([])
        setSummary(null)
        toastError(error.message || 'Failed to load attendance')
      } finally {
        setIsLoading(false)
      }
    }

    loadAttendance()
  }, [enrollmentId, toastError])

  const stats = useMemo(() => ({
    percentage: summary?.percentage ?? 0,
    workingDays: summary?.workingDays ?? 0,
    presentCount: summary?.presentCount ?? 0,
    absentCount: summary?.absentCount ?? 0,
    lateCount: summary?.lateCount ?? 0,
    halfDayCount: summary?.halfDayCount ?? 0,
  }), [summary])

  if (!enrollmentId) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="No active enrollment found"
        description="Attendance can be shown after the student is enrolled in a class and section."
        className="border-0 py-10"
      />
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <SummaryCard label="Attendance" value={formatPercent(stats.percentage, 2)} />
        <SummaryCard label="Working Days" value={stats.workingDays} />
        <SummaryCard label="Present" value={stats.presentCount} />
        <SummaryCard label="Absent" value={stats.absentCount} />
        <SummaryCard label="Late" value={stats.lateCount} />
        <SummaryCard label="Half Day" value={stats.halfDayCount} />
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No attendance records"
          description="Attendance has not been marked for this enrollment yet."
          className="border-0 py-10"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Date', 'Status', 'Method', 'Marked At', 'Note'].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider pr-4" style={{ color: 'var(--color-text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="py-3.5 pr-4 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {formatDate(row.date)}
                  </td>
                  <td className="py-3.5 pr-4">
                    <Badge variant={STATUS_VARIANT[row.status] || 'grey'}>
                      {String(row.status || '').replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3.5 pr-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {row.method || 'manual'}
                  </td>
                  <td className="py-3.5 pr-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {formatDate(row.marked_at, 'short')}
                  </td>
                  <td className="py-3.5 pr-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {row.override_reason || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default TabAttendance
