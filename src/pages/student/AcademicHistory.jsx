import { useEffect, useState } from 'react'
import { Download, GraduationCap, RefreshCw, TrendingUp } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import PerformanceTrend from '@/components/student/PerformanceTrend'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import * as studentApi from '@/api/studentApi'
import { formatDate, formatPercent } from '@/utils/helpers'

const AcademicHistory = () => {
  usePageTitle('Academic History')

  const { toastError, toastInfo, toastSuccess } = useToast()
  const [history, setHistory] = useState([])
  const [timeline, setTimeline] = useState([])
  const [trend, setTrend] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)

  const load = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await studentApi.getStudentAcademicHistory()
      setHistory(res?.data?.history || [])
      setTimeline(res?.data?.timeline || [])
      setTrend(res?.data?.performance_trend || [])
      setLoading(false)
      setRefreshing(false)
    } catch (err) {
      setLoading(false)
      setRefreshing(false)
      toastError(err?.message || 'Unable to load academic history.')
    }
  }

  useEffect(() => {
    load().catch(() => {})
  }, [])

  const handleRefresh = async () => {
    toastInfo('Refreshing academic history')
    await load({ silent: true })
  }

  const handleExport = () => {
    const popup = window.open('', '_blank', 'noopener,noreferrer')
    if (!popup) {
      toastError('Unable to open print window.')
      return
    }

    const rows = history.map((row) => `
      <tr>
        <td>${row.session_name || '--'}</td>
        <td>${row.class_name || '--'} ${row.section_name || ''}</td>
        <td>${row.roll_number || '--'}</td>
        <td>${String(row.result || '--').toUpperCase()}</td>
        <td>${formatPercent(row.attendance_percentage || 0, 0)}</td>
        <td>${String(row.enrollment_status || '--').toUpperCase()}</td>
      </tr>
    `).join('')

    popup.document.write(`
      <html>
        <head>
          <title>Academic History</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 24px; }
            h1 { margin: 0 0 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 12px; }
            th { background: #f8fafc; text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px; }
          </style>
        </head>
        <body>
          <h1>Academic History</h1>
          <p>Full academic history across all sessions.</p>
          <table>
            <thead>
              <tr>
                <th>Session</th>
                <th>Class</th>
                <th>Roll No</th>
                <th>Result</th>
                <th>Attendance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `)
    popup.document.close()
    popup.focus()
    popup.print()
    toastSuccess('Academic history opened for print/PDF.')
  }

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(109,40,217,0.16), rgba(37,99,235,0.05) 52%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--student-accent)' }}>
              Academic History
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Full Academic Journey</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
              Review every session, track your progression class by class, and see how your long-term performance has moved over time.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleRefresh} loading={refreshing} icon={RefreshCw}>
              Refresh
            </Button>
            <Button onClick={handleExport} icon={Download}>
              Download History
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="space-y-5 animate-pulse">
          <div className="rounded-[28px] bg-[var(--color-surface)] p-20" />
          <div className="rounded-[28px] bg-[var(--color-surface)] p-24" />
        </div>
      ) : history.length ? (
        <>
          <section
            className="overflow-hidden rounded-[28px] border"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div className="border-b px-5 py-4" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Session History Table</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead style={{ backgroundColor: 'var(--color-surface-raised)' }}>
                  <tr>
                    {['Session', 'Class', 'Section', 'Roll No', 'Result', 'Attendance', 'Status'].map((head) => (
                      <th key={head} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => {
                    const expanded = expandedRow === row.enrollment_id
                    return (
                      <>
                        <tr
                          key={row.enrollment_id}
                          className="cursor-pointer border-t"
                          style={{ borderColor: 'var(--color-border)' }}
                          onClick={() => setExpandedRow(expanded ? null : row.enrollment_id)}
                        >
                          <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{row.session_name}</td>
                          <td className="px-4 py-3 text-[var(--color-text-secondary)]">{row.class_name}</td>
                          <td className="px-4 py-3 text-[var(--color-text-secondary)]">{row.section_name}</td>
                          <td className="px-4 py-3 text-[var(--color-text-secondary)]">{row.roll_number || '--'}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={resultStyle(row.result)}>
                              {String(row.result || '--').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">{formatPercent(row.attendance_percentage || 0, 0)}</td>
                          <td className="px-4 py-3 text-[var(--color-text-secondary)]">{String(row.enrollment_status || '--').toUpperCase()}</td>
                        </tr>
                        {expanded && (
                          <tr className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                            <td colSpan={7} className="px-4 py-4">
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <DetailCell label="Joined Date" value={formatDate(row.joined_date, 'long')} />
                                <DetailCell label="Left Date" value={row.left_date ? formatDate(row.left_date, 'long') : 'Active / Not recorded'} />
                                <DetailCell label="Percentage" value={formatPercent(row.percentage || 0, 0)} />
                                <DetailCell label="Promotion" value={row.is_promoted ? 'Promoted' : 'Not marked'} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <section
              className="rounded-[28px] border p-5"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(124,58,237,0.10)] text-[var(--student-accent)]">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Visual Timeline</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Your class-by-class progression across sessions.</p>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                {timeline.map((item, index) => (
                  <div key={`${item.session_name}-${index}`} className="relative flex gap-4">
                    <div className="flex w-10 flex-col items-center">
                      <div className="h-10 w-10 rounded-full border-2 bg-[var(--color-surface)]" style={{ borderColor: resultStyle(item.result).color }} />
                      {index < timeline.length - 1 && <div className="mt-2 h-full w-0.5" style={{ backgroundColor: 'var(--color-border)' }} />}
                    </div>
                    <div className="flex-1 rounded-[22px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{item.session_name}</p>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{item.class_name} {item.section_name}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={resultStyle(item.result)}>
                          {String(item.result || '--').toUpperCase()}
                        </span>
                        <span className="rounded-full bg-[rgba(37,99,235,0.10)] px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {formatPercent(item.attendance_percentage || 0, 0)} attendance
                        </span>
                        <span className="rounded-full bg-[rgba(22,163,74,0.10)] px-2.5 py-1 text-xs font-semibold text-green-700">
                          {item.promoted ? 'Promoted' : 'In record'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section
              className="rounded-[28px] border p-5"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(37,99,235,0.10)] text-blue-700">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Performance Trend</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Session-wise percentage trend across your academic record.</p>
                </div>
              </div>
              <div className="mt-5">
                <PerformanceTrend data={trend} />
              </div>
            </section>
          </div>
        </>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="No academic history found"
          description="Once session records are available, your academic journey will appear here."
        />
      )}
    </div>
  )
}

const DetailCell = ({ label, value }) => (
  <div className="rounded-[20px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-2 text-sm text-[var(--color-text-primary)]">{value || '--'}</p>
  </div>
)

function resultStyle(result) {
  if (result === 'pass') return { backgroundColor: '#dcfce7', color: '#15803d' }
  if (result === 'compartment') return { backgroundColor: '#fef3c7', color: '#b45309' }
  if (result === 'fail') return { backgroundColor: '#fee2e2', color: '#dc2626' }
  return { backgroundColor: '#e5e7eb', color: '#4b5563' }
}

export default AcademicHistory
