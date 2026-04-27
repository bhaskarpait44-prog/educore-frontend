import Badge from '@/components/ui/Badge'

const TONE_MAP = {
  casual: '#0f766e',
  sick: '#ef4444',
  emergency: '#f59e0b',
  earned: '#14b8a6',
  without_pay: '#64748b',
}

const LeaveBalance = ({ balances = [] }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {balances.map((balance) => (
      <article
        key={balance.leave_type}
        className="rounded-[24px] border p-4"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
              {balance.leave_type.replace('_', ' ')}
            </p>
            <p className="mt-2 text-xl font-bold" style={{ color: TONE_MAP[balance.leave_type] || '#0f766e' }}>
              {Number(balance.remaining || 0)}
            </p>
          </div>
          <Badge variant={Number(balance.remaining || 0) > 0 ? 'green' : 'red'}>
            Remaining
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Mini label="Total" value={balance.total_allowed} />
          <Mini label="Used" value={balance.used} />
          <Mini label="Left" value={balance.remaining} />
        </div>
      </article>
    ))}
  </div>
)

const Mini = ({ label, value }) => (
  <div className="rounded-2xl px-3 py-3" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
    <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-muted)' }}>
      {label}
    </p>
    <p className="mt-2 text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
      {Number(value || 0)}
    </p>
  </div>
)

export default LeaveBalance
