import { AlertCircle, ChevronRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/helpers'

const FeeInvoiceCard = ({ invoice, onOpen }) => {
  const balance = Number(invoice?.balance_remaining || 0)
  const isOverdue = balance > 0 && invoice?.due_date && new Date(invoice.due_date) < new Date()
  const overdueDays = isOverdue ? Math.max(Math.ceil((Date.now() - new Date(invoice.due_date).getTime()) / 86400000), 1) : 0

  return (
    <button
      type="button"
      onClick={() => onOpen?.(invoice)}
      className="w-full rounded-[26px] border p-4 text-left transition hover:-translate-y-0.5"
      style={{
        borderColor: isOverdue ? '#fca5a5' : 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        boxShadow: isOverdue ? '0 18px 38px rgba(239,68,68,0.08)' : '0 14px 34px rgba(76,29,149,0.05)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{invoice.fee_type_name}</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{humanize(invoice.period)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]" style={statusStyle(invoice.status)}>
            {statusLabel(invoice.status)}
          </span>
          <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <DataCell label="Due" value={formatDate(invoice.due_date, 'short')} />
        <DataCell label="Amount" value={formatCurrency(invoice.amount_due)} />
        <DataCell label="Paid" value={formatCurrency(invoice.amount_paid || 0)} tone="#16a34a" />
        <DataCell label="Balance" value={formatCurrency(balance)} tone={balance > 0 ? '#dc2626' : '#16a34a'} />
      </div>

      {isOverdue && (
        <div className="mt-4 rounded-[18px] border px-3 py-3 text-sm" style={{ borderColor: '#fecaca', backgroundColor: 'rgba(239,68,68,0.06)' }}>
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <div className="min-w-0">
              <p className="font-semibold text-red-700 dark:text-red-300">Overdue since {overdueDays} day(s)</p>
              {Number(invoice.late_fee_amount || 0) > 0 && (
                <p className="mt-1 text-xs text-red-700/80 dark:text-red-200/80">
                  Late fee added: {formatCurrency(invoice.late_fee_amount)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </button>
  )
}

const DataCell = ({ label, value, tone = 'var(--color-text-primary)' }) => (
  <div className="rounded-[18px] border px-3 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-2 text-sm font-semibold" style={{ color: tone }}>{value}</p>
  </div>
)

function humanize(value) {
  if (!value) return '--'
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function statusLabel(status) {
  if (status === 'carried_forward') return 'Carried Forward'
  return humanize(status)
}

function statusStyle(status) {
  if (status === 'paid') return { backgroundColor: '#dcfce7', color: '#15803d' }
  if (status === 'partial') return { backgroundColor: '#fef3c7', color: '#b45309' }
  if (status === 'waived') return { backgroundColor: '#e5e7eb', color: '#4b5563' }
  if (status === 'carried_forward') return { backgroundColor: '#dbeafe', color: '#1d4ed8' }
  return { backgroundColor: '#fee2e2', color: '#dc2626' }
}

export default FeeInvoiceCard
