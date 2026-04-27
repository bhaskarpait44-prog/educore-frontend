import { useEffect, useMemo, useState } from 'react'
import * as accountantApi from '@/api/accountantApi'
import { getSessions } from '@/api/sessions'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Select from '@/components/ui/Select'
import TableSkeleton from '@/components/ui/TableSkeleton'
import usePageTitle from '@/hooks/usePageTitle'
import usePermissions from '@/hooks/usePermissions'
import useToast from '@/hooks/useToast'
import { PERMISSION } from '@/utils/permissions'
import { formatCurrency } from '@/utils/helpers'
import { AccountantHero, AccountantSection, ExportActions, LockedAccessCard, MetricCard, SummaryTable } from './portalUtils'

export default function CarryForwardPage() {
  usePageTitle('Carry Forward')
  const { can } = usePermissions()
  const { toastError, toastSuccess } = useToast()
  const [items, setItems] = useState([])
  const [sessions, setSessions] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedStudents, setSelectedStudents] = useState([])
  const [oldSessionId, setOldSessionId] = useState('')
  const [newSessionId, setNewSessionId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([accountantApi.getCarryForwardEligible(), getSessions()])
      .then(([carryRes, sessionsRes]) => {
        setItems(carryRes.data?.items || [])
        setSessions(sessionsRes.data?.sessions || sessionsRes.data || [])
      })
      .catch((error) => toastError(error.message || 'Failed to load carry forward data'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!can(PERMISSION.FEES_EDIT)) return
    load()
  }, [can, toastError])

  const totals = useMemo(() => items.reduce((acc, item) => {
    acc.pending += Number(item.total_pending || 0)
    acc.invoices += Number(item.invoices_count || 0)
    return acc
  }, { pending: 0, invoices: 0 }), [items])

  if (!can(PERMISSION.FEES_EDIT)) {
    return <LockedAccessCard title="Carry Forward Locked" description="Contact admin to enable fees.edit before moving balances to the next session." />
  }

  const doSingle = async () => {
    if (!selectedStudent || !oldSessionId || !newSessionId) return
    setSaving(true)
    try {
      await accountantApi.carryForwardSingle({
        student_id    : selectedStudent,
        old_session_id: oldSessionId,
        new_session_id: newSessionId,
      })
      toastSuccess('Carry forward completed')
      load()
    } catch (error) {
      toastError(error.message || 'Failed to carry forward fees')
    } finally {
      setSaving(false)
    }
  }

  const doBulk = async () => {
    if (!selectedStudents.length || !oldSessionId || !newSessionId) return
    setSaving(true)
    try {
      await accountantApi.carryForwardBulk({
        student_ids   : selectedStudents,
        old_session_id: oldSessionId,
        new_session_id: newSessionId,
      })
      toastSuccess('Bulk carry forward completed')
      load()
    } catch (error) {
      toastError(error.message || 'Failed to carry forward selected students')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key   : 'select',
      label : '',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedStudents.includes(row.student_id)}
          onChange={() => setSelectedStudents((current) => current.includes(row.student_id) ? current.filter((id) => id !== row.student_id) : [...current, row.student_id])}
          className="h-4 w-4 accent-amber-500"
        />
      ),
      csv: () => '',
    },
    { key: 'student_name', label: 'Student' },
    { key: 'class_name', label: 'Class' },
    { key: 'invoices_count', label: 'Invoices' },
    { key: 'total_pending', label: 'Total Pending', render: (row) => formatCurrency(row.total_pending) },
  ]

  return (
    <div className="space-y-6">
      <AccountantHero
        eyebrow="Step 13"
        title="Carry Forward"
        description="Move pending balances from a closed session into the next session with single-student or bulk processing."
        actions={<ExportActions filename="carry-forward-eligible.csv" columns={columns.slice(1)} rows={items} printTitle="Carry Forward Eligible Students" />}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Eligible Students" value={items.length} />
        <MetricCard label="Pending Invoices" value={totals.invoices} />
        <MetricCard label="Pending Amount" value={formatCurrency(totals.pending)} accent="#dc2626" />
      </div>

      <AccountantSection title="Carry Forward Actions" subtitle="Choose source and target session, then run a single or bulk carry forward.">
        <div className="grid gap-4 xl:grid-cols-4">
          <Select label="Old Session" value={oldSessionId} onChange={(event) => setOldSessionId(event.target.value)} options={sessions.map((session) => ({ value: String(session.id), label: session.name }))} />
          <Select label="New Session" value={newSessionId} onChange={(event) => setNewSessionId(event.target.value)} options={sessions.map((session) => ({ value: String(session.id), label: session.name }))} />
          <Select label="Single Student" value={selectedStudent} onChange={(event) => setSelectedStudent(event.target.value)} options={items.map((row) => ({ value: String(row.student_id), label: `${row.student_name} · ${formatCurrency(row.total_pending)}` }))} />
          <div className="flex items-end gap-3">
            <Button loading={saving} onClick={doSingle}>Carry Single</Button>
            <Button variant="secondary" loading={saving} onClick={doBulk} disabled={!selectedStudents.length}>Carry Bulk</Button>
          </div>
        </div>
      </AccountantSection>

      <AccountantSection title="Eligible List" subtitle="Students with pending balances from past sessions.">
        {loading ? <TableSkeleton cols={5} rows={8} /> : items.length ? <SummaryTable columns={columns} rows={items} /> : <EmptyState title="No carry forward candidates" description="Closed-session pending balances will appear here automatically." />}
      </AccountantSection>
    </div>
  )
}
