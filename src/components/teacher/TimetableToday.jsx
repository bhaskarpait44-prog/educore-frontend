import { CalendarClock, ClipboardCheck, Users } from 'lucide-react'
import { ROUTES } from '@/constants/app'

const TimetableToday = ({ schedule = [], currentPeriodId = null, onNavigate }) => {
  if (!schedule.length) {
    return (
      <div
        className="rounded-2xl border p-10 text-center"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <CalendarClock size={18} className="mx-auto" style={{ color: 'var(--color-text-muted)' }} />
        <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No classes are scheduled for today.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {schedule.map((slot, index) => {
        const isCurrent = slot.id === currentPeriodId || slot.status === 'current'
        const isUpcoming = !isCurrent && slot.status === 'upcoming'
        const isDone = slot.status === 'done'

        const accentColor = isCurrent ? '#16a34a' : isUpcoming ? '#f59e0b' : 'rgba(0,0,0,0.08)'
        const cardBorder = isCurrent
          ? '1px solid rgba(22,163,74,0.3)'
          : isUpcoming
          ? '1px solid rgba(245,158,11,0.25)'
          : '1px solid var(--color-border)'

        return (
          <div
            key={slot.id || `${slot.period_number}-${index}`}
            className="flex overflow-hidden rounded-xl"
            style={{
              border: cardBorder,
              backgroundColor: 'var(--color-surface)',
              opacity: isDone ? 0.6 : 1,
            }}
          >
            {/* Left accent strip */}
            <div className="w-1 flex-shrink-0" style={{ backgroundColor: accentColor }} />

            {/* Period number column */}
            <div
              className="flex w-14 flex-shrink-0 flex-col items-center justify-center gap-0.5 py-4"
              style={{ borderRight: '1px solid var(--color-border)' }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                P
              </span>
              <span className="text-lg font-bold leading-none" style={{ color: isCurrent ? '#15803d' : 'var(--color-text-primary)' }}>
                {slot.period_number}
              </span>
              {isCurrent && (
                <span className="mt-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: '#16a34a' }} />
              )}
            </div>

            {/* Main content */}
            <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              {/* Left: info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {slot.subject_name}
                  </p>
                  <StatusBadge isCurrent={isCurrent} isUpcoming={isUpcoming} isDone={isDone} />
                </div>

                <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {slot.class_name} {slot.section_name}
                  {slot.room_number ? (
                    <span style={{ color: isCurrent ? '#15803d' : '#0f766e' }}>
                      {' '}· Room {slot.room_number}
                    </span>
                  ) : null}
                </p>

                <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  {to12Hour(slot.start_time)} – {to12Hour(slot.end_time)}
                </p>

                {/* Countdown */}
                {(isCurrent || isUpcoming) && typeof slot.countdown_minutes === 'number' && (
                  <p className="mt-1 text-[11px] font-semibold" style={{ color: isCurrent ? '#15803d' : '#b45309' }}>
                    {isCurrent ? 'Ends in' : 'Starts in'} {formatMinutes(slot.countdown_minutes)}
                  </p>
                )}
              </div>

              {/* Right: actions */}
              <div className="flex flex-shrink-0 flex-wrap gap-2">
                <ActionBtn
                  icon={ClipboardCheck}
                  label="Attendance"
                  onClick={() => onNavigate(ROUTES.TEACHER_ATTENDANCE_MARK, {
                    state: {
                      class_id: String(slot.class_id),
                      section_id: String(slot.section_id),
                      subject_id: String(slot.subject_id || ''),
                      assignment_role: 'class_teacher',
                    },
                  })}
                  color="#0f766e"
                />
                <ActionBtn
                  icon={Users}
                  label="Students"
                  onClick={() => onNavigate(ROUTES.TEACHER_STUDENTS, {
                    state: {
                      class_id: String(slot.class_id),
                      section_id: String(slot.section_id),
                    },
                  })}
                  color="#0284c7"
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ isCurrent, isUpcoming, isDone }) => {
  let bg, color, label
  if (isCurrent)      { bg = 'rgba(22,163,74,0.12)';  color = '#15803d'; label = 'Live'     }
  else if (isUpcoming){ bg = 'rgba(245,158,11,0.12)'; color = '#b45309'; label = 'Next'     }
  else if (isDone)    { bg = 'rgba(0,0,0,0.06)';      color = 'var(--color-text-muted)'; label = 'Done' }
  else                { bg = 'rgba(0,0,0,0.05)';      color = 'var(--color-text-muted)'; label = 'Later'}

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: bg, color }}
    >
      {isCurrent && (
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-600" />
      )}
      {label}
    </span>
  )
}

// ─── Action button ────────────────────────────────────────────────────────────

const ActionBtn = ({ icon: Icon, label, onClick, color }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5"
    style={{
      backgroundColor: `${color}14`,
      color,
      border: `1px solid ${color}28`,
    }}
  >
    <Icon size={12} />
    {label}
  </button>
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function to12Hour(value) {
  if (!value) return '--'
  const [hour = '0', minute = '0'] = String(value).slice(0, 5).split(':')
  const date = new Date()
  date.setHours(Number(hour), Number(minute), 0, 0)
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

function formatMinutes(value) {
  const m = Number(value || 0)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h}h ${r}m` : `${h}h`
}

export default TimetableToday