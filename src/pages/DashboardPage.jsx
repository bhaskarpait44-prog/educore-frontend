// src/pages/DashboardPage.jsx
import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, CalendarCheck, IndianRupee, ClipboardList,
  Plus, ArrowUpRight, RefreshCw, ClipboardCheck,
  ScrollText, TrendingUp, TrendingDown, Minus,
  ChevronRight, Bell, Wifi, WifiOff,
} from 'lucide-react'
import useDashboardStore from '@/store/dashboardStore'
import useSessionStore   from '@/store/sessionStore'
import useAuthStore      from '@/store/authStore'
import useUiStore        from '@/store/uiStore'
import usePageTitle      from '@/hooks/usePageTitle'
import useToast          from '@/hooks/useToast'
import AttendanceBarChart from '@/components/ui/AttendanceBarChart'
import { OldValue, NewValue } from '@/components/ui/ValueDiff'
import { ROUTES }        from '@/constants/app'
import { formatCurrency, formatDate, formatPercent, getInitials } from '@/utils/helpers'

const AUTO_REFRESH_MS = 5 * 60 * 1000

// ── Palette helpers ──────────────────────────────────────────────────────
const CARD_ACCENTS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed']

// ── Main Component ───────────────────────────────────────────────────────
const DashboardPage = () => {
  usePageTitle('Dashboard')
  const navigate      = useNavigate()
  const { toastInfo } = useToast()

  const { user }           = useAuthStore()
  const { currentSession } = useSessionStore()
  const {
    stats, attendanceChart, recentAdmissions,
    feeDefaulters, recentAudit,
    isLoading, lastRefreshed, fetchAll, clearDashboard,
  } = useDashboardStore()

  const timerRef = useRef(null)

  const load = useCallback(() => {
    fetchAll(currentSession?.id).catch(() => {})
  }, [currentSession?.id])

  useEffect(() => {
    load()
    timerRef.current = setInterval(() => { load(); toastInfo('Dashboard refreshed') }, AUTO_REFRESH_MS)
    return () => { clearInterval(timerRef.current); clearDashboard() }
  }, [load])

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }

  const formatRefreshed = () => lastRefreshed?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) || ''

  const attendancePct  = stats?.attendanceToday?.percentage ?? stats?.today_attendance?.percentage
  const attendanceData = stats?.attendanceToday ?? stats?.today_attendance
  const feeData        = stats?.feeCollection   ?? stats?.fee_collection
  const examData       = stats?.upcomingExams   ?? stats?.upcoming_exams

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--color-brand)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            {greeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {currentSession ? `Session · ${currentSession.name}` : 'No active session'}
          </p>
        </div>

        <button
          onClick={() => { load(); toastInfo('Refreshing…') }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0"
          style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          title="Refresh dashboard"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          {lastRefreshed && (
            <span className="text-xs hidden sm:block" style={{ color: 'var(--color-text-muted)' }}>
              {formatRefreshed()}
            </span>
          )}
        </button>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          isLoading={isLoading}
          icon={Users}
          accent="#2563eb"
          label="Total Students"
          value={stats?.totalStudents ?? stats?.total_students ?? '—'}
          sub={stats?.newThisSession ? `+${stats.newThisSession} this session` : currentSession?.name}
          trend={stats?.studentTrend}
          onClick={() => navigate(ROUTES.STUDENTS)}
        />
        <StatCard
          isLoading={isLoading}
          icon={CalendarCheck}
          accent="#16a34a"
          label="Attendance"
          value={attendancePct != null ? formatPercent(attendancePct) : '—'}
          sub={attendanceData ? `${attendanceData.present ?? 0} present · ${attendanceData.absent ?? 0} absent` : 'Today'}
          progress={attendancePct}
          progressColor={(attendancePct ?? 100) >= 75 ? '#16a34a' : '#ef4444'}
          onClick={() => navigate(ROUTES.ATTENDANCE)}
        />
        <StatCard
          isLoading={isLoading}
          icon={IndianRupee}
          accent="#d97706"
          label="Fee Collection"
          value={feeData ? formatCurrency(feeData.collected ?? feeData.total_paid ?? 0) : '—'}
          sub={feeData ? `${formatCurrency(feeData.pending ?? 0)} pending` : 'This month'}
          progress={feeData?.percentage}
          progressColor="#d97706"
        />
        <StatCard
          isLoading={isLoading}
          icon={ClipboardList}
          accent="#7c3aed"
          label="Upcoming Exams"
          value={examData?.count ?? 0}
          sub={examData?.next ? `Next: ${examData.next}` : 'This month'}
          onClick={() => navigate(ROUTES.EXAMS)}
        />
      </div>

      {/* ── Attendance Chart + Quick Actions ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Chart — 2/3 */}
        <div className="lg:col-span-2 rounded-[20px] p-5"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Attendance — Last 30 Days
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Green ≥ 75% · Yellow 50–75% · Red &lt; 50%
              </p>
            </div>
            <button onClick={() => navigate(ROUTES.ATTENDANCE)}
              className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-brand)' }}>
              Full report <ArrowUpRight size={12} />
            </button>
          </div>
          {isLoading
            ? <div className="animate-pulse h-40 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
            : <AttendanceBarChart data={attendanceChart} height={150} />
          }
        </div>

        {/* Quick Actions — 1/3 */}
        <div className="rounded-[20px] p-5"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Quick Actions
          </h2>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Mark Attendance',  icon: CalendarCheck,  accent: '#16a34a', route: ROUTES.ATTENDANCE  },
              { label: 'Admit Student',    icon: Plus,           accent: '#2563eb', route: ROUTES.STUDENT_NEW },
              { label: 'Enter Exam Marks', icon: ClipboardCheck, accent: '#7c3aed', route: ROUTES.EXAMS       },
            ].map(({ label, icon: Icon, accent, route }) => (
              <button
                key={label}
                onClick={() => navigate(route)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left w-full transition-all group"
                style={{ border: '1px solid var(--color-border)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = `${accent}08`
                  e.currentTarget.style.borderColor     = `${accent}40`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor     = 'var(--color-border)'
                }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${accent}12` }}>
                  <Icon size={15} style={{ color: accent }} />
                </div>
                <span className="text-sm font-medium flex-1" style={{ color: 'var(--color-text-primary)' }}>
                  {label}
                </span>
                <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Admissions + Fee Defaulters ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Admissions */}
        <Panel
          title="Recent Admissions"
          action={{ label: 'All Students', onClick: () => navigate(ROUTES.STUDENTS) }}
        >
          {isLoading ? <ListSkeleton /> : recentAdmissions.length === 0
            ? <EmptyState icon={Users} message="No recent admissions" />
            : (
              <div>
                {recentAdmissions.slice(0, 8).map((s, i) => (
                  <AdmissionRow
                    key={s.id || i}
                    student={s}
                    onClick={() => navigate(`${ROUTES.STUDENTS}/${s.id}`)}
                  />
                ))}
              </div>
            )}
        </Panel>

        {/* Fee Defaulters */}
        <Panel
          title="Fee Defaulters"
          badge={feeDefaulters.length > 0 ? feeDefaulters.length : null}
        >
          {isLoading ? <ListSkeleton /> : feeDefaulters.length === 0
            ? <EmptyState icon={IndianRupee} message="No pending dues — all clear! 🎉" positive />
            : (
              <div>
                {feeDefaulters.slice(0, 8).map((s, i) => (
                  <DefaulterRow key={s.id || i} student={s} />
                ))}
              </div>
            )}
        </Panel>
      </div>

      {/* ── Recent Audit ─────────────────────────────────────────────── */}
      <Panel
        title="Recent System Activity"
        icon={ScrollText}
        action={{ label: 'Full Audit Log', onClick: () => navigate(ROUTES.AUDIT) }}
      >
        {isLoading ? <ListSkeleton rows={4} /> : recentAudit.length === 0
          ? <EmptyState icon={ScrollText} message="No recent activity" />
          : (
            <div>
              {recentAudit.map((log, i) => (
                <AuditRow key={log.id || i} log={log} onClick={() => navigate(ROUTES.AUDIT)} />
              ))}
            </div>
          )}
      </Panel>
    </div>
  )
}

// ── StatCard ─────────────────────────────────────────────────────────────
const StatCard = ({ isLoading, icon: Icon, accent, label, value, sub, trend, progress, progressColor, onClick }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className="w-full text-left p-4 rounded-[20px] transition-all duration-200"
    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    onMouseEnter={e => {
      if (!onClick) return
      e.currentTarget.style.borderColor = accent + '50'
      e.currentTarget.style.transform   = 'translateY(-2px)'
      e.currentTarget.style.boxShadow   = `0 8px 32px ${accent}12`
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--color-border)'
      e.currentTarget.style.transform   = 'translateY(0)'
      e.currentTarget.style.boxShadow   = 'none'
    }}
  >
    {isLoading ? <StatSkeleton /> : (
      <>
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${accent}12` }}>
            <Icon size={17} style={{ color: accent }} />
          </div>
          {trend != null && (
            <span className="flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: trend > 0 ? '#f0fdf4' : trend < 0 ? '#fef2f2' : 'var(--color-surface-raised)',
                color: trend > 0 ? '#16a34a' : trend < 0 ? '#dc2626' : 'var(--color-text-muted)',
              }}>
              {trend > 0 ? <TrendingUp size={10} /> : trend < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>

        <p className="text-2xl font-bold tracking-tight leading-none mb-1.5"
          style={{ color: 'var(--color-text-primary)' }}>
          {value ?? '—'}
        </p>
        <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </p>
        {sub && <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{sub}</p>}

        {progress != null && (
          <div className="mt-3 h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: progressColor || accent }} />
          </div>
        )}
      </>
    )}
  </button>
)

// ── Panel wrapper ────────────────────────────────────────────────────────
const Panel = ({ title, badge, action, icon: Icon, children }) => (
  <div className="rounded-[20px] overflow-hidden"
    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
    <div className="flex items-center justify-between px-5 py-4"
      style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-2.5">
        {Icon && <Icon size={14} style={{ color: 'var(--color-brand)' }} />}
        <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
        {badge != null && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold"
            style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            {badge}
          </span>
        )}
      </div>
      {action && (
        <button onClick={action.onClick}
          className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-brand)' }}>
          {action.label} <ArrowUpRight size={11} />
        </button>
      )}
    </div>
    <div className="px-5 py-2">{children}</div>
  </div>
)

// ── Row components ───────────────────────────────────────────────────────
const AdmissionRow = ({ student, onClick }) => (
  <div
    className="flex items-center gap-3 py-3 cursor-pointer rounded-xl px-1 -mx-1 transition-colors"
    onClick={onClick}
    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    style={{ borderBottom: '1px solid var(--color-border)' }}
  >
    <Avatar name={`${student.first_name} ${student.last_name}`} color="var(--color-brand)" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
        {student.first_name} {student.last_name}
      </p>
      <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
        {student.class_name || student.class || '—'}
        {student.admission_no && ` · ${student.admission_no}`}
      </p>
    </div>
    <div className="text-right flex-shrink-0">
      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
        {formatDate(student.created_at || student.joined_date)}
      </p>
      <ChevronRight size={13} style={{ color: 'var(--color-text-muted)', marginLeft: 'auto', marginTop: 2 }} />
    </div>
  </div>
)

const DefaulterRow = ({ student }) => {
  const name = student.student_name || `${student.first_name} ${student.last_name}`
  const due  = student.pending || student.balance || student.total_pending || 0
  return (
    <div className="flex items-center gap-3 py-3"
      style={{ borderBottom: '1px solid var(--color-border)' }}>
      <Avatar name={name} color="#dc2626" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{name}</p>
        <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
          {student.class_name || student.class || '—'}
        </p>
      </div>
      <span className="text-sm font-bold flex-shrink-0" style={{ color: '#dc2626' }}>
        {formatCurrency(due)}
      </span>
    </div>
  )
}

const AuditRow = ({ log, onClick }) => (
  <div
    className="flex items-start gap-3 py-3.5 cursor-pointer rounded-xl px-1 -mx-1 transition-colors"
    onClick={onClick}
    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    style={{ borderBottom: '1px solid var(--color-border)' }}
  >
    <Avatar name={(log.changed_by_name || log.admin_name || 'S')} color="var(--color-brand)" size="sm" />
    <div className="flex-1 min-w-0">
      <div className="flex flex-wrap items-center gap-1.5 leading-snug">
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {log.changed_by_name || log.admin_name || `User #${log.changed_by}`}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>updated</span>
        <code className="text-[11px] px-1.5 py-0.5 rounded-md font-mono"
          style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
          {log.field_name}
        </code>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>in</span>
        <code className="text-[11px] px-1.5 py-0.5 rounded-md font-mono"
          style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-brand)' }}>
          {log.table_name}
        </code>
      </div>
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <OldValue value={log.old_value ? String(log.old_value).slice(0, 24) : null} />
        <span className="text-xs" style={{ color: '#94a3b8' }}>→</span>
        <NewValue value={log.new_value ? String(log.new_value).slice(0, 24) : null} />
      </div>
    </div>
    <span className="text-[11px] flex-shrink-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
      {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
    </span>
  </div>
)

// ── Shared atoms ─────────────────────────────────────────────────────────
const Avatar = ({ name, color, size = 'md' }) => {
  const dim = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs'
  return (
    <div className={`${dim} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ backgroundColor: color }}>
      {getInitials(name)}
    </div>
  )
}

const EmptyState = ({ icon: Icon, message, positive }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    {Icon && (
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5"
        style={{ backgroundColor: positive ? '#f0fdf4' : 'var(--color-surface-raised)' }}>
        <Icon size={17} style={{ color: positive ? '#16a34a' : 'var(--color-text-muted)' }} />
      </div>
    )}
    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{message}</p>
  </div>
)

const StatSkeleton = () => (
  <div className="animate-pulse space-y-3">
    <div className="w-9 h-9 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    <div className="h-7 w-20 rounded-lg" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    <div className="h-3 w-16 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    <div className="h-3 w-24 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
  </div>
)

const ListSkeleton = ({ rows = 5 }) => (
  <div className="animate-pulse">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-3"
        style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="w-9 h-9 rounded-full flex-shrink-0"
          style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-36 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          <div className="h-2.5 w-24 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        </div>
        <div className="h-3 w-12 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
      </div>
    ))}
  </div>
)

export default DashboardPage