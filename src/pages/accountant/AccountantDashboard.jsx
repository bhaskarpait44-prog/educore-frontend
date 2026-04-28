import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Files, IndianRupee, Receipt, RefreshCw, ShieldCheck, UserRound, WalletCards } from 'lucide-react'
import * as feeApi from '@/api/fees'
import { getClasses, getClassOptions } from '@/api/classApi'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Select from '@/components/ui/Select'
import StatCard from '@/components/ui/StatCard'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { ROUTES } from '@/constants/app'
import { formatCurrency, formatDate } from '@/utils/helpers'
import AccountantPageShell, { QuickLink, Surface } from './AccountantPageShell'

const AccountantDashboard = () => {
  const navigate = useNavigate()
  const { toastError, toastSuccess } = useToast()
  const { sessions, currentSession, fetchSessions } = useSessionStore()
  const [classes, setClasses] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [dashboard, setDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    fetchSessions().catch(() => {})
    getClasses().then((res) => setClasses(getClassOptions(res))).catch(() => setClasses([]))
  }, [fetchSessions])

  useEffect(() => {
    if (currentSession?.id && !sessionId) setSessionId(String(currentSession.id))
  }, [currentSession, sessionId])

  const loadDashboard = async (nextSessionId = sessionId) => {
    if (!nextSessionId) return
    setIsLoading(true)
    try {
      const res = await feeApi.getFeeDashboard({ session_id: nextSessionId })
      setDashboard(res.data)
    } catch (error) {
      toastError(error.message || 'Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [sessionId])

  const handleGenerate = async () => {
    if (!sessionId) return
    setIsGenerating(true)
    try {
      const res = await feeApi.generateInvoices({ session_id: Number(sessionId) })
      toastSuccess(res.message || 'Invoices generated')
      loadDashboard(sessionId)
    } catch (error) {
      toastError(error.message || 'Failed to generate invoices')
    } finally {
      setIsGenerating(false)
    }
  }

  const summary = dashboard?.summary || {}
  const quickLinks = useMemo(() => ([
    { to: ROUTES.FEE_COLLECTION, label: 'Fee Collection', helper: 'Search students and record live payments.' },
    { to: ROUTES.FEE_STUDENT_LEDGER, label: 'Student Fee Ledger', helper: 'Review one student across all invoices.' },
    { to: ROUTES.FEE_STRUCTURES, label: 'Fee Structure', helper: 'Maintain class-wise billing components.' },
    { to: ROUTES.FEE_INVOICES, label: 'Invoices', helper: 'Audit generated bills and balances.' },
    { to: ROUTES.FEE_RECEIPTS, label: 'Receipts', helper: 'Track every recorded payment.' },
    { to: ROUTES.FEE_DEFAULTERS, label: 'Defaulters', helper: 'Follow up with overdue students quickly.' },
    { to: ROUTES.STUDENTS, label: 'Students', helper: 'Open full student profiles and fee tabs.' },
    { to: ROUTES.ACCOUNTANT_PROFILE, label: 'My Profile', helper: 'Review signed-in account details.' },
  ]), [])

  return (
    <AccountantPageShell
      title="Fee Operations Dashboard"
      description="A working view for the accountant desk across invoices, collections, receipts, structures, and outstanding balances."
      action={(
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={() => loadDashboard()} loading={isLoading}>
            Refresh
          </Button>
          <Button icon={ShieldCheck} onClick={handleGenerate} loading={isGenerating}>
            Generate Invoices
          </Button>
        </div>
      )}
    >
      <Surface className="p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Session"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            options={(sessions || []).map((item) => ({ value: String(item.id), label: item.name }))}
          />
          <div className="rounded-xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Classes Available</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: '#92400e' }}>{classes.length}</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>Configured classes ready for fee structures and student billing.</p>
          </div>
        </div>
      </Surface>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Expected" value={formatCurrency(summary.total_expected || 0)} icon={IndianRupee} color="#92400e" />
        <StatCard label="Collected" value={formatCurrency(summary.total_collected || 0)} icon={Receipt} color="#15803d" sub={`${summary.collection_rate || 0}% rate`} />
        <StatCard label="Outstanding" value={formatCurrency(summary.total_balance || 0)} icon={AlertTriangle} color="#dc2626" sub={`${summary.overdue_invoices || 0} overdue invoices`} />
        <StatCard label="Open Invoices" value={Number(summary.pending_invoices || 0) + Number(summary.partial_invoices || 0)} icon={Files} color="var(--color-brand)" sub={`${summary.total_invoices || 0} total generated`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Surface className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Quick Navigation</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Everything the accountant sidebar exposes, available from one landing page.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickLinks.map((item) => <QuickLink key={item.to} {...item} />)}
          </div>
        </Surface>

        <Surface className="p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Recent Receipts</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Latest fee entries recorded at the counter.</p>
          </div>
          {isLoading ? (
            <TableSkeleton cols={4} rows={5} />
          ) : (dashboard?.recent_payments || []).length === 0 ? (
            <EmptyState icon={Receipt} title="No receipts yet" description="Payments will appear here as soon as they are recorded." className="border-0 px-0 py-12" />
          ) : (
            <div className="space-y-3">
              {dashboard.recent_payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between gap-3 rounded-2xl border p-3" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {payment.student_name} <span style={{ color: 'var(--color-text-muted)' }}>• {payment.fee_name}</span>
                    </p>
                    <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {payment.admission_no} • {payment.class_name || 'Class not set'} • {formatDate(payment.payment_date)} • {String(payment.payment_mode || '').toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" style={{ color: '#15803d' }}>{formatCurrency(payment.amount)}</p>
                    <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{payment.receipt_no}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Surface>
      </div>

      <Surface className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Top Defaulters</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Largest pending balances in the selected session.</p>
          </div>
          <Button variant="secondary" icon={WalletCards} onClick={() => navigate(ROUTES.FEE_DEFAULTERS)}>Full List</Button>
        </div>
        {isLoading ? (
          <TableSkeleton cols={5} rows={5} />
        ) : (dashboard?.defaulters || []).length === 0 ? (
          <EmptyState icon={UserRound} title="No defaulters found" description="Outstanding students will appear here automatically." className="border-0 px-0 py-12" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Student', 'Class', 'Open Invoices', 'Last Due Date', 'Balance'].map((item) => (
                    <th key={item} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dashboard.defaulters.map((row, index) => (
                  <tr key={row.student_id} style={{ borderBottom: index < dashboard.defaulters.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.student_name}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{row.admission_no}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{row.class_name || '—'}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-primary)' }}>{row.open_invoices}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(row.last_due_date)}</td>
                    <td className="px-4 py-3.5 text-sm font-bold" style={{ color: '#dc2626' }}>{formatCurrency(row.balance || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
    </AccountantPageShell>
  )
}

export default AccountantDashboard
