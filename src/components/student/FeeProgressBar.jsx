import { formatCurrency, formatDate } from '@/utils/helpers'

const FeeProgressBar = ({ summary }) => {
  const total = Number(summary?.total_fee || 0)
  const paid = Number(summary?.total_paid || 0)
  const pending = Number(summary?.total_pending || 0)
  const percentPaid = total > 0 ? Math.min((paid / total) * 100, 100) : 0

  return (
    <section
      className="rounded-[28px] border p-5 sm:p-6"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Fee Summary</p>
          <h2 className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">{formatCurrency(total)}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Total fee this session</p>
        </div>
        <div className="rounded-[22px] border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Next Due Date</p>
          <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">{summary?.next_due_date ? formatDate(summary.next_due_date, 'long') : 'No upcoming due'}</p>
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--color-surface-raised)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentPaid}%`,
            background: 'linear-gradient(90deg, #16a34a, #22c55e)',
          }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em]">
        <span style={{ color: '#15803d' }}>{Math.round(percentPaid)}% paid</span>
        <span className="text-[var(--color-text-muted)]">{formatCurrency(pending)} pending</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MiniAmount label="Paid" value={formatCurrency(paid)} tone="#16a34a" />
        <MiniAmount label="Pending" value={formatCurrency(pending)} tone={pending > 0 ? '#dc2626' : '#16a34a'} />
      </div>
    </section>
  )
}

const MiniAmount = ({ label, value, tone }) => (
  <div className="rounded-[22px] border px-4 py-4" style={{ borderColor: `${tone}22`, backgroundColor: `${tone}10` }}>
    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: tone }}>{label}</p>
    <p className="mt-2 text-lg font-bold text-[var(--color-text-primary)]">{value}</p>
  </div>
)

export default FeeProgressBar
