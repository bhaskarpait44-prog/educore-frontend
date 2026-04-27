import { useEffect, useMemo, useState } from 'react'
import {
  AlarmClock,
  ArrowRight,
  Award,
  BookOpenText,
  CalendarRange,
  CircleAlert,
  ClipboardList,
  CreditCard,
  RefreshCw,
  Sparkles,
  TrendingUp,
  WifiOff,
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useStudentDashboard from '@/hooks/useStudentDashboard'
import { ROUTES } from '@/constants/app'
import { cn, formatCurrency, formatDate, formatPercent } from '@/utils/helpers'
import { useNavigate } from 'react-router-dom'

const StudentDashboard = () => {
  usePageTitle('Student Dashboard')

  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { toastError, toastInfo } = useToast()
  const {
    dashboard,
    todaySchedule,
    upcomingEvents,
    achievements,
    loading,
    refreshing,
    error,
    offline,
    lastLoadedAt,
    refresh,
  } = useStudentDashboard()

  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const student = dashboard?.student || {}
  const attendance = dashboard?.attendance || {}
  const latestResult = dashboard?.latest_result || null
  const fee = dashboard?.fee || {}
  const classesToday = dashboard?.classes_today || {}
  const currentPeriod = classesToday.current_period || null
  const nextPeriod = classesToday.next_period || null
  const schedule = todaySchedule?.length ? todaySchedule : dashboard?.today_schedule || []
  const recentAttendance = dashboard?.recent_attendance || []
  const homeworkDueToday = dashboard?.homework_due_today?.items || []
  const motivational = dashboard?.motivational || null
  const birthdayBanner = dashboard?.birthday_banner || null
  const hasContent = Boolean(dashboard)

  const statCards = [
    {
      key: 'attendance',
      title: 'My Attendance',
      icon: TrendingUp,
      route: ROUTES.STUDENT_ATTENDANCE,
      tone: getAttendanceTone(attendance.percentage),
      primary: formatPercent(attendance.percentage || 0, 0),
      secondary: `${attendance.present_days || 0} present / ${attendance.working_days || 0} working days`,
      footer: attendance.percentage < 75
        ? `Need ${attendance.days_needed_for_minimum || 0} more day(s) to reach 75%`
        : attendance.percentage >= 85
          ? 'Attendance is looking strong'
          : 'Keep steady for the minimum target',
      progress: Math.min(Number(attendance.percentage || 0), 100),
    },
    {
      key: 'result',
      title: 'Latest Result',
      icon: ClipboardList,
      route: ROUTES.STUDENT_RESULTS,
      tone: getResultTone(latestResult?.result_status),
      primary: latestResult ? formatPercent(latestResult.percentage || 0, 0) : '—',
      secondary: latestResult
        ? `${latestResult.exam_name} • Grade ${latestResult.grade}`
        : 'Most recent published exam will appear here',
      footer: latestResult
        ? `${String(latestResult.result_status || '').toUpperCase()} • Tap to view full result`
        : 'Awaiting result publication',
      badge: latestResult ? String(latestResult.result_status || '').toUpperCase() : 'AWAITING',
    },
    {
      key: 'fee',
      title: 'Fee Status',
      icon: CreditCard,
      route: ROUTES.STUDENT_FEES,
      tone: Number(fee.total_pending || 0) > 0 ? '#ef4444' : '#16a34a',
      primary: formatCurrency(fee.total_pending || 0),
      secondary: Number(fee.total_pending || 0) > 0 ? 'Outstanding balance' : 'All clear',
      footer: fee.next_due_date
        ? `Next due ${formatDate(fee.next_due_date, 'short')}`
        : 'No upcoming due date',
    },
    {
      key: 'classes',
      title: "Today's Classes",
      icon: CalendarRange,
      route: ROUTES.STUDENT_TIMETABLE,
      tone: currentPeriod ? '#16a34a' : '#7c3aed',
      primary: `${classesToday.total_periods || schedule.length || 0}`,
      secondary: currentPeriod
        ? `${currentPeriod.subject_name} is live now`
        : nextPeriod
          ? `${nextPeriod.subject_name} is next`
          : 'No more classes today',
      footer: currentPeriod
        ? `Ends in ${formatMinutes(currentPeriod.countdown_minutes)}`
        : nextPeriod
          ? `Starts in ${formatMinutes(nextPeriod.countdown_minutes)}`
          : 'Schedule complete',
    },
  ]

  const handleRefresh = async () => {
    toastInfo('Refreshing dashboard')
    try {
      await refresh()
    } catch {}
  }

  return (
    <div className="space-y-5 pb-2">
      {offline && (
        <Banner
          icon={WifiOff}
          title="You are offline"
          description="Showing the last saved student dashboard until the connection returns."
          tone="#f59e0b"
          soft="rgba(245,158,11,0.12)"
          border="#fcd34d"
        />
      )}

      {birthdayBanner && (
        <section
          className="relative overflow-hidden rounded-[28px] border px-5 py-5 sm:px-6"
          style={{
            borderColor: '#c4b5fd',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.20), rgba(236,72,153,0.12) 55%, rgba(255,255,255,0.9) 100%)',
            boxShadow: '0 20px 48px rgba(124,58,237,0.14)',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#7c3aed,#ec4899,#f59e0b,#10b981)]" />
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-[var(--student-accent)]">
              <Sparkles size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold sm:text-2xl">{birthdayBanner.title}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Wishing you a joyful day and a year full of wins, growth, and good surprises.
              </p>
            </div>
          </div>
        </section>
      )}

      {homeworkDueToday.length > 0 && (
        <section
          className="rounded-[24px] border px-4 py-4 sm:px-5"
          style={{ borderColor: '#fca5a5', backgroundColor: 'rgba(239,68,68,0.08)' }}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
              <CircleAlert size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                {homeworkDueToday.length} homework due today
              </p>
              <div className="mt-3 space-y-2">
                {homeworkDueToday.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border px-3 py-3"
                    style={{ borderColor: '#fecaca', backgroundColor: 'rgba(255,255,255,0.7)' }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{item.title}</p>
                      <p className="truncate text-xs text-[var(--color-text-secondary)]">
                        {item.subject_name} • {item.teacher_name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.STUDENT_HOMEWORK)}
                      className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-white"
                      style={{ backgroundColor: 'var(--student-accent)' }}
                    >
                      {item.submission_type === 'online' || item.submission_type === 'both' ? 'Quick Submit' : 'View'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section
        className="overflow-hidden rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(109,40,217,0.18), rgba(79,70,229,0.10) 52%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--student-accent)' }}>
              Student Dashboard
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">
              {greeting}, {student.name || user?.name || 'Student'}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[var(--color-text-secondary)]">
              {student.class_name ? `${student.class_name}${student.section_name ? ` • ${student.section_name}` : ''}` : 'Your class details will appear here'}
              {student.roll_number ? ` • Roll No: ${student.roll_number}` : ''}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Current session: {student.session_name || '—'} • Today: {formatLongDate(dashboard?.today)}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <SoftPill label={`${classesToday.total_periods || schedule.length || 0} classes today`} tone="#6d28d9" />
              <SoftPill label={`${upcomingEvents.length} upcoming event(s)`} tone="#0f766e" />
              <SoftPill label={`${achievements.length} achievement badge(s)`} tone="#d97706" />
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition hover:-translate-y-0.5"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <RefreshCw size={16} className={refreshing || loading ? 'animate-spin' : ''} />
            {lastLoadedAt ? `Updated ${formatTime(lastLoadedAt)}` : 'Refresh'}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => navigate(card.route)}
            className="rounded-[26px] border p-5 text-left transition hover:-translate-y-0.5"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            {loading && !hasContent ? (
              <DashboardCardSkeleton />
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${card.tone}18`, color: card.tone }}
                  >
                    <card.icon size={20} />
                  </div>
                  <div className="flex items-center gap-2">
                    {card.badge && (
                      <span
                        className="rounded-full px-2 py-1 text-[10px] font-bold tracking-[0.16em]"
                        style={{ backgroundColor: `${card.tone}18`, color: card.tone }}
                      >
                        {card.badge}
                      </span>
                    )}
                    <ArrowRight size={18} style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                  {card.title}
                </p>
                <p className="mt-2 text-[28px] font-bold leading-8 text-[var(--color-text-primary)]">
                  {card.primary}
                </p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  {card.secondary}
                </p>
                {typeof card.progress === 'number' && (
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-surface-raised)]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${card.progress}%`, backgroundColor: card.tone }}
                    />
                  </div>
                )}
                <p className="mt-4 text-xs font-medium" style={{ color: card.tone }}>
                  {card.footer}
                </p>
              </>
            )}
          </button>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]">
        <div className="space-y-5">
          <SectionCard
            title="Today Schedule"
            actionLabel="Open Timetable"
            onAction={() => navigate(ROUTES.STUDENT_TIMETABLE)}
          >
            {loading && !hasContent ? (
              <TimelineSkeleton />
            ) : schedule.length > 0 ? (
              <div className="space-y-3">
                {schedule.map((item) => (
                  <div
                    key={item.id || `${item.period_number}-${item.start_time}`}
                    className="rounded-3xl border px-4 py-4 transition"
                    style={{
                      borderColor:
                        item.status === 'current'
                          ? 'rgba(22,163,74,0.35)'
                          : item.status === 'done'
                            ? 'var(--color-border)'
                            : 'rgba(124,58,237,0.18)',
                      backgroundColor:
                        item.status === 'current'
                          ? 'rgba(22,163,74,0.08)'
                          : item.status === 'done'
                            ? 'var(--color-surface-raised)'
                            : 'var(--color-surface)',
                      boxShadow: item.status === 'current' ? '0 0 0 1px rgba(22,163,74,0.10), 0 14px 34px rgba(22,163,74,0.10)' : 'none',
                      opacity: item.status === 'done' ? 0.72 : 1,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">
                            Period {item.period_number || '—'}
                          </p>
                          <span className={statusPillClass(item.status)} style={statusPillStyle(item.status)}>
                            {item.status === 'current' ? 'ONGOING' : item.status === 'done' ? 'DONE' : 'UPCOMING'}
                          </span>
                        </div>
                        <p className="mt-2 text-lg font-semibold text-[var(--color-text-primary)]">
                          {item.subject_name}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                          {item.teacher_name}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {formatTimeRange(item.start_time, item.end_time)}
                          {item.room_number ? ` • Room ${item.room_number}` : ''}
                        </p>
                      </div>
                      {(item.status === 'current' || item.status === 'upcoming') && typeof item.countdown_minutes === 'number' && (
                        <div className="shrink-0 rounded-2xl px-3 py-2 text-right" style={{ backgroundColor: 'rgba(124,58,237,0.10)' }}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--student-accent)]">
                            {item.status === 'current' ? 'Ends In' : 'Starts In'}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                            {formatMinutes(item.countdown_minutes)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyMiniState
                icon={CalendarRange}
                title="No classes lined up today"
                description="Your day looks clear right now."
              />
            )}
          </SectionCard>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <SectionCard title="Recent Attendance">
              {loading && !hasContent ? (
                <BubbleStripSkeleton />
              ) : recentAttendance.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-2">
                    {recentAttendance.map((day, index) => (
                      <div key={`${day.date}-${index}`} className="flex flex-col items-center gap-2">
                        <button
                          type="button"
                          title={`${formatDate(day.date, 'long')} • ${labelFromStatus(day.status)}`}
                          className="flex aspect-square w-full max-w-[52px] items-center justify-center rounded-full border text-xs font-bold"
                          style={attendanceBubbleStyle(day, dashboard?.today)}
                        >
                          {bubbleLabel(day.status)}
                        </button>
                        <span className="text-[11px] text-[var(--color-text-muted)]">
                          {formatDayShort(day.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-medium text-[var(--color-text-secondary)]">
                    <Legend tone="#16a34a" label="Present" />
                    <Legend tone="#ef4444" label="Absent" />
                    <Legend tone="#f59e0b" label="Late" />
                    <Legend tone="#2563eb" label="Half Day" />
                    <Legend tone="#94a3b8" label="Holiday" />
                  </div>
                </div>
              ) : (
                <EmptyMiniState
                  icon={TrendingUp}
                  title="Attendance will appear here soon"
                  description="Once your records are marked, this strip will show the last seven days."
                />
              )}
            </SectionCard>

            <SectionCard
              title="Upcoming Events"
              actionLabel="Open Notices"
              onAction={() => navigate(ROUTES.STUDENT_NOTICES)}
            >
              {loading && !hasContent ? (
                <EventSkeleton />
              ) : upcomingEvents.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {upcomingEvents.map((event) => (
                    <div
                      key={`${event.event_type}-${event.id}`}
                      className="min-w-[210px] rounded-3xl border p-4"
                      style={{
                        borderColor: eventTone(event.event_type).border,
                        backgroundColor: eventTone(event.event_type).soft,
                      }}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: eventTone(event.event_type).strong }}>
                        {event.event_type}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold text-[var(--color-text-primary)]">
                        {event.title}
                      </p>
                      <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
                        {formatDate(event.event_date, 'short')}
                      </p>
                      <p className="mt-2 text-xs font-semibold" style={{ color: eventTone(event.event_type).strong }}>
                        In {event.days_remaining} day(s)
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyMiniState
                  icon={AlarmClock}
                  title="Nothing upcoming right now"
                  description="New exams, holidays, dues, and notices will show up here."
                />
              )}
            </SectionCard>
          </div>
        </div>

        <div className="space-y-5">
          <SectionCard title="Motivation">
            {loading && !hasContent ? (
              <MotivationSkeleton />
            ) : motivational ? (
              <Banner
                icon={motivational.type === 'streak' ? Award : CircleAlert}
                title={motivational.type === 'streak' ? 'Attendance streak' : 'Gentle reminder'}
                description={motivational.message}
                tone={motivational.type === 'streak' ? '#16a34a' : '#d97706'}
                soft={motivational.type === 'streak' ? 'rgba(22,163,74,0.08)' : 'rgba(217,119,6,0.10)'}
                border={motivational.type === 'streak' ? 'rgba(22,163,74,0.20)' : 'rgba(217,119,6,0.24)'}
              />
            ) : (
              <EmptyMiniState
                icon={Sparkles}
                title="You are on track"
                description="Keep moving steadily and your milestones will show up here."
              />
            )}
          </SectionCard>

          <SectionCard
            title="Achievement Badges"
            actionLabel="Open Profile"
            onAction={() => navigate(ROUTES.STUDENT_PROFILE)}
          >
            {loading && !hasContent ? (
              <BadgeSkeleton />
            ) : achievements.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {achievements.slice(0, 4).map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-3 rounded-3xl border px-4 py-4"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(124,58,237,0.14)] text-[var(--student-accent)]">
                      <Award size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                        {prettifyBadge(badge.achievement_type)}
                      </p>
                      <p className="truncate text-xs text-[var(--color-text-secondary)]">
                        {badge.earned_for || 'Student milestone'}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                        Earned {formatDate(badge.earned_at, 'short')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyMiniState
                icon={Award}
                title="Your badges will collect here"
                description="Perfect attendance, improvement, and top performer rewards will appear as you earn them."
              />
            )}
          </SectionCard>

          <SectionCard
            title="Quick Links"
            actionLabel="Profile"
            onAction={() => navigate(ROUTES.STUDENT_PROFILE)}
          >
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Open Report Card', icon: ClipboardList, route: ROUTES.STUDENT_REPORT_CARD, tone: '#2563eb' },
                { label: 'Check Homework', icon: BookOpenText, route: ROUTES.STUDENT_HOMEWORK, tone: '#dc2626' },
                { label: 'Review Fee Details', icon: CreditCard, route: ROUTES.STUDENT_FEES, tone: '#16a34a' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.route)}
                  className="flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: `${item.tone}18`, color: item.tone }}>
                      <item.icon size={18} />
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">{item.label}</span>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

const SectionCard = ({ title, actionLabel, onAction, children }) => (
  <section
    className="rounded-[28px] border p-5 sm:p-5"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">{title}</h2>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-xs font-semibold uppercase tracking-[0.16em]"
          style={{ color: 'var(--student-accent)' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
    {children}
  </section>
)

const Banner = ({ icon: Icon, title, description, tone, soft, border }) => (
  <div className="rounded-[24px] border px-4 py-4" style={{ borderColor: border, backgroundColor: soft }}>
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${tone}18`, color: tone }}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: tone }}>{title}</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
      </div>
    </div>
  </div>
)

const SoftPill = ({ label, tone }) => (
  <span
    className="rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]"
    style={{ backgroundColor: `${tone}18`, color: tone }}
  >
    {label}
  </span>
)

const EmptyMiniState = ({ icon: Icon, title, description }) => (
  <div className="rounded-3xl border border-dashed px-4 py-6 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 text-[var(--student-accent)] dark:bg-white/5">
      <Icon size={20} />
    </div>
    <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
    <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{description}</p>
  </div>
)

const Legend = ({ tone, label }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tone }} />
    <span>{label}</span>
  </span>
)

const DashboardCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-11 w-11 rounded-2xl bg-[var(--color-surface-raised)]" />
    <div className="mt-4 h-3 w-24 rounded-full bg-[var(--color-surface-raised)]" />
    <div className="mt-3 h-8 w-28 rounded-2xl bg-[var(--color-surface-raised)]" />
    <div className="mt-3 h-3 w-3/4 rounded-full bg-[var(--color-surface-raised)]" />
    <div className="mt-5 h-2 w-full rounded-full bg-[var(--color-surface-raised)]" />
  </div>
)

const TimelineSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="rounded-3xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
        <div className="h-3 w-24 rounded-full bg-[var(--color-surface-raised)]" />
        <div className="mt-3 h-5 w-36 rounded-full bg-[var(--color-surface-raised)]" />
        <div className="mt-3 h-3 w-24 rounded-full bg-[var(--color-surface-raised)]" />
      </div>
    ))}
  </div>
)

const BubbleStripSkeleton = () => (
  <div className="grid grid-cols-7 gap-2 animate-pulse">
    {Array.from({ length: 7 }).map((_, index) => (
      <div key={index} className="flex flex-col items-center gap-2">
        <div className="h-11 w-11 rounded-full bg-[var(--color-surface-raised)]" />
        <div className="h-2.5 w-6 rounded-full bg-[var(--color-surface-raised)]" />
      </div>
    ))}
  </div>
)

const EventSkeleton = () => (
  <div className="flex gap-3 overflow-hidden animate-pulse">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="min-w-[200px] rounded-3xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
        <div className="h-3 w-16 rounded-full bg-[var(--color-surface-raised)]" />
        <div className="mt-3 h-4 w-36 rounded-full bg-[var(--color-surface-raised)]" />
        <div className="mt-4 h-3 w-20 rounded-full bg-[var(--color-surface-raised)]" />
      </div>
    ))}
  </div>
)

const MotivationSkeleton = () => (
  <div className="animate-pulse rounded-[24px] border p-4" style={{ borderColor: 'var(--color-border)' }}>
    <div className="h-10 w-10 rounded-2xl bg-[var(--color-surface-raised)]" />
    <div className="mt-3 h-4 w-32 rounded-full bg-[var(--color-surface-raised)]" />
    <div className="mt-3 h-3 w-full rounded-full bg-[var(--color-surface-raised)]" />
    <div className="mt-2 h-3 w-3/4 rounded-full bg-[var(--color-surface-raised)]" />
  </div>
)

const BadgeSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="flex items-center gap-3 rounded-3xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
        <div className="h-12 w-12 rounded-2xl bg-[var(--color-surface-raised)]" />
        <div className="flex-1">
          <div className="h-4 w-28 rounded-full bg-[var(--color-surface-raised)]" />
          <div className="mt-2 h-3 w-40 rounded-full bg-[var(--color-surface-raised)]" />
        </div>
      </div>
    ))}
  </div>
)

function getAttendanceTone(percentage) {
  const value = Number(percentage || 0)
  if (value >= 85) return '#16a34a'
  if (value >= 75) return '#d97706'
  if (value >= 65) return '#f97316'
  return '#ef4444'
}

function getResultTone(status) {
  if (status === 'pass') return '#16a34a'
  if (status === 'compartment') return '#d97706'
  if (status === 'fail') return '#ef4444'
  return '#64748b'
}

function formatMinutes(value) {
  const minutes = Number(value || 0)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

function formatLongDate(value) {
  if (!value) return 'Today'
  return new Date(value).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(value) {
  if (!value) return 'now'
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatTimeRange(startTime, endTime) {
  const date = new Date().toISOString().slice(0, 10)
  return `${formatTime(`${date}T${startTime}`)} - ${formatTime(`${date}T${endTime}`)}`
}

function formatDayShort(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', { weekday: 'short' })
}

function labelFromStatus(status) {
  return String(status || '').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function bubbleLabel(status) {
  if (status === 'present') return 'P'
  if (status === 'absent') return 'A'
  if (status === 'late') return 'L'
  if (status === 'half_day') return 'H'
  return '•'
}

function attendanceBubbleStyle(day, today) {
  const date = String(day?.date || '')
  const isToday = today && String(today) === date
  const styles = {
    present: { backgroundColor: '#dcfce7', color: '#15803d', borderColor: '#86efac' },
    absent: { backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' },
    late: { backgroundColor: '#fef3c7', color: '#b45309', borderColor: '#fcd34d' },
    half_day: { backgroundColor: '#dbeafe', color: '#1d4ed8', borderColor: '#93c5fd' },
    holiday: { backgroundColor: '#e5e7eb', color: '#6b7280', borderColor: '#cbd5e1' },
  }
  const base = styles[day?.status] || styles.holiday
  return {
    ...base,
    borderWidth: isToday ? '2px' : '1px',
    boxShadow: isToday ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
  }
}

function statusPillClass(status) {
  return cn('rounded-full px-2 py-1 text-[10px] font-bold tracking-[0.16em]')
}

function statusPillStyle(status) {
  if (status === 'current') return { backgroundColor: 'rgba(22,163,74,0.14)', color: '#15803d' }
  if (status === 'done') return { backgroundColor: 'rgba(148,163,184,0.16)', color: '#64748b' }
  return { backgroundColor: 'rgba(124,58,237,0.14)', color: '#6d28d9' }
}

function eventTone(type) {
  if (type === 'exam') return { soft: 'rgba(37,99,235,0.10)', strong: '#2563eb', border: 'rgba(37,99,235,0.22)' }
  if (type === 'fee') return { soft: 'rgba(239,68,68,0.10)', strong: '#dc2626', border: 'rgba(239,68,68,0.22)' }
  if (type === 'holiday') return { soft: 'rgba(22,163,74,0.10)', strong: '#15803d', border: 'rgba(22,163,74,0.22)' }
  return { soft: 'rgba(124,58,237,0.10)', strong: '#6d28d9', border: 'rgba(124,58,237,0.22)' }
}

function prettifyBadge(value) {
  return String(value || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default StudentDashboard
