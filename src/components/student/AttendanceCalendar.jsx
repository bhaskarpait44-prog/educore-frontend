const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const AttendanceCalendar = ({
  month,
  year,
  records = [],
  today,
  onSelectDate,
}) => {
  const firstDay = new Date(year, month - 1, 1)
  const totalDays = new Date(year, month, 0).getDate()
  const leadingBlanks = firstDay.getDay()
  const recordMap = new Map(records.map((record) => [String(record.date).slice(0, 10), record]))

  const cells = []
  for (let index = 0; index < leadingBlanks; index += 1) {
    cells.push({ key: `blank-${index}`, blank: true })
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month - 1, day)
    const dateKey = toLocalDateKey(date)
    const record = recordMap.get(dateKey) || null
    const isFuture = dateKey > String(today || '')
    cells.push({
      key: dateKey,
      blank: false,
      day,
      dateKey,
      record,
      isToday: dateKey === String(today || ''),
      isFuture,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    })
  }

  return (
    <div className="overflow-hidden rounded-[24px] border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-[var(--color-border)]">
        {cells.map((cell) =>
          cell.blank ? (
            <div key={cell.key} className="aspect-square bg-[var(--color-surface)]" />
          ) : (
            <button
              key={cell.key}
              type="button"
              onClick={() => cell.record && onSelectDate?.(cell.record)}
              disabled={!cell.record}
              className="group aspect-square p-2 text-left align-top transition"
              style={{
                backgroundColor: 'var(--color-surface)',
                opacity: cell.record ? 1 : 0.84,
                cursor: cell.record ? 'pointer' : 'default',
              }}
            >
              <div className="flex h-full flex-col justify-between rounded-2xl p-2 transition group-hover:bg-black/3 dark:group-hover:bg-white/4">
                <div className="flex justify-between">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                    style={calendarDateStyle(cell)}
                  >
                    {cell.day}
                  </span>
                </div>

                <div className="flex items-end justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: statusTone(cell.record?.status, cell.isFuture, cell.isWeekend).text }}>
                    {statusShort(cell.record?.status, cell.isFuture, cell.isWeekend)}
                  </span>
                  {cell.isToday && (
                    <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]" style={{ backgroundColor: 'rgba(124,58,237,0.12)', color: 'var(--student-accent)' }}>
                      Today
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        )}
      </div>
    </div>
  )
}

function toLocalDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function calendarDateStyle(cell) {
  const tone = statusTone(cell.record?.status, cell.isFuture, cell.isWeekend)
  return {
    backgroundColor: tone.bg,
    color: tone.text,
    border: cell.isToday ? '2px solid rgba(124,58,237,0.28)' : '1px solid transparent',
    boxShadow: cell.isToday ? '0 0 0 3px rgba(124,58,237,0.10)' : 'none',
  }
}

function statusTone(status, isFuture, isWeekend) {
  if (isFuture) return { bg: '#ffffff', text: '#cbd5e1' }
  if (status === 'present') return { bg: '#dcfce7', text: '#15803d' }
  if (status === 'absent') return { bg: '#fee2e2', text: '#dc2626' }
  if (status === 'late') return { bg: '#fef3c7', text: '#b45309' }
  if (status === 'half_day') return { bg: '#dbeafe', text: '#1d4ed8' }
  if (status === 'holiday' || isWeekend) return { bg: '#e5e7eb', text: '#6b7280' }
  return { bg: '#f8fafc', text: '#64748b' }
}

function statusShort(status, isFuture, isWeekend) {
  if (isFuture) return 'Future'
  if (status === 'present') return 'P'
  if (status === 'absent') return 'A'
  if (status === 'late') return 'L'
  if (status === 'half_day') return 'H'
  if (status === 'holiday' || isWeekend) return 'Off'
  return '—'
}

export default AttendanceCalendar
