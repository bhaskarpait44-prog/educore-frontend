import { useEffect, useMemo, useState } from 'react'
import * as accountantApi from '@/api/accountantApi'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import TableSkeleton from '@/components/ui/TableSkeleton'
import useAccountant from '@/hooks/useAccountant'
import usePageTitle from '@/hooks/usePageTitle'
import usePermissions from '@/hooks/usePermissions'
import useToast from '@/hooks/useToast'
import { Search } from 'lucide-react'
import { PERMISSION } from '@/utils/permissions'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { AccountantHero, AccountantSection, ExportActions, LockedAccessCard, MetricCard, SummaryTable } from './portalUtils'

export default function RefundsPage() {
  usePageTitle('Refunds')
  const { can } = usePermissions()
  const { toastError, toastSuccess } = useToast()
  const { searchStudents } = useAccountant()
  const [items, setItems] = useState([])
  const [reportItems, setReportItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [studentQuery, setStudentQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [student, setStudent] = useState(null)
  const [payments, setPayments] = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    payment_id       : '',
    invoice_id       : '',
    amount           : '',
    reason           : '',
    refund_method    : 'cash',
    reference_number : '',
  })

  const load = () => {
    setLoading(true)
    Promise.all([accountantApi.getRefunds(), accountantApi.getRefundReport()])
      .then(([refundsRes, reportRes]) => {
        setItems(refundsRes.data?.items || [])
        setReportItems(reportRes.data?.items || [])
      })
      .catch((error) => toastError(error.message || 'Failed to load refunds'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!can(PERMISSION.FEES_REFUND)) return
    load()
  }, [can, toastError])

  if (!can(PERMISSION.FEES_REFUND)) {
    return <LockedAccessCard title="Refund Processing Locked" description="Contact admin to enable fees.refund before processing or listing refunds." />
  }

  const totals = useMemo(() => items.reduce((acc, item) => {
    acc.total += Number(item.amount || 0)
    return acc
  }, { total: 0 }), [items])

  const searchStudent = async () => {
    if (studentQuery.trim().length < 2) return
    setSearchResults(await searchStudents(studentQuery.trim()))
  }

  const chooseStudent = async (row) => {
    setStudent(row)
    try {
      const res = await accountantApi.getStudentPayments(row.id)
      const nextPayments = res.data?.items || []
      setPayments(nextPayments)
      if (nextPayments[0]) {
        setForm((current) => ({
          ...current,
          payment_id: String(nextPayments[0].id),
          invoice_id: String(nextPayments[0].invoice_id || ''),
          amount: String(nextPayments[0].amount || ''),
        }))
      }
    } catch (error) {
      toastError(error.message || 'Failed to load student payments')
    }
  }

  const process = async (event) => {
    event.preventDefault()
    if (!student) return
    setSaving(true)
    try {
      await accountantApi.processRefund({
        student_id: student.id,
        ...form,
      })
      toastSuccess('Refund processed successfully')
      load()
    } catch (error) {
      toastError(error.message || 'Failed to process refund')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'student_name', label: 'Student' },
    { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
    { key: 'processed_at', label: 'Date', render: (row) => formatDate(row.processed_at) },
    { key: 'reason', label: 'Reason' },
    { key: 'refund_method', label: 'Method' },
    { key: 'processed_by_name', label: 'Processed By' },
    { key: 'status', label: 'Status' },
  ]

  return (
    <div className="space-y-6">
      <AccountantHero
        eyebrow="Step 14"
        title="Refunds"
        description="Process refunds for duplicate payments, transfers, or collection errors while keeping a searchable refund register and summary."
        actions={<ExportActions filename="refunds.csv" columns={columns} rows={items} printTitle="Refund Register" />}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Refund Entries" value={items.length} />
        <MetricCard label="Refunded Amount" value={formatCurrency(totals.total)} accent="#dc2626" />
        <MetricCard label="Refund Methods" value={reportItems.length} accent="#2563eb" />
      </div>

      <AccountantSection title="Process Refund" subtitle="Select a student, choose a payment, and record the refund method with reason.">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <Input value={studentQuery} onChange={(event) => setStudentQuery(event.target.value)} placeholder="Search student by name or admission number" />
          <Button icon={Search} onClick={searchStudent}>Find Student</Button>
        </div>
        <div className="mt-4 grid gap-3">
          {searchResults.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => chooseStudent(row)}
              className="rounded-[1.2rem] border px-4 py-3 text-left"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
            >
              <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.student_name}</div>
              <div className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{row.admission_no} · {row.class_name} {row.section_name || ''}</div>
            </button>
          ))}
        </div>
        {student ? (
          <form className="mt-5 grid gap-4 xl:grid-cols-2" onSubmit={process}>
            <div className="space-y-4">
              <Select label="Payment" value={form.payment_id} onChange={(event) => {
                const selectedPayment = payments.find((item) => String(item.id) === event.target.value)
                setForm((current) => ({
                  ...current,
                  payment_id: event.target.value,
                  invoice_id: String(selectedPayment?.invoice_id || ''),
                  amount: String(selectedPayment?.amount || current.amount),
                }))
              }} options={payments.map((payment) => ({ value: String(payment.id), label: `${formatDate(payment.payment_date)} · ${payment.fee_name} · ${formatCurrency(payment.amount)}` }))} />
              <Input label="Invoice ID" value={form.invoice_id} onChange={(event) => setForm((current) => ({ ...current, invoice_id: event.target.value }))} required />
              <Input label="Amount" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} required />
              <Input label="Reason" value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Duplicate payment, transfer out..." required />
              <Select label="Refund Method" value={form.refund_method} onChange={(event) => setForm((current) => ({ ...current, refund_method: event.target.value }))} options={[
                { value: 'cash', label: 'Cash' },
                { value: 'online', label: 'Online transfer' },
                { value: 'adjustment', label: 'Adjustment to next invoice' },
              ]} />
              <Input label="Reference Number" value={form.reference_number} onChange={(event) => setForm((current) => ({ ...current, reference_number: event.target.value }))} />
              <Button type="submit" loading={saving}>Confirm Refund</Button>
            </div>
            <div className="rounded-[1.5rem] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
              <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Refund Summary</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {reportItems.map((row) => (
                  <MetricCard key={row.refund_method} label={row.refund_method} value={formatCurrency(row.total_amount)} hint={`${row.refunds_count} refunds`} />
                ))}
              </div>
            </div>
          </form>
        ) : null}
      </AccountantSection>

      <AccountantSection title="Refund Register" subtitle="All processed refunds remain visible with status and processor name.">
        {loading ? <TableSkeleton cols={7} rows={8} /> : items.length ? <SummaryTable columns={columns} rows={items} /> : <EmptyState title="No refunds processed yet" description="Processed refunds will appear here." />}
      </AccountantSection>
    </div>
  )
}
