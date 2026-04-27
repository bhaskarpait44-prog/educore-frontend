import { useEffect, useMemo, useState } from 'react'
import * as accountantApi from '@/api/accountantApi'
import TableSkeleton from '@/components/ui/TableSkeleton'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { AccountantHero, AccountantSection, ExportActions, MetricCard, SummaryTable } from './portalUtils'

export default function OverdueInvoices() {
  usePageTitle('Overdue Invoices')
  const { toastError } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    accountantApi.getOverdueInvoices()
      .then((res) => setItems(res.data?.items || []))
      .catch((error) => toastError(error.message || 'Failed to load overdue invoices'))
      .finally(() => setLoading(false))
  }, [toastError])

  const totals = useMemo(() => items.reduce((acc, item) => {
    acc.balance += Number(item.balance || 0)
    acc.amount += Number(item.amount_due || 0)
    return acc
  }, { balance: 0, amount: 0 }), [items])

  const columns = [
    { key: 'id', label: 'Invoice', render: (row) => `INV-${row.id}` },
    { key: 'student_name', label: 'Student' },
    { key: 'class_name', label: 'Class', render: (row) => `${row.class_name} ${row.section_name || ''}` },
    { key: 'fee_type', label: 'Fee Type' },
    { key: 'due_date', label: 'Due Date', render: (row) => formatDate(row.due_date) },
    { key: 'days_overdue', label: 'Days Overdue', render: (row) => <span style={{ color: '#dc2626', fontWeight: 700 }}>{row.days_overdue}</span> },
    { key: 'amount_due', label: 'Amount', render: (row) => formatCurrency(row.amount_due) },
    { key: 'balance', label: 'Balance', render: (row) => formatCurrency(row.balance) },
  ]

  return (
    <div className="space-y-6">
      <AccountantHero
        eyebrow="Step 8"
        title="Overdue Invoices"
        description="A dedicated priority view ordered by delay so the counter team can focus on the riskiest outstanding dues first."
        actions={<ExportActions filename="overdue-invoices.csv" columns={columns} rows={items} printTitle="Overdue Invoices" />}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Overdue Invoices" value={items.length} hint="Most delayed shown first" />
        <MetricCard label="Overdue Amount" value={formatCurrency(totals.amount)} />
        <MetricCard label="Collectable Today" value={formatCurrency(totals.balance)} accent="#dc2626" />
      </div>
      <AccountantSection title="Overdue Queue" subtitle="Sorted from highest delay to lowest.">
        {loading ? <TableSkeleton cols={8} rows={8} /> : <SummaryTable columns={columns} rows={items} emptyTitle="No overdue invoices" emptyDescription="This view will fill automatically when invoices pass their due date." />}
      </AccountantSection>
    </div>
  )
}
