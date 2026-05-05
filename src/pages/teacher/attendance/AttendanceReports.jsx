import { useEffect, useMemo, useState } from 'react'
import { BellRing, Download, PhoneCall, TriangleAlert, TrendingUp, Users, AlertCircle, Activity } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useAttendance from '@/hooks/useAttendance'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

// ─────────────────────────────────────────────────────────────────────────────
//  All colours use the same CSS variables your original file used:
//    var(--color-border)         var(--color-surface)
//    var(--color-surface-raised) var(--color-text-primary)
//    var(--color-text-secondary) var(--color-text-muted)
//  Your app's existing dark/light theme switching handles everything.
//  No theme tokens, no toggle button added here.
// ─────────────────────────────────────────────────────────────────────────────

const STYLES = `
  .ar * { box-sizing: border-box; }
  .ar ::-webkit-scrollbar { width: 4px; height: 4px; }
  .ar ::-webkit-scrollbar-track { background: transparent; }
  .ar ::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }
  .ar input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.5; }

  @keyframes ar-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* stat card */
  .ar-stat {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.18s;
  }
  .ar-stat:hover { border-color: var(--color-text-muted); }

  /* filter bar */
  .ar-filters {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    padding: 18px 22px;
    margin-bottom: 20px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
    gap: 16px;
    align-items: end;
  }

  /* report card */
  .ar-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 24px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .ar-card-head {
    padding: 22px 24px 18px;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .ar-card-body { padding: 20px 24px; flex: 1; }

  /* field label */
  .ar-label {
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    display: block;
    margin-bottom: 6px;
  }

  /* native select & date */
  .ar-select, .ar-date {
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    border-radius: 12px;
    padding: 10px 32px 10px 14px;
    font-size: 13px;
    color: var(--color-text-primary);
    outline: none;
    cursor: pointer;
    font-family: inherit;
    width: 100%;
    transition: border-color 0.15s;
    min-height: 44px;
  }
  .ar-select {
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888899' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-color: var(--color-surface);
  }
  .ar-select:focus, .ar-date:focus { border-color: #7b6ef6; }

  /* export button */
  .ar-export {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 10px;
    border: 1.5px solid var(--color-border);
    background: var(--color-surface-raised);
    color: var(--color-text-secondary);
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
    font-family: inherit;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .ar-export:hover {
    border-color: #7b6ef6;
    background: rgba(123,110,246,0.08);
    color: #7b6ef6;
  }

  /* icon action button */
  .ar-icon-btn {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s; flex-shrink: 0;
    border: none;
  }

  /* skeleton */
  .ar-skel {
    height: 44px; border-radius: 12px;
    background: linear-gradient(90deg, var(--color-surface-raised) 25%, var(--color-surface) 50%, var(--color-surface-raised) 75%);
    background-size: 200% 100%;
    animation: ar-shimmer 1.4s infinite;
  }

  /* summary table */
  .ar-table { width: 100%; border-collapse: collapse; }
  .ar-table th {
    padding: 8px 12px;
    text-align: left;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    font-weight: 600;
    white-space: nowrap;
  }
  .ar-table td { padding: 11px 12px; }
  .ar-table tbody tr { border-top: 1px solid var(--color-border); }
  .ar-table tbody tr:first-child { border-top: none; }

  /* below-threshold card */
  .ar-thr-card {
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 14px 16px;
    position: relative;
    overflow: hidden;
  }

  /* chronic card */
  .ar-chr-card {
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 14px 16px;
  }

  /* empty state */
  .ar-empty {
    border: 1px dashed var(--color-border);
    border-radius: 14px;
    padding: 32px 24px;
    text-align: center;
  }

  /* progress tracks */
  .ar-bar-track {
    height: 3px; border-radius: 2px;
    background: var(--color-surface-raised);
    width: 56px; margin-top: 5px;
  }
  .ar-daily-track {
    height: 6px; border-radius: 3px;
    background: var(--color-surface-raised);
    overflow: hidden;
  }

  /* badges */
  .ar-badge {
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.06em;
    padding: 3px 9px; border-radius: 6px;
  }
  .ar-absent-tag {
    font-size: 10px; padding: 2px 8px; border-radius: 5px;
    background: rgba(239,68,68,0.12); color: #ef4444;
    letter-spacing: 0.08em; font-weight: 600;
  }
`

// ─────────────────────────────────────────────────────────────────────────────
//  STRUCTURAL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, color, icon: Icon }) => (
  <div className="ar-stat">
    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color, opacity: 0.08, filter: 'blur(20px)', pointerEvents: 'none' }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{label}</span>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: `${color}1c`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={14} style={{ color }} />
      </div>
    </div>
    <span style={{ fontSize: 30, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</span>
    {sub && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{sub}</span>}
  </div>
)

const ReportCard = ({ title, subtitle, onExport, accent = '#7b6ef6', children }) => (
  <div className="ar-card">
    <div className="ar-card-head">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: accent, flexShrink: 0 }} />
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>{title}</h2>
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0, paddingLeft: 13 }}>{subtitle}</p>
      </div>
      <button className="ar-export" onClick={onExport}>
        <Download size={12} /> Export
      </button>
    </div>
    <div className="ar-card-body">{children}</div>
  </div>
)

const FieldSelect = ({ label, value, onChange, options, placeholder }) => (
  <div>
    <label className="ar-label">{label}</label>
    <select className="ar-select" value={value} onChange={onChange}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
)

const DateField = ({ label, value, onChange }) => (
  <div>
    <label className="ar-label">{label}</label>
    <input type="date" className="ar-date" value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
)

const PanelSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {[...Array(5)].map((_, i) => <div key={i} className="ar-skel" />)}
  </div>
)

const EmptyPanel = ({ text }) => (
  <div className="ar-empty">
    <TriangleAlert size={18} style={{ color: 'var(--color-text-muted)', display: 'block', margin: '0 auto 10px' }} />
    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>{text}</p>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
//  REPORT PANELS — logic identical to original
// ─────────────────────────────────────────────────────────────────────────────

const SummaryTable = ({ rows, threshold }) => {
  if (!rows.length) return <EmptyPanel text="No attendance records found for this range." />
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="ar-table">
        <thead>
          <tr>
            {['Roll', 'Name', 'Days', 'Present', 'Absent', 'Late', '%', 'Status'].map((head) => (
              <th key={head}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const pct = Number(row.percentage || 0)
            const sColor = pct >= threshold ? '#10b981' : pct >= threshold - 10 ? '#f59e0b' : '#ef4444'
            const sBg    = pct >= threshold ? 'rgba(16,185,129,0.12)' : pct >= threshold - 10 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)'
            const sLabel = pct >= threshold ? 'Good' : pct >= threshold - 10 ? 'Warning' : 'Critical'
            return (
              <tr key={row.enrollment_id}>
                <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{row.roll_number || '--'}</td>
                <td style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>{row.first_name} {row.last_name}</td>
                <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{row.total_days || 0}</td>
                <td style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>{row.present || 0}</td>
                <td style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{row.absent || 0}</td>
                <td style={{ fontSize: 12, color: '#f59e0b' }}>{row.late || 0}</td>
                <td>
                  <span style={{ fontSize: 13, fontWeight: 700, color: sColor }}>{pct.toFixed(0)}%</span>
                  <div className="ar-bar-track">
                    <div style={{ height: '100%', borderRadius: 2, width: `${Math.min(pct, 100)}%`, background: sColor, transition: 'width 0.6s ease' }} />
                  </div>
                </td>
                <td>
                  <span className="ar-badge" style={{ background: sBg, color: sColor }}>{sLabel}</span>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((row) => {
        const color = row.percentage >= 90 ? '#10b981' : row.percentage >= 75 ? '#7b6ef6' : row.percentage >= 60 ? '#f59e0b' : '#ef4444'
        return (
          <div key={row.date}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{row.date}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color }}>
                {row.present}/{row.total}
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}> · </span>
                {row.percentage.toFixed(0)}%
              </span>
            </div>
            <div className="ar-daily-track">
              <div style={{ height: '100%', borderRadius: 3, width: `${(row.percentage / max) * 100}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, transition: 'width 0.7s cubic-bezier(.4,0,.2,1)' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

const BelowThresholdTable = ({ rows, threshold }) => {
  if (!rows.length) return <EmptyPanel text={`No students are below ${threshold}% in this date range.`} />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((row) => {
        const percentage = Number(row.percentage || 0)
        const totalDays = Number(row.total_days || 0)
        const effectivePresentDays = percentage * totalDays / 100
        const daysShort = percentage >= threshold ? 0 : Math.ceil((threshold * totalDays / 100) - effectivePresentDays)
        return (
          <div key={row.enrollment_id} className="ar-thr-card">
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${percentage}%`, background: 'linear-gradient(90deg, rgba(239,68,68,0.06), transparent)', borderRadius: 16, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{row.first_name} {row.last_name}</p>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--color-text-secondary)' }}>Roll {row.roll_number || '--'} · {totalDays} school days</p>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#ef4444' }}>
                  Days short to reach {threshold}%: {Math.max(0, daysShort)}
                </p>
              </div>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>
                {percentage.toFixed(0)}%
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const ChronicAbsentees = ({ rows, onAlert }) => {
  if (!rows.length) return <EmptyPanel text="No chronic absentees found in this date range." />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((row) => (
        <div key={row.enrollment_id} className="ar-chr-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{row.first_name} {row.last_name}</p>
                <span className="ar-absent-tag">{row.consecutive_absent_days} consecutive days absent</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-secondary)', wordBreak: 'break-all' }}>
                Dates: {Array.isArray(row.dates) ? row.dates.join(', ') : '--'}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                Parent contact: {row.father_phone || row.mother_phone || 'Not available'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, marginLeft: 12, flexShrink: 0 }}>
              <button
                type="button"
                className="ar-icon-btn"
                onClick={() => row.father_phone && window.open(`tel:${row.father_phone}`, '_self')}
                style={{ background: 'rgba(16,185,129,0.14)', color: '#10b981' }}
                title="Call parent"
              >
                <PhoneCall size={16} />
              </button>
              <button
                type="button"
                className="ar-icon-btn"
                onClick={onAlert}
                style={{ background: 'rgba(245,158,11,0.14)', color: '#f59e0b' }}
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

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS — identical to original
// ─────────────────────────────────────────────────────────────────────────────

const firstOfMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}
const today = () => new Date().toISOString().slice(0, 10)

const dedupeAssignments = (assignments) => {
  const grouped = {}
  assignments.forEach((a) => {
    const key = `${a.class_id}:${a.section_id}`
    if (!grouped[key]) {
      grouped[key] = {
        class_name: a.class_name,
        section_name: a.section_name,
        subjects: [],
        is_class_teacher: false,
      }
    }
    if (a.is_class_teacher) grouped[key].is_class_teacher = true
    if (a.subject_name && !grouped[key].subjects.includes(a.subject_name)) {
      grouped[key].subjects.push(a.subject_name)
    }
  })

  return Object.entries(grouped).map(([key, info]) => {
    let label = `${info.class_name} ${info.section_name}`
    const details = []
    if (info.is_class_teacher) details.push('Class Teacher')
    if (info.subjects.length > 0) details.push(...info.subjects)

    if (details.length > 0) {
      label += ` | ${details.join(', ')}`
    }

    return { value: key, label }
  })
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

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PAGE — logic identical to original
// ─────────────────────────────────────────────────────────────────────────────

const AttendanceReports = () => {
  usePageTitle('Attendance Reports')

  const { toastError, toastInfo } = useToast()
  const { assignmentOptions, loadingAssignments, reportData, loadingReports, loadReports, loadRegister, registerData } = useAttendance()

  const [assignmentKey, setAssignmentKey] = useState('')
  const [fromDate,      setFromDate]      = useState(firstOfMonth())
  const [toDate,        setToDate]        = useState(today())
  const [threshold,     setThreshold]     = useState('75')

  const reportAssignments = useMemo(
    () => dedupeAssignments(assignmentOptions),
    [assignmentOptions]
  )

  useEffect(() => {
    if (loadingAssignments || !reportAssignments.length) return

    const exists = reportAssignments.some((o) => o.value === assignmentKey)
    if (!assignmentKey || !exists) {
      setAssignmentKey(reportAssignments[0].value)
    }
  }, [loadingAssignments, reportAssignments, assignmentKey])

  const selectedSection = useMemo(() => {
    if (!assignmentKey) return null
    const [classId, sectionId] = assignmentKey.split(':')
    return assignmentOptions.find((assignment) =>
      String(assignment.class_id) === String(classId) &&
      String(assignment.section_id) === String(sectionId)
    ) || null
  }, [assignmentKey, assignmentOptions])

  useEffect(() => {
    if (!selectedSection || !fromDate || !toDate) return

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

  // derived counts for stat strip
  const avgAtt = reportData.summary.length
    ? (reportData.summary.reduce((a, r) => a + Number(r.percentage), 0) / reportData.summary.length).toFixed(1)
    : '—'

  return (
    <div className="ar" style={{ fontFamily: 'inherit' }}>
      <style>{STYLES}</style>

      {/* ── PAGE HEADER — identical text to original ── */}
      <section
        className="ar-filters"
        style={{ marginBottom: 20, borderRadius: 28 }}
      >
        <div style={{ gridColumn: '1 / -1', marginBottom: 4 }}>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)', margin: 0 }}>
            Attendance Reports
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
            Summary, daily class trends, below-threshold tracking, and chronic absentee alerts for your assigned sections only.
          </p>
        </div>

        {/* filters — same fields, same logic as original */}
        <FieldSelect
          label="Assigned Section"
          value={assignmentKey}
          onChange={(e) => setAssignmentKey(e.target.value)}
          options={reportAssignments}
          placeholder={loadingAssignments ? 'Loading…' : 'Select section'}
        />
        <DateField label="From Date" value={fromDate} onChange={setFromDate} />
        <DateField label="To Date"   value={toDate}   onChange={setToDate}   />
        <FieldSelect
          label="Threshold"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          options={[
            { value: '75', label: '75%' },
            { value: '80', label: '80%' },
            { value: '85', label: '85%' },
          ]}
        />
      </section>

      {/* ── STAT STRIP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Students"    value={reportData.summary.length}          sub="in selected section"          color="#7b6ef6" icon={Users}      />
        <StatCard label="Avg Attendance"    value={`${avgAtt}%`}                       sub="across date range"            color="#10b981" icon={TrendingUp}  />
        <StatCard label="Below Threshold"   value={reportData.belowThreshold.length}   sub={`under ${threshold}% target`} color="#ef4444" icon={AlertCircle} />
        <StatCard label="Chronic Absentees" value={reportData.chronicAbsentees.length} sub="3+ consecutive days"          color="#f59e0b" icon={Activity}    />
      </div>

      {/* ── REPORT GRID — same 4 cards as original ── */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        <ReportCard
          title="Student Attendance Summary"
          subtitle="Per-student attendance percentage, counts, and status."
          accent="#7b6ef6"
          onExport={() => exportSummaryCsv(reportData.summary)}
        >
          {loadingAssignments || loadingReports
            ? <PanelSkeleton />
            : <SummaryTable rows={reportData.summary} threshold={Number(threshold)} />}
        </ReportCard>

        <ReportCard
          title="Daily Class Summary"
          subtitle="Day-wise class attendance percentage to help spot weak attendance patterns."
          accent="#10b981"
          onExport={() => exportDailyCsv(dailySummary)}
        >
          {loadingAssignments || loadingReports
            ? <PanelSkeleton />
            : <DailySummaryPanel rows={dailySummary} />}
        </ReportCard>

        <ReportCard
          title="Below Threshold Report"
          subtitle="Students under the target attendance percentage, sorted from lowest first."
          accent="#ef4444"
          onExport={() => exportBelowThresholdCsv(reportData.belowThreshold, Number(threshold))}
        >
          {loadingAssignments || loadingReports
            ? <PanelSkeleton />
            : <BelowThresholdTable rows={reportData.belowThreshold} threshold={Number(threshold)} />}
        </ReportCard>

        <ReportCard
          title="Chronic Absentees"
          subtitle="Students absent for 3 or more consecutive days with parent contact details."
          accent="#f59e0b"
          onExport={() => exportChronicCsv(reportData.chronicAbsentees)}
        >
          {loadingAssignments || loadingReports
            ? <PanelSkeleton />
            : (
              <ChronicAbsentees
                rows={reportData.chronicAbsentees}
                onAlert={() => toastInfo('Parent alert integration comes in the student communication steps.')}
              />
            )}
        </ReportCard>

      </section>
    </div>
  )
}

export default AttendanceReports