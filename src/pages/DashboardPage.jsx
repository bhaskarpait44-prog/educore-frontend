// src/pages/DashboardPage.jsx
import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, CalendarCheck, IndianRupee, ClipboardList,
  Plus, BarChart3, ArrowUpRight, RefreshCw,
  ClipboardCheck, ScrollText, AlertCircle,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react'
import useDashboardStore from '@/store/dashboardStore'
import useSessionStore   from '@/store/sessionStore'
import useAuthStore      from '@/store/authStore'
import useUiStore        from '@/store/uiStore'
import usePageTitle      from '@/hooks/usePageTitle'
import useToast          from '@/hooks/useToast'
import ProgressBar       from '@/components/ui/ProgressBar'
import AttendanceBarChart from '@/components/ui/AttendanceBarChart'
import { OldValue, NewValue } from '@/components/ui/ValueDiff'
import { ROUTES }        from '@/constants/app'
import { formatCurrency, formatDate, formatPercent, getInitials, cn } from '@/utils/helpers'

const AUTO_REFRESH_MS = 5 * 60 * 1000   // 5 minutes

const DashboardPage = () => {
  usePageTitle('Dashboard')
  const navigate  = useNavigate()
  const { toastInfo } = useToast()

  const { user }           = useAuthStore()
  const { currentSession } = useSessionStore()
  const { theme }          = useUiStore()
  const {
    stats, attendanceChart, recentAdmissions,
    feeDefaulters, recentAudit,
    isLoading, lastRefreshed, fetchAll, clearDashboard,
  } = useDashboardStore()

  const timerRef = useRef(null)

  const load = useCallback(() => {
    fetchAll(currentSession?.id).catch(() => {})
  }, [currentSession?.id])

  // Initial load + auto-refresh
  useEffect(() => {
    load()
    timerRef.current = setInterval(() => {
      load()
      toastInfo('Dashboard refreshed')
    }, AUTO_REFRESH_MS)
    return () => {
      clearInterval(timerRef.current)
      clearDashboard()
    }
  }, [load])

  const formatLastRefreshed = () => {
    if (!lastRefreshed) return ''
    return lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {currentSession
              ? `Session: ${currentSession.name} · Today is ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })}`
              : 'No active session'}
          </p>
        </div>
        <button
          onClick={() => { load(); toastInfo('Refreshing…') }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors self-start"
          style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Refresh dashboard"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          {lastRefreshed && (
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {formatLastRefreshed()}
            </span>
          )}
        </button>
      </div>

      {/* ── Section 1: Stats cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          theme={theme}
          isLoading={isLoading}
          icon={Users}
          iconColor="#2563eb"
          label="Total Students"
          value={stats?.totalStudents ?? stats?.total_students}
          sub={stats?.newThisSession ? `+${stats.newThisSession} this session` : currentSession?.name}
          trend={stats?.studentTrend}
          onClick={() => navigate(ROUTES.STUDENTS)}
        />
        <StatsCard
          theme={theme}
          isLoading={isLoading}
          icon={CalendarCheck}
          iconColor="#16a34a"
          label="Attendance Today"
          value={stats?.attendanceToday?.percentage != null
            ? formatPercent(stats.attendanceToday.percentage)
            : stats?.today_attendance?.percentage != null
            ? formatPercent(stats.today_attendance.percentage)
            : '—'}
          sub={stats?.attendanceToday
            ? `${stats.attendanceToday.present ?? 0} present · ${stats.attendanceToday.absent ?? 0} absent`
            : stats?.today_attendance
            ? `${stats.today_attendance.present ?? 0} present · ${stats.today_attendance.absent ?? 0} absent`
            : 'No data yet'}
          progress={stats?.attendanceToday?.percentage ?? stats?.today_attendance?.percentage}
          progressColor={
            (stats?.attendanceToday?.percentage ?? stats?.today_attendance?.percentage ?? 100) >= 75
              ? '#16a34a' : '#ef4444'
          }
          onClick={() => navigate(ROUTES.ATTENDANCE)}
        />
        <StatsCard
          theme={theme}
          isLoading={isLoading}
          icon={IndianRupee}
          iconColor="#d97706"
          label="Fee Collection"
          value={stats?.feeCollection
            ? formatCurrency(stats.feeCollection.collected ?? stats.feeCollection.total_paid ?? 0)
            : stats?.fee_collection
            ? formatCurrency(stats.fee_collection.collected ?? 0)
            : '—'}
          sub={stats?.feeCollection
            ? `${formatCurrency(stats.feeCollection.pending ?? 0)} pending`
            : stats?.fee_collection
            ? `${formatCurrency(stats.fee_collection.pending ?? 0)} pending`
            : 'This month'}
          progress={
            stats?.feeCollection?.percentage ??
            stats?.fee_collection?.percentage
          }
          progressColor="#d97706"
          onClick={() => navigate(ROUTES.FEES)}
        />
        <StatsCard
          theme={theme}
          isLoading={isLoading}
          icon={ClipboardList}
          iconColor="#7c3aed"
          label="Upcoming Exams"
          value={stats?.upcomingExams?.count ?? stats?.upcoming_exams?.count ?? 0}
          sub={
            (stats?.upcomingExams?.next || stats?.upcoming_exams?.next)
              ? `Next: ${stats?.upcomingExams?.next ?? stats?.upcoming_exams?.next}`
              : 'This month'
          }
          onClick={() => navigate(ROUTES.EXAMS)}
        />
      </div>

      {/* ── Section 2: Attendance Chart + Quick Actions ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Attendance chart — 2/3 width */}
        <div
          className="lg:col-span-2 p-5 rounded-2xl"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Attendance — Last 30 Days
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Green ≥ 75% · Yellow 50-75% · Red &lt; 50%
              </p>
            </div>
            <button
              onClick={() => navigate(ROUTES.ATTENDANCE)}
              className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-brand)' }}
            >
              Full report <ArrowUpRight size={12} />
            </button>
          </div>

          {isLoading ? (
            <div className="animate-pulse h-40 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          ) : (
            <AttendanceBarChart data={attendanceChart} height={150} />
          )}
        </div>

        {/* Quick Actions — 1/3 width */}
        <div
          className="p-5 rounded-2xl"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Mark Attendance',    icon: CalendarCheck, color: '#16a34a', route: ROUTES.ATTENDANCE       },
              { label: 'Admit Student',      icon: Plus,          color: '#2563eb', route: ROUTES.STUDENT_NEW      },
              { label: 'Manage Fees',        icon: IndianRupee,   color: '#d97706', route: ROUTES.FEES },
              { label: 'Enter Exam Marks',   icon: ClipboardCheck,color: '#7c3aed', route: ROUTES.EXAMS           },
            ].map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.route)}
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all text-center"
                style={{ border: '1px solid var(--color-border)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = `${action.color}10`
                  e.currentTarget.style.borderColor     = `${action.color}50`
                  e.currentTarget.style.transform       = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor     = 'var(--color-border)'
                  e.currentTarget.style.transform       = 'translateY(0)'
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <action.icon size={18} style={{ color: action.color }} />
                </div>
                <span className="text-xs font-medium leading-tight" style={{ color: 'var(--color-text-secondary)' }}>
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 3 + 4: Recent Admissions + Fee Defaulters ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent admissions */}
        <SectionCard
          title="Recent Admissions"
          action={{ label: 'All Students', onClick: () => navigate(ROUTES.STUDENTS) }}
        >
          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : recentAdmissions.length === 0 ? (
            <EmptyCard icon={Users} message="No recent admissions" />
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {recentAdmissions.slice(0, 10).map((student, i) => (
                <div
                  key={student.id || i}
                  className="flex items-center gap-3 py-3 cursor-pointer transition-colors rounded-xl px-1"
                  onClick={() => navigate(`${ROUTES.STUDENTS}/${student.id}`)}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: 'var(--color-brand)' }}
                  >
                    {getInitials(`${student.first_name} ${student.last_name}`)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                      {student.class_name || student.class || student.current_enrollment?.class || '—'}
                      {student.admission_no && ` · ${student.admission_no}`}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {formatDate(student.created_at || student.joined_date)}
                    </p>
                    <ArrowUpRight size={13} style={{ color: 'var(--color-brand)', marginLeft: 'auto', marginTop: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Fee defaulters */}
        <SectionCard
          title="Fee Defaulters"
          titleBadge={feeDefaulters.length > 0 ? feeDefaulters.length : null}
          action={{ label: 'Open Fees', onClick: () => navigate(ROUTES.FEES) }}
        >
          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : feeDefaulters.length === 0 ? (
            <EmptyCard icon={IndianRupee} message="No pending dues — all clear! 🎉" positive />
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {feeDefaulters.slice(0, 8).map((student, i) => (
                <div key={student.id || i} className="flex items-center gap-3 py-3">
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: '#dc2626' }}
                  >
                    {getInitials(student.student_name || `${student.first_name} ${student.last_name}`)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {student.student_name || `${student.first_name} ${student.last_name}`}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                      {student.class_name || student.class || '—'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold" style={{ color: '#dc2626' }}>
                      {formatCurrency(student.pending || student.balance || student.total_pending || 0)}
                    </span>
                    <button
                      onClick={() => navigate(ROUTES.FEES)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                      style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    >
                      Pay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Section 6: Recent Audit Activity ────────────────────────── */}
      <SectionCard
        title="Recent System Activity"
        icon={ScrollText}
        action={{ label: 'Full Audit Log', onClick: () => navigate(ROUTES.AUDIT) }}
      >
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : recentAudit.length === 0 ? (
          <EmptyCard icon={ScrollText} message="No recent activity" />
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {recentAudit.map((log, i) => (
              <div
                key={log.id || i}
                className="flex items-start gap-3 py-3 cursor-pointer transition-colors rounded-xl px-1"
                onClick={() => navigate(ROUTES.AUDIT)}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {/* Admin avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                  style={{ backgroundColor: 'var(--color-brand)' }}
                >
                  {(log.changed_by_name || log.admin_name || 'S')[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {log.changed_by_name || log.admin_name || `User #${log.changed_by}`}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>changed</span>
                    <span
                      className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}
                    >
                      {log.field_name}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>in</span>
                    <span
                      className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-brand)' }}
                    >
                      {log.table_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <OldValue value={log.old_value ? String(log.old_value).slice(0, 20) : null} />
                    <span className="text-xs" style={{ color: '#94a3b8' }}>→</span>
                    <NewValue value={log.new_value ? String(log.new_value).slice(0, 20) : null} />
                  </div>
                </div>

                <p className="text-xs shrink-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {new Date(log.created_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────

const StatsCard = ({
  theme,
  isLoading, icon: Icon, iconColor,
  label, value, sub, trend, progress, progressColor,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="w-full text-left p-5 rounded-2xl transition-all duration-150 group"
    style={{
      backgroundColor : 'var(--color-surface)',
      border          : '1px solid var(--color-border)',
      borderTop       : theme === 'light' ? '4px solid var(--color-success)' : '1px solid var(--color-border)',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = iconColor + '60'
      e.currentTarget.style.transform   = 'translateY(-2px)'
      e.currentTarget.style.boxShadow   = `0 8px 24px ${iconColor}15`
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--color-border)'
      e.currentTarget.style.transform   = 'translateY(0)'
      e.currentTarget.style.boxShadow   = 'none'
    }}
  >
    {isLoading ? (
      <StatCardSkeleton />
    ) : (
      <>
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${iconColor}15` }}
          >
            <Icon size={20} style={{ color: iconColor }} />
          </div>

          {trend != null && (
            <div
              className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor : trend > 0 ? '#f0fdf4' : trend < 0 ? '#fef2f2' : 'var(--color-surface-raised)',
                color           : trend > 0 ? '#16a34a' : trend < 0 ? '#dc2626' : 'var(--color-text-muted)',
              }}
            >
              {trend > 0 ? <TrendingUp size={11} /> : trend < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>

        <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
          {value ?? '—'}
        </p>
        <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </p>
        {sub && (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{sub}</p>
        )}

        {progress != null && (
          <div className="mt-3">
            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width           : `${Math.min(100, Math.max(0, progress))}%`,
                  backgroundColor : progressColor || iconColor,
                }}
              />
            </div>
          </div>
        )}
      </>
    )}
  </button>
)

const SectionCard = ({ title, titleBadge, action, icon: Icon, children }) => (
  <div
    className="rounded-2xl overflow-hidden"
    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
  >
    <div
      className="flex items-center justify-between px-5 py-4"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon size={15} style={{ color: 'var(--color-brand)' }} />}
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h3>
        {titleBadge != null && (
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}
          >
            {titleBadge}
          </span>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-brand)' }}
        >
          {action.label} <ArrowUpRight size={12} />
        </button>
      )}
    </div>
    <div className="px-5 py-3">
      {children}
    </div>
  </div>
)

const EmptyCard = ({ icon: Icon, message, positive }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    {Icon && (
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
        style={{ backgroundColor: positive ? '#f0fdf4' : 'var(--color-surface-raised)' }}
      >
        <Icon size={18} style={{ color: positive ? '#16a34a' : 'var(--color-text-muted)' }} />
      </div>
    )}
    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{message}</p>
  </div>
)

const StatCardSkeleton = () => (
  <div className="animate-pulse space-y-3">
    <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    <div className="h-7 w-24 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    <div className="h-3 w-20 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    <div className="h-3 w-28 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
  </div>
)

const ListSkeleton = ({ rows = 4 }) => (
  <div className="divide-y animate-pulse" style={{ borderColor: 'var(--color-border)' }}>
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-3">
        <div className="w-9 h-9 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-36 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          <div className="h-3 w-24 rounded"   style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        </div>
        <div className="h-3 w-14 rounded"     style={{ backgroundColor: 'var(--color-surface-raised)' }} />
      </div>
    ))}
  </div>
)

export default DashboardPage
