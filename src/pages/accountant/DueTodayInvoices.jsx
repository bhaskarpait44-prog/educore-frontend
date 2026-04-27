import { useEffect, useMemo, useState } from 'react'
import * as accountantApi from '@/api/accountantApi'
import TableSkeleton from '@/components/ui/TableSkeleton'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { AccountantHero, AccountantSection, ExportActions, MetricCard, SummaryTable } from './portalUtils'

export default function DueTodayInvoices() {
  usePageTitle('Pending Invoices')
  const { toastError } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    accountantApi.getDueTodayInvoices()
      .then((res) => setItems(res.data?.items || []))
      .catch((error) => toastError(error.message || 'Failed to load priority invoices'))
      .finally(() => setLoading(false))
  }, [toastError])

  const totals = useMemo(() => items.reduce((acc, item) => {
    acc.balance += Number(item.balance || 0)
    return acc
  }, { balance: 0 }), [items])

  const columns = [
    { key: 'id', label: 'Invoice', render: (row) => `INV-${row.id}` },
    { key: 'student_name', label: 'Student' },
    { key: 'class_name', label: 'Class', render: (row) => `${row.class_name} ${row.section_name || ''}` },
    { key: 'fee_type', label: 'Fee Type' },
    { key: 'due_date', label: 'Due Date', render: (row) => formatDate(row.due_date) },
    { key: 'amount_due', label: 'Amount', render: (row) => formatCurrency(row.amount_due) },
    { key: 'balance', label: 'Balance', render: (row) => formatCurrency(row.balance) },
  ]

  return (
    <div className="space-y-6">
      <AccountantHero
        eyebrow="Step 8"
        title="Pending Invoices"
        description="This queue combines invoices due today and already overdue so the collection counter can move quickly through today’s most urgent list."
        actions={<ExportActions filename="pending-priority-invoices.csv" columns={columns} rows={items} printTitle="Pending Priority Invoices" />}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard label="Priority Invoices" value={items.length} />
        <MetricCard label="Priority Balance" value={formatCurrency(totals.balance)} accent="#dc2626" />
      </div>
      <AccountantSection title="Counter Collection List" subtitle="Print this list for desk use or save it as PDF.">
        {loading ? <TableSkeleton cols={7} rows={8} /> : <SummaryTable columns={columns} rows={items} emptyTitle="No pending priority invoices" emptyDescription="Invoices due today or overdue will appear here." />}
      </AccountantSection>
    </div>
  )
}
