import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react'
import { ROUTES } from '@/constants/app'
import usePageTitle from '@/hooks/usePageTitle'
import useAccountantDashboard from '@/hooks/useAccountantDashboard'
import CollectionChart from '@/components/accountant/CollectionChart'
import { formatCurrency, formatDate } from '@/utils/helpers'
import useAuthStore from '@/store/authStore'

const StatCard = ({ title, value, sub, children }) => (
  <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>{title}</p>
    <p className="mt-3 text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
    {sub && <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{sub}</p>}
    {children}
  </div>
)

const AccountantDashboard = () => {
  usePageTitle('Accountant Dashboard')
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { dashboard, todayStats, recentTransactions, pendingTasks, weekTrend, isLoading, refresh } = useAccountantDashboard()

  const collectionDelta = Number(todayStats?.today?.difference_from_yesterday || 0)
  const collectionDirection = collectionDelta >= 0
  const modeBreakdown = todayStats?.today?.mode_breakdown || []
  const circularPct = Number(todayStats?.session_overview?.collection_percentage || dashboard?.summary?.collection_rate || 0)
  const progressAngle = `${Math.max(Math.min(circularPct, 100), 0) * 3.6}deg`
  const weekMax = Math.max(...weekTrend.map((item) => Number(item.amount || 0)), 1)

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[32px] border p-6" style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)', borderColor: '#fdba74' }}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: '#9a3412' }}>{greeting}</p>
          <h1 className="mt-2 text-3xl font-bold" style={{ color: '#7c2d12' }}>{user?.name || 'Accountant'}</h1>
          <p className="mt-2 text-sm" style={{ color: '#9a3412' }}>
            Today: {formatDate(new Date(), 'long')} | Session: {dashboard?.session_id || todayStats?.session?.name || 'Current'} | Your role: {user?.role || 'accountant'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refresh().catch(() => {})}
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
          style={{ borderColor: '#fdba74', color: '#9a3412', backgroundColor: '#fff' }}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <StatCard
          title="Today's Collection"
          value={formatCurrency(todayStats?.today?.total_amount || 0)}
          sub={`${todayStats?.today?.transaction_count || 0} transaction(s)`}
        >
          <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: collectionDirection ? '#15803d' : '#dc2626' }}>
            {collectionDirection ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {formatCurrency(Math.abs(collectionDelta))} {collectionDirection ? 'more' : 'less'} than yesterday
          </div>
        </StatCard>

        <StatCard
          title="Pending Collection Today"
          value={formatCurrency(todayStats?.pending_today?.amount || 0)}
          sub={`${todayStats?.pending_today?.student_count || 0} students pending today`}
        />

        <StatCard
          title="This Month So Far"
          value={formatCurrency(todayStats?.month?.total_amount || 0)}
          sub={`Target ${formatCurrency(todayStats?.month?.target_amount || 0)}`}
        >
          <div className="mt-4 h-2 rounded-full" style={{ backgroundColor: '#ffedd5' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${todayStats?.month?.target_amount ? Math.min((Number(todayStats.month.total_amount || 0) / Number(todayStats.month.target_amount || 1)) * 100, 100) : 0}%`,
                backgroundColor: 'var(--color-brand)',
              }}
            />
          </div>
        </StatCard>

        <StatCard title="Session Overview" value={formatCurrency(todayStats?.session_overview?.total_pending || 0)} sub="Pending amount in current session">
          <div className="mt-4 flex items-center gap-4">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full text-lg font-bold"
              style={{ background: `conic-gradient(var(--color-brand) 0 ${progressAngle}, #ffedd5 ${progressAngle} 360deg)` }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-sm font-bold text-amber-700">
                {circularPct.toFixed(0)}%
              </div>
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Collected {formatCurrency(todayStats?.session_overview?.total_collected || 0)}
              <br />
              Expected {formatCurrency(todayStats?.session_overview?.total_expected || 0)}
            </div>
          </div>
        </StatCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Last 10 transactions</h2>
            {isLoading && <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Refreshing...</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Time', 'Student', 'Class', 'Amount', 'Mode', 'Receipt'].map((head) => (
                    <th key={head} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => navigate(ROUTES.ACCOUNTANT_RECEIPT_DETAIL.replace(':id', row.id))}
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(row.payment_date)}</td>
                    <td className="px-3 py-3 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{row.student_name}</td>
                    <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{row.class_name}</td>
                    <td className="px-3 py-3 text-sm font-semibold" style={{ color: '#15803d' }}>{formatCurrency(row.amount)}</td>
                    <td className="px-3 py-3 text-sm capitalize" style={{ color: 'var(--color-text-secondary)' }}>{row.payment_mode}</td>
                    <td className="px-3 py-3 text-xs font-semibold" style={{ color: '#c2410c' }}>{row.receipt_no}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Payment Mode Chart</h2>
            <CollectionChart items={modeBreakdown} />
          </div>

          <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Week Trend</h2>
            <div className="flex items-end gap-3">
              {weekTrend.map((item) => (
                <div key={item.collection_date} className="flex-1 text-center">
                  <div className="mx-auto flex h-32 items-end">
                    <div
                      className="w-full rounded-t-2xl"
                      style={{
                        height: `${Math.max((Number(item.amount || 0) / weekMax) * 100, 8)}%`,
                        backgroundColor: 'var(--color-brand)',
                      }}
                    />
                  </div>
                  <div className="mt-2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{formatDate(item.collection_date)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Pending Tasks</h2>
            <div className="space-y-3">
              {(pendingTasks || []).map((task) => (
                <div key={task.key} className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{task.count || 0} {task.label}</div>
                    {task.amount ? <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(task.amount)}</div> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(task.route)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: 'var(--color-brand)' }}
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate(ROUTES.ACCOUNTANT_COLLECTION)}
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg"
        style={{ backgroundColor: 'var(--color-brand)' }}
      >
        <Plus size={16} />
        Collect Fee
      </button>
    </div>
  )
}

export default AccountantDashboard
