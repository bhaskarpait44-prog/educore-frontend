import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import * as feeApi from '@/api/fees'
import { getClasses, getClassOptions } from '@/api/classApi'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import EmptyState from '@/components/ui/EmptyState'
import Select from '@/components/ui/Select'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { formatCurrency, formatDate } from '@/utils/helpers'
import AccountantPageShell, { Surface } from './AccountantPageShell'

const AccountantInvoicesPage = () => {
  const { toastError } = useToast()
  const { sessions, currentSession, fetchSessions } = useSessionStore()
  const [classes, setClasses] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [classId, setClassId] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSessions().catch(() => {})
    getClasses().then((res) => setClasses(getClassOptions(res))).catch(() => setClasses([]))
  }, [fetchSessions])

  useEffect(() => {
    if (currentSession?.id && !sessionId) setSessionId(String(currentSession.id))
  }, [currentSession, sessionId])

  useEffect(() => {
    if (!sessionId) return
    setIsLoading(true)
    feeApi.getFeeInvoices({
      session_id: sessionId,
      class_id: classId || undefined,
      status: status || undefined,
      search: search || undefined,
      perPage: 100,
    })
      .then((res) => setRows(res.data?.invoices || []))
      .catch((error) => {
        setRows([])
        toastError(error.message || 'Failed to load invoices')
      })
      .finally(() => setIsLoading(false))
  }, [sessionId, classId, status, search, toastError])

  return (
    <AccountantPageShell
      title="Invoice Register"
      description="Review generated invoices across the session with balances, fee heads, and current payment status."
    >
      <Surface className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Select label="Session" value={sessionId} onChange={(e) => setSessionId(e.target.value)} options={(sessions || []).map((item) => ({ value: String(item.id), label: item.name }))} />
          <Select label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} options={classes} placeholder="All classes" />
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={[
            { value: 'pending', label: 'Pending' },
            { value: 'partial', label: 'Partial' },
            { value: 'paid', label: 'Paid' },
            { value: 'waived', label: 'Waived' },
            { value: 'carried_forward', label: 'Carried Forward' },
          ]} placeholder="All statuses" />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Search</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Student, fee, admission no" className="rounded-xl px-4 py-2.5 text-sm outline-none" style={{ backgroundColor: 'var(--color-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
          </label>
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton cols={7} rows={8} />
        ) : rows.length === 0 ? (
          <EmptyState icon={FileText} title="No invoices found" description="Try adjusting the filters to load generated invoices." className="border-0 rounded-none py-14" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Student', 'Fee Head', 'Due Date', 'Amount', 'Paid', 'Balance', 'Status'].map((item) => (
                    <th key={item} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} style={{ borderBottom: index < rows.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.student_name}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{row.admission_no} • {row.class_name || '—'}{row.section_name ? ` • ${row.section_name}` : ''}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-primary)' }}>{row.fee_name}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(row.due_date)}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(row.amount_due)}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold" style={{ color: '#15803d' }}>{formatCurrency(row.amount_paid || 0)}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold" style={{ color: Number(row.balance || 0) > 0 ? '#dc2626' : '#15803d' }}>{formatCurrency(row.balance || 0)}</td>
                    <td className="px-4 py-3.5 text-sm capitalize" style={{ color: 'var(--color-text-secondary)' }}>{String(row.status || '').replace('_', ' ')}</td>
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

export default AccountantInvoicesPage
