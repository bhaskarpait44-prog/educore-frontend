import { useMemo, useState } from 'react'
import * as accountantApi from '@/api/accountantApi'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import useAccountant from '@/hooks/useAccountant'
import usePageTitle from '@/hooks/usePageTitle'
import usePermissions from '@/hooks/usePermissions'
import useToast from '@/hooks/useToast'
import { Search } from 'lucide-react'
import { PERMISSION } from '@/utils/permissions'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { AccountantHero, AccountantSection, LockedAccessCard, MetricCard } from './portalUtils'

export default function ApplyConcession() {
  usePageTitle('Apply Concession')
  const { can } = usePermissions()
  const { toastError, toastSuccess } = useToast()
  const { searchStudents, fetchPendingInvoices } = useAccountant()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState([])
  const [student, setStudent] = useState(null)
  const [invoiceOptions, setInvoiceOptions] = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    invoice_id         : '',
    concession_type    : 'percentage',
    concession_value   : '50',
    reason             : 'Scholarship',
    approval_reference : '',
    remarks            : '',
  })

  const selectedInvoice = invoiceOptions.find((item) => String(item.id) === String(form.invoice_id))
  const preview = useMemo(() => {
    if (!selectedInvoice) return { original: 0, concession: 0, final: 0 }
    const original = Number(selectedInvoice.balance || selectedInvoice.amount_due || 0)
    let concession = 0
    if (form.concession_type === 'percentage') concession = original * (Number(form.concession_value || 0) / 100)
    if (form.concession_type === 'fixed_amount') concession = Number(form.concession_value || 0)
    if (form.concession_type === 'full_waiver') concession = original
    concession = Math.min(original, concession)
    return {
      original,
      concession,
      final: Math.max(0, original - concession),
    }
  }, [form.concession_type, form.concession_value, selectedInvoice])

  if (!can(PERMISSION.FEES_WAIVE)) {
    return <LockedAccessCard title="Concession Form Locked" description="Contact admin to enable waiver permissions before applying concessions." />
  }

  const handleSearch = async () => {
    if (query.trim().length < 2) return
    setSearching(true)
    try {
      setResults(await searchStudents(query.trim()))
    } finally {
      setSearching(false)
    }
  }

  const chooseStudent = async (row) => {
    setStudent(row)
    try {
      const res = await fetchPendingInvoices(row.id)
      setInvoiceOptions(res.invoices || [])
      if ((res.invoices || [])[0]) {
        setForm((current) => ({ ...current, invoice_id: String(res.invoices[0].id) }))
      }
    } catch (error) {
      toastError(error.message || 'Failed to load pending invoices')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await accountantApi.waiveFee(form)
      toastSuccess('Concession applied successfully')
      if (student) chooseStudent(student)
    } catch (error) {
      toastError(error.message || 'Failed to apply concession')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <AccountantHero
        eyebrow="Step 11"
        title="Apply Concession"
        description="Find a student, choose an invoice, preview the new amount, and apply a logged concession with reason and approval reference."
      />
      <AccountantSection title="Step 1: Find Student" subtitle="Use the same fast student search used by the collection counter.">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or admission number" />
          <Button icon={Search} loading={searching} onClick={handleSearch}>Search</Button>
        </div>
        <div className="mt-4 grid gap-3">
          {results.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => chooseStudent(row)}
              className="rounded-[1.2rem] border px-4 py-3 text-left"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
            >
              <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.student_name}</div>
              <div className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {row.admission_no} · {row.class_name} {row.section_name || ''} · Pending {formatCurrency(row.pending_amount)}
              </div>
            </button>
          ))}
        </div>
      </AccountantSection>

      {student ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Student" value={student.student_name} hint={`${student.admission_no} · ${student.class_name}`} />
            <MetricCard label="Pending Invoices" value={invoiceOptions.length} />
            <MetricCard label="Pending Amount" value={formatCurrency(student.pending_amount)} accent="#dc2626" />
          </div>

          <AccountantSection title="Step 2 to 4: Concession Details" subtitle="This action is logged and cannot be silently reversed.">
            {!invoiceOptions.length ? (
              <EmptyState title="No pending invoices available" description="This student has no pending invoices that can receive a concession right now." />
            ) : (
              <form className="grid gap-4 xl:grid-cols-2" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <Select
                    label="Invoice"
                    value={form.invoice_id}
                    onChange={(event) => setForm((current) => ({ ...current, invoice_id: event.target.value }))}
                    options={invoiceOptions.map((invoice) => ({
                      value: String(invoice.id),
                      label: `${invoice.fee_name} · Due ${formatDate(invoice.due_date)} · ${formatCurrency(invoice.balance || invoice.amount_due)}`,
                    }))}
                    required
                  />
                  <Select
                    label="Concession Type"
                    value={form.concession_type}
                    onChange={(event) => setForm((current) => ({ ...current, concession_type: event.target.value }))}
                    options={[
                      { value: 'percentage', label: 'Percentage' },
                      { value: 'fixed_amount', label: 'Fixed Amount' },
                      { value: 'full_waiver', label: 'Full Waiver' },
                    ]}
                    required
                  />
                  <Input
                    label="Concession Value"
                    value={form.concession_value}
                    onChange={(event) => setForm((current) => ({ ...current, concession_value: event.target.value }))}
                    placeholder={form.concession_type === 'percentage' ? '50' : '2000'}
                    required={form.concession_type !== 'full_waiver'}
                    disabled={form.concession_type === 'full_waiver'}
                  />
                  <Select
                    label="Reason"
                    value={form.reason}
                    onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                    options={[
                      { value: 'Financial hardship', label: 'Financial hardship' },
                      { value: 'Scholarship', label: 'Scholarship' },
                      { value: 'Staff ward concession', label: 'Staff ward concession' },
                      { value: 'Management decision', label: 'Management decision' },
                      { value: 'RTE', label: 'RTE' },
                      { value: 'Merit based', label: 'Merit based' },
                      { value: 'Sibling discount', label: 'Sibling discount' },
                      { value: 'Other', label: 'Other' },
                    ]}
                    required
                  />
                  <Input label="Approval Reference" value={form.approval_reference} onChange={(event) => setForm((current) => ({ ...current, approval_reference: event.target.value }))} placeholder="Reference number or approval letter" />
                  <Input label="Remarks" value={form.remarks} onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))} placeholder="Optional internal remarks" />
                </div>

                <div
                  className="rounded-[1.5rem] border p-5"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
                >
                  <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>New Amount Preview</h3>
                  <div className="mt-4 grid gap-4">
                    <MetricCard label="Original" value={formatCurrency(preview.original)} />
                    <MetricCard label="Concession" value={formatCurrency(preview.concession)} accent="#2563eb" />
                    <MetricCard label="Final Amount" value={formatCurrency(preview.final)} accent="#15803d" />
                  </div>
                  <p className="mt-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    This action is logged in the financial audit trail and should only be used with approval.
                  </p>
                  <div className="mt-5">
                    <Button type="submit" loading={saving}>Confirm Waiver</Button>
                  </div>
                </div>
              </form>
            )}
          </AccountantSection>
        </>
      ) : null}
    </div>
  )
}
