import { useEffect, useMemo, useState } from 'react'
import * as accountantApi from '@/api/accountantApi'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import TableSkeleton from '@/components/ui/TableSkeleton'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { AccountantHero, AccountantSection, ExportActions, MetricCard, SummaryTable } from './portalUtils'

export default function ChequeManagement() {
  usePageTitle('Cheque Management')
  const { toastError, toastSuccess } = useToast()
  const [items, setItems] = useState([])
  const [pendingItems, setPendingItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeAction, setActiveAction] = useState(null)
  const [actionForm, setActionForm] = useState({ clearance_date: '', bounce_reason: '', bounce_date: '', bounce_charge: '0' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([accountantApi.getCheques(), accountantApi.getPendingCheques()])
      .then(([allRes, pendingRes]) => {
        setItems(allRes.data?.items || [])
        setPendingItems(pendingRes.data?.items || [])
      })
      .catch((error) => toastError(error.message || 'Failed to load cheque tracker'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const tracker = useMemo(() => items.reduce((acc, item) => {
    const amount = Number(item.amount || 0)
    acc[item.status] = (acc[item.status] || 0) + amount
    return acc
  }, { pending: 0, cleared: 0, bounced: 0 }), [items])

  const clearSelectedCheque = async () => {
    if (!activeAction?.id) return
    setSaving(true)
    try {
      await accountantApi.clearCheque(activeAction.id, { clearance_date: actionForm.clearance_date })
      toastSuccess('Cheque marked as cleared')
      setActiveAction(null)
      load()
    } catch (error) {
      toastError(error.message || 'Failed to clear cheque')
    } finally {
      setSaving(false)
    }
  }

  const bounceSelectedCheque = async () => {
    if (!activeAction?.id) return
    setSaving(true)
    try {
      await accountantApi.bounceCheque(activeAction.id, {
        bounce_reason: actionForm.bounce_reason,
        bounce_date  : actionForm.bounce_date,
        bounce_charge: actionForm.bounce_charge,
      })
      toastSuccess('Cheque marked as bounced')
      setActiveAction(null)
      load()
    } catch (error) {
      toastError(error.message || 'Failed to bounce cheque')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'cheque_number', label: 'Cheque No' },
    { key: 'student_name', label: 'Student' },
    { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
    { key: 'bank_name', label: 'Bank' },
    { key: 'cheque_date', label: 'Cheque Date', render: (row) => formatDate(row.cheque_date) },
    { key: 'received_date', label: 'Received Date', render: (row) => formatDate(row.received_date) },
    { key: 'clearance_date', label: 'Clearance Date', render: (row) => formatDate(row.clearance_date) },
    { key: 'status', label: 'Status' },
  ]

  const pendingColumns = [
    ...columns.slice(0, 6),
    {
      key   : 'actions',
      label : 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => { setActiveAction({ ...row, mode: 'clear' }); setActionForm({ clearance_date: new Date().toISOString().split('T')[0], bounce_reason: '', bounce_date: '', bounce_charge: '0' }) }}>
            Mark Cleared
          </Button>
          <Button size="sm" variant="danger" onClick={() => { setActiveAction({ ...row, mode: 'bounce' }); setActionForm({ clearance_date: '', bounce_reason: 'Cheque bounced', bounce_date: new Date().toISOString().split('T')[0], bounce_charge: '0' }) }}>
            Mark Bounced
          </Button>
        </div>
      ),
      csv: () => '',
    },
  ]

  return (
    <div className="space-y-6">
      <AccountantHero
        eyebrow="Step 15"
        title="Cheque Management"
        description="Track received cheques, clear them after bank confirmation, and record bounced cheque reversals with charge details."
        actions={<ExportActions filename="cheque-register.csv" columns={columns} rows={items} printTitle="Cheque Register" />}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Received" value={formatCurrency(items.reduce((sum, item) => sum + Number(item.amount || 0), 0))} />
        <MetricCard label="Pending" value={formatCurrency(tracker.pending)} accent="#ea580c" />
        <MetricCard label="Cleared" value={formatCurrency(tracker.cleared)} accent="#15803d" />
        <MetricCard label="Bounced" value={formatCurrency(tracker.bounced)} accent="#dc2626" />
      </div>

      <AccountantSection title="Pending Clearance" subtitle="These cheque payments are waiting for bank confirmation.">
        {loading ? <TableSkeleton cols={8} rows={6} /> : pendingItems.length ? <SummaryTable columns={pendingColumns} rows={pendingItems} /> : <EmptyState title="No pending cheques" description="Pending cheques will appear here until cleared or bounced." />}
      </AccountantSection>

      <AccountantSection title="Cheque Register" subtitle="All cheque entries, including cleared and bounced history.">
        {loading ? <TableSkeleton cols={8} rows={8} /> : items.length ? <SummaryTable columns={columns} rows={items} /> : <EmptyState title="No cheque entries yet" description="Cheque collections will appear here after recording payment mode as cheque." />}
      </AccountantSection>

      {activeAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={(event) => event.target === event.currentTarget && setActiveAction(null)}>
          <div className="w-full max-w-lg rounded-[1.8rem] border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {activeAction.mode === 'clear' ? 'Mark Cheque Cleared' : 'Mark Cheque Bounced'}
            </h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {activeAction.student_name} · {activeAction.cheque_number} · {formatCurrency(activeAction.amount)}
            </p>
            <div className="mt-5 grid gap-4">
              {activeAction.mode === 'clear' ? (
                <Input label="Clearance Date" type="date" value={actionForm.clearance_date} onChange={(event) => setActionForm((current) => ({ ...current, clearance_date: event.target.value }))} />
              ) : (
                <>
                  <Input label="Bounce Reason" value={actionForm.bounce_reason} onChange={(event) => setActionForm((current) => ({ ...current, bounce_reason: event.target.value }))} />
                  <Input label="Bounce Date" type="date" value={actionForm.bounce_date} onChange={(event) => setActionForm((current) => ({ ...current, bounce_date: event.target.value }))} />
                  <Input label="Bounce Charge" value={actionForm.bounce_charge} onChange={(event) => setActionForm((current) => ({ ...current, bounce_charge: event.target.value }))} />
                </>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" onClick={() => setActiveAction(null)}>Cancel</Button>
              <Button loading={saving} variant={activeAction.mode === 'clear' ? 'primary' : 'danger'} onClick={activeAction.mode === 'clear' ? clearSelectedCheque : bounceSelectedCheque}>
                {activeAction.mode === 'clear' ? 'Confirm Clearance' : 'Confirm Bounce'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
