import { CalendarClock, Clock } from 'lucide-react'

const TimetableToday = ({ schedule = [], currentPeriodId = null, nextPeriodId = null }) => {
  if (!schedule.length) {
    return (
      <div
        className="rounded-2xl border p-10 text-center"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <CalendarClock size={18} className="mx-auto" style={{ color: 'var(--color-text-muted)' }} />
        <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No classes scheduled for today.
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl border p-3"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      {/* Wrap flex — cards shrink to fit, no scroll */}
      <div className="flex flex-wrap gap-2">
        {schedule.map((slot, index) => {
          const current = slot.id === currentPeriodId || slot.status === 'current'
          const isNext = !current && (slot.id === nextPeriodId || slot.status === 'upcoming')
          const done = slot.status === 'done'
          const isLast = index === schedule.length - 1

          const accentColor = current
            ? '#16a34a'
            : isNext
            ? '#f59e0b'
            : done
            ? 'rgba(0,0,0,0.1)'
            : 'rgba(0,0,0,0.07)'

          const cardBorder = current
            ? '1px solid rgba(22,163,74,0.3)'
            : isNext
            ? '1px solid rgba(245,158,11,0.3)'
            : '1px solid var(--color-border)'

          return (
            <div
              key={slot.id || `${slot.period_number}-${index}`}
              className="flex items-center gap-2"
              style={{ flex: '1 1 140px', minWidth: 0, maxWidth: '200px' }}
            >
              {/* ── Card ── */}
              <div
                className="flex flex-col overflow-hidden rounded-xl w-full"
                style={{
                  border: cardBorder,
                  backgroundColor: 'var(--color-surface)',
                  opacity: done ? 0.55 : 1,
                }}
              >
                {/* Accent bar */}
                <div className="h-[3px] w-full flex-shrink-0" style={{ backgroundColor: accentColor }} />

                <div className="flex flex-col gap-1.5 p-2.5">
                  {/* Period + badge */}
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      P{slot.period_number}
                    </span>
                    <StatusBadge current={current} isNext={isNext} done={done} />
                  </div>

                  {/* Subject */}
                  <p
                    className="text-xs font-semibold leading-tight truncate"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {slot.subject_name}
                  </p>

                  {/* Teacher */}
                  <p
                    className="text-[11px] truncate"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {slot.teacher_name || '—'}
                  </p>

                  {/* Divider */}
                  <div style={{ borderTop: '1px solid var(--color-border)', margin: '1px -10px' }} />

                  {/* Time */}
                  <div className="flex items-center gap-1 pt-0.5">
                    <Clock size={9} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                    <p className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                      {to12Hour(slot.start_time)} – {to12Hour(slot.end_time)}
                    </p>
                  </div>

                  {/* Room */}
                  {slot.room_number && (
                    <p
                      className="text-[10px] font-medium"
                      style={{ color: current ? '#15803d' : '#0f766e' }}
                    >
                      Room {slot.room_number}
                    </p>
                  )}

                  {/* Countdown */}
                  {(current || isNext) && typeof slot.countdown_minutes === 'number' && (
                    <div
                      className="mt-1 rounded-lg px-2 py-1.5 text-center"
                      style={{
                        backgroundColor: current ? 'rgba(22,163,74,0.09)' : 'rgba(245,158,11,0.09)',
                      }}
                    >
                      <p
                        className="text-[9px] font-semibold uppercase tracking-wider"
                        style={{ color: current ? '#15803d' : '#b45309' }}
                      >
                        {current ? 'Ends in' : 'Starts in'}
                      </p>
                      <p
                        className="mt-0.5 text-[11px] font-bold"
                        style={{ color: current ? '#15803d' : '#b45309' }}
                      >
                        {formatMinutes(slot.countdown_minutes)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chevron connector — hidden on last */}
              {!isLast && (
                <svg
                  width="6" height="10" viewBox="0 0 6 10" fill="none"
                  style={{ flexShrink: 0, opacity: 0.25 }}
                >
                  <path d="M1 1l4 4-4 4" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ current, isNext, done }) => {
  let bg, color, label
  if (current)     { bg = 'rgba(22,163,74,0.12)';  color = '#15803d';                  label = 'Live'  }
  else if (isNext) { bg = 'rgba(245,158,11,0.12)'; color = '#b45309';                  label = 'Next'  }
  else if (done)   { bg = 'rgba(0,0,0,0.06)';      color = 'var(--color-text-muted)';  label = 'Done'  }
  else             { bg = 'rgba(0,0,0,0.05)';      color = 'var(--color-text-muted)';  label = 'Later' }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: bg, color }}
    >
      {current && (
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-600" />
      )}
      {label}
    </span>
  )
}

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