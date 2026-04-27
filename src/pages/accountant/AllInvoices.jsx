import { useEffect, useMemo, useState } from 'react'
import { BellRing, CheckSquare, CreditCard, Filter } from 'lucide-react'
import * as accountantApi from '@/api/accountantApi'
import { getClasses, getSections } from '@/api/classApi'
import { getSessions } from '@/api/sessions'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import TableSkeleton from '@/components/ui/TableSkeleton'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/utils/helpers'
import {
  AccountantHero,
  AccountantSection,
  ExportActions,
  MetricCard,
  paymentModeLabel,
  statusBadgeForInvoice,
  SummaryTable,
} from './portalUtils'

export default function AllInvoices() {
  usePageTitle('All Invoices')
  const { toastSuccess, toastError } = useToast()

  const [filters, setFilters] = useState({
    session_id : '',
    class_id   : '',
    section_id : '',
    status     : '',
    fee_type   : '',
  })
  const [items, setItems] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [sessions, setSessions] = useState([])
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([getSessions(), getClasses()])
      .then(([sessionsRes, classesRes]) => {
        setSessions(sessionsRes.data?.sessions || sessionsRes.data || [])
        setClasses(classesRes.data?.classes || classesRes.data || [])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!filters.class_id) {
      setSections([])
      return
    }
    getSections(filters.class_id)
      .then((res) => setSections(res.data || []))
      .catch(() => setSections([]))
  }, [filters.class_id])

  useEffect(() => {
    setLoading(true)
    accountantApi.getInvoices(filters)
      .then((res) => {
        const nextItems = res.data?.items || []
        setItems(nextItems)
        setSelectedIds([])
        setSelectedRows([])
      })
      .catch((error) => toastError(error.message || 'Failed to load invoices'))
      .finally(() => setLoading(false))
  }, [filters, toastError])

  useEffect(() => {
    setSelectedRows(items.filter((item) => selectedIds.includes(item.id)))
  }, [items, selectedIds])

  const totals = useMemo(() => items.reduce((acc, item) => {
    acc.expected += Number(item.amount_due || 0)
    acc.paid += Number(item.paid || 0)
    acc.balance += Number(item.balance || 0)
    return acc
  }, { expected: 0, paid: 0, balance: 0 }), [items])

  const columns = [
    {
      key   : 'select',
      label : '',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => setSelectedIds((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id])}
          className="h-4 w-4 cursor-pointer accent-amber-500"
        />
      ),
      csv: () => '',
    },
    { key: 'id', label: 'Invoice ID', render: (row) => <span className="font-mono">INV-{row.id}</span> },
    { key: 'student_name', label: 'Student' },
    { key: 'class_name', label: 'Class', render: (row) => `${row.class_name} ${row.section_name || ''}` },
    { key: 'fee_type', label: 'Fee Type' },
    { key: 'due_date', label: 'Due Date', render: (row) => formatDate(row.due_date) },
    { key: 'amount_due', label: 'Amount', render: (row) => formatCurrency(row.amount_due) },
    { key: 'paid', label: 'Paid', render: (row) => formatCurrency(row.paid) },
    { key: 'balance', label: 'Balance', render: (row) => <span style={{ color: Number(row.balance || 0) > 0 ? '#dc2626' : '#15803d' }}>{formatCurrency(row.balance)}</span> },
    { key: 'status', label: 'Status', render: (row) => statusBadgeForInvoice(row.status) },
  ]

  const handleBulkReminder = async () => {
    if (!selectedRows.length) return
    setBusy(true)
    try {
      const studentIds = [...new Set(selectedRows.map((item) => item.student_id).filter(Boolean))]
      if (!studentIds.length) {
        toastError('Selected invoices do not include student ids for reminders.')
        return
      }
      await accountantApi.sendBulkReminder({
        student_ids: studentIds,
        type       : 'whatsapp',
      })
      toastSuccess('Bulk reminders queued')
    } catch (error) {
      toastError(error.message || 'Failed to send reminders')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <AccountantHero
        eyebrow="Step 8"
        title="Invoice Management"
        description="Review all invoices, narrow by class or session, and run bulk follow-up actions from one counter-friendly screen."
        actions={(
          <>
            <ExportActions filename="all-invoices.csv" columns={columns.slice(1)} rows={items} printTitle="All Invoices" />
            <Button icon={BellRing} loading={busy} disabled={!selectedRows.length} onClick={handleBulkReminder}>
              Send Reminder
            </Button>
          </>
        )}
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Invoices" value={items.length} hint="Current filter result" />
        <MetricCard label="Expected" value={formatCurrency(totals.expected)} />
        <MetricCard label="Collected" value={formatCurrency(totals.paid)} accent="#15803d" />
        <MetricCard label="Outstanding" value={formatCurrency(totals.balance)} accent="#dc2626" />
      </div>

      <AccountantSection title="Filters" subtitle="Session, class, section, status, and fee type filters for day-to-day desk use.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Select
            label="Session"
            value={filters.session_id}
            onChange={(event) => setFilters((current) => ({ ...current, session_id: event.target.value }))}
            options={sessions.map((session) => ({ value: String(session.id), label: session.name }))}
          />
          <Select
            label="Class"
            value={filters.class_id}
            onChange={(event) => setFilters((current) => ({ ...current, class_id: event.target.value, section_id: '' }))}
            options={classes.map((classItem) => ({ value: String(classItem.id), label: classItem.name }))}
          />
          <Select
            label="Section"
            value={filters.section_id}
            onChange={(event) => setFilters((current) => ({ ...current, section_id: event.target.value }))}
            options={sections.map((section) => ({ value: String(section.id), label: section.name }))}
          />
          <Select
            label="Status"
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'partial', label: 'Partial' },
              { value: 'paid', label: 'Paid' },
              { value: 'waived', label: 'Waived' },
            ]}
          />
          <Input
            label="Fee Type"
            value={filters.fee_type}
            onChange={(event) => setFilters((current) => ({ ...current, fee_type: event.target.value }))}
            placeholder="Tuition, Transport..."
          />
        </div>
      </AccountantSection>

      <AccountantSection
        title="Invoice Table"
        subtitle="Select invoices for reminders or export."
        actions={(
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <CheckSquare size={16} />
            {selectedRows.length} selected
          </div>
        )}
      >
        {loading ? <TableSkeleton cols={10} rows={8} /> : (
          <SummaryTable
            columns={columns}
            rows={items}
            emptyTitle="No invoices matched the current filters"
            emptyDescription="Try widening the class, session, or status filter."
          />
        )}
      </AccountantSection>
    </div>
  )
}
