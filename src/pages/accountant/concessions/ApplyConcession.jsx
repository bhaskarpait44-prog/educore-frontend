import { useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import usePermissions from '@/hooks/usePermissions'
import StudentSearchBox from '@/components/accountant/StudentSearchBox'
import * as accountantApi from '@/api/accountantApi'
import { LockedView } from './ConcessionList'
import { formatCurrency } from '@/utils/helpers'

const ApplyConcession = () => {
  usePageTitle('Apply Concession')
  const { can } = usePermissions()
  const [student, setStudent] = useState(null)
  const [invoiceData, setInvoiceData] = useState(null)
  const [form, setForm] = useState({
    invoice_id: '',
    concession_type: 'percentage',
    concession_value: '',
    reason: 'Financial hardship',
    approval_reference: '',
    remarks: '',
  })

  if (!can('fees.waive')) {
    return <LockedView title="Apply Concession" />
  }

  const selectStudent = async (selectedStudent) => {
    setStudent(selectedStudent)
    const response = await accountantApi.getStudentPendingInvoices(selectedStudent.id)
    setInvoiceData(response.data)
  }

  const selectedInvoice = (invoiceData?.pending_invoices || []).find((invoice) => String(invoice.id) === String(form.invoice_id))
  const originalAmount = Number(selectedInvoice?.balance || 0)
  const concessionAmount = form.concession_type === 'percentage'
    ? (originalAmount * Number(form.concession_value || 0)) / 100
    : form.concession_type === 'fixed'
      ? Number(form.concession_value || 0)
      : originalAmount

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Apply Concession</h1>
      </div>
      <StudentSearchBox onSelect={selectStudent} />
      {student && (
        <div className="space-y-4 rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <select value={form.invoice_id} onChange={(event) => setForm((current) => ({ ...current, invoice_id: event.target.value }))} className="w-full rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
            <option value="">Select Invoice</option>
            {(invoiceData?.pending_invoices || []).map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.fee_name} • {formatCurrency(invoice.balance)}</option>)}
          </select>
          <div className="grid gap-4 md:grid-cols-2">
            <select value={form.concession_type} onChange={(event) => setForm((current) => ({ ...current, concession_type: event.target.value }))} className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
              <option value="full">Full Waiver</option>
            </select>
            <input value={form.concession_value} onChange={(event) => setForm((current) => ({ ...current, concession_value: event.target.value }))} placeholder="Concession value" className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
            <input value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Reason" className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
            <input value={form.approval_reference} onChange={(event) => setForm((current) => ({ ...current, approval_reference: event.target.value }))} placeholder="Approval reference" className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
          </div>
          <textarea value={form.remarks} onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))} rows={4} placeholder="Remarks" className="w-full rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
          <div className="rounded-[22px] border p-4 text-sm" style={{ borderColor: 'var(--color-border)' }}>
            Original: {formatCurrency(originalAmount)} | Concession: {formatCurrency(concessionAmount)} | Final: {formatCurrency(Math.max(originalAmount - concessionAmount, 0))}
          </div>
          <button type="button" onClick={() => accountantApi.applyConcession(form).catch(() => {})} className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: 'var(--color-brand)' }}>
            Confirm Waiver
          </button>
        </div>
      )}
    </div>
  )
}

export default ApplyConcession
