// ─── Unchanged logic ──────────────────────────────────────────────────────────

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const renderTimeRange = (slot) => {
  if (!slot) return '--'
  return `${to12Hour(slot.start_time)} - ${to12Hour(slot.end_time)}`
}

const to12Hour = (value) => {
  if (!value) return '--'
  const [hour = '0', minute = '0'] = String(value).slice(0, 5).split(':')
  const date = new Date()
  date.setHours(Number(hour), Number(minute), 0, 0)
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

// ─── Subject colour palette ───────────────────────────────────────────────────
// accent = top bar colour
// bg     = pastel card background (flat, no gradient)
// text   = subject name colour

const SUBJECT_COLORS = {
  'Physics':           { accent: '#7C6FCD', bg: '#EEEDFB', text: '#4A4299' },
  'Chemistry':         { accent: '#26A97A', bg: '#E3F7F0', text: '#1A7A58' },
  'Mathematics':       { accent: '#F5A623', bg: '#FEF6E4', text: '#B5750E' },
  'Math':              { accent: '#F5A623', bg: '#FEF6E4', text: '#B5750E' },
  'English':           { accent: '#4BAEE8', bg: '#E8F5FD', text: '#1F7AB0' },
  'Biology':           { accent: '#E84B9A', bg: '#FDEAF4', text: '#B01F6E' },
  'History':           { accent: '#E8834B', bg: '#FDF0E8', text: '#B05215' },
  'Geography':         { accent: '#6AB04C', bg: '#EEF8E8', text: '#3E7A28' },
  'Computer Sc':       { accent: '#4B7BE8', bg: '#EAF0FD', text: '#1F4EB0' },
  'Computer':          { accent: '#4B7BE8', bg: '#EAF0FD', text: '#1F4EB0' },
  'Hindi':             { accent: '#E84B4B', bg: '#FDEAEA', text: '#B01F1F' },
  'Assamese':          { accent: '#E84B4B', bg: '#FDEAEA', text: '#B01F1F' },
  'Economics':         { accent: '#26A9A9', bg: '#E3F7F7', text: '#1A7A7A' },
  'Political Sc':      { accent: '#A926A9', bg: '#F7E3F7', text: '#7A1A7A' },
  'Physical Ed':       { accent: '#26A94B', bg: '#E3F7EA', text: '#1A7A38' },
  'EVS':               { accent: '#6AB04C', bg: '#EEF8E8', text: '#3E7A28' },
  'Environmental Science': { accent: '#6AB04C', bg: '#EEF8E8', text: '#3E7A28' },
  'General Knowledge': { accent: '#A94B26', bg: '#F7EAE3', text: '#7A2E1A' },
  'Sanskrit':          { accent: '#A9A926', bg: '#F7F7E3', text: '#7A7A1A' },
}
const FALLBACK = { accent: '#9E9E9E', bg: '#F5F5F5', text: '#616161' }

const getColor = (name) => SUBJECT_COLORS[name] || FALLBACK

// ─── Component ────────────────────────────────────────────────────────────────

const TimetableGrid = ({ slots = [], currentPeriodId = null }) => {
  // exact same logic as original
  const periods = [...new Set(slots.map((slot) => slot.period_number))].sort((a, b) => a - b)

  if (!periods.length) {
    return (
      <div
        className="rounded-[28px] border p-10 text-center"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No timetable slots are configured yet for this teacher.
        </p>
      </div>
    )
  }

  const slotMap = new Map(slots.map((slot) => [`${slot.day_of_week}:${slot.period_number}`, slot]))
  // end unchanged logic

  const todayName = new Date().toLocaleDateString('en-IN', { weekday: 'long' }).toLowerCase()

  return (
    <>
      <style>{`
        @keyframes ttgPulse {
          0%,100% { opacity:.5; transform:scale(1); }
          50%      { opacity:1;  transform:scale(1.5); }
        }
        .ttg-card {
          transition: transform .13s, box-shadow .13s;
          cursor: default;
        }
        .ttg-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.10) !important;
        }

        /* ── layout switch ── */
        .ttg-desktop { display: block; }
        .ttg-mobile  { display: none;  }
        @media (max-width: 767px) {
          .ttg-desktop { display: none;  }
          .ttg-mobile  { display: block; }
        }

        /* ── table column equal width ── */
        .ttg-table { table-layout: fixed; width: 100%; min-width: 700px; border-collapse: separate; border-spacing: 0; }
        .ttg-table th, .ttg-table td { width: calc(100% / 7); }
        .ttg-table th:first-child, .ttg-table td:first-child { width: 80px; }
      `}</style>

      {/* ══════════════════════════════════════════
          DESKTOP
      ══════════════════════════════════════════ */}
      <div className="ttg-desktop overflow-x-auto rounded-[28px] border"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <table className="ttg-table">
          <thead>
            <tr>
              {/* empty top-left cell */}
              <th style={{ padding: '14px 12px', borderBottom: '1px solid var(--color-border)' }} />
              {DAYS.map((day) => {
                const isToday = day === todayName
                return (
                  <th key={day}
                    style={{
                      padding: '14px 8px',
                      borderBottom: '1px solid var(--color-border)',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{
                      display: 'inline-block',
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '.12em',
                      textTransform: 'uppercase',
                      color: isToday ? '#7C6FCD' : 'var(--color-text-muted)',
                      borderBottom: isToday ? '2px solid #7C6FCD' : 'none',
                      paddingBottom: isToday ? 2 : 0,
                    }}>
                      {day}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {periods.map((period) => (
              <tr key={period}>
                {/* Period label */}
                <td style={{
                  padding: '8px 12px',
                  verticalAlign: 'top',
                  borderTop: '1px solid var(--color-border)',
                  whiteSpace: 'nowrap',
                }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>P{period}</p>
                  <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {renderTimeRange(slots.find((s) => s.period_number === period))}
                  </p>
                </td>

                {DAYS.map((day) => {
                  const slot = slotMap.get(`${day}:${period}`)
                  const isLive = slot?.id === currentPeriodId && currentPeriodId !== null
                  const c = slot ? getColor(slot.subject_name) : null

                  return (
                    <td key={`${day}-${period}`} style={{
                      padding: '6px 5px',
                      verticalAlign: 'top',
                      borderTop: '1px solid var(--color-border)',
                    }}>
                      {slot ? (
                        <div
                          className="ttg-card"
                          style={{
                            borderRadius: 14,
                            backgroundColor: c.bg,
                            padding: '10px 11px 10px 11px',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: isLive ? `0 0 0 2px ${c.accent}` : 'none',
                          }}
                          title={`${slot.subject_name} · ${slot.class_name} ${slot.section_name}`}
                        >
                          {/* Coloured top accent bar */}
                          <div style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0,
                            height: 4,
                            backgroundColor: c.accent,
                            borderRadius: '14px 14px 0 0',
                          }} />

                          {/* Live pulse */}
                          {isLive && (
                            <span style={{
                              position: 'absolute', top: 9, right: 8,
                              width: 7, height: 7, borderRadius: '50%',
                              backgroundColor: c.accent,
                              animation: 'ttgPulse 1.8s ease-in-out infinite',
                            }} />
                          )}

                          <div style={{ paddingTop: 4 }}>
                            <p style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: c.text,
                              lineHeight: 1.3,
                              marginBottom: 3,
                            }}>
                              {slot.subject_name}
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                              {slot.class_name} · {slot.section_name}
                            </p>
                            <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
                              {renderTimeRange(slot)}
                            </p>
                            {slot.room_number && (
                              <p style={{ fontSize: 10, color: c.accent, marginTop: 2, fontWeight: 600 }}>
                                Room {slot.room_number}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Free cell — subtle dashed */
                        <div style={{
                          borderRadius: 14,
                          border: '1.5px dashed var(--color-border)',
                          padding: '10px 11px',
                          minHeight: 64,
                          display: 'flex',
                          alignItems: 'center',
                        }}>
                          <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>—</p>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE  —  stacked by period
      ══════════════════════════════════════════ */}
      <div className="ttg-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {periods.map((period) => {
          const periodSlot = slots.find((s) => s.period_number === period)
          return (
            <div key={period} style={{
              borderRadius: 20,
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              overflow: 'hidden',
            }}>
              {/* Period header */}
              <div style={{
                padding: '9px 14px',
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-raised)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Period {period}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {renderTimeRange(periodSlot)}
                </span>
              </div>

              {/* Cards for each day */}
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {DAYS.map((day) => {
                  const slot = slotMap.get(`${day}:${period}`)
                  const isLive = slot?.id === currentPeriodId && currentPeriodId !== null
                  const isToday = day === todayName
                  const c = slot ? getColor(slot.subject_name) : null

                  if (!slot) {
                    if (!isToday) return null
                    return (
                      <div key={day} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px',
                        borderRadius: 12,
                        border: '1.5px dashed var(--color-border)',
                      }}>
                        <span style={{
                          fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                          letterSpacing: '.06em', color: '#7C6FCD', minWidth: 32,
                        }}>{day.slice(0, 3)}</span>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Free period</span>
                      </div>
                    )
                  }

                  return (
                    <div key={day}
                      className="ttg-card"
                      style={{
                        display: 'flex',
                        borderRadius: 14,
                        overflow: 'hidden',
                        boxShadow: isLive ? `0 0 0 2px ${c.accent}` : 'none',
                        backgroundColor: c.bg,
                        position: 'relative',
                      }}
                    >
                      {/* Left accent bar */}
                      <div style={{
                        width: 5,
                        flexShrink: 0,
                        backgroundColor: c.accent,
                      }} />

                      {/* Day label column */}
                      <div style={{
                        width: 44,
                        flexShrink: 0,
                        backgroundColor: c.bg,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 4px',
                        borderRight: `1px solid ${c.accent}33`,
                        gap: 3,
                      }}>
                        <span style={{
                          fontSize: 10, fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '.05em',
                          color: c.text,
                        }}>
                          {day.slice(0, 3)}
                        </span>
                        {isToday && (
                          <span style={{
                            fontSize: 8, fontWeight: 700,
                            backgroundColor: c.accent,
                            color: '#fff',
                            borderRadius: 6,
                            padding: '1px 4px',
                          }}>
                            TODAY
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, padding: '9px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: c.text }}>
                            {slot.subject_name}
                          </p>
                          {isLive && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 10, fontWeight: 700,
                              backgroundColor: c.accent,
                              color: '#fff',
                              borderRadius: 10,
                              padding: '2px 7px',
                            }}>
                              <span style={{
                                width: 5, height: 5, borderRadius: '50%',
                                backgroundColor: '#fff',
                                animation: 'ttgPulse 1.8s ease-in-out infinite',
                                display: 'inline-block',
                              }} />
                              LIVE
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                          {slot.class_name} · {slot.section_name}
                        </p>
                        <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                            {renderTimeRange(slot)}
                          </span>
                          {slot.room_number && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: c.accent }}>
                              Room {slot.room_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

export default TimetableGrid