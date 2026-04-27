import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Download, Receipt, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import FeeProgressBar from '@/components/student/FeeProgressBar'
import FeeInvoiceCard from '@/components/student/FeeInvoiceCard'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentFees from '@/hooks/useStudentFees'
import useToast from '@/hooks/useToast'
import { ROUTES } from '@/constants/app'
import { formatCurrency, formatDate } from '@/utils/helpers'

const filters = ['all', 'pending', 'paid', 'partial', 'waived', 'carried_forward']

const MyFees = () => {
  usePageTitle('My Fees')

  const navigate = useNavigate()
  const { toastError, toastInfo, toastSuccess } = useToast()
  const {
    summary,
    invoices,
    carriedForwardInvoices,
    loading,
    refreshing,
    detailLoading,
    selectedInvoice,
    error,
    refresh,
    openInvoice,
    closeInvoice,
    fetchReceipt,
  } = useStudentFees()

  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const filteredInvoices = useMemo(() => {
    if (filter === 'all') return invoices
    return invoices.filter((invoice) => invoice.status === filter)
  }, [filter, invoices])

  const miniCards = [
    { label: 'This Month Due', value: formatCurrency(sumByStatus(invoices, ['pending', 'partial'])), tone: '#dc2626' },
    { label: 'Paid', value: formatCurrency(summary?.total_paid || 0), tone: '#16a34a' },
    { label: 'Balance', value: formatCurrency(summary?.total_pending || 0), tone: Number(summary?.total_pending || 0) > 0 ? '#dc2626' : '#16a34a' },
  ]

  const handleRefresh = async () => {
    toastInfo('Refreshing fee details')
    try {
      await refresh()
    } catch {}
  }

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(109,40,217,0.16), rgba(239,68,68,0.05) 52%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--student-accent)' }}>
              Student Fees
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">My Fees</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
              Track session fees, see pending balances, open invoice details, and review payment history and receipts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleRefresh} loading={refreshing} icon={RefreshCw}>
              Refresh
            </Button>
            <Button variant="secondary" onClick={() => navigate(ROUTES.STUDENT_FEE_PAYMENTS)} icon={Receipt}>
              Payment History
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <FeesSkeleton />
      ) : (
        <>
          <FeeProgressBar summary={summary} />

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {miniCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[24px] border p-4"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{card.label}</p>
                <p className="mt-2 text-2xl font-bold" style={{ color: card.tone }}>{card.value}</p>
              </div>
            ))}
          </section>

          {carriedForwardInvoices.length > 0 && (
            <section
              className="rounded-[28px] border p-5"
              style={{ borderColor: '#93c5fd', backgroundColor: 'rgba(37,99,235,0.06)' }}
            >
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Carried from Previous Session</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                These invoices include balances carried forward into the current session.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3">
                {carriedForwardInvoices.map((invoice) => (
                  <FeeInvoiceCard key={invoice.id} invoice={invoice} onOpen={(row) => openInvoice(row.id).catch((err) => toastError(err?.message || 'Unable to load invoice detail.'))} />
                ))}
              </div>
            </section>
          )}

          <section
            className="rounded-[28px] border p-5"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Current Session Invoices</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Tap any invoice card to view fee breakup and payment history for that invoice.
                </p>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {filters.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] whitespace-nowrap"
                    style={{
                      backgroundColor: filter === item ? 'var(--student-accent)' : 'var(--color-surface-raised)',
                      color: filter === item ? '#fff' : 'var(--color-text-secondary)',
                    }}
                  >
                    {item.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <FeeInvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                    onOpen={(row) => openInvoice(row.id).catch((err) => toastError(err?.message || 'Unable to load invoice detail.'))}
                  />
                ))
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title="No invoices in this filter"
                  description="Try another fee status filter to see your invoices."
                />
              )}
            </div>
          </section>
        </>
      )}

      <Modal
        open={Boolean(selectedInvoice)}
        onClose={closeInvoice}
        title="Invoice Detail"
        size="lg"
        footer={
          <div className="flex w-full justify-between gap-3">
            <Button variant="secondary" onClick={closeInvoice}>Close</Button>
            <Button variant="secondary" onClick={() => navigate(ROUTES.STUDENT_FEE_PAYMENTS)} icon={Receipt}>
              All Payments
            </Button>
          </div>
        }
      >
        {detailLoading && !selectedInvoice ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 rounded-2xl bg-[var(--color-surface-raised)]" />
            <div className="h-36 rounded-2xl bg-[var(--color-surface-raised)]" />
          </div>
        ) : selectedInvoice && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoCard label="Fee Type" value={selectedInvoice.fee_type_name} />
              <InfoCard label="Period" value={selectedInvoice.period} />
              <InfoCard label="Due Date" value={formatDate(selectedInvoice.due_date, 'long')} />
              <InfoCard label="Status" value={selectedInvoice.status} />
              <InfoCard label="Original Amount" value={formatCurrency(selectedInvoice.original_amount)} />
              <InfoCard label="Total Payable" value={formatCurrency(selectedInvoice.total_payable)} />
              <InfoCard label="Concession" value={formatCurrency(selectedInvoice.concession_amount || 0)} />
              <InfoCard label="Late Fee" value={formatCurrency(selectedInvoice.late_fee_amount || 0)} />
              <InfoCard label="Amount Paid" value={formatCurrency(selectedInvoice.amount_paid || 0)} />
              <InfoCard label="Balance Remaining" value={formatCurrency(selectedInvoice.balance_remaining || 0)} />
            </div>

            <section
              className="rounded-[24px] border p-4"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
            >
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Payment History for This Invoice</h3>
              <div className="mt-4 space-y-3">
                {selectedInvoice.payments?.length ? selectedInvoice.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-3 rounded-[18px] border px-3 py-3"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{formatCurrency(payment.amount)}</p>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                        {formatDate(payment.payment_date, 'short')} • {String(payment.payment_mode || '').toUpperCase()} • {payment.receipt_no || 'No receipt no'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Download}
                      onClick={async () => {
                        try {
                          const receipt = await fetchReceipt(payment.id)
                          toastSuccess(`Receipt ${receipt?.receipt_no || payment.receipt_no || 'loaded'}`)
                          navigate(ROUTES.STUDENT_FEE_PAYMENTS)
                        } catch (err) {
                          toastError(err?.message || 'Unable to load receipt.')
                        }
                      }}
                    >
                      Receipt
                    </Button>
                  </div>
                )) : (
                  <EmptyState
                    icon={Receipt}
                    title="No payments on this invoice yet"
                    description="Payment rows will appear here when any amount is recorded."
                    className="py-10"
                  />
                )}
              </div>
            </section>
          </div>
        )}
      </Modal>
    </div>
  )
}

const InfoCard = ({ label, value }) => (
  <div className="rounded-[20px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">{value || '--'}</p>
  </div>
)

const FeesSkeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="rounded-[28px] bg-[var(--color-surface)] p-10" />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-24 rounded-[24px] bg-[var(--color-surface)]" />)}
    </div>
    <div className="rounded-[28px] bg-[var(--color-surface)] p-12" />
  </div>
)

function sumByStatus(invoices, statuses) {
  return invoices
    .filter((invoice) => statuses.includes(invoice.status))
    .reduce((sum, invoice) => sum + Number(invoice.balance_remaining || 0), 0)
}

export default MyFees
