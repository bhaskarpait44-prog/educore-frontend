import { useEffect, useMemo, useState } from 'react'
import { BellRing, Download, PhoneCall, TriangleAlert } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useAttendance from '@/hooks/useAttendance'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

const AttendanceReports = () => {
  usePageTitle('Attendance Reports')

  const { toastError, toastInfo } = useToast()
  const { assignmentOptions, loadingAssignments, reportData, loadingReports, loadReports, loadRegister, registerData } = useAttendance()
  const [assignmentKey, setAssignmentKey] = useState('')
  const [fromDate, setFromDate] = useState(firstOfMonth())
  const [toDate, setToDate] = useState(today())
  const [threshold, setThreshold] = useState('75')

  useEffect(() => {
    if (!assignmentOptions.length || assignmentKey) return
    const first = assignmentOptions[0]
    setAssignmentKey(`${first.class_id}:${first.section_id}`)
  }, [assignmentOptions, assignmentKey])

  const selectedSection = useMemo(() => {
    const [classId, sectionId] = assignmentKey.split(':')
    return assignmentOptions.find((assignment) =>
      String(assignment.class_id) === String(classId) &&
      String(assignment.section_id) === String(sectionId)
    ) || null
  }, [assignmentKey, assignmentOptions])

  useEffect(() => {
    if (!selectedSection) return
    loadReports({
      summaryParams: {
        class_id: selectedSection.class_id,
        section_id: selectedSection.section_id,
        from: fromDate,
        to: toDate,
      },
      thresholdParams: {
        class_id: selectedSection.class_id,
        section_id: selectedSection.section_id,
        from: fromDate,
        to: toDate,
        threshold,
      },
      chronicParams: {
        class_id: selectedSection.class_id,
        section_id: selectedSection.section_id,
        from: fromDate,
        to: toDate,
      },
    }).catch((error) => {
      toastError(error?.message || 'Failed to load attendance reports.')
    })

    loadRegister({
      class_id: selectedSection.class_id,
      section_id: selectedSection.section_id,
      month: String(new Date(fromDate).getMonth() + 1),
      year: String(new Date(fromDate).getFullYear()),
    }).catch(() => {})
  }, [selectedSection, fromDate, toDate, threshold, loadReports, loadRegister, toastError])

  const dailySummary = useMemo(() => buildDailySummary(registerData?.students || []), [registerData])

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Attendance Reports
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Summary, daily class trends, below-threshold tracking, and chronic absentee alerts for your assigned sections only.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-4">
          <Select
            label="Assigned Section"
            value={assignmentKey}
            onChange={(e) => setAssignmentKey(e.target.value)}
            options={dedupeAssignments(assignmentOptions)}
            placeholder="Select section"
          />
          <DateField label="From Date" value={fromDate} onChange={setFromDate} />
          <DateField label="To Date" value={toDate} onChange={setToDate} />
          <Select
            label="Threshold"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            options={[
              { value: '75', label: '75%' },
              { value: '80', label: '80%' },
              { value: '85', label: '85%' },
            ]}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ReportCard
          title="Student Attendance Summary"
          subtitle="Per-student attendance percentage, counts, and status."
          onExport={() => exportSummaryCsv(reportData.summary)}
          loading={loadingAssignments || loadingReports}
        >
          <SummaryTable rows={reportData.summary} threshold={Number(threshold)} />
        </ReportCard>

        <ReportCard
          title="Daily Class Summary"
          subtitle="Day-wise class attendance percentage to help spot weak attendance patterns."
          onExport={() => exportDailyCsv(dailySummary)}
          loading={loadingAssignments || loadingReports}
        >
          <DailySummaryPanel rows={dailySummary} />
        </ReportCard>

        <ReportCard
          title="Below Threshold Report"
          subtitle="Students under the target attendance percentage, sorted from lowest first."
          onExport={() => exportBelowThresholdCsv(reportData.belowThreshold, Number(threshold))}
          loading={loadingAssignments || loadingReports}
        >
          <BelowThresholdTable rows={reportData.belowThreshold} threshold={Number(threshold)} />
        </ReportCard>

        <ReportCard
          title="Chronic Absentees"
          subtitle="Students absent for 3 or more consecutive days with parent contact details."
          onExport={() => exportChronicCsv(reportData.chronicAbsentees)}
          loading={loadingAssignments || loadingReports}
        >
          <ChronicAbsentees rows={reportData.chronicAbsentees} onAlert={() => toastInfo('Parent alert integration comes in the student communication steps.')} />
        </ReportCard>
      </section>
    </div>
  )
}

const ReportCard = ({ title, subtitle, onExport, loading, children }) => (
  <section
    className="rounded-[28px] border p-5 sm:p-6"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{subtitle}</p>
      </div>
      <Button variant="secondary" icon={Download} onClick={onExport}>Export</Button>
    </div>
    <div className="mt-5">
      {loading ? <PanelSkeleton /> : children}
    </div>
  </section>
)

const SummaryTable = ({ rows, threshold }) => {
  if (!rows.length) return <EmptyPanel text="No attendance records found for this range." />

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            {['Roll', 'Name', 'Days', 'Present', 'Absent', 'Late', '%', 'Status'].map((head) => (
              <th key={head} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const pct = Number(row.percentage || 0)
            return (
              <tr key={row.enrollment_id} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{row.roll_number || '--'}</td>
                <td className="px-3 py-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.first_name} {row.last_name}</td>
                <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{row.total_days || 0}</td>
                <td className="px-3 py-3 text-sm" style={{ color: '#10b981' }}>{row.present || 0}</td>
                <td className="px-3 py-3 text-sm" style={{ color: '#ef4444' }}>{row.absent || 0}</td>
                <td className="px-3 py-3 text-sm" style={{ color: '#f59e0b' }}>{row.late || 0}</td>
                <td className="px-3 py-3 text-sm font-semibold" style={{ color: pct < threshold ? '#ef4444' : '#10b981' }}>{pct.toFixed(0)}%</td>
                <td className="px-3 py-3 text-sm" style={{ color: pct < threshold ? '#ef4444' : 'var(--color-text-secondary)' }}>
                  {pct >= threshold ? 'Good' : pct >= threshold - 10 ? 'Warning' : 'Critical'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const DailySummaryPanel = ({ rows }) => {
  if (!rows.length) return <EmptyPanel text="No daily summary available for the selected month." />

  const max = Math.max(...rows.map((row) => row.percentage), 1)

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.date}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span style={{ color: 'var(--color-text-primary)' }}>{row.date}</span>
            <span style={{ color: row.percentage < 80 ? '#f59e0b' : '#10b981' }}>{row.present}/{row.total} | {row.percentage.toFixed(0)}%</span>
          </div>
          <div className="h-3 rounded-full" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${(row.percentage / max) * 100}%`,
                backgroundColor: row.percentage < 80 ? '#f59e0b' : '#10b981',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

const BelowThresholdTable = ({ rows, threshold }) => {
  if (!rows.length) return <EmptyPanel text={`No students are below ${threshold}% in this date range.`} />

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const percentage = Number(row.percentage || 0)
        const totalDays = Number(row.total_days || 0)
        const effectivePresentDays = percentage * totalDays / 100
        const daysShort = percentage >= threshold ? 0 : Math.ceil((threshold * totalDays / 100) - effectivePresentDays)

        return (
          <div
            key={row.enrollment_id}
            className="rounded-3xl border p-4"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {row.first_name} {row.last_name}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Roll {row.roll_number || '--'} | {percentage.toFixed(0)}% attendance
            </p>
            <p className="mt-2 text-xs" style={{ color: '#ef4444' }}>
              Days short to reach {threshold}%: {Math.max(0, daysShort)}
            </p>
          </div>
        )
      })}
    </div>
  )
}

const ChronicAbsentees = ({ rows, onAlert }) => {
  if (!rows.length) return <EmptyPanel text="No chronic absentees found in this date range." />

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div
          key={row.enrollment_id}
          className="rounded-3xl border p-4"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {row.first_name} {row.last_name}
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {row.consecutive_absent_days} consecutive days absent
              </p>
              <p className="mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Dates: {Array.isArray(row.dates) ? row.dates.join(', ') : '--'}
              </p>
              <p className="mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Parent contact: {row.father_phone || row.mother_phone || 'Not available'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => row.father_phone && window.open(`tel:${row.father_phone}`, '_self')}
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.14)', color: '#10b981' }}
                title="Call parent"
              >
                <PhoneCall size={16} />
              </button>
              <button
                type="button"
                onClick={onAlert}
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.14)', color: '#f59e0b' }}
                title="Send alert"
              >
                <BellRing size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const DateField = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</label>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-11 rounded-xl px-4 text-sm outline-none"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        color: 'var(--color-text-primary)',
      }}
    />
  </div>
)

const EmptyPanel = ({ text }) => (
  <div className="rounded-3xl border border-dashed p-8 text-center" style={{ borderColor: 'var(--color-border)' }}>
    <TriangleAlert size={18} className="mx-auto" style={{ color: 'var(--color-text-muted)' }} />
    <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{text}</p>
  </div>
)

const PanelSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[...Array(5)].map((_, index) => (
      <div key={index} className="h-14 rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    ))}
  </div>
)

const dedupeAssignments = (assignments) => {
  const map = new Map()
  assignments.forEach((assignment) => {
    const key = `${assignment.class_id}:${assignment.section_id}`
    if (!map.has(key)) {
      map.set(key, {
        value: key,
        label: `${assignment.class_name} ${assignment.section_name}`,
      })
    }
  })
  return [...map.values()]
}

const buildDailySummary = (students) => {
  const map = new Map()
  students.forEach((student) => {
    ;(student.records || []).forEach((record) => {
      if (!map.has(record.date)) map.set(record.date, { date: record.date, present: 0, total: 0 })
      const current = map.get(record.date)
      current.total += 1
      if (record.status === 'present' || record.status === 'late') current.present += 1
      if (record.status === 'half_day') current.present += 0.5
    })
  })

  return [...map.values()]
    .map((row) => ({ ...row, percentage: row.total ? (row.present / row.total) * 100 : 0 }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

const firstOfMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

const today = () => new Date().toISOString().slice(0, 10)

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

const exportSummaryCsv = (rows) => {
  downloadCsv('attendance-summary.csv', [
    ['Roll', 'Name', 'Total Days', 'Present', 'Absent', 'Late', 'Half Day', 'Percentage'],
    ...rows.map((row) => [
      row.roll_number || '',
      `${row.first_name} ${row.last_name}`,
      row.total_days || 0,
      row.present || 0,
      row.absent || 0,
      row.late || 0,
      row.half_day || 0,
      Number(row.percentage || 0).toFixed(2),
    ]),
  ])
}

const exportBelowThresholdCsv = (rows, threshold) => {
  downloadCsv(`attendance-below-${threshold}.csv`, [
    ['Roll', 'Name', 'Percentage', 'Total Days'],
    ...rows.map((row) => [
      row.roll_number || '',
      `${row.first_name} ${row.last_name}`,
      Number(row.percentage || 0).toFixed(2),
      row.total_days || 0,
    ]),
  ])
}

const exportChronicCsv = (rows) => {
  downloadCsv('attendance-chronic-absentees.csv', [
    ['Roll', 'Name', 'Consecutive Days', 'Dates', 'Father Phone', 'Mother Phone'],
    ...rows.map((row) => [
      row.roll_number || '',
      `${row.first_name} ${row.last_name}`,
      row.consecutive_absent_days || 0,
      Array.isArray(row.dates) ? row.dates.join(' | ') : '',
      row.father_phone || '',
      row.mother_phone || '',
    ]),
  ])
}

const exportDailyCsv = (rows) => {
  downloadCsv('attendance-daily-summary.csv', [
    ['Date', 'Present Equivalent', 'Total', 'Percentage'],
    ...rows.map((row) => [row.date, row.present, row.total, row.percentage.toFixed(2)]),
  ])
}

export default AttendanceReports
