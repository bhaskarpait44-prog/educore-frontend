import { useEffect, useMemo, useState } from 'react'
import * as accountantApi from '@/api/accountantApi'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import TableSkeleton from '@/components/ui/TableSkeleton'
import usePageTitle from '@/hooks/usePageTitle'
import usePermissions from '@/hooks/usePermissions'
import useToast from '@/hooks/useToast'
import { PERMISSION } from '@/utils/permissions'
import { formatCurrency } from '@/utils/helpers'
import { AccountantHero, AccountantSection, ExportActions, LockedAccessCard, MetricCard, SummaryTable } from './portalUtils'

export default function ConcessionList() {
  usePageTitle('Concession List')
  const { can } = usePermissions()
  const { toastError } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [reasonFilter, setReasonFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')

  useEffect(() => {
    if (!can(PERMISSION.FEES_WAIVE)) return
    accountantApi.getConcessions()
      .then((res) => setItems(res.data?.items || []))
      .catch((error) => toastError(error.message || 'Failed to load concessions'))
      .finally(() => setLoading(false))
  }, [can, toastError])

  if (!can(PERMISSION.FEES_WAIVE)) {
    return <LockedAccessCard title="Concession Management Locked" description="Contact admin to enable fee waiver and concession management for your accountant role." />
  }

  const filteredItems = items.filter((item) => {
    const matchReason = !reasonFilter || String(item.reason || '').toLowerCase().includes(reasonFilter.toLowerCase())
    const matchClass = !classFilter || String(item.class_name || '').toLowerCase().includes(classFilter.toLowerCase())
    return matchReason && matchClass
  })

  const totals = useMemo(() => filteredItems.reduce((acc, item) => {
    acc.original += Number(item.original_amount || 0)
    acc.concession += Number(item.concession_amount || 0)
    acc.final += Number(item.final_amount || 0)
    return acc
  }, { original: 0, concession: 0, final: 0 }), [filteredItems])

  const columns = [
    { key: 'student_name', label: 'Student' },
    { key: 'class_name', label: 'Class' },
    { key: 'fee_type', label: 'Fee Type' },
    { key: 'original_amount', label: 'Original', render: (row) => formatCurrency(row.original_amount) },
    { key: 'concession_amount', label: 'Concession', render: (row) => formatCurrency(row.concession_amount) },
    { key: 'final_amount', label: 'Final Amount', render: (row) => formatCurrency(row.final_amount) },
    { key: 'reason', label: 'Reason' },
    { key: 'concession_type', label: 'Type' },
    { key: 'concession_reference', label: 'Reference' },
  ]

  return (
    <div className="space-y-6">
      <AccountantHero
        eyebrow="Step 11"
        title="Concession List"
        description="Track all fee concessions granted in the current session with class, fee type, reason, and resulting amount."
        actions={<ExportActions filename="concessions.csv" columns={columns} rows={filteredItems} printTitle="Concession List" />}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Concessions" value={filteredItems.length} />
        <MetricCard label="Concession Amount" value={formatCurrency(totals.concession)} accent="#2563eb" />
        <MetricCard label="Final Amount After Concession" value={formatCurrency(totals.final)} accent="#15803d" />
      </div>
      <AccountantSection title="Filters" subtitle="Narrow concession activity by class or reason text.">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Class Filter" value={classFilter} onChange={(event) => setClassFilter(event.target.value)} placeholder="Grade 6, Grade 7..." />
          <Input label="Reason Filter" value={reasonFilter} onChange={(event) => setReasonFilter(event.target.value)} placeholder="Scholarship, Merit, Hardship..." />
        </div>
      </AccountantSection>
      <AccountantSection title="Concession Register" subtitle="Every concession remains visible for audit and reporting.">
        {loading ? <TableSkeleton cols={9} rows={8} /> : <SummaryTable columns={columns} rows={filteredItems} emptyTitle="No concessions recorded" emptyDescription="Applied concessions will appear here once recorded." />}
      </AccountantSection>
    </div>
  )
}
