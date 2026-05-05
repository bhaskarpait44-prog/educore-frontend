import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, Trash2, BookOpen, ScrollText,
  KeyRound, Copy, Mail, IdCard, CalendarCheck, GraduationCap, Wallet,
  Phone, Heart, User, ChevronLeft, ChevronRight as ChevronRIcon,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import useStudentStore from '@/store/studentStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { getInitials, formatDate } from '@/utils/helpers'
import { ROUTES } from '@/constants/app'
import * as studentApi from '@/api/students'
import useAuth from '@/hooks/useAuth'
import TabAuditLog from './tabs/TabAuditLog'
import TabResults from './tabs/TabResults'
import TabFees from './tabs/TabFees'
import TabIdentity from './tabs/TabIdentity'
import TabProfile from './tabs/TabProfile'
import TabDocuments from './tabs/TabDocuments'
import useAttendanceStore from '@/store/attendanceStore'

// ─── Palette ──────────────────────────────────────────────────────────────────
const PALETTES = [
  { a: '#4338ca', light: '#eef2ff', text: '#3730a3', border: '#c7d2fe' },
  { a: '#0e7490', light: '#ecfeff', text: '#155e75', border: '#a5f3fc' },
  { a: '#047857', light: '#ecfdf5', text: '#065f46', border: '#6ee7b7' },
  { a: '#b45309', light: '#fffbeb', text: '#92400e', border: '#fde68a' },
  { a: '#b91c1c', light: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  { a: '#6d28d9', light: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe' },
]

const getPalette = (name = '') => PALETTES[name.charCodeAt(0) % PALETTES.length]

const formatStream = (s) => {
  if (!s) return null
  const l = s[0].toUpperCase() + s.slice(1)
  return s === 'regular' ? l : `${l} Stream`
}

// ─── Primitives ───────────────────────────────────────────────────────────────
const Divider = () => (
  <div style={{ height: '0.5px', background: 'var(--color-border)', margin: '8px 0' }} />
)

const FieldItem = ({ label, value }) => (
  <div style={{ padding: '5px 0' }}>
    <p style={{
      margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: '0.09em',
      textTransform: 'uppercase', color: 'var(--color-text-muted)',
    }}>{label}</p>
    <p style={{
      margin: '2px 0 0', fontSize: 12.5, fontWeight: 400,
      color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
      fontStyle: value ? 'normal' : 'italic',
    }}>{value || 'Not provided'}</p>
  </div>
)

const SecLabel = ({ icon: Icon, title, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '12px 0 4px' }}>
    <Icon size={11} style={{ color }} />
    <span style={{
      fontSize: 10, fontWeight: 600, letterSpacing: '0.09em',
      textTransform: 'uppercase', color: 'var(--color-text-muted)',
    }}>{title}</span>
  </div>
)

// ─── LEFT PANEL (desktop sidebar / mobile collapsible card) ───────────────────
const LeftPanel = ({ student, palette, isAdmin, onResetPassword, onDelete }) => {
  const [expanded, setExpanded] = useState(false)
  const fullName = `${student.first_name} ${student.last_name}`.trim()
  const enrollment = student.current_enrollment

  const detailsBody = (
    <div style={{ padding: '4px 14px 14px' }}>
      {enrollment && (
        <>
          <SecLabel icon={BookOpen} title="Enrollment" color={palette.a} />
          <FieldItem label="Class" value={[enrollment.class, formatStream(enrollment.stream)].filter(Boolean).join(' — ')} />
          <FieldItem label="Section · Roll" value={`Sec ${enrollment.section}  ·  Roll ${enrollment.roll_number || '—'}`} />
          {student.session_name && <FieldItem label="Session" value={student.session_name} />}
        </>
      )}

      <Divider />
      <SecLabel icon={User} title="Identity" color="#0891b2" />
      <FieldItem label="Date of Birth" value={formatDate(student.date_of_birth, 'long')} />
      <FieldItem label="Gender" value={student.gender} />
      <FieldItem label="Blood Group" value={student.blood_group} />
      {student.medical_notes && <FieldItem label="Medical Notes" value={student.medical_notes} />}

      <Divider />
      <SecLabel icon={Phone} title="Contact" color="#059669" />
      <FieldItem label="Phone" value={student.phone} />
      <FieldItem label="Email" value={student.email} />
      <FieldItem label="Address" value={[student.city, student.address].filter(Boolean).join(', ')} />

      <Divider />
      <SecLabel icon={Heart} title="Parents" color="#d97706" />
      <FieldItem label="Father" value={student.father_name} />
      <FieldItem label="Father Phone" value={student.father_phone} />
      <FieldItem label="Mother" value={student.mother_name} />
      <FieldItem label="Emergency" value={student.emergency_contact} />

      {isAdmin && (
        <>
          <Divider />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 2 }}>
            <button
              onClick={onResetPassword}
              style={{
                width: '100%', padding: '7px', borderRadius: 8,
                fontSize: 11.5, fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                backgroundColor: 'var(--color-surface-raised)',
                border: '0.5px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <KeyRound size={11} /> Reset Password
            </button>
            <button
              onClick={onDelete}
              style={{
                width: '100%', padding: '7px', borderRadius: 8,
                fontSize: 11.5, fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                backgroundColor: '#fef2f2',
                border: '0.5px solid #fecaca',
                color: '#dc2626',
              }}
            >
              <Trash2 size={11} /> Delete Student
            </button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <div className="sdp-left-desktop" style={{
        width: 240, flexShrink: 0, alignSelf: 'flex-start',
        position: 'sticky', top: 16,
        borderRadius: 14, overflow: 'hidden',
        backgroundColor: 'var(--color-surface)',
        border: '0.5px solid var(--color-border)',
      }}>
        {/* Avatar block */}
        <div style={{
          padding: '22px 16px 14px',
          textAlign: 'center',
          borderBottom: '0.5px solid var(--color-border)',
          backgroundColor: palette.light,
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            margin: '0 auto 10px',
            backgroundColor: palette.light,
            border: `1.5px solid ${palette.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 600, color: palette.a, letterSpacing: '-0.02em',
          }}>
            {getInitials(fullName)}
          </div>
          <h2 style={{
            margin: 0, fontSize: 14, fontWeight: 600,
            letterSpacing: '-0.01em', color: 'var(--color-text-primary)', lineHeight: 1.3,
          }}>{fullName}</h2>
          <p style={{
            margin: '3px 0 8px', fontSize: 11,
            fontFamily: 'monospace', fontWeight: 500, color: 'var(--color-text-muted)',
          }}>{student.admission_no}</p>
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '2px 10px', borderRadius: 99,
            backgroundColor: student.is_deleted ? 'var(--color-surface-raised)' : '#dcfce7',
            color: student.is_deleted ? 'var(--color-text-muted)' : '#15803d',
            border: `0.5px solid ${student.is_deleted ? 'var(--color-border)' : '#bbf7d0'}`,
          }}>
            {student.is_deleted ? 'Inactive' : 'Active'}
          </span>
        </div>
        {detailsBody}
      </div>

      {/* ── Mobile profile card (hidden on desktop) ── */}
      <div className="sdp-left-mobile" style={{
        display: 'none', // shown via media query
        borderRadius: 14, overflow: 'hidden',
        backgroundColor: 'var(--color-surface)',
        border: '0.5px solid var(--color-border)',
      }}>
        {/* Compact header row — always visible */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px',
          backgroundColor: palette.light,
          borderBottom: expanded ? '0.5px solid var(--color-border)' : 'none',
        }}>
          {/* Avatar */}
          <div style={{
            width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
            backgroundColor: palette.light,
            border: `1.5px solid ${palette.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 600, color: palette.a,
          }}>
            {getInitials(fullName)}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              margin: 0, fontSize: 15, fontWeight: 600,
              color: 'var(--color-text-primary)', lineHeight: 1.3,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{fullName}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: '#2563eb',
              }}>{student.admission_no}</span>
              {enrollment && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: 'var(--color-text-muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    Class {enrollment.class}{enrollment.section ? ` · Sec ${enrollment.section}` : ''}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Status badge + expand toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '2px 8px', borderRadius: 99,
              backgroundColor: student.is_deleted ? 'var(--color-surface-raised)' : '#dcfce7',
              color: student.is_deleted ? 'var(--color-text-muted)' : '#15803d',
              border: `0.5px solid ${student.is_deleted ? 'var(--color-border)' : '#bbf7d0'}`,
            }}>
              {student.is_deleted ? 'Inactive' : 'Active'}
            </span>
            <button
              onClick={() => setExpanded(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                border: '0.5px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-secondary)', cursor: 'pointer',
              }}
            >
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {expanded ? 'Less' : 'Details'}
            </button>
          </div>
        </div>

        {/* Expandable details */}
        {expanded && detailsBody}
      </div>
    </>
  )
}

// ─── ATTENDANCE CALENDAR ──────────────────────────────────────────────────────
const WDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const STATUS = {
  present: { bg: '#f0fdf4', border: '#bbf7d0', dot: '#16a34a', text: '#166534' },
  absent:  { bg: '#fef2f2', border: '#fecaca', dot: '#dc2626', text: '#991b1b' },
  late:    { bg: '#fffbeb', border: '#fde68a', dot: '#d97706', text: '#92400e' },
  half_day: { bg: '#eff6ff', border: '#bfdbfe', dot: '#2563eb', text: '#1e40af' },
  holiday: { bg: 'var(--color-surface-raised)', border: 'var(--color-border)', dot: '#94a3b8', text: 'var(--color-text-muted)' },
}

const LEGEND_KEYS = ['present', 'absent', 'late', 'holiday']

const AttendanceCalendar = ({ enrollmentId }) => {
  const { fetchStudentAttendance, studentRecords, studentSummary, isLoading } = useAttendanceStore()
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  useEffect(() => {
    if (!enrollmentId) return
    const from = new Date(year, month, 1).toISOString().split('T')[0]
    const to = new Date(year, month + 1, 0).toISOString().split('T')[0]
    fetchStudentAttendance(enrollmentId, { from, to })
  }, [year, month, enrollmentId, fetchStudentAttendance])

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const next = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const firstDay  = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const cells     = Array(firstDay).fill(null).concat(
    Array.from({ length: totalDays }, (_, i) => i + 1)
  )

  const recordsMap = useMemo(() => {
    const map = {}
    studentRecords.forEach(r => {
      const d = new Date(r.date).getDate()
      map[d] = r.status
    })
    return map
  }, [studentRecords])

  const STATS = [
    { label: 'Present', value: studentSummary?.presentCount || 0, bg: '#f0fdf4', border: '#bbf7d0', labelColor: '#16a34a', valColor: '#166534' },
    { label: 'Absent',  value: studentSummary?.absentCount || 0, bg: '#fef2f2', border: '#fecaca', labelColor: '#ef4444', valColor: '#991b1b' },
    { label: 'Late',    value: studentSummary?.lateCount || 0, bg: '#fffbeb', border: '#fde68a', labelColor: '#f59e0b', valColor: '#92400e' },
    { label: 'Rate',    value: studentSummary?.percentage !== undefined ? `${studentSummary.percentage}%` : '—', bg: '#eff6ff', border: '#bfdbfe', labelColor: '#3b82f6', valColor: '#1e40af' },
  ]

  return (
    <div style={{ opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
      {/* Stats row — 2×2 on mobile, 4-col on desktop */}
      <div className="sdp-stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8, marginBottom: 20,
      }}>
        {STATS.map(s => (
          <div key={s.label} style={{
            padding: '11px 13px', borderRadius: 10,
            backgroundColor: s.bg,
            border: `0.5px solid ${s.border}`,
          }}>
            <p style={{
              margin: 0, fontSize: 9.5, fontWeight: 600,
              letterSpacing: '0.09em', textTransform: 'uppercase', color: s.labelColor,
            }}>{s.label}</p>
            <p style={{
              margin: '4px 0 0', fontSize: 22, fontWeight: 600,
              color: s.valColor, letterSpacing: '-0.03em', lineHeight: 1,
            }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          onClick={prev}
          style={{
            width: 34, height: 34, borderRadius: 8,
            border: '0.5px solid var(--color-border)',
            background: 'var(--color-surface)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-secondary)',
          }}
        >
          <ChevronLeft size={15} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={next}
          style={{
            width: 34, height: 34, borderRadius: 8,
            border: '0.5px solid var(--color-border)',
            background: 'var(--color-surface)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-secondary)',
          }}
        >
          <ChevronRIcon size={15} />
        </button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 3 }}>
        {WDAYS.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 9.5, fontWeight: 600,
            letterSpacing: '0.07em', textTransform: 'uppercase',
            color: 'var(--color-text-muted)', padding: '3px 0',
          }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e${idx}`} />
          const status  = recordsMap[day]
          const s       = STATUS[status]
          const isToday = (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
          )
          return (
            <div
              key={day}
              title={status || 'No school'}
              style={{
                aspectRatio: '1',
                borderRadius: 7,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                backgroundColor: s ? s.bg : 'var(--color-surface-raised)',
                border: isToday
                  ? '1.5px solid #3b82f6'
                  : `0.5px solid ${s ? s.border : 'var(--color-border)'}`,
                outline: isToday ? '2px solid #bfdbfe' : 'none',
                outlineOffset: '-2px',
              }}
            >
              <span style={{
                fontSize: 11,
                fontWeight: isToday ? 700 : 400,
                color: isToday ? '#1d4ed8' : (s ? s.text : 'var(--color-text-muted)'),
              }}>
                {day}
              </span>
              {s && (
                <div style={{
                  width: 3, height: 3, borderRadius: '50%',
                  backgroundColor: s.dot,
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10,
        marginTop: 14, paddingTop: 12,
        borderTop: '0.5px solid var(--color-border)',
      }}>
        {LEGEND_KEYS.map(k => (
          <span
            key={k}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11.5, color: 'var(--color-text-secondary)',
              textTransform: 'capitalize',
            }}
          >
            <span style={{
              width: 11, height: 11, borderRadius: 3,
              backgroundColor: STATUS[k].bg,
              border: `0.5px solid ${STATUS[k].border}`,
              display: 'inline-block',
            }} />
            {k}
          </span>
        ))}
        <span className="sdp-today-note" style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--color-text-muted)' }}>
          Today outlined in blue
        </span>
      </div>
    </div>
  )
}

// ─── RIGHT PANEL TABS ─────────────────────────────────────────────────────────
const RIGHT_TABS = [
  { key: 'identity',   label: 'Identity',   icon: IdCard },
  { key: 'profile',    label: 'Profile',    icon: User },
  { key: 'documents',  label: 'Documents',  icon: ScrollText },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { key: 'results',    label: 'Results',    icon: GraduationCap },
  { key: 'fees',       label: 'Fees',       icon: Wallet },
  { key: 'audit',      label: 'Audit Log',  icon: FileTextIcon },
]

function FileTextIcon(props) {
  return <ScrollText {...props} />
}

const RightPanel = ({ student, palette, activeTab, setActiveTab }) => (
  <div style={{
    flex: 1, minWidth: 0,
    borderRadius: 14, overflow: 'hidden',
    backgroundColor: 'var(--color-surface)',
    border: '0.5px solid var(--color-border)',
  }}>
    {/* Tab strip — scrollable */}
    <div style={{
      display: 'flex',
      borderBottom: '0.5px solid var(--color-border)',
      overflowX: 'auto',
      scrollbarWidth: 'none',
      WebkitOverflowScrolling: 'touch',
      // Ensure tab strip doesn't wrap
      whiteSpace: 'nowrap',
    }}>
      {RIGHT_TABS.map(tab => {
        const active = activeTab === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '11px 16px', fontSize: 12.5,
              fontWeight: active ? 600 : 400,
              whiteSpace: 'nowrap', cursor: 'pointer',
              border: 'none', flexShrink: 0,
              borderBottom: `2px solid ${active ? palette.a : 'transparent'}`,
              backgroundColor: active ? palette.light : 'transparent',
              color: active ? palette.a : 'var(--color-text-secondary)',
              transition: 'all 0.12s',
            }}
          >
            <tab.icon size={13} style={{ opacity: active ? 1 : 0.55 }} />
            {tab.label}
          </button>
        )
      })}
    </div>

    {/* Content — tighter padding on mobile */}
    <div className="sdp-tab-content">
      {activeTab === 'identity'   && <TabIdentity student={student} studentId={student.id} />}
      {activeTab === 'profile'    && <TabProfile  student={student} studentId={student.id} />}
      {activeTab === 'documents'  && <TabDocuments studentId={student.id} />}
      {activeTab === 'attendance' && <AttendanceCalendar enrollmentId={student.current_enrollment?.id} />}
      {activeTab === 'results'    && <TabResults  studentId={student.id} />}
      {activeTab === 'fees'       && <TabFees     enrollmentId={student.current_enrollment?.id} />}
      {activeTab === 'audit'      && <TabAuditLog studentId={student.id} />}
    </div>
  </div>
)

// ─── Credential copy row ──────────────────────────────────────────────────────
const CredRow = ({ icon: Icon, label, value, onCopy }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    padding: '10px 13px', borderRadius: 10,
    backgroundColor: 'var(--color-surface-raised)',
    border: '0.5px solid var(--color-border)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 7, flexShrink: 0,
        backgroundColor: '#eff6ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={12} style={{ color: '#3b82f6' }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 9.5, fontWeight: 600,
          letterSpacing: '0.09em', textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}>{label}</p>
        <p style={{
          margin: '2px 0 0', fontSize: 12.5, fontWeight: 500,
          fontFamily: 'monospace', color: 'var(--color-text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{value || '—'}</p>
      </div>
    </div>
    <button
      onClick={() => onCopy(value)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 500,
        cursor: 'pointer', backgroundColor: 'var(--color-surface)',
        border: '0.5px solid var(--color-border)', color: 'var(--color-text-secondary)',
        flexShrink: 0,
      }}
    >
      <Copy size={10} /> Copy
    </button>
  </div>
)

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Pulse = ({ h, w = '100%', r = 8 }) => (
  <div style={{
    height: h, width: w, borderRadius: r,
    backgroundColor: 'var(--color-border)',
    animation: 'sk 1.6s ease-in-out infinite',
  }} />
)

const DetailSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <style>{`@keyframes sk { 0%,100%{opacity:1} 50%{opacity:.35} }`}</style>
    <Pulse h={30} w={130} r={8} />
    <div className="sdp-layout" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div className="sdp-left-desktop" style={{
        width: 240, flexShrink: 0, borderRadius: 14,
        backgroundColor: 'var(--color-surface)',
        border: '0.5px solid var(--color-border)',
        padding: '20px 14px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9,
      }}>
        <Pulse h={60} w={60} r={30} />
        <Pulse h={14} w="70%" />
        <Pulse h={10} w="45%" />
        {Array.from({ length: 10 }).map((_, i) => <Pulse key={i} h={32} />)}
      </div>
      <div style={{
        flex: 1, borderRadius: 14,
        backgroundColor: 'var(--color-surface)',
        border: '0.5px solid var(--color-border)', overflow: 'hidden',
      }}>
        <div style={{
          height: 44, borderBottom: '0.5px solid var(--color-border)',
          display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px',
        }}>
          {[90, 72, 56, 84].map((w, i) => <Pulse key={i} h={12} w={w} r={5} />)}
        </div>
        <div style={{ padding: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 18 }}>
            {Array.from({ length: 4 }).map((_, i) => <Pulse key={i} h={64} r={10} />)}
          </div>
          <Pulse h={32} r={6} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginTop: 12 }}>
            {Array.from({ length: 35 }).map((_, i) => <Pulse key={i} h={38} r={7} />)}
          </div>
        </div>
      </div>
    </div>
  </div>
)

// ─── Page ─────────────────────────────────────────────────────────────────────
const StudentDetailPage = () => {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toastError, toastSuccess } = useToast()
  const { isAdmin } = useAuth()
  const {
    selectedStudent: student,
    fetchStudent,
    clearSelected,
    deleteStudent,
    isSaving,
  } = useStudentStore()

  const initialTab = RIGHT_TABS.some(tab => tab.key === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'identity'
  const [activeTab,       setActiveTab]       = useState(initialTab)
  const [pageLoading,     setPageLoading]     = useState(true)
  const [deleteOpen,      setDeleteOpen]      = useState(false)
  const [passwordOpen,    setPasswordOpen]    = useState(false)
  const [confirmName,     setConfirmName]     = useState('')
  const [tempPassword,    setTempPassword]    = useState('')
  const [resetResult,     setResetResult]     = useState(null)
  const [isResettingPass, setIsResettingPass] = useState(false)

  usePageTitle(student ? `${student.first_name} ${student.last_name}` : 'Student')

  useEffect(() => {
    setPageLoading(true)
    fetchStudent(id)
      .catch(() => { toastError('Student not found'); navigate(ROUTES.STUDENTS) })
      .finally(() => setPageLoading(false))
    return () => clearSelected()
  }, [id])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (RIGHT_TABS.some(item => item.key === tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchParams(tab === 'identity' ? {} : { tab })
  }

  if (pageLoading || !student) return <DetailSkeleton />

  const fullName  = `${student.first_name} ${student.last_name}`.trim()
  const canDelete = confirmName.trim() === fullName
  const palette   = getPalette(fullName)

  const handleDelete = async () => {
    if (!canDelete) return
    const r = await deleteStudent(id, {
      confirm_name: confirmName.trim(),
      reason: `Deleted after confirming name ${fullName}`,
    })
    if (r.success) { toastSuccess('Student deleted'); navigate(ROUTES.STUDENTS) }
    else toastError(r.message || 'Failed to delete')
  }

  const handleResetPassword = async () => {
    setIsResettingPass(true)
    try {
      const res = await studentApi.resetPassword(id, {
        new_password: tempPassword.trim() || undefined,
      })
      setResetResult(res.data)
      setTempPassword('')
      toastSuccess('Password reset')
    } catch (err) {
      toastError(err.message || 'Failed')
    } finally {
      setIsResettingPass(false)
    }
  }

  const handleCopy = async (v) => {
    if (!v) return
    try { await navigator.clipboard.writeText(v); toastSuccess('Copied') }
    catch { toastError('Unable to copy') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        .sdt { animation: fadeUp .25s ease both }

        /* ── Tab content padding ── */
        .sdp-tab-content { padding: 22px }

        /* ── Desktop: side-by-side layout ── */
        .sdp-layout      { display: flex; gap: 14px; align-items: flex-start }
        .sdp-left-mobile { display: none !important }
        .sdp-left-desktop { display: block }
        .sdp-stats-grid  { grid-template-columns: repeat(4, 1fr) !important }
        .sdp-today-note  { display: inline !important }

        /* ── Mobile (≤640px) ── */
        @media (max-width: 640px) {
          /* Stack layout vertically */
          .sdp-layout { flex-direction: column !important; gap: 12px !important }

          /* Hide desktop sidebar, show mobile card */
          .sdp-left-desktop { display: none !important }
          .sdp-left-mobile  { display: block !important }

          /* Stats: 2×2 grid on mobile */
          .sdp-stats-grid { grid-template-columns: repeat(2, 1fr) !important }

          /* Hide today note to save space */
          .sdp-today-note { display: none !important }

          /* Reduce tab content padding */
          .sdp-tab-content { padding: 14px !important }
        }
      `}</style>

      {/* ── Back button ── */}
      <button
        onClick={() => navigate(ROUTES.STUDENTS)}
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 13px', borderRadius: 8, fontSize: 12.5, fontWeight: 500,
          cursor: 'pointer', backgroundColor: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)', color: 'var(--color-text-secondary)',
        }}
      >
        <ArrowLeft size={13} /> Back to students
      </button>

      {/* ── Main layout ── */}
      <div className="sdt sdp-layout">
        <LeftPanel
          student={student}
          palette={palette}
          isAdmin={isAdmin}
          onResetPassword={() => { setTempPassword(''); setResetResult(null); setPasswordOpen(true) }}
          onDelete={() => { setConfirmName(''); setDeleteOpen(true) }}
        />
        <RightPanel
          student={student}
          palette={palette}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
        />
      </div>

      {/* ── Delete modal ── */}
      <Modal
        open={isAdmin && deleteOpen}
        onClose={() => !isSaving && setDeleteOpen(false)}
        title="Delete student record"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="danger" icon={Trash2} onClick={handleDelete} loading={isSaving} disabled={!canDelete}>
              Delete permanently
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            display: 'flex', gap: 10, padding: '11px 13px', borderRadius: 10,
            backgroundColor: '#fef2f2', border: '0.5px solid #fecaca',
          }}>
            <AlertTriangle size={14} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#991b1b' }}>
                This action cannot be undone.
              </p>
              <p style={{ margin: '2px 0 0', color: '#b91c1c' }}>
                The student will be removed from all active lists permanently.
              </p>
            </div>
          </div>
          <div style={{
            padding: '9px 13px', borderRadius: 10,
            backgroundColor: 'var(--color-surface-raised)',
            border: '0.5px solid var(--color-border)', fontSize: 12.5,
          }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Confirm name: </span>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{fullName}</span>
          </div>
          <Input
            label="Type the full student name"
            value={confirmName}
            onChange={e => setConfirmName(e.target.value)}
            placeholder={fullName}
            autoFocus
            error={confirmName && !canDelete ? 'Name does not match' : undefined}
          />
        </div>
      </Modal>

      {/* ── Reset password modal ── */}
      <Modal
        open={isAdmin && passwordOpen}
        onClose={() => !isResettingPass && setPasswordOpen(false)}
        title="Reset student password"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPasswordOpen(false)} disabled={isResettingPass}>
              Close
            </Button>
            <Button icon={KeyRound} onClick={handleResetPassword} loading={isResettingPass}>
              Reset password
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            padding: '9px 13px', borderRadius: 10,
            backgroundColor: 'var(--color-surface-raised)',
            border: '0.5px solid var(--color-border)',
            fontSize: 12.5, color: 'var(--color-text-secondary)', lineHeight: 1.6,
          }}>
            Leave blank to auto-generate a secure password for the student portal.
          </div>
          <Input
            label="New password"
            value={tempPassword}
            onChange={e => setTempPassword(e.target.value)}
            placeholder="Leave blank to auto-generate"
          />
          {resetResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                padding: '9px 13px', borderRadius: 10,
                backgroundColor: '#f0fdf4', border: '0.5px solid #bbf7d0',
              }}>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: '#166534' }}>
                  Share these credentials with the student immediately.
                </p>
              </div>
              <CredRow icon={IdCard}   label="Admission Number"   value={resetResult.admission_no}       onCopy={handleCopy} />
              <CredRow icon={Mail}     label="Login Email"        value={resetResult.email}              onCopy={handleCopy} />
              <CredRow icon={KeyRound} label="Temporary Password" value={resetResult.generated_password} onCopy={handleCopy} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default StudentDetailPage