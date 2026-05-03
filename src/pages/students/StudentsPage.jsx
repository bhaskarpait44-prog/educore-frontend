// src/pages/students/StudentsPage.jsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Users, ChevronRight,
  ChevronLeft, X, LayoutGrid, LayoutList,
  MoreVertical, Eye, Pencil, Trash2,
} from 'lucide-react'
import useStudentStore from '@/store/studentStore'
import useSessionStore from '@/store/sessionStore'
import useClasses from '@/hooks/useClasses'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate, getInitials, debounce } from '@/utils/helpers'
import { ROUTES } from '@/constants/app'
import useAuth from '@/hooks/useAuth'

// ─── Constants ────────────────────────────────────────────────────────────────
const GENDER_BADGE = {
  male   : { label: 'Male',   variant: 'blue'  },
  female : { label: 'Female', variant: 'green' },
  other  : { label: 'Other',  variant: 'grey'  },
}

const PALETTES = [
  { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  { bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff' },
  { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  { bg: '#ecfdf5', color: '#0e7490', border: '#a5f3fc' },
  { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
  { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
]

const getPalette = (name = '') => PALETTES[name.charCodeAt(0) % PALETTES.length]

const formatStream = (stream) => {
  if (!stream) return null
  const label = stream.charAt(0).toUpperCase() + stream.slice(1)
  return stream === 'regular' ? label : `${label} Stream`
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AvatarCircle = ({ name, size = 36 }) => {
  const p = getPalette(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: p.bg,
      border: `1px solid ${p.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      fontSize: size > 38 ? 15 : 12,
      fontWeight: 600,
      color: p.color,
      letterSpacing: '-0.01em',
    }}>
      {getInitials(name)}
    </div>
  )
}

// ─── Three-dot dropdown menu (grid cards only) ────────────────────────────────
const CardMenu = ({ onView, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const items = [
    { icon: Eye,    label: 'View Student', action: onView   },
    { icon: Pencil, label: 'Edit',         action: onEdit   },
    { icon: Trash2, label: 'Delete',       action: onDelete, danger: true },
  ]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        style={{
          width: 28, height: 28, borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none',
          backgroundColor: open ? 'var(--color-surface-raised)' : 'transparent',
          color: 'var(--color-text-muted)',
          cursor: 'pointer', transition: 'all 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
        onMouseLeave={e => { if (!open) e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <MoreVertical size={14} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 32, right: 0, zIndex: 50,
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.09)',
          minWidth: 170,
          overflow: 'hidden',
          padding: '4px',
        }}>
          {items.map(({ icon: Icon, label, action, danger }) => (
            <button
              key={label}
              onClick={(e) => { e.stopPropagation(); setOpen(false); action?.() }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 8,
                fontSize: 13, fontWeight: 400,
                border: 'none', cursor: 'pointer',
                backgroundColor: 'transparent',
                color: danger ? '#dc2626' : 'var(--color-text-primary)',
                transition: 'background 0.1s',
                textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = danger ? '#fef2f2' : 'var(--color-surface-raised)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Icon size={13} style={{ color: danger ? '#dc2626' : 'var(--color-text-muted)', flexShrink: 0 }} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Grid Card ────────────────────────────────────────────────────────────────
const StudentGridCard = ({ student, onView, onEdit, onDelete }) => {
  const fullName   = `${student.first_name} ${student.last_name}`
  const enrollment = student.current_enrollment
  const gCfg       = GENDER_BADGE[student.gender] || { label: student.gender, variant: 'grey' }

  const classLabel   = enrollment
    ? [enrollment.class, formatStream(enrollment.stream)].filter(Boolean).join(', ')
    : null
  const sectionLabel = enrollment?.section ? `${enrollment.section}` : null

  return (
    <div style={{
      borderRadius: 16,
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      boxShadow: '0 2px 10px rgba(0,0,0,0.055), 0 1px 3px rgba(0,0,0,0.04)',
      overflow: 'visible',
      display: 'flex', flexDirection: 'column',
      minHeight: 320,
      transition: 'box-shadow 0.18s, transform 0.15s',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 6px 22px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.055), 0 1px 3px rgba(0,0,0,0.04)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Top row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px 12px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <span
          onClick={onView}
          style={{
            fontSize: 12.5, fontWeight: 600, fontFamily: 'monospace',
            color: '#2563eb', cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          {student.admission_no}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge variant={student.is_deleted ? 'grey' : 'green'} dot>
            {student.is_deleted ? 'Inactive' : 'Active'}
          </Badge>
          <CardMenu onView={onView} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>

      {/* Student info — no border, no background */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '18px 16px 16px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <AvatarCircle name={fullName} size={52} />
        <div style={{ minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: 14.5, fontWeight: 600,
            color: 'var(--color-text-primary)', lineHeight: 1.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {fullName}
          </p>
          {(classLabel || sectionLabel) && (
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--color-text-secondary)' }}>
              {[classLabel, sectionLabel].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: enrollment?.roll_number ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
        padding: '14px 16px 16px',
        gap: 10,
      }}>
        {enrollment?.roll_number && (
          <div>
            <p style={{ margin: 0, fontSize: 10.5, color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Roll No</p>
            <p style={{ margin: '4px 0 0', fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>{enrollment.roll_number}</p>
          </div>
        )}
        <div>
          <p style={{ margin: 0, fontSize: 10.5, color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gender</p>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {gCfg.label}
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 10.5, color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Joined On</p>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {formatDate(student.date_of_birth)}
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px 14px',
        borderTop: '1px solid var(--color-border)',
        marginTop: 'auto',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { title: 'Message', path: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
            { title: 'Call',    path: 'M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.61 19a19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-2.92-8.17A2 2 0 0 1 4.68 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z' },
            { title: 'Email',   path: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22,6 12,13 2,6' },
          ].map(({ title, path }) => (
            <button
              key={title}
              title={title}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-muted)',
                cursor: 'pointer', transition: 'all 0.12s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {title === 'Email'
                  ? <><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/></>
                  : <path d={path} />
                }
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── List Row (desktop) — full row clickable, NO three-dot ───────────────────
const StudentRow = ({ student, onView }) => {
  const fullName   = `${student.first_name} ${student.last_name}`
  const gCfg       = GENDER_BADGE[student.gender] || { label: student.gender, variant: 'grey' }
  const enrollment = student.current_enrollment

  return (
    <tr
      onClick={onView}
      style={{ transition: 'background 0.12s', cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <td style={{ padding: '13px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AvatarCircle name={fullName} size={36} />
          <div>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {fullName}
            </p>
            {enrollment && (
              <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--color-text-muted)' }}>
                {[
                  `Class ${enrollment.class}`,
                  formatStream(enrollment.stream),
                  `Sec ${enrollment.section}`,
                ].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
      </td>
      <td style={{ padding: '13px 20px' }}>
        <span style={{ fontSize: 12.5, fontFamily: 'monospace', color: '#2563eb' }}>
          {student.admission_no}
        </span>
      </td>
      <td style={{ padding: '13px 20px', fontSize: 12.5, color: 'var(--color-text-secondary)' }}>
        {formatDate(student.date_of_birth)}
      </td>
      <td style={{ padding: '13px 20px' }}>
        <Badge variant={gCfg.variant}>{gCfg.label}</Badge>
      </td>
      <td style={{ padding: '13px 20px' }}>
        <Badge variant={student.is_deleted ? 'grey' : 'green'} dot>
          {student.is_deleted ? 'Inactive' : 'Active'}
        </Badge>
      </td>
    </tr>
  )
}

// ─── Mobile List Card — full card clickable, NO three-dot ────────────────────
const StudentMobileCard = ({ student, isLast, onView }) => {
  const fullName   = `${student.first_name} ${student.last_name}`
  const enrollment = student.current_enrollment

  return (
    <div
      onClick={onView}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
        transition: 'background 0.12s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <AvatarCircle name={fullName} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {fullName}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11.5, fontFamily: 'monospace', color: '#2563eb' }}>
          {student.admission_no}
        </p>
        {enrollment && (
          <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--color-text-secondary)' }}>
            {[
              `Class ${enrollment.class}`,
              formatStream(enrollment.stream),
              `Sec ${enrollment.section}`,
            ].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
      <Badge variant={student.is_deleted ? 'grey' : 'green'} dot>
        {student.is_deleted ? 'Inactive' : 'Active'}
      </Badge>
    </div>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
const Pulse = ({ w = '100%', h = 14, r = 6 }) => (
  <div style={{
    width: w, height: h, borderRadius: r,
    backgroundColor: 'var(--color-surface-raised)',
    animation: 'skpulse 1.6s ease-in-out infinite',
  }} />
)

const ListSkeleton = () => (
  <div>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 20px',
      }}>
        <Pulse w={36} h={36} r={18} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <Pulse w="40%" h={13} />
          <Pulse w="28%" h={10} />
        </div>
        <Pulse w={80} h={12} />
        <Pulse w={70} h={12} />
        <Pulse w={60} h={20} r={99} />
      </div>
    ))}
  </div>
)

const GridSkeleton = () => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16, padding: 18,
  }}>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} style={{
        borderRadius: 16,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.055)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Pulse w={90} h={13} />
          <Pulse w={60} h={20} r={99} />
        </div>
        <div style={{ padding: '18px 16px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Pulse w={52} h={52} r={26} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <Pulse w="70%" h={14} />
            <Pulse w="45%" h={11} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', padding: '14px 16px 16px', gap: 10 }}>
          {[1, 2, 3].map(j => (
            <div key={j} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Pulse w="60%" h={10} />
              <Pulse w="80%" h={13} />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
)

// ─── View toggle ──────────────────────────────────────────────────────────────
const ViewToggle = ({ view, setView }) => (
  <div style={{
    display: 'flex', borderRadius: 9, overflow: 'hidden',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface-raised)',
    padding: 2, gap: 2,
  }}>
    {[
      { key: 'list', Icon: LayoutList },
      { key: 'grid', Icon: LayoutGrid },
    ].map(({ key, Icon }) => (
      <button
        key={key}
        onClick={() => setView(key)}
        title={key === 'list' ? 'List view' : 'Grid view'}
        style={{
          width: 30, height: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer',
          borderRadius: 7,
          backgroundColor: view === key ? 'var(--color-surface)' : 'transparent',
          color: view === key ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          transition: 'all 0.12s',
          boxShadow: view === key ? '0 1px 3px rgba(0,0,0,0.07)' : 'none',
        }}
      >
        <Icon size={14} />
      </button>
    ))}
  </div>
)

// ─── Page ─────────────────────────────────────────────────────────────────────
const StudentsPage = () => {
  usePageTitle('Students')
  const navigate = useNavigate()
  const { toastError } = useToast()
  const { isAdmin } = useAuth()
  const { students, pagination, isLoading, fetchStudents } = useStudentStore()
  const { classes, fetchClasses } = useClasses()
  const { currentSession } = useSessionStore()

  const [search,  setSearch]  = useState('')
  const [filters, setFilters] = useState({ class_id: '', section_id: '' })
  const [page,    setPage]    = useState(1)
  const [view,    setView]    = useState('grid')

  const doFetch = useCallback(
    debounce((q, f, p) => {
      fetchStudents({ search: q, ...f, page: p, perPage: 20 })
        .catch(() => toastError('Failed to load students'))
    }, 350),
    []
  )

  useEffect(() => {
    if (!currentSession?.id) return
    doFetch(search, { ...filters, session_id: String(currentSession.id) }, page)
  }, [search, filters, page, currentSession?.id])

  useEffect(() => {
    fetchClasses().catch(() => toastError('Failed to load classes'))
  }, [fetchClasses, toastError])

  const clearFilters = () => {
    setSearch('')
    setFilters({ class_id: '', section_id: '' })
    setPage(1)
  }

  const hasActiveFilters = search || filters.class_id || filters.section_id

  const goToDetail = (id) => navigate(`${ROUTES.STUDENTS}/${id}`)
  const goToEdit   = (id) => navigate(`${ROUTES.STUDENTS}/${id}?tab=profile`)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        @keyframes skpulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @media (max-width: 640px) {
          .sp-header       { flex-direction: column !important; align-items: flex-start !important; }
          .sp-filter-row   { flex-direction: column !important; }
          .sp-filter-row select { width: 100% !important; min-width: unset !important; }
          .sp-desktop-tbl  { display: none !important; }
          .sp-mobile-list  { display: block !important; }
          .sp-grid         { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; }
          .sp-view-toggle  { display: none !important; }
        }
        @media (min-width: 641px) {
          .sp-mobile-list  { display: none !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="sp-header" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Students
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {pagination.total > 0
              ? `${pagination.total} students enrolled in ${currentSession?.name || 'the current session'}`
              : 'Manage current-session student admissions and profiles'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div className="sp-view-toggle">
            <ViewToggle view={view} setView={setView} />
          </div>
          {isAdmin && (
            <Button icon={Plus} onClick={() => navigate(ROUTES.STUDENT_NEW)}>
              Admit Student
            </Button>
          )}
        </div>
      </div>

      {/* ── Search + filters ── */}
      <div
        className="sp-filter-row"
        style={{
          display: 'flex', gap: 10, padding: '10px 12px',
          borderRadius: 14,
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <Search size={14} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)', pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Search by name or admission number…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12,
              paddingTop: 7, paddingBottom: 7,
              borderRadius: 9, fontSize: 13,
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              outline: 'none', transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--color-brand)'}
            onBlur={e  => e.target.style.borderColor = 'var(--color-border)'}
          />
        </div>

        <select
          value={filters.class_id}
          onChange={e => { setFilters(f => ({ ...f, class_id: e.target.value })); setPage(1) }}
          style={{
            padding: '7px 12px', borderRadius: 9, fontSize: 13,
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            outline: 'none', minWidth: 160,
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--color-brand)'}
          onBlur={e  => e.target.style.borderColor = 'var(--color-border)'}
        >
          <option value="">All Classes</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.display_name || cls.name}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 12px', borderRadius: 9, fontSize: 12.5,
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              cursor: 'pointer', transition: 'background 0.12s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* ── Content ── */}
      <div style={{
        borderRadius: 14, overflow: 'hidden',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}>
        {isLoading ? (
          view === 'grid' ? <GridSkeleton /> : <ListSkeleton />
        ) : students.length === 0 ? (
          <EmptyState
            icon={Users}
            title={hasActiveFilters ? 'No students match' : 'No students yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search or filters.'
                : 'Admit your first student to get started.'
            }
            action={!hasActiveFilters && isAdmin && (
              <Button icon={Plus} onClick={() => navigate(ROUTES.STUDENT_NEW)}>
                Admit New Student
              </Button>
            )}
          />
        ) : view === 'grid' ? (

          // ── Grid view ──
          <div
            className="sp-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16, padding: 18,
            }}
          >
            {students.map(student => (
              <StudentGridCard
                key={student.id}
                student={student}
                onView={() => goToDetail(student.id)}
                onEdit={() => goToEdit(student.id)}
                onDelete={() => {/* wire up delete modal */}}
              />
            ))}
          </div>

        ) : (

          // ── List view ──
          <>
            {/* Desktop table — row click navigates, no three-dot */}
            <div className="sp-desktop-tbl" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Student', 'Admission No', 'Date of Birth', 'Gender', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '10px 20px', textAlign: 'left',
                        fontSize: 10.5, fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        color: 'var(--color-text-muted)', whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <StudentRow
                      key={student.id}
                      student={student}
                      onView={() => goToDetail(student.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="sp-mobile-list">
              {students.map((student, i) => (
                <StudentMobileCard
                  key={student.id}
                  student={student}
                  isLast={i === students.length - 1}
                  onView={() => goToDetail(student.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Pagination ── */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} students
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Button
              variant="secondary" size="sm" icon={ChevronLeft}
              disabled={pagination.page <= 1}
              onClick={() => setPage(p => p - 1)}
            />
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const p = pagination.page <= 3 ? i + 1 : pagination.page + i - 2
              if (p < 1 || p > pagination.totalPages) return null
              const isActive = p === pagination.page
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    fontSize: 12.5, fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    border: '1px solid var(--color-border)',
                    backgroundColor: isActive ? 'var(--color-brand)' : 'var(--color-surface)',
                    color: isActive ? '#fff' : 'var(--color-text-secondary)',
                    transition: 'all 0.12s',
                  }}
                >
                  {p}
                </button>
              )
            })}
            <Button
              variant="secondary" size="sm" icon={ChevronRight}
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentsPage
