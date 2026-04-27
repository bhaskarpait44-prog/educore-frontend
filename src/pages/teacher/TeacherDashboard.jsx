import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlarmClock, ArrowRight, BellPlus, BookMarked, BookOpenCheck, CalendarDays, CheckCheck,
  CircleAlert, ClipboardCheck, LayoutGrid, RefreshCw, Users, WifiOff,
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import usePageTitle from '@/hooks/usePageTitle'
import useTeacherDashboard from '@/hooks/useTeacherDashboard'
import useToast from '@/hooks/useToast'
import PendingTasksList from '@/components/teacher/PendingTasksList'
import { ROUTES } from '@/constants/app'
import { formatPercent, titleCase } from '@/utils/helpers'

const TeacherDashboard = () => {
  usePageTitle('Teacher Dashboard')

  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { toastInfo, toastError } = useToast()
  const {
    dashboard,
    schedule,
    pendingTasks,
    recentActivity,
    loading,
    refreshing,
    error,
    offline,
    lastLoadedAt,
    refresh,
  } = useTeacherDashboard()

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

  const scheduleRows = schedule?.length ? schedule : dashboard?.today_schedule || []
  const glance = dashboard?.today_at_a_glance || {}
  const nextPeriod = glance?.todays_classes?.next_period || null
  const unmarkedCount = Math.max(
    0,
    Number(glance?.attendance_status?.total || 0) - Number(glance?.attendance_status?.marked || 0)
  )

  const statsCards = [
    {
      key: 'classes',
      title: "Today's Classes",
      icon: CalendarDays,
      tone: unmarkedCount === 0 ? '#10b981' : '#f59e0b',
      route: ROUTES.TEACHER_TIMETABLE,
      summary: `${glance?.todays_classes?.total_periods || 0} period(s) today`,
      detail: nextPeriod
        ? `Next: ${formatSubjectClass(nextPeriod)}`
        : 'No more periods left today',
      footer: nextPeriod ? formatCountdown(nextPeriod, now) : 'Schedule complete',
    },
    {
      key: 'attendance',
      title: 'Attendance Status',
      icon: ClipboardCheck,
      tone: unmarkedCount === 0 ? '#10b981' : '#ef4444',
      route: ROUTES.TEACHER_ATTENDANCE_MARK,
      summary: `${glance?.attendance_status?.marked || 0} of ${glance?.attendance_status?.total || 0} marked`,
      detail: unmarkedCount > 0 ? `${unmarkedCount} class(es) still pending today` : 'All attendance marked',
      footer: unmarkedCount > 0 ? 'Quick mark available' : 'Everything is up to date',
    },
    {
      key: 'marks',
      title: 'Pending Marks Entry',
      icon: BookOpenCheck,
      tone: Number(glance?.pending_marks?.pending_exams || 0) > 0 ? '#ef4444' : '#0f766e',
      route: ROUTES.TEACHER_MARKS_ENTER,
      summary: `${glance?.pending_marks?.pending_exams || 0} exam(s) pending`,
      detail: `${glance?.pending_marks?.missing_students || 0} student mark slot(s) missing`,
      footer: Number(glance?.pending_marks?.pending_exams || 0) > 0 ? 'Review before deadlines' : 'Marks work is clear',
    },
    {
      key: 'students',
      title: 'My Students Today',
      icon: Users,
      tone: '#14b8a6',
      route: ROUTES.TEACHER_STUDENTS,
      summary: `${glance?.my_students_today?.present || 0} present`,
      detail: `${glance?.my_students_today?.absent || 0} absent today`,
      footer: `${formatPercent(glance?.my_students_today?.percentage || 0, 0)} attendance across assigned classes`,
    },
  ]

  const quickActions = [
    { label: 'Mark Attendance', icon: ClipboardCheck, route: ROUTES.TEACHER_ATTENDANCE_MARK, tone: '#10b981' },
    { label: 'Enter Marks', icon: BookMarked, route: ROUTES.TEACHER_MARKS_ENTER, tone: '#0f766e' },
    { label: 'Post Notice', icon: BellPlus, route: ROUTES.TEACHER_NOTICE_NEW, tone: '#14b8a6' },
    { label: 'View Timetable', icon: LayoutGrid, route: ROUTES.TEACHER_TIMETABLE, tone: '#f59e0b' },
  ]

  const handleRefresh = async () => {
    toastInfo('Refreshing dashboard')
    try {
      await refresh()
    } catch {}
  }

  return (
    <div className="space-y-5 pb-28 lg:pb-8">
      {offline && (
        <div
          className="flex items-center gap-3 rounded-3xl border px-4 py-3"
          style={{ borderColor: '#f59e0b55', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: 'var(--color-text-primary)' }}
        >
          <WifiOff size={18} style={{ color: '#f59e0b' }} />
          <div className="min-w-0">
            <p className="text-sm font-semibold">You are offline</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Changes will sync when connection returns. Pull to refresh once you are back online.
            </p>
          </div>
        </div>
      )}

      <section
        className="overflow-hidden rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.22), rgba(16, 185, 129, 0.08) 55%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: '#0f766e' }}>
              Teacher Portal
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl" style={{ color: 'var(--color-text-primary)' }}>
              {greeting}, {dashboard?.teacher?.name || user?.name || 'Teacher'}
            </h1>
            <p className="mt-2 text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
              Today is {formatLongDate(dashboard?.date)}. Current session: {dashboard?.current_session?.name || 'Not available'}.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <SoftPill label={`${scheduleRows.length} class periods today`} tone="#0f766e" />
              <SoftPill
                label={`${glance?.attendance_status?.marked || 0}/${glance?.attendance_status?.total || 0} attendance marked`}
                tone={unmarkedCount === 0 ? '#10b981' : '#ef4444'}
              />
              <SoftPill
                label={`${pendingTasks.length} smart task(s) pending`}
                tone={pendingTasks.length ? '#f59e0b' : '#14b8a6'}
              />
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
        {statsCards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => navigate(card.route)}
            className="rounded-[26px] border p-5 text-left transition hover:-translate-y-0.5"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            {loading && !dashboard ? (
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
                  <ArrowRight size={18} style={{ color: 'var(--color-text-muted)' }} />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                  {card.title}
                </p>
                <p className="mt-2 text-lg font-bold leading-6" style={{ color: 'var(--color-text-primary)' }}>
                  {card.summary}
                </p>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {card.detail}
                </p>
                <p className="mt-4 text-xs font-medium" style={{ color: card.tone }}>
                  {card.footer}
                </p>
              </>
            )}
          </button>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
        <div className="space-y-5">
          <SectionShell
            title="Today's Schedule"
            caption="Your classes lined up for the day with fast actions for attendance, marks, and students."
          >
            {loading && !scheduleRows.length ? (
              <ScheduleSkeleton />
            ) : scheduleRows.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No classes scheduled today"
                message="Your timetable is clear for today. Any free periods or updates will appear here."
              />
            ) : (
              <div className="space-y-4">
                {scheduleRows.map((item, index) => (
                  <div key={item.id || `${item.class_id}-${item.period_number}-${index}`} className="flex gap-3">
                    <div className="flex w-12 flex-col items-center">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-bold"
                        style={{
                          backgroundColor: `${statusTone(item.status)}18`,
                          color: statusTone(item.status),
                          boxShadow: item.status === 'current' ? '0 0 0 6px rgba(16, 185, 129, 0.10)' : 'none',
                        }}
                      >
                        P{item.period_number}
                      </div>
                      {index !== scheduleRows.length - 1 && (
                        <div className="mt-2 h-full w-px" style={{ backgroundColor: 'var(--color-border)' }} />
                      )}
                    </div>

                    <div
                      className="flex-1 rounded-[24px] border p-4"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                              {item.subject_name}
                            </h3>
                            <StatusBadge status={item.status} />
                          </div>
                          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {item.class_name} {item.section_name} | {formatTimeRange(item.start_time, item.end_time)}
                          </p>
                          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {item.room_number ? `Room ${item.room_number}` : 'Room not configured'} | {scheduleDetail(item, now)}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:min-w-[180px]">
                          <QuickActionButton
                            label="Mark Attendance"
                            tone="#10b981"
                            onClick={() => navigate(ROUTES.TEACHER_ATTENDANCE_MARK, {
                              state: {
                                class_id: String(item.class_id),
                                section_id: String(item.section_id),
                                subject_id: String(item.subject_id || ''),
                                assignment_role: 'class_teacher',
                              },
                            })}
                          />
                          <QuickActionButton
                            label="Enter Marks"
                            tone="#0f766e"
                            onClick={() => navigate(ROUTES.TEACHER_MARKS_ENTER, {
                              state: {
                                class_id: String(item.class_id),
                                section_id: String(item.section_id),
                                subject_id: String(item.subject_id || ''),
                                assignment_role: 'subject_teacher',
                              },
                            })}
                          />
                          <QuickActionButton
                            label="View Students"
                            tone="#14b8a6"
                            onClick={() => navigate(ROUTES.TEACHER_STUDENTS, {
                              state: {
                                class_id: String(item.class_id),
                                section_id: String(item.section_id),
                              },
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionShell>

          <SectionShell
            title="Recent Activity"
            caption="The last actions you completed across attendance, marks, notices, and remarks."
          >
            {loading && !recentActivity.length ? (
              <RecentActivitySkeleton />
            ) : recentActivity.length === 0 ? (
              <EmptyState
                icon={CheckCheck}
                title="No recent activity yet"
                message="Once you start marking attendance or entering marks, your latest work will appear here."
              />
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, index) => (
                  <button
                    key={item.id || index}
                    type="button"
                    onClick={() => navigate(activityRoute(item))}
                    className="flex w-full items-start gap-3 rounded-3xl border p-4 text-left transition hover:-translate-y-0.5"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${activityTone(item.table_name)}18`, color: activityTone(item.table_name) }}
                    >
                      <ActivityIcon tableName={item.table_name} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {activityMessage(item)}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {timeAgo(item.created_at, now)}
                      </p>
                    </div>
                    <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                  </button>
                ))}
              </div>
            )}
          </SectionShell>
        </div>

        <div className="space-y-5">
          <SectionShell
            title="Pending Tasks"
            caption="Smart reminders generated from your assigned classes and sections."
          >
            <PendingTasksList tasks={pendingTasks} loading={loading && !pendingTasks.length} />
          </SectionShell>

          <SectionShell
            title="Quick Actions"
            caption="Shortcuts for the actions teachers repeat most during the day."
          >
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => navigate(action.route)}
                  className="flex min-h-24 flex-col items-start justify-between rounded-3xl border p-4 text-left transition hover:-translate-y-0.5"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${action.tone}18`, color: action.tone }}
                  >
                    <action.icon size={18} />
                  </div>
                  <p className="text-sm font-semibold leading-5" style={{ color: 'var(--color-text-primary)' }}>
                    {action.label}
                  </p>
                </button>
              ))}
            </div>
          </SectionShell>

          {error && (
            <div
              className="rounded-3xl border px-4 py-3"
              style={{ borderColor: '#ef444455', backgroundColor: 'rgba(239, 68, 68, 0.10)' }}
            >
              <div className="flex items-start gap-3">
                <CircleAlert size={18} style={{ color: '#ef4444' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Some dashboard data could not be refreshed
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-x-3 bottom-3 z-30 lg:hidden">
        <div
          className="grid grid-cols-4 gap-2 rounded-[28px] border p-2 shadow-2xl backdrop-blur"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'color-mix(in srgb, var(--color-surface) 88%, transparent)',
          }}
        >
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => navigate(action.route)}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-center text-[11px] font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${action.tone}18`, color: action.tone }}
              >
                <action.icon size={16} />
              </div>
              <span className="leading-3">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const SectionShell = ({ title, caption, children }) => (
  <section
    className="rounded-[28px] border p-5 sm:p-6"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <div className="mb-4">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {caption}
      </p>
    </div>
    {children}
  </section>
)

const SoftPill = ({ label, tone }) => (
  <span
    className="inline-flex min-h-9 items-center rounded-full px-3 text-xs font-semibold"
    style={{ backgroundColor: `${tone}16`, color: tone }}
  >
    {label}
  </span>
)

const StatusBadge = ({ status }) => (
  <span
    className="inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold capitalize"
    style={{ backgroundColor: `${statusTone(status)}18`, color: statusTone(status) }}
  >
    {status === 'done' ? 'Done' : status === 'current' ? 'Current' : 'Upcoming'}
  </span>
)

const QuickActionButton = ({ label, tone, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex min-h-11 items-center justify-center rounded-2xl px-3 text-sm font-semibold transition hover:-translate-y-0.5"
    style={{ backgroundColor: `${tone}18`, color: tone }}
  >
    {label}
  </button>
)

const EmptyState = ({ icon: Icon, title, message }) => (
  <div className="rounded-3xl border border-dashed p-8 text-center" style={{ borderColor: 'var(--color-border)' }}>
    <div
      className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
      style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}
    >
      <Icon size={20} />
    </div>
    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
    <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
  </div>
)

const DashboardCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="flex items-start justify-between">
      <div className="h-11 w-11 rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
      <div className="h-5 w-5 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    </div>
    <div className="mt-4 h-3 w-24 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    <div className="mt-3 h-6 w-2/3 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    <div className="mt-3 h-4 w-full rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    <div className="mt-4 h-4 w-1/2 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
  </div>
)

const ScheduleSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, index) => (
      <div key={index} className="flex gap-3 animate-pulse">
        <div className="w-12">
          <div className="h-10 w-10 rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        </div>
        <div className="flex-1 rounded-[24px] p-4" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
          <div className="h-4 w-40 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="mt-3 h-3 w-56 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[...Array(3)].map((__, buttonIndex) => (
              <div key={buttonIndex} className="h-11 rounded-2xl" style={{ backgroundColor: 'var(--color-border)' }} />
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
)

const RecentActivitySkeleton = () => (
  <div className="space-y-3">
    {[...Array(4)].map((_, index) => (
      <div
        key={index}
        className="flex items-start gap-3 rounded-3xl border p-4 animate-pulse"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="h-10 w-10 rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        <div className="flex-1">
          <div className="h-4 w-3/4 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          <div className="mt-2 h-3 w-1/4 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        </div>
      </div>
    ))}
  </div>
)

const ActivityIcon = ({ tableName }) => {
  const iconProps = { size: 18 }
  if (tableName === 'attendance') return <ClipboardCheck {...iconProps} />
  if (tableName === 'exam_results') return <BookMarked {...iconProps} />
  if (tableName === 'student_remarks') return <Users {...iconProps} />
  if (tableName === 'teacher_notices') return <BellPlus {...iconProps} />
  return <AlarmClock {...iconProps} />
}

const formatLongDate = (date) => {
  const value = date ? new Date(date) : new Date()
  return value.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const formatTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'just now'
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const formatTimeRange = (startTime, endTime) => {
  const start = to12Hour(startTime)
  const end = to12Hour(endTime)
  return `${start} - ${end}`
}

const to12Hour = (value) => {
  if (!value) return '--'
  const [hour = '0', minute = '00'] = String(value).slice(0, 5).split(':')
  const date = new Date()
  date.setHours(Number(hour), Number(minute), 0, 0)
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const formatSubjectClass = (row) => `${row.subject_name} | ${row.class_name} ${row.section_name}`

const formatCountdown = (period, now) => {
  const nowDate = new Date(now)
  const start = timeToDate(period.start_time, nowDate)
  const end = timeToDate(period.end_time, nowDate)

  if (nowDate < start) {
    const diff = Math.max(0, start.getTime() - nowDate.getTime())
    const mins = Math.floor(diff / 60000)
    return `Starts in ${mins} min`
  }

  if (nowDate >= start && nowDate < end) {
    const diff = Math.max(0, end.getTime() - nowDate.getTime())
    const mins = Math.floor(diff / 60000)
    return `${mins} min remaining`
  }

  return 'Completed'
}

const timeToDate = (time, baseDate = new Date()) => {
  const [hour = '0', minute = '0'] = String(time).slice(0, 5).split(':')
  const date = new Date(baseDate)
  date.setHours(Number(hour), Number(minute), 0, 0)
  return date
}

const statusTone = (status) => {
  if (status === 'current') return '#10b981'
  if (status === 'done') return '#0f766e'
  return '#94a3b8'
}

const scheduleDetail = (item, now) => {
  if (item.status === 'current') return formatCountdown(item, now)
  if (item.status === 'upcoming') return `Starts ${to12Hour(item.start_time)}`
  return `Finished ${to12Hour(item.end_time)}`
}

const timeAgo = (value, now) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'

  const diffMs = Math.max(0, now - date.getTime())
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

const activityMessage = (item) => {
  if (item.table_name === 'attendance') {
    return `Marked attendance ${item.field_name ? `for ${titleCase(String(item.field_name).replace(/_/g, ' '))}` : ''}`.trim()
  }
  if (item.table_name === 'exam_results') {
    return `Entered marks ${item.new_value ? `for ${item.new_value}` : ''}`.trim()
  }
  if (item.table_name === 'student_remarks') {
    return `Added student remark ${item.new_value ? `(${item.new_value})` : ''}`.trim()
  }
  if (item.table_name === 'teacher_notices') {
    return `Posted notice ${item.new_value ? `to ${item.new_value}` : ''}`.trim()
  }
  return 'Updated profile information'
}

const activityTone = (tableName) => {
  if (tableName === 'attendance') return '#10b981'
  if (tableName === 'exam_results') return '#0f766e'
  if (tableName === 'student_remarks') return '#14b8a6'
  if (tableName === 'teacher_notices') return '#f59e0b'
  return '#94a3b8'
}

const activityRoute = (item) => {
  if (item.table_name === 'attendance') return ROUTES.TEACHER_ATTENDANCE_MARK
  if (item.table_name === 'exam_results') return ROUTES.TEACHER_MARKS_ENTER
  if (item.table_name === 'student_remarks') return ROUTES.TEACHER_STUDENT_REMARKS
  if (item.table_name === 'teacher_notices') return ROUTES.TEACHER_NOTICES
  return ROUTES.TEACHER_PROFILE
}

export default TeacherDashboard
