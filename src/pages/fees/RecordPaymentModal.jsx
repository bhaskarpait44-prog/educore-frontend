// src/pages/fees/RecordPaymentModal.jsx
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Printer, IndianRupee } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import useFeeStore from '@/store/feeStore'
import useToast from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/utils/helpers'

const schema = z.object({
  amount          : z.string().min(1, 'Amount is required')
    .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Enter a valid amount'),
  payment_mode    : z.enum(['cash','online','cheque','dd'], { required_error: 'Select payment mode' }),
  payment_date    : z.string().min(1, 'Payment date is required'),
  transaction_ref : z.string().optional(),
})

const PAYMENT_MODES = [
  { value: 'cash',   label: 'Cash — counter payment'     },
  { value: 'online', label: 'Online — UPI / NEFT / IMPS' },
  { value: 'cheque', label: 'Cheque'                     },
  { value: 'dd',     label: 'Demand Draft'                },
]

const today = () => new Date().toISOString().split('T')[0]

const RecordPaymentModal = ({ open, invoice, onClose, onSuccess }) => {
  const { toastSuccess, toastError } = useToast()
  const { recordPayment, isSaving } = useFeeStore()
  const [receipt, setReceipt] = useState(null)

  const balance = invoice
    ? parseFloat(invoice.amount_due || 0) + parseFloat(invoice.late_fee_amount || 0)
      - parseFloat(invoice.concession_amount || 0) - parseFloat(invoice.amount_paid || 0)
    : 0

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver     : zodResolver(schema),
    defaultValues: { amount: '', payment_mode: 'cash', payment_date: today(), transaction_ref: '' },
  })

  const paymentMode = watch('payment_mode')

  useEffect(() => {
    if (open && invoice) {
      reset({
        amount          : balance.toFixed(2),
        payment_mode    : 'cash',
        payment_date    : today(),
        transaction_ref : '',
      })
      setReceipt(null)
    }
  }, [open, invoice])

  const onSubmit = async (data) => {
    const result = await recordPayment({
      invoice_id      : invoice.id,
      enrollment_id   : invoice.enrollment_id,
      amount          : data.amount,
      payment_date    : data.payment_date,
      payment_mode    : data.payment_mode,
      transaction_ref : data.transaction_ref || null,
    })

    if (result.success) {
      toastSuccess(`Payment of ${formatCurrency(data.amount)} recorded`)
      setReceipt({
        ...data,
        ...result.data,
        feeName: invoice.fee_name || invoice.fee_type_name || invoice.name,
        invoiceId: invoice.id,
      })
    } else {
      toastError(result.message || 'Failed to record payment')
    }
  }

  if (!invoice) return null

  return (
    <Modal
      open={open}
      onClose={() => { receipt ? onSuccess?.() : onClose(); setReceipt(null) }}
      title={receipt ? 'Payment Receipt' : 'Record Payment'}
      size="sm"
      footer={
        receipt ? (
          <div className="flex gap-3 w-full">
            <Button variant="secondary" icon={Printer} className="flex-1"
              onClick={() => window.print()}>
              Print Receipt
            </Button>
            <Button className="flex-1" onClick={onSuccess}>Done</Button>
          </div>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} loading={isSaving}>Record Payment</Button>
          </>
        )
      }
    >
      {receipt ? (
        /* ── Receipt view ────────────────────────────────────────────── */
        <div className="space-y-4">
          <div className="flex flex-col items-center py-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: '#f0fdf4' }}
            >
              <CheckCircle2 size={28} style={{ color: '#16a34a' }} />
            </div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Payment Successful
            </h3>
          </div>

          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--color-border)' }}
          >
            {[
              { label: 'Fee',          value: receipt.feeName },
              { label: 'Amount Paid',  value: formatCurrency(receipt.amount), highlight: true },
              { label: 'Mode',         value: receipt.payment_mode?.toUpperCase() },
              { label: 'Date',         value: formatDate(receipt.payment_date) },
              receipt.transaction_ref && { label: 'Ref No', value: receipt.transaction_ref },
              { label: 'Balance Left', value: formatCurrency(receipt.balanceRemaining || 0) },
              { label: 'Invoice Status', value: receipt.newStatus?.toUpperCase() },
            ].filter(Boolean).map((row, i, arr) => (
              <div
                key={row.label}
                className="flex justify-between items-center px-4 py-3"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}
              >
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{row.label}</span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: row.highlight ? '#16a34a' : 'var(--color-text-primary)' }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Payment form ────────────────────────────────────────────── */
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Invoice summary */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Invoice</p>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              {invoice.fee_name || invoice.fee_type_name || invoice.name}
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Total Due',  value: formatCurrency(invoice.amount_due),   color: 'var(--color-text-primary)' },
                { label: 'Paid',       value: formatCurrency(invoice.amount_paid || 0), color: '#16a34a' },
                { label: 'Balance',    value: formatCurrency(balance),              color: '#dc2626' },
              ].map(c => (
                <div key={c.label}>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{c.label}</p>
                  <p className="text-sm font-bold" style={{ color: c.color }}>{c.value}</p>
                </div>
              ))}
            </div>
          </div>

          <Input
            label="Payment Amount (₹)"
            type="number"
            step="0.01"
            min="1"
            max={balance}
            required
            error={errors.amount?.message}
            hint={`Maximum payable: ${formatCurrency(balance)}`}
            icon={IndianRupee}
            {...register('amount')}
          />

          <Select
            label="Payment Mode"
            required
            options={PAYMENT_MODES}
            error={errors.payment_mode?.message}
            {...register('payment_mode')}
          />

          {(paymentMode === 'online' || paymentMode === 'cheque' || paymentMode === 'dd') && (
            <Input
              label="Transaction / Reference Number"
              placeholder={
                paymentMode === 'online' ? 'UPI transaction ID or NEFT ref' :
                paymentMode === 'cheque' ? 'Cheque number' : 'DD number'
              }
              {...register('transaction_ref')}
            />
          )}

          <Input
            label="Payment Date"
            type="date"
            max={today()}
            required
            error={errors.payment_date?.message}
            {...register('payment_date')}
          />
        </form>
      )}
    </Modal>
  )
}

export default RecordPaymentModal
