// src/pages/fees/FeeReportPage.jsx
import { useEffect, useState } from 'react'
import { FileText, FileSpreadsheet, TrendingUp, IndianRupee, AlertCircle, CheckCircle } from 'lucide-react'
import useFeeStore from '@/store/feeStore'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import StatCard from '@/components/ui/StatCard'
import ProgressBar from '@/components/ui/ProgressBar'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { formatCurrency } from '@/utils/helpers'
import { getClasses, getClassOptions } from '@/api/classApi'

const STATUS_CONFIG = {
  paid    : { label: 'Paid',    variant: 'green'  },
  partial : { label: 'Partial', variant: 'yellow' },
  pending : { label: 'Pending', variant: 'red'    },
}

const FeeReportPage = () => {
  const { toastError } = useToast()
  const { report, isLoading, fetchReport } = useFeeStore()
  const { sessions, currentSession, fetchSessions } = useSessionStore()

  const [sessionId, setSessionId] = useState('')
  const [classId,   setClassId]   = useState('')
  const [classes,   setClasses]   = useState([])

  useEffect(() => {
    fetchSessions().catch(() => {})
    getClasses()
      .then(r => setClasses(getClassOptions(r)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (currentSession && !sessionId) setSessionId(String(currentSession.id))
  }, [currentSession])

  useEffect(() => {
    if (!sessionId) return
    fetchReport({ session_id: sessionId, class_id: classId || undefined })
      .catch(() => toastError('Failed to load report'))
  }, [sessionId, classId])

  const summary   = report?.summary   || {}
  const students  = report?.students  || (Array.isArray(report) ? report : [])
  const collected = parseFloat(summary.total_collected || 0)
  const expected  = parseFloat(summary.total_expected  || 0)
  const pending   = parseFloat(summary.total_pending   || 0)
  const pct       = expected > 0 ? (collected / expected * 100) : 0

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div
        className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <Select
          label="Session"
          value={sessionId}
          onChange={e => setSessionId(e.target.value)}
          options={(sessions || []).map(s => ({ value: String(s.id), label: s.name }))}
          containerClassName="flex-1"
        />
        <Select
          label="Class (optional)"
          value={classId}
          onChange={e => setClassId(e.target.value)}
          options={classes}
          placeholder="All classes"
          containerClassName="flex-1"
        />
        <div className="flex items-end gap-2">
          <Button variant="secondary" size="sm" icon={FileText}>PDF</Button>
          <Button variant="secondary" size="sm" icon={FileSpreadsheet}>Excel</Button>
        </div>
      </div>

      {/* Summary cards */}
      {expected > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Expected"
              value={formatCurrency(expected)}
              icon={IndianRupee}
              color="var(--color-text-primary)"
            />
            <StatCard
              label="Collected"
              value={formatCurrency(collected)}
              icon={CheckCircle}
              color="#16a34a"
            />
            <StatCard
              label="Pending"
              value={formatCurrency(pending)}
              icon={AlertCircle}
              color="#dc2626"
            />
            <StatCard
              label="Students"
              value={students.length}
              icon={TrendingUp}
              color="var(--color-brand)"
              sub={`${summary.paid_count || 0} fully paid`}
            />
          </div>

          {/* Collection percentage bar */}
          <div
            className="p-5 rounded-2xl"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Collection Rate
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {formatCurrency(collected)} of {formatCurrency(expected)}
              </p>
            </div>
            <ProgressBar value={pct} size="lg" />
          </div>
        </>
      )}

      {/* Student-wise table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {isLoading ? (
          <TableSkeleton cols={6} rows={6} />
        ) : students.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No fee data"
            description="Select a session to view the collection report."
            className="border-0 rounded-none py-12"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Student', 'Class', 'Total Due', 'Paid', 'Balance', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--color-text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((row, i) => {
                  const balance   = parseFloat(row.balance || row.total_due - row.total_paid || 0)
                  const status    = balance <= 0 ? 'paid' : row.total_paid > 0 ? 'partial' : 'pending'
                  const statusCfg = STATUS_CONFIG[status] || { label: status, variant: 'grey' }

                  return (
                    <tr
                      key={i}
                      style={{ borderBottom: i < students.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {row.student_name || row.name}
                        </p>
                        <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                          {row.admission_no}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {row.class_name || row.class || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {formatCurrency(row.total_due || 0)}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium" style={{ color: '#16a34a' }}>
                        {formatCurrency(row.total_paid || 0)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: balance > 0 ? '#dc2626' : '#16a34a' }}
                        >
                          {formatCurrency(balance)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>

              {/* Total row */}
              {students.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                    <td colSpan={2} className="px-4 py-3.5 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      Total ({students.length} students)
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {formatCurrency(expected)}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold" style={{ color: '#16a34a' }}>
                      {formatCurrency(collected)}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold" style={{ color: '#dc2626' }}>
                      {formatCurrency(pending)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default FeeReportPage
