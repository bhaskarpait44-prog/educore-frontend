import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, FileClock, ShieldCheck, XCircle } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useTeacherLeave from '@/hooks/useTeacherLeave'
import LeaveBalance from '@/components/teacher/LeaveBalance'
import LeaveForm from '@/components/teacher/LeaveForm'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate } from '@/utils/helpers'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const TeacherLeave = () => {
  usePageTitle('Leave Application')

  const { toastSuccess, toastError } = useToast()
  const {
    balances,
    applications,
    session,
    workingDays,
    holidays,
    loading,
    saving,
    stats,
    applyLeave,
    cancelLeave,
  } = useTeacherLeave()
  const [cancelTarget, setCancelTarget] = useState(null)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const calendarDays = useMemo(
    () => buildMonthCalendar(calendarMonth, workingDays, holidays, applications),
    [applications, calendarMonth, holidays, workingDays]
  )

  const handleApply = async (payload) => {
    try {
      await applyLeave(payload)
      toastSuccess('Leave application submitted.')
    } catch (error) {
      toastError(error?.message || 'Unable to submit leave application.')
    }
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    try {
      await cancelLeave(cancelTarget.id)
      toastSuccess('Leave application cancelled.')
      setCancelTarget(null)
    } catch (error) {
      toastError(error?.message || 'Unable to cancel leave application.')
    }
  }

  return (
    <div className="space-y-5 pb-20">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.18), rgba(16, 185, 129, 0.06) 58%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Leave Application
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Apply for leave, track approval status, view your session leave balance, and check your leave calendar at a glance.
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em]" style={{ color: '#0f766e' }}>
              Current Session: {session?.name || 'Not available'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title="Applications" value={stats.total} tone="#0f766e" />
            <StatCard title="Pending" value={stats.pending} tone="#f59e0b" />
            <StatCard title="Approved" value={stats.approved} tone="#10b981" />
            <StatCard title="Rejected" value={stats.rejected} tone="#ef4444" />
          </div>
        </div>
      </section>

      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Leave Balance
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-36 animate-pulse rounded-[24px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
            ))}
          </div>
        ) : balances.length ? (
          <LeaveBalance balances={balances} />
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="No leave balances configured"
            description="Leave balances are not yet configured for this session."
          />
        )}
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,420px)]">
        <section
          className="rounded-[28px] border p-5 sm:p-6"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <div className="mb-4 flex items-center gap-2">
            <FileClock size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Apply Leave
            </h2>
          </div>
          <LeaveForm
            workingDays={workingDays}
            holidays={holidays}
            onSubmit={handleApply}
            saving={saving}
          />
        </section>

        <section
          className="rounded-[28px] border p-5 sm:p-6"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Leave Calendar
            </h2>
          </div>

          <div
            className="rounded-[26px] border p-3 sm:p-4"
            style={{
              borderColor: 'var(--color-border)',
              background: 'linear-gradient(180deg, var(--color-surface-raised), var(--color-surface))',
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                  Calendar View
                </p>
                <p className="mt-1 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {calendarMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date()
                    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1))
                  }}
                  className="min-h-10 rounded-2xl border px-3 text-sm font-semibold"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface)' }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-2">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="rounded-2xl py-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface)' }}
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day) => (
                <div
                  key={day.key}
                  className="min-h-[72px] rounded-[18px] border p-1.5 sm:min-h-[82px] sm:rounded-[22px] sm:p-2"
                  style={{
                    borderColor: day.isToday ? day.accent : day.isCurrentMonth ? 'var(--color-border)' : 'transparent',
                    backgroundColor: day.bg,
                    opacity: day.isCurrentMonth ? 1 : 0.45,
                    boxShadow: day.isToday ? `0 0 0 1px ${day.accent} inset` : 'none',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: day.textMuted }}>
                        {MONTH_NAMES[day.date.getMonth()]}
                      </p>
                      <p className="mt-0.5 text-xs font-bold sm:mt-1 sm:text-sm" style={{ color: day.text }}>
                        {day.date.getDate()}
                      </p>
                    </div>
                    {day.isToday ? (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]"
                        style={{ backgroundColor: day.accent, color: '#fff' }}
                      >
                        Today
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 sm:mt-3">
                    <p className="text-[9px] font-semibold leading-tight sm:text-[10px]" style={{ color: day.text }}>
                      {day.shortLabel || day.label}
                    </p>
                    {day.subLabel ? (
                      <p
                        className="mt-0.5 text-[8px] leading-tight sm:mt-1 sm:text-[9px]"
                        style={{ color: day.textMuted, wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                      >
                        {day.shortSubLabel || day.subLabel}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { label: 'Approved Leave', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
              { label: 'Pending Leave', color: '#d97706', bg: 'rgba(245, 158, 11, 0.14)' },
              { label: 'Rejected Leave', color: '#dc2626', bg: 'rgba(239, 68, 68, 0.12)' },
              { label: 'Holiday', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.10)' },
              { label: 'Working Day', color: '#0f766e', bg: 'rgba(15, 118, 110, 0.10)' },
              { label: 'Weekend / Off Day', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border px-3 py-2" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 0 4px ${item.bg}` }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Leave Status
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Review all leave applications and cancel only pending requests.
        </p>

        <div className="mt-4 space-y-4">
          {loading ? (
            [...Array(4)].map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-[24px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
            ))
          ) : applications.length === 0 ? (
            <EmptyState
              icon={FileClock}
              title="No leave applications yet"
              description="Your submitted leave requests will appear here."
            />
          ) : (
            applications.map((application) => (
              <article
                key={application.id}
                className="rounded-[24px] border p-4"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={statusVariant(application.status)}>{application.status}</Badge>
                      <Badge variant="blue">{application.leave_type.replace('_', ' ')}</Badge>
                    </div>
                    <h3 className="mt-3 break-words text-sm font-semibold sm:text-base" style={{ color: 'var(--color-text-primary)' }}>
                      {formatDate(application.from_date, 'long')} to {formatDate(application.to_date, 'long')}
                    </h3>
                    <p className="mt-2 break-words text-xs leading-5 sm:text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {application.reason}
                    </p>
                    <p className="mt-2 break-words text-[11px] sm:text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {Number(application.days_count || 0)} day(s)
                      {application.reviewed_by_name ? ` | Reviewed by ${application.reviewed_by_name}` : ''}
                    </p>
                  </div>

                  {application.status === 'pending' ? (
                    <Button
                      variant="ghost"
                      icon={XCircle}
                      onClick={() => setCancelTarget(application)}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        loading={saving}
        title="Cancel leave application?"
        description={`This will cancel the pending ${cancelTarget?.leave_type?.replace('_', ' ') || 'leave'} request.`}
        confirmLabel="Cancel Leave"
      />
    </div>
  )
}

const StatCard = ({ title, value, tone }) => (
  <div className="rounded-[22px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
      {title}
    </p>
    <p className="mt-2 text-2xl font-bold" style={{ color: tone }}>
      {value}
    </p>
  </div>
)

const statusVariant = (status) => {
  if (status === 'approved') return 'green'
  if (status === 'rejected') return 'red'
  if (status === 'pending') return 'yellow'
  return 'grey'
}

const buildMonthCalendar = (monthDate, workingDays, holidays, applications) => {
  const today = new Date()
  const todayKey = today.toISOString().slice(0, 10)
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - monthStart.getDay())
  const gridEnd = new Date(monthEnd)
  gridEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()))
  const holidayMap = new Map((holidays || []).map((holiday) => [String(holiday.holiday_date).slice(0, 10), holiday]))
  const result = []

  for (let cursor = new Date(gridStart); cursor <= gridEnd; cursor.setDate(cursor.getDate() + 1)) {
    const currentDate = new Date(cursor)
    const key = currentDate.toISOString().slice(0, 10)
    const dayKey = DAY_KEYS[currentDate.getDay()]
    const matchingLeave = applications.find((application) => key >= application.from_date && key <= application.to_date)
    const holiday = holidayMap.get(key)
    const isWorkingDay = workingDays?.[dayKey] ?? (dayKey !== 'saturday' && dayKey !== 'sunday')
    const isToday = key === todayKey
    const isCurrentMonth = currentDate.getMonth() === monthDate.getMonth()

    let label = isWorkingDay ? 'Working day' : 'Off day'
    let subLabel = holiday?.name || null
    let bg = 'var(--color-surface)'
    let accent = '#94a3b8'
    let text = 'var(--color-text-primary)'
    let textMuted = 'var(--color-text-muted)'

    if (matchingLeave?.status === 'pending') {
      label = 'Pending leave'
      subLabel = matchingLeave.leave_type.replace('_', ' ')
      bg = 'rgba(245, 158, 11, 0.14)'
      accent = '#d97706'
      text = '#92400e'
      textMuted = '#b45309'
    } else if (matchingLeave?.status === 'approved') {
      label = 'Approved leave'
      subLabel = matchingLeave.leave_type.replace('_', ' ')
      bg = 'rgba(16, 185, 129, 0.12)'
      accent = '#10b981'
      text = '#065f46'
      textMuted = '#0f766e'
    } else if (matchingLeave?.status === 'rejected') {
      label = 'Rejected leave'
      subLabel = matchingLeave.leave_type.replace('_', ' ')
      bg = 'rgba(239, 68, 68, 0.12)'
      accent = '#dc2626'
      text = '#991b1b'
      textMuted = '#b91c1c'
    } else if (holiday) {
      label = 'Holiday'
      bg = 'rgba(124, 58, 237, 0.10)'
      accent = '#7c3aed'
      text = '#5b21b6'
      textMuted = '#7c3aed'
    } else if (isWorkingDay) {
      bg = 'rgba(15, 118, 110, 0.10)'
      accent = '#0f766e'
      text = '#115e59'
      textMuted = '#0f766e'
    }

    result.push({
      key,
      date: currentDate,
      label,
      shortLabel: shortenCalendarLabel(label),
      subLabel,
      shortSubLabel: shortenCalendarText(subLabel),
      bg,
      accent,
      text,
      textMuted,
      isToday,
      isCurrentMonth,
    })
  }

  return result
}

const shortenCalendarLabel = (label) => {
  if (label === 'Approved leave') return 'Approved'
  if (label === 'Pending leave') return 'Pending'
  if (label === 'Rejected leave') return 'Rejected'
  if (label === 'Working day') return 'Working'
  if (label === 'Off day') return 'Off'
  return label
}

const shortenCalendarText = (text) => {
  if (!text) return null
  return text.length > 12 ? `${text.slice(0, 12)}...` : text
}

export default TeacherLeave
