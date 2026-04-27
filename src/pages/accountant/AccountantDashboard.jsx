import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  CreditCard,
  IndianRupee,
  RefreshCcw,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import useAccountant from '@/hooks/useAccountant'
import usePageTitle from '@/hooks/usePageTitle'
import { ROUTES } from '@/constants/app'
import { formatCurrency, formatDate } from '@/utils/helpers'

const modePalette = {
  cash   : '#dd8d1f',
  online : '#2563eb',
  cheque : '#7c3aed',
  upi    : '#16a34a',
  dd     : '#ea580c',
}

function formatTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString('en-IN', {
    hour   : '2-digit',
    minute : '2-digit',
  })
}

function formatRefreshTime(value) {
  if (!value) return 'Just now'
  return new Date(value).toLocaleTimeString('en-IN', {
    hour   : '2-digit',
    minute : '2-digit',
    second : '2-digit',
  })
}

function DashboardCard({ title, value, subtext, accent = '#dd8d1f', children, onClick, loading = false }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className="rounded-[1.6rem] border p-5 text-left transition-transform hover:-translate-y-0.5"
      style={{
        backgroundColor : 'var(--color-surface)',
        borderColor     : 'var(--color-border)',
        boxShadow       : '0 18px 35px rgba(15, 23, 42, 0.04)',
      }}
    >
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-28 rounded-full" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          <div className="h-10 w-40 rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          <div className="h-3 w-36 rounded-full" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        </div>
      ) : (
        <>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{title}</div>
          <div className="mt-2 text-[2rem] font-bold leading-none" style={{ color: accent }}>{value}</div>
          {subtext ? (
            <div className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>{subtext}</div>
          ) : null}
          {children ? <div className="mt-4">{children}</div> : null}
        </>
      )}
    </Tag>
  )
}

function MiniProgress({ value }) {
  return (
    <div className="mt-4">
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width           : `${Math.min(100, Math.max(0, value || 0))}%`,
            backgroundImage : 'linear-gradient(90deg, #f59e0b, #ea580c)',
          }}
        />
      </div>
    </div>
  )
}

function CircularProgress({ value }) {
  const safeValue = Math.min(100, Math.max(0, value || 0))
  const angle = safeValue * 3.6
  return (
    <div
      className="relative h-28 w-28 rounded-full"
      style={{
        background: `conic-gradient(#f59e0b ${angle}deg, var(--color-surface-raised) ${angle}deg)`,
      }}
    >
      <div
        className="absolute inset-[11px] flex items-center justify-center rounded-full"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="text-center">
          <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{safeValue.toFixed(0)}%</div>
          <div className="text-[0.7rem]" style={{ color: 'var(--color-text-muted)' }}>Collected</div>
        </div>
      </div>
    </div>
  )
}

function ModePie({ entries }) {
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0)
  let currentAngle = 0
  const segments = entries
    .filter((entry) => entry.amount > 0)
    .map((entry) => {
      const angle = total > 0 ? (entry.amount / total) * 360 : 0
      const start = currentAngle
      currentAngle += angle
      return `${entry.color} ${start}deg ${currentAngle}deg`
    })

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
      <div
        className="mx-auto h-52 w-52 rounded-full"
        style={{
          background : segments.length ? `conic-gradient(${segments.join(', ')})` : 'var(--color-surface-raised)',
          boxShadow  : 'inset 0 0 0 14px rgba(255,255,255,0.82)',
        }}
      />
      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        {entries.map((entry) => {
          const percent = total > 0 ? (entry.amount / total) * 100 : 0
          return (
            <div
              key={entry.key}
              className="rounded-2xl border p-3"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.label}
              </div>
              <div className="mt-1 text-lg font-bold" style={{ color: entry.color }}>{formatCurrency(entry.amount)}</div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{percent.toFixed(1)}% of today</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekTrendChart({ items }) {
  const max = Math.max(...items.map((item) => item.total), 1)
  return (
    <div className="grid grid-cols-7 gap-3">
      {items.map((item) => (
        <div key={item.date} className="flex flex-col items-center gap-2">
          <div className="flex h-36 items-end">
            <div
              className="w-9 rounded-t-2xl transition-all duration-500"
              style={{
                height         : `${Math.max(10, (item.total / max) * 100)}%`,
                backgroundImage: 'linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)',
              }}
            />
          </div>
          <div className="text-center">
            <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {new Date(item.date).toLocaleDateString('en-IN', { weekday: 'short' })}
            </div>
            <div className="text-[0.7rem]" style={{ color: 'var(--color-text-muted)' }}>
              {formatCurrency(item.total)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AccountantDashboard() {
  usePageTitle('Accountant Dashboard')
  const navigate = useNavigate()
  const {
    dashboardSummary,
    dashboardTodayStats,
    dashboardTransactions,
    dashboardTasks,
    dashboardWeekTrend,
    dashboardLastRefreshedAt,
    isDashboardLoading,
    fetchDashboard,
    refreshDashboardTransactions,
  } = useAccountant()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const runDashboardFetch = useEffectEvent((options) => fetchDashboard(options))
  const runTransactionsRefresh = useEffectEvent(() => refreshDashboardTransactions())

  useEffect(() => {
    runDashboardFetch()
  }, [runDashboardFetch])

  useEffect(() => {
    const statsTimer = window.setInterval(() => {
      runDashboardFetch({ silent: true }).catch(() => {})
    }, 60000)

    const feedTimer = window.setInterval(() => {
      runTransactionsRefresh().catch(() => {})
    }, 30000)

    return () => {
      window.clearInterval(statsTimer)
      window.clearInterval(feedTimer)
    }
  }, [runDashboardFetch, runTransactionsRefresh])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchDashboard({ silent: true })
    } finally {
      setIsRefreshing(false)
    }
  }

  const summary = dashboardSummary || {}
  const todayStats = dashboardTodayStats || {}
  const todayCollection = summary.today_collection || {}
  const pendingToday = summary.pending_collection_today || {}
  const month = todayStats.month || {}
  const session = summary.session_overview || {}

  const paymentModes = useMemo(() => {
    const byMode = todayCollection.by_mode || {}
    return [
      { key: 'cash', label: 'Cash', amount: Number(byMode.cash || 0), color: modePalette.cash },
      { key: 'online', label: 'Online', amount: Number(byMode.online || 0), color: modePalette.online },
      { key: 'cheque', label: 'Cheque', amount: Number(byMode.cheque || 0), color: modePalette.cheque },
      { key: 'upi', label: 'UPI', amount: Number(byMode.upi || 0), color: modePalette.upi },
      { key: 'dd', label: 'DD', amount: Number(byMode.dd || 0), color: modePalette.dd },
    ]
  }, [todayCollection.by_mode])

  const difference = Number(todayCollection.difference_vs_yesterday || 0)
  const comparisonText = difference >= 0
    ? `${formatCurrency(Math.abs(difference))} more than yesterday`
    : `${formatCurrency(Math.abs(difference))} less than yesterday`

  const collectionPercent = session.expected > 0
    ? (Number(session.collected || 0) / Number(session.expected || 0)) * 100
    : 0

  const weekTrend = useMemo(() => {
    if (dashboardWeekTrend.length > 0) return dashboardWeekTrend.map((item) => ({ ...item, total: Number(item.total || 0) }))
    const dates = []
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date()
      day.setDate(day.getDate() - i)
      dates.push({
        date  : day.toISOString().split('T')[0],
        total : 0,
      })
    }
    return dates
  }, [dashboardWeekTrend])

  return (
    <div className="space-y-6">
      <section
        className="rounded-[1.8rem] border p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.14), rgba(234,88,12,0.08), var(--color-surface))',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--color-text-muted)' }}>
              Daily Counter Overview
            </div>
            <h1 className="mt-1 text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {summary.greeting || 'Good morning Accountant'}
            </h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <span>Today: {formatDate(summary.today || new Date(), 'long')}</span>
              <span>Session: {summary.session || 'Current Session'}</span>
              <span>Your role: {String(summary.role || 'Accountant').replace(/_/g, ' ')}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className="rounded-2xl border px-4 py-3 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <div style={{ color: 'var(--color-text-muted)' }}>Last refreshed</div>
              <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {formatRefreshTime(dashboardLastRefreshedAt)}
              </div>
            </div>
            <button
              type="button"
              onClick={handleManualRefresh}
              className="rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
            >
              <RefreshCcw size={14} className={`mr-2 inline ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Now
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        <DashboardCard
          title="Today's Collection"
          value={formatCurrency(todayCollection.total || 0)}
          subtext={`${todayCollection.transactions || 0} transactions today`}
          accent="#dd8d1f"
          loading={isDashboardLoading}
          onClick={() => navigate(ROUTES.ACCOUNTANT_COLLECTION)}
        >
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold"
              style={{
                backgroundColor: difference >= 0 ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)',
                color: difference >= 0 ? '#15803d' : '#dc2626',
              }}
            >
              {difference >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {comparisonText}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-2xl p-3" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
              <div style={{ color: 'var(--color-text-muted)' }}>Cash</div>
              <div className="mt-1 font-semibold">{formatCurrency(todayCollection.by_mode?.cash || 0)}</div>
            </div>
            <div className="rounded-2xl p-3" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
              <div style={{ color: 'var(--color-text-muted)' }}>Online</div>
              <div className="mt-1 font-semibold">{formatCurrency((todayCollection.by_mode?.online || 0) + (todayCollection.by_mode?.upi || 0))}</div>
            </div>
            <div className="rounded-2xl p-3" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
              <div style={{ color: 'var(--color-text-muted)' }}>Cheque</div>
              <div className="mt-1 font-semibold">{formatCurrency(todayCollection.by_mode?.cheque || 0)}</div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Pending Collection Today"
          value={formatCurrency(pendingToday.expected_amount || 0)}
          subtext={`${pendingToday.students || 0} students due today`}
          accent="#dc2626"
          loading={isDashboardLoading}
          onClick={() => navigate(ROUTES.ACCOUNTANT_COLLECTION)}
        >
          <button
            type="button"
            onClick={() => navigate(ROUTES.ACCOUNTANT_COLLECTION)}
            className="mt-1 rounded-2xl px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: '#dc2626' }}
          >
            Quick Collect
          </button>
        </DashboardCard>

        <DashboardCard
          title="This Month So Far"
          value={formatCurrency(month.collected || 0)}
          subtext={`${month.days_remaining ?? '—'} days remaining in month`}
          accent="#2563eb"
          loading={isDashboardLoading}
          onClick={() => navigate(ROUTES.ACCOUNTANT_REPORT_MONTHLY)}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span>Target: {formatCurrency(month.target_amount || 0)}</span>
            <span>{Number(month.progress_percent || 0).toFixed(1)}%</span>
          </div>
          <MiniProgress value={Number(month.progress_percent || 0)} />
        </DashboardCard>

        <DashboardCard
          title="Session Overview"
          value={formatCurrency(session.expected || 0)}
          subtext={`Pending: ${formatCurrency(session.pending || 0)}`}
          accent="#7c3aed"
          loading={isDashboardLoading}
        >
          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="space-y-2 text-xs">
              <div>
                <div style={{ color: 'var(--color-text-muted)' }}>Expected</div>
                <div className="font-semibold">{formatCurrency(session.expected || 0)}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-muted)' }}>Collected</div>
                <div className="font-semibold" style={{ color: '#15803d' }}>{formatCurrency(session.collected || 0)}</div>
              </div>
            </div>
            <CircularProgress value={collectionPercent} />
          </div>
        </DashboardCard>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.95fr]">
        <div
          className="rounded-[1.6rem] border"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <div className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Real Time Feed</div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Last 10 transactions · auto refresh every 30 seconds</div>
            </div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.ACCOUNTANT_RECEIPTS)}
              className="text-sm font-semibold"
              style={{ color: '#dd8d1f' }}
            >
              Receipt History
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>
                  {['Time', 'Student', 'Class', 'Amount', 'Mode', 'Receipt No'].map((heading) => (
                    <th key={heading} className="px-5 py-3">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(dashboardTransactions || []).length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      No transactions yet for today.
                    </td>
                  </tr>
                ) : (
                  dashboardTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="cursor-pointer border-t transition-colors hover:bg-amber-50/40 dark:hover:bg-white/5"
                      style={{ borderColor: 'var(--color-border)' }}
                      onClick={() => navigate(`${ROUTES.ACCOUNTANT_RECEIPTS}?receipt=${tx.receipt_no || tx.id}`)}
                    >
                      <td className="px-5 py-4 text-sm">{formatTime(tx.created_at || tx.payment_date)}</td>
                      <td className="px-5 py-4">
                        <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{tx.student_name}</div>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{tx.class_name}</td>
                      <td className="px-5 py-4 text-sm font-semibold" style={{ color: '#15803d' }}>{formatCurrency(tx.amount)}</td>
                      <td className="px-5 py-4 text-sm uppercase" style={{ color: 'var(--color-text-secondary)' }}>{tx.payment_mode_display || tx.payment_mode}</td>
                      <td className="px-5 py-4 text-sm font-mono" style={{ color: '#dd8d1f' }}>{tx.receipt_no || `RCP-${tx.id}`}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div
            className="rounded-[1.6rem] border p-5"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} style={{ color: '#dd8d1f' }} />
              <div className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Pending Tasks</div>
            </div>
            <div className="mt-4 space-y-3">
              {dashboardTasks.length === 0 ? (
                <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}>
                  No pending tasks right now.
                </div>
              ) : (
                dashboardTasks.map((task) => (
                  <button
                    key={task.key}
                    type="button"
                    onClick={() => navigate(task.action || ROUTES.ACCOUNTANT_DASHBOARD)}
                    className="flex w-full items-start justify-between rounded-2xl border p-4 text-left transition-colors hover:bg-amber-50/40 dark:hover:bg-white/5"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {String(task.key || '').replace(/_/g, ' ')}
                      </div>
                      <div className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Action needed on {task.count || 0} items
                      </div>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: 'rgba(221,141,31,0.12)', color: '#dd8d1f' }}>
                      {task.count || 0}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div
            className="rounded-[1.6rem] border p-5"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-2">
              <Clock3 size={18} style={{ color: '#2563eb' }} />
              <div className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Refresh Rules</div>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-2xl p-3" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
                <div className="font-semibold">Dashboard cards</div>
                <div style={{ color: 'var(--color-text-muted)' }}>Auto refresh every 60 seconds</div>
              </div>
              <div className="rounded-2xl p-3" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
                <div className="font-semibold">Transaction feed</div>
                <div style={{ color: 'var(--color-text-muted)' }}>Auto refresh every 30 seconds</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div
          className="rounded-[1.6rem] border p-5"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Wallet size={18} style={{ color: '#dd8d1f' }} />
            <div>
              <div className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Payment Mode Chart</div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Today&apos;s collection by payment mode</div>
            </div>
          </div>
          <ModePie entries={paymentModes} />
        </div>

        <div
          className="rounded-[1.6rem] border p-5"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={18} style={{ color: '#16a34a' }} />
            <div>
              <div className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Week Trend</div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Last 7 days collection pattern</div>
            </div>
          </div>
          <WeekTrendChart items={weekTrend} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div
          className="rounded-[1.6rem] border p-5"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <Target size={18} style={{ color: '#2563eb' }} />
            <div className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Projected Monthly Total</div>
          </div>
          <div className="mt-4 text-3xl font-bold" style={{ color: '#2563eb' }}>
            {formatCurrency(month.days_remaining >= 0
              ? ((Number(month.collected || 0) / Math.max(1, new Date().getDate())) * (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()))
              : Number(month.collected || 0))}
          </div>
          <div className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Based on current daily average collection.
          </div>
        </div>

        <div
          className="rounded-[1.6rem] border p-5"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <IndianRupee size={18} style={{ color: '#15803d' }} />
            <div className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Collected So Far</div>
          </div>
          <div className="mt-4 text-3xl font-bold" style={{ color: '#15803d' }}>{formatCurrency(session.collected || 0)}</div>
          <div className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Against session expected amount of {formatCurrency(session.expected || 0)}.
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate(ROUTES.ACCOUNTANT_COLLECTION)}
          className="rounded-[1.6rem] border p-5 text-left transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderColor: '#f59e0b', color: '#fff' }}
        >
          <CreditCard size={22} />
          <div className="mt-5 text-2xl font-bold">+ Collect Fee</div>
          <div className="mt-2 text-sm text-amber-50">
            Open the fee collection workflow instantly for counter use.
          </div>
        </button>
      </section>
    </div>
  )
}
