import { useEffect, useState } from 'react'
import { Receipt } from 'lucide-react'
import * as feeApi from '@/api/fees'
import { getClasses, getClassOptions } from '@/api/classApi'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import EmptyState from '@/components/ui/EmptyState'
import Select from '@/components/ui/Select'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { formatCurrency, formatDate } from '@/utils/helpers'
import AccountantPageShell, { Surface } from './AccountantPageShell'

const AccountantReceiptsPage = () => {
  const { toastError } = useToast()
  const { sessions, currentSession, fetchSessions } = useSessionStore()
  const [classes, setClasses] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [classId, setClassId] = useState('')
  const [paymentMode, setPaymentMode] = useState('')
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
    feeApi.getFeeReceipts({
      session_id: sessionId,
      class_id: classId || undefined,
      payment_mode: paymentMode || undefined,
      search: search || undefined,
      perPage: 100,
    })
      .then((res) => setRows(res.data?.receipts || []))
      .catch((error) => {
        setRows([])
        toastError(error.message || 'Failed to load receipts')
      })
      .finally(() => setIsLoading(false))
  }, [sessionId, classId, paymentMode, search, toastError])

  return (
    <AccountantPageShell
      title="Receipt Register"
      description="Every payment entry recorded in the current session, with student, fee head, mode, and receipt reference."
    >
      <Surface className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Select label="Session" value={sessionId} onChange={(e) => setSessionId(e.target.value)} options={(sessions || []).map((item) => ({ value: String(item.id), label: item.name }))} />
          <Select label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} options={classes} placeholder="All classes" />
          <Select label="Mode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} options={[
            { value: 'cash', label: 'Cash' },
            { value: 'online', label: 'Online' },
            { value: 'cheque', label: 'Cheque' },
            { value: 'dd', label: 'Demand Draft' },
          ]} placeholder="All modes" />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Search</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Receipt no, student, fee" className="rounded-xl px-4 py-2.5 text-sm outline-none" style={{ backgroundColor: 'var(--color-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
          </label>
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton cols={7} rows={8} />
        ) : rows.length === 0 ? (
          <EmptyState icon={Receipt} title="No receipts found" description="Payments recorded from fee collection will appear here." className="border-0 rounded-none py-14" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Receipt', 'Student', 'Fee Head', 'Date', 'Mode', 'Received By', 'Amount'].map((item) => (
                    <th key={item} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} style={{ borderBottom: index < rows.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <td className="px-4 py-3.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.receipt_no}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.student_name}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{row.admission_no} • {row.class_name || '—'}{row.section_name ? ` • ${row.section_name}` : ''}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-primary)' }}>{row.fee_name}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(row.payment_date)}</td>
                    <td className="px-4 py-3.5 text-sm uppercase" style={{ color: 'var(--color-text-secondary)' }}>{row.payment_mode}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{row.received_by_name || 'System'}</td>
                    <td className="px-4 py-3.5 text-sm font-bold" style={{ color: '#15803d' }}>{formatCurrency(row.amount)}</td>
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

export default AccountantReceiptsPage
