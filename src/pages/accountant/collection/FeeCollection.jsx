import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Printer } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import StudentSearchBox from '@/components/accountant/StudentSearchBox'
import CollectionStepper from '@/components/accountant/CollectionStepper'
import PaymentModeSelector from '@/components/accountant/PaymentModeSelector'
import ReceiptPrint from '@/components/accountant/ReceiptPrint'
import useFeeCollection from '@/hooks/useFeeCollection'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency, formatDate } from '@/utils/helpers'

const today = new Date().toISOString().slice(0, 10)

const FeeCollection = () => {
  usePageTitle('Fee Collection')
  const { toastSuccess, toastError } = useToast()
  const { collect, isSaving } = useFeeCollection()
  const [step, setStep] = useState(0)
  const [student, setStudent] = useState(null)
  const [invoicePayload, setInvoicePayload] = useState(null)
  const [selectedInvoices, setSelectedInvoices] = useState([])
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_mode: 'cash',
    payment_date: today,
    reference: '',
    remarks: '',
    bank_name: '',
    cheque_number: '',
    cheque_date: today,
  })
  const [receipt, setReceipt] = useState(null)

  const selectedRows = useMemo(
    () => (invoicePayload?.pending_invoices || []).filter((row) => selectedInvoices.includes(row.id)),
    [invoicePayload, selectedInvoices]
  )
  const selectedTotal = selectedRows.reduce((sum, row) => sum + Number(row.balance || 0), 0)

  const selectStudent = async (selectedStudent) => {
    setStudent(selectedStudent)
    try {
      const response = await accountantApi.getStudentPendingInvoices(selectedStudent.id)
      setInvoicePayload(response.data)
      setSelectedInvoices([])
      setPaymentData((current) => ({ ...current, amount: '' }))
      setStep(1)
    } catch (error) {
      toastError(error.message || 'Failed to load pending invoices')
    }
  }

  const toggleInvoice = (invoiceId) => {
    setSelectedInvoices((current) => current.includes(invoiceId) ? current.filter((id) => id !== invoiceId) : [...current, invoiceId])
  }

  const moveToPayment = () => {
    if (selectedInvoices.length === 0) {
      toastError('Select at least one invoice')
      return
    }
    setPaymentData((current) => ({ ...current, amount: selectedTotal.toFixed(2) }))
    setStep(2)
  }

  const confirmCollection = async () => {
    try {
      const response = await collect({
        student_id: student.id,
        invoice_ids: selectedInvoices,
        ...paymentData,
      })
      toastSuccess('Receipt generated successfully')
      setReceipt({
        ...response,
        student_name: `${student.first_name} ${student.last_name}`,
        admission_no: student.admission_no,
        class_name: student.class_name,
        section_name: student.section_name,
        amount: response.total_applied,
        payment_mode: paymentData.payment_mode,
        payment_date: paymentData.payment_date,
        fee_name: selectedRows.map((row) => row.fee_name).join(', '),
      })
      setStep(4)
    } catch (error) {
      toastError(error.message || 'Failed to collect fee')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Counter Fee Collection</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Fast keyboard-friendly collection workflow for repeated daily use.</p>
          </div>
          <CollectionStepper step={step} />
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <StudentSearchBox onSelect={selectStudent} autoFocus />
          </div>
        )}

        {step === 1 && student && (
          <div className="space-y-5">
            <div className="rounded-[24px] border p-4" style={{ backgroundColor: '#fff7ed', borderColor: '#fdba74' }}>
              <div className="text-lg font-semibold" style={{ color: '#9a3412' }}>{student.first_name} {student.last_name}</div>
              <div className="text-sm" style={{ color: '#9a3412' }}>
                {student.admission_no} | {invoicePayload?.student?.class_name || student.class_name} {invoicePayload?.student?.section_name ? `Section ${invoicePayload.student.section_name}` : ''}
              </div>
              <div className="mt-2 text-sm font-semibold" style={{ color: Number(invoicePayload?.summary?.balance || 0) > 0 ? '#dc2626' : '#15803d' }}>
                Total pending: {formatCurrency(invoicePayload?.summary?.balance || 0)}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setSelectedInvoices((invoicePayload?.pending_invoices || []).map((row) => row.id))} className="rounded-full border px-3 py-2 text-xs font-semibold" style={{ borderColor: 'var(--color-border)' }}>Select All Pending</button>
              <button type="button" onClick={() => setSelectedInvoices([])} className="rounded-full border px-3 py-2 text-xs font-semibold" style={{ borderColor: 'var(--color-border)' }}>Clear Selection</button>
            </div>

            <div className="space-y-3">
              {(invoicePayload?.pending_invoices || []).map((invoice) => {
                const overdue = new Date(invoice.due_date) < new Date(today)
                const selected = selectedInvoices.includes(invoice.id)
                return (
                  <label key={invoice.id} className="flex items-start gap-3 rounded-[22px] border px-4 py-4" style={{ borderColor: selected ? '#fb923c' : 'var(--color-border)', backgroundColor: selected ? '#fff7ed' : 'var(--color-surface)' }}>
                    <input type="checkbox" checked={selected} onChange={() => toggleInvoice(invoice.id)} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{invoice.fee_name}</span>
                        {overdue && <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-bold text-red-700">OVERDUE</span>}
                      </div>
                      <div className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Due {formatDate(invoice.due_date)} | Amount {formatCurrency(invoice.balance)}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>

            <div className="flex items-center justify-between rounded-[22px] border px-4 py-4" style={{ backgroundColor: '#fffbeb', borderColor: '#fed7aa' }}>
              <div className="text-sm font-semibold" style={{ color: '#9a3412' }}>
                Selected: {selectedInvoices.length} invoice(s)
              </div>
              <div className="text-lg font-bold" style={{ color: '#9a3412' }}>{formatCurrency(selectedTotal)}</div>
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(0)} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: 'var(--color-border)' }}>
                <ArrowLeft size={15} />
                Back
              </button>
              <button type="button" onClick={moveToPayment} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: 'var(--color-brand)' }}>
                Next
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="rounded-[22px] border p-4" style={{ borderColor: 'var(--color-border)' }}>
              <div className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Payment Mode</div>
              <PaymentModeSelector value={paymentData.payment_mode} onChange={(payment_mode) => setPaymentData((current) => ({ ...current, payment_mode }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input value={paymentData.amount} onChange={(event) => setPaymentData((current) => ({ ...current, amount: event.target.value }))} placeholder="Payment Amount" className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
              <input type="date" max={today} value={paymentData.payment_date} onChange={(event) => setPaymentData((current) => ({ ...current, payment_date: event.target.value }))} className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
              <input value={paymentData.reference} onChange={(event) => setPaymentData((current) => ({ ...current, reference: event.target.value }))} placeholder="Reference / Transaction ID" className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
              <input value={paymentData.bank_name} onChange={(event) => setPaymentData((current) => ({ ...current, bank_name: event.target.value }))} placeholder="Bank Name" className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
              {paymentData.payment_mode === 'cheque' && (
                <>
                  <input value={paymentData.cheque_number} onChange={(event) => setPaymentData((current) => ({ ...current, cheque_number: event.target.value }))} placeholder="Cheque Number" className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
                  <input type="date" value={paymentData.cheque_date} onChange={(event) => setPaymentData((current) => ({ ...current, cheque_date: event.target.value }))} className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
                </>
              )}
            </div>
            <textarea value={paymentData.remarks} onChange={(event) => setPaymentData((current) => ({ ...current, remarks: event.target.value }))} rows={4} placeholder="Remarks" className="w-full rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: 'var(--color-border)' }}>
                <ArrowLeft size={15} />
                Back
              </button>
              <button type="button" onClick={() => setStep(3)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: 'var(--color-brand)' }}>
                Review
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-[24px] border p-5" style={{ borderColor: 'var(--color-border)' }}>
              <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Review and Confirm</div>
              <div className="mt-4 space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <div>Student: {student.first_name} {student.last_name}</div>
                <div>Invoices: {selectedRows.length}</div>
                <div>Payment Mode: {paymentData.payment_mode.toUpperCase()}</div>
                <div>Date: {formatDate(paymentData.payment_date)}</div>
                <div>Amount: {formatCurrency(paymentData.amount || 0)}</div>
              </div>
              <div className="mt-4 space-y-2">
                {selectedRows.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--color-text-primary)' }}>{invoice.fee_name}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(invoice.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: 'var(--color-border)' }}>
                <ArrowLeft size={15} />
                Back
              </button>
              <button type="button" disabled={isSaving} onClick={confirmCollection} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--color-brand)' }}>
                {isSaving ? 'Processing...' : 'Confirm & Generate Receipt'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && receipt && (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Receipt generated successfully</h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{receipt.receipt_no}</p>
              </div>
            </div>
            <ReceiptPrint receipt={receipt} />
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: 'var(--color-border)' }}>
                <Printer size={15} />
                Print Receipt
              </button>
              <button type="button" onClick={() => { setStep(0); setStudent(null); setReceipt(null); setInvoicePayload(null); setSelectedInvoices([]) }} className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: 'var(--color-brand)' }}>
                Collect Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FeeCollection
