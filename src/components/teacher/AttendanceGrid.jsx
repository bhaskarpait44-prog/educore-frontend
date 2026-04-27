import { useMemo, useState } from 'react'
import { AlertTriangle, Download, FileSpreadsheet, FileText } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

const STATUS_STYLE = {
  present: { label: 'P', bg: 'rgba(16, 185, 129, 0.16)', color: '#10b981' },
  absent: { label: 'A', bg: 'rgba(239, 68, 68, 0.16)', color: '#ef4444' },
  late: { label: 'L', bg: 'rgba(245, 158, 11, 0.16)', color: '#f59e0b' },
  half_day: { label: 'H', bg: 'rgba(59, 130, 246, 0.16)', color: '#3b82f6' },
  holiday: { label: '-', bg: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' },
  future: { label: '', bg: 'transparent', color: 'var(--color-text-muted)' },
}

const AttendanceGrid = ({
  registerData,
  loading,
  canEdit = false,
  onOverride,
}) => {
  const [editingCell, setEditingCell] = useState(null)
  const [overrideStatus, setOverrideStatus] = useState('present')
  const [overrideReason, setOverrideReason] = useState('')
  const [savingOverride, setSavingOverride] = useState(false)

  const month = registerData?.month || new Date().getMonth() + 1
  const year = registerData?.year || new Date().getFullYear()
  const days = useMemo(() => {
    const count = new Date(year, month, 0).getDate()
    return [...Array(count)].map((_, index) => {
      const day = index + 1
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const now = new Date()
      const dayDate = new Date(date)
      const isFuture = dayDate > new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekend = dayDate.getDay() === 0
      return { day, date, weekend, isFuture }
    })
  }, [month, year])

  const rows = registerData?.students || []
  const summary = useMemo(() => buildSummary(rows), [rows])
  const dailyTotals = useMemo(() => buildDailyTotals(rows), [rows])

  const exportCsv = () => {
    const headers = ['Roll No', 'Name', ...days.map((day) => day.day), 'Present', 'Absent', 'Attendance %']
    const csvRows = rows.map((student) => {
      const recordMap = new Map((student.records || []).map((record) => [record.date, record]))
      const stats = computeStudentStats(student.records || [])
      return [
        student.roll_number || '',
        `${student.first_name} ${student.last_name}`,
        ...days.map((day) => {
          if (day.isFuture) return ''
          if (day.weekend) return '-'
          const record = recordMap.get(day.date)
          return STATUS_STYLE[record?.status || 'holiday']?.label || ''
        }),
        stats.present,
        stats.absent,
        `${stats.percentage.toFixed(0)}%`,
      ]
    })

    downloadCsv(`attendance-register-${year}-${month}.csv`, [headers, ...csvRows])
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Attendance Register
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {canEdit
              ? 'Monthly attendance grid with class-teacher override access and class summary.'
              : 'Monthly attendance grid in view-only mode for assigned teachers.'}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" icon={FileText} onClick={exportCsv}>Download PDF</Button>
          <Button variant="secondary" icon={FileSpreadsheet} onClick={exportCsv}>Download Excel</Button>
        </div>
      </div>

      <section
        className="rounded-[28px] border p-5"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        {loading ? (
          <GridSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-[220px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
                    Student
                  </th>
                  {days.map((day) => (
                    <th
                      key={day.date}
                      className="min-w-[42px] px-1 py-3 text-center text-xs font-semibold"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {day.day}
                    </th>
                  ))}
                  <th className="min-w-[88px] px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                    Totals
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((student) => {
                  const recordMap = new Map((student.records || []).map((record) => [record.date, record]))
                  const stats = computeStudentStats(student.records || [])

                  return (
                    <tr key={student.enrollment_id}>
                      <td className="sticky left-0 z-10 border-t px-4 py-3" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          Roll {student.roll_number || '--'}
                        </p>
                      </td>

                      {days.map((day) => {
                        const record = recordMap.get(day.date)
                        const type = day.isFuture ? 'future' : day.weekend && !record ? 'holiday' : (record?.status || 'holiday')
                        const style = STATUS_STYLE[type] || STATUS_STYLE.holiday

                        return (
                          <td key={day.date} className="border-t px-1 py-2 text-center" style={{ borderColor: 'var(--color-border)' }}>
                            <button
                              type="button"
                              disabled={!record?.attendance_id}
                              onClick={() => {
                                if (!record?.attendance_id || !canEdit) return
                                setEditingCell({ record, student, date: day.date })
                                setOverrideStatus(record.status)
                                setOverrideReason('')
                              }}
                              className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold transition enabled:hover:scale-110"
                              style={{
                                backgroundColor: style.bg,
                                color: style.color,
                                opacity: day.isFuture ? 0.5 : 1,
                              }}
                              title={!record?.attendance_id ? undefined : canEdit ? 'Change status' : 'View only'}
                            >
                              {style.label}
                            </button>
                          </td>
                        )
                      })}

                      <td className="border-t px-3 py-3 text-center" style={{ borderColor: 'var(--color-border)' }}>
                        <p className="text-xs font-semibold" style={{ color: stats.percentage < 75 ? '#ef4444' : '#10b981' }}>
                          {stats.percentage.toFixed(0)}%
                        </p>
                        <p className="mt-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                          P {stats.present} | A {stats.absent}
                        </p>
                      </td>
                    </tr>
                  )
                })}

                {!!rows.length && (
                  <tr>
                    <td className="sticky left-0 z-10 border-t px-4 py-3" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Daily Totals</p>
                    </td>
                    {days.map((day) => {
                      const total = dailyTotals[day.date] || { present: 0, total: 0 }
                      const pct = total.total ? (total.present / total.total) * 100 : 0
                      return (
                        <td key={day.date} className="border-t px-1 py-2 text-center" style={{ borderColor: 'var(--color-border)' }}>
                          <div className="text-[11px] font-semibold" style={{ color: pct < 80 && total.total ? '#f59e0b' : 'var(--color-text-primary)' }}>
                            {total.present}/{total.total}
                          </div>
                        </td>
                      )
                    })}
                    <td className="border-t px-3 py-3 text-center" style={{ borderColor: 'var(--color-border)' }}>
                      <Download size={14} className="mx-auto" style={{ color: 'var(--color-text-muted)' }} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SummaryCard
          title="Top 5 Most Absent"
          items={summary.mostAbsent.map((item) => `${item.name} - ${item.absent} absent`)}
        />
        <SummaryCard
          title="Below 75%"
          items={summary.belowThreshold.map((item) => `${item.name} - ${item.percentage.toFixed(0)}%`)}
          danger
        />
        <SummaryCard
          title="Perfect Attendance"
          items={summary.perfectAttendance.map((item) => item.name)}
          success
        />
      </section>

      <Modal
        open={!!editingCell}
        onClose={() => setEditingCell(null)}
        title="Change Attendance Status"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setEditingCell(null)}>Cancel</Button>
            <Button
              disabled={!overrideReason.trim() || savingOverride}
              loading={savingOverride}
              onClick={async () => {
                setSavingOverride(true)
                try {
                  await onOverride(editingCell.record.attendance_id, {
                    status: overrideStatus,
                    reason: overrideReason.trim(),
                  })
                  setEditingCell(null)
                } finally {
                  setSavingOverride(false)
                }
              }}
            >
              Save Change
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div
            className="rounded-2xl border px-4 py-3"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {editingCell?.student?.first_name} {editingCell?.student?.last_name}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {editingCell?.date}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {['present', 'absent', 'late', 'half_day'].map((status) => {
              const style = STATUS_STYLE[status]
              const selected = overrideStatus === status
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setOverrideStatus(status)}
                  className="min-h-11 rounded-2xl border text-sm font-semibold"
                  style={{
                    borderColor: selected ? style.color : 'var(--color-border)',
                    backgroundColor: selected ? style.color : style.bg,
                    color: selected ? '#fff' : style.color,
                  }}
                >
                  {style.label} {status.replace('_', ' ')}
                </button>
              )
            })}
          </div>

          <div>
            <label className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Reason
            </label>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              rows={3}
              placeholder="Reason is required and will be written to the audit trail."
              className="mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

const SummaryCard = ({ title, items, danger = false, success = false }) => (
  <div
    className="rounded-[28px] border p-5"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <div className="flex items-center gap-2">
      {danger ? <AlertTriangle size={16} style={{ color: '#ef4444' }} /> : null}
      <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
    </div>
    <div className="mt-4 space-y-2">
      {items.length ? items.map((item) => (
        <p
          key={item}
          className="rounded-2xl px-3 py-2 text-sm"
          style={{
            backgroundColor: success ? 'rgba(16, 185, 129, 0.10)' : 'var(--color-surface-raised)',
            color: 'var(--color-text-primary)',
          }}
        >
          {item}
        </p>
      )) : (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No students in this list.</p>
      )}
    </div>
  </div>
)

const computeStudentStats = (records = []) => {
  const present = records.filter((item) => item.status === 'present').length
  const absent = records.filter((item) => item.status === 'absent').length
  const late = records.filter((item) => item.status === 'late').length
  const halfDay = records.filter((item) => item.status === 'half_day').length
  const total = records.length
  const effectivePresent = present + late + halfDay * 0.5
  const percentage = total ? (effectivePresent / total) * 100 : 0
  return { present, absent, late, halfDay, total, percentage }
}

const buildSummary = (rows) => {
  const normalized = rows.map((row) => {
    const stats = computeStudentStats(row.records || [])
    return {
      name: `${row.first_name} ${row.last_name}`,
      absent: stats.absent,
      percentage: stats.percentage,
    }
  })

  return {
    mostAbsent: [...normalized].sort((a, b) => b.absent - a.absent).slice(0, 5),
    belowThreshold: normalized.filter((item) => item.percentage < 75).sort((a, b) => a.percentage - b.percentage),
    perfectAttendance: normalized.filter((item) => item.percentage === 100),
  }
}

const buildDailyTotals = (rows) => {
  const totals = {}
  rows.forEach((row) => {
    ;(row.records || []).forEach((record) => {
      if (!totals[record.date]) totals[record.date] = { present: 0, total: 0 }
      totals[record.date].total += 1
      if (record.status === 'present' || record.status === 'late') totals[record.date].present += 1
      if (record.status === 'half_day') totals[record.date].present += 0.5
    })
  })
  return totals
}

const GridSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[...Array(5)].map((_, index) => (
      <div key={index} className="flex gap-2">
        <div className="h-10 w-40 rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        {[...Array(12)].map((__, cellIndex) => (
          <div key={cellIndex} className="h-10 w-10 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        ))}
      </div>
    ))}
  </div>
)

const downloadCsv = (filename, rows) => {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default AttendanceGrid
