import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import * as feeApi from '@/api/fees'
import { getClasses, getClassOptions } from '@/api/classApi'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import EmptyState from '@/components/ui/EmptyState'
import Select from '@/components/ui/Select'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { formatCurrency, formatDate } from '@/utils/helpers'
import AccountantPageShell, { Surface } from './AccountantPageShell'

const AccountantDefaultersPage = () => {
  const { toastError } = useToast()
  const { sessions, currentSession, fetchSessions } = useSessionStore()
  const [classes, setClasses] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [classId, setClassId] = useState('')
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
    feeApi.getFeeDefaulters({
      session_id: sessionId,
      class_id: classId || undefined,
      search: search || undefined,
    })
      .then((res) => setRows(res.data?.defaulters || []))
      .catch((error) => {
        setRows([])
        toastError(error.message || 'Failed to load defaulters')
      })
      .finally(() => setIsLoading(false))
  }, [sessionId, classId, search, toastError])

  return (
    <AccountantPageShell
      title="Defaulters"
      description="Students with pending or partially paid invoices in the selected session, ready for follow-up."
    >
      <Surface className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Select label="Session" value={sessionId} onChange={(e) => setSessionId(e.target.value)} options={(sessions || []).map((item) => ({ value: String(item.id), label: item.name }))} />
          <Select label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} options={classes} placeholder="All classes" />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Search Student</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or admission no" className="rounded-xl px-4 py-2.5 text-sm outline-none" style={{ backgroundColor: 'var(--color-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
          </label>
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton cols={7} rows={8} />
        ) : rows.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="No defaulters found" description="Everyone is up to date for the current filter set." className="border-0 rounded-none py-14" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Student', 'Class', 'Open Invoices', 'Overdue', 'First Due', 'Last Due', 'Balance'].map((item) => (
                    <th key={item} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.student_id} style={{ borderBottom: index < rows.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.student_name}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{row.admission_no}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{row.class_name || '—'}{row.section_name ? ` • ${row.section_name}` : ''}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-primary)' }}>{row.open_invoices}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: Number(row.overdue_invoices || 0) > 0 ? '#dc2626' : 'var(--color-text-secondary)' }}>{row.overdue_invoices}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(row.first_due_date)}</td>
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

export default AccountantDefaultersPage
