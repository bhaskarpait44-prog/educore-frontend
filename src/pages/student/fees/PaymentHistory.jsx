import { useEffect, useMemo, useState } from 'react'
import { Download, Receipt, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentFees from '@/hooks/useStudentFees'
import useToast from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/utils/helpers'

const PaymentHistory = () => {
  usePageTitle('Payment History')

  const { toastError, toastInfo, toastSuccess } = useToast()
  const {
    payments,
    loading,
    refreshing,
    receiptLoadingId,
    error,
    refresh,
    fetchReceipt,
  } = useStudentFees()

  const [modeFilter, setModeFilter] = useState('all')
  const [receipt, setReceipt] = useState(null)

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const filteredPayments = useMemo(() => {
    if (modeFilter === 'all') return payments
    return payments.filter((payment) => payment.payment_mode === modeFilter)
  }, [modeFilter, payments])

  const openReceipt = async (paymentId) => {
    try {
      const data = await fetchReceipt(paymentId)
      setReceipt(data)
    } catch (err) {
      toastError(err?.message || 'Unable to load receipt.')
    }
  }

  const printReceipt = () => {
    if (!receipt) return
    const popup = window.open('', '_blank', 'noopener,noreferrer')
    if (!popup) {
      toastError('Unable to open receipt print window.')
      return
    }

    popup.document.write(`
      <html>
        <head>
          <title>Receipt ${receipt.receipt_no || ''}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 24px; }
            .wrap { max-width: 720px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 18px; padding: 24px; }
            h1 { margin: 0 0 6px; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
            .item { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; background: #f8fafc; }
            .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
            .value { margin-top: 8px; font-size: 15px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <h1>Fee Receipt</h1>
            <p>Student payment receipt</p>
            <div class="grid">
              <div class="item"><div class="label">Receipt No</div><div class="value">${receipt.receipt_no || '--'}</div></div>
              <div class="item"><div class="label">Date</div><div class="value">${formatDate(receipt.payment_date, 'long')}</div></div>
              <div class="item"><div class="label">Fee Type</div><div class="value">${receipt.fee_type_name || '--'}</div></div>
              <div class="item"><div class="label">Payment Mode</div><div class="value">${String(receipt.payment_mode || '').toUpperCase()}</div></div>
              <div class="item"><div class="label">Amount</div><div class="value">${formatCurrency(receipt.amount)}</div></div>
              <div class="item"><div class="label">Balance After</div><div class="value">${formatCurrency(receipt.balance_after || 0)}</div></div>
            </div>
          </div>
        </body>
      </html>
    `)
    popup.document.close()
    popup.focus()
    popup.print()
    toastSuccess('Receipt opened for print/PDF.')
  }

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(109,40,217,0.16), rgba(34,197,94,0.05) 52%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--student-accent)' }}>
              Fees
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Payment History</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
              Every payment recorded against your account, with receipt details available one row at a time.
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={async () => {
              toastInfo('Refreshing payment history')
              await refresh()
            }}
            loading={refreshing}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      </section>

      <section
        className="rounded-[28px] border p-5"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['all', 'cash', 'online', 'cheque', 'dd'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setModeFilter(mode)}
              className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] whitespace-nowrap"
              style={{
                backgroundColor: modeFilter === mode ? 'var(--student-accent)' : 'var(--color-surface-raised)',
                color: modeFilter === mode ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 rounded-[24px] bg-[var(--color-surface-raised)]" />)}
            </div>
          ) : filteredPayments.length > 0 ? (
            filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-[24px] border p-4"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{payment.fee_type_name}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      {formatDate(payment.payment_date, 'long')} • {String(payment.payment_mode || '').toUpperCase()} • Receipt {payment.receipt_no || '--'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Download}
                      loading={receiptLoadingId === payment.id}
                      onClick={() => openReceipt(payment.id)}
                    >
                      Receipt
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={Receipt}
              title="No payments found"
              description="Payments matching this filter will appear here."
            />
          )}
        </div>
      </section>

      <Modal
        open={Boolean(receipt)}
        onClose={() => setReceipt(null)}
        title="Receipt Detail"
        footer={
          <div className="flex w-full justify-between gap-3">
            <Button variant="secondary" onClick={() => setReceipt(null)}>Close</Button>
            <Button onClick={printReceipt} icon={Download}>Print / Save PDF</Button>
          </div>
        }
      >
        {receipt && (
          <div className="space-y-3">
            <ReceiptRow label="Receipt No" value={receipt.receipt_no} />
            <ReceiptRow label="Fee Type" value={receipt.fee_type_name} />
            <ReceiptRow label="Payment Date" value={formatDate(receipt.payment_date, 'long')} />
            <ReceiptRow label="Payment Mode" value={String(receipt.payment_mode || '').toUpperCase()} />
            <ReceiptRow label="Amount" value={formatCurrency(receipt.amount)} />
            <ReceiptRow label="Balance After" value={formatCurrency(receipt.balance_after || 0)} />
          </div>
        )}
      </Modal>
    </div>
  )
}

const ReceiptRow = ({ label, value }) => (
  <div className="rounded-[20px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">{value || '--'}</p>
  </div>
)

export default PaymentHistory
