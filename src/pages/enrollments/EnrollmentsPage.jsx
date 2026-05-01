import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus, Users, ChevronDown, ChevronUp } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useStudentStore from '@/store/studentStore'
import useSessionStore from '@/store/sessionStore'
import useClasses from '@/hooks/useClasses'
import { getSections } from '@/api/classApi'
import { ROUTES } from '@/constants/app'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Select from '@/components/ui/Select'
import { formatDate } from '@/utils/helpers'

/* ─────────────────────────────────────────────────────────────
   Responsive CSS — injected once into <head>
   Keeps all media-query logic in one place, not scattered
   through inline styles (which can't use @media).
───────────────────────────────────────────────────────────── */
const STYLE_ID = 'ep-responsive'
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    /* ── base layout ── */
    .ep-page          { display:flex; flex-direction:column; gap:20px; padding-bottom:40px; }
    .ep-header        { display:flex; flex-wrap:wrap; align-items:flex-start; justify-content:space-between; gap:12px; }
    .ep-title         { font-size:20px; font-weight:700; color:var(--color-text-primary); margin:0; }
    .ep-subtitle      { font-size:13px; margin-top:4px; color:var(--color-text-secondary); }

    /* ── stats row ── */
    .ep-stats         { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
    .ep-stat          { display:flex; align-items:flex-start; gap:14px; padding:16px; border-radius:16px; background:var(--color-surface); border:1px solid var(--color-border); }
    .ep-stat-icon     { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .ep-stat-label    { font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:var(--color-text-muted); margin:0; }
    .ep-stat-value    { font-size:22px; font-weight:700; color:var(--color-text-primary); margin:4px 0 0; }
    .ep-stat-value.sm { font-size:14px; padding-top:5px; line-height:1.3; }

    /* ── filter bar ── */
    .ep-filters       { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; padding:16px; border-radius:16px; background:var(--color-surface); border:1px solid var(--color-border); }

    /* ── card list ── */
    .ep-card-list     { display:flex; flex-direction:column; gap:14px; }
    .ep-empty-wrap    { border-radius:16px; overflow:hidden; background:var(--color-surface); border:1px solid var(--color-border); }

    /* ── class card ── */
    .ep-card          { border-radius:16px; overflow:hidden; background:var(--color-surface); border:1px solid var(--color-border); }
    .ep-card-head     { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px; padding:12px 16px; background:var(--color-surface-raised); border-bottom:1px solid var(--color-border); }
    .ep-head-left     { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .ep-head-right    { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .ep-cls-dot       { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
    .ep-cls-name      { font-size:14px; font-weight:600; color:var(--color-text-primary); }
    .ep-cls-count     { font-size:12px; color:var(--color-text-muted); }

    /* ── section pills ── */
    .ep-pills         { display:flex; flex-wrap:wrap; gap:6px; }
    .ep-pill          { font-size:11px; font-weight:500; padding:3px 10px; border-radius:100px; cursor:pointer; line-height:1.6; transition:background .15s, color .15s; border:1px solid; }
    .ep-pill.on       { background:var(--color-text-primary); color:var(--color-surface); border-color:var(--color-text-primary); }
    .ep-pill.off      { background:transparent; color:var(--color-text-secondary); border-color:var(--color-border); }

    /* ── collapse toggle ── */
    .ep-toggle        { display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:8px; border:1px solid var(--color-border); background:transparent; color:var(--color-text-secondary); cursor:pointer; flex-shrink:0; }

    /* ── desktop table ── */
    .ep-table-wrap    { display:block; overflow-x:auto; }
    .ep-table         { width:100%; border-collapse:collapse; min-width:560px; }
    .ep-table th      { padding:10px 16px; text-align:left; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--color-text-muted); border-bottom:1px solid var(--color-border); white-space:nowrap; }
    .ep-table td      { padding:11px 16px; font-size:13px; color:var(--color-text-secondary); vertical-align:middle; }
    .ep-table tbody tr                   { cursor:pointer; transition:background .1s; }
    .ep-table tbody tr:not(:last-child) td { border-bottom:1px solid var(--color-border); }
    .ep-table tbody tr:hover td          { background:var(--color-surface-raised); }

    /* ── mobile rows (hidden on desktop) ── */
    .ep-mob-rows      { display:none; }
    .ep-mob-row       { padding:14px 16px; cursor:pointer; transition:background .1s; }
    .ep-mob-row:not(:last-child) { border-bottom:1px solid var(--color-border); }
    .ep-mob-row:hover { background:var(--color-surface-raised); }
    .ep-mob-top       { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:10px; }
    .ep-mob-meta      { display:grid; grid-template-columns:1fr 1fr; gap:8px 20px; }
    .ep-mob-key       { font-size:10px; text-transform:uppercase; letter-spacing:.06em; color:var(--color-text-muted); display:block; }
    .ep-mob-val       { font-size:12px; color:var(--color-text-secondary); display:block; margin-top:2px; }

    /* ── shared atoms ── */
    .ep-s-name        { font-size:13px; font-weight:600; color:var(--color-text-primary); margin:0; }
    .ep-s-dob         { font-size:11px; color:var(--color-text-muted); margin:2px 0 0; }
    .ep-mono          { font-family:monospace; font-size:12px; }
    .ep-skeleton      { height:120px; border-radius:16px; background:var(--color-surface-raised); }

    /* ── RESPONSIVE BREAKPOINTS ── */
    @media (max-width: 768px) {
      .ep-stats   { grid-template-columns:1fr 1fr; }
      .ep-filters { grid-template-columns:1fr 1fr; }
    }

    @media (max-width: 639px) {
      /* Switch table ↔ mobile rows */
      .ep-table-wrap { display:none; }
      .ep-mob-rows   { display:block; }

      /* Stack card head vertically */
      .ep-card-head  { flex-direction:column; align-items:flex-start; }
      .ep-head-right { width:100%; justify-content:space-between; }

      /* Full-width filters */
      .ep-filters { grid-template-columns:1fr; }
    }

    @media (max-width: 400px) {
      .ep-stats { grid-template-columns:1fr; }
    }
  `
  document.head.appendChild(el)
}

/* ─────────────────────────────────────────────────────────────
   Colour palette — flat, no gradients
───────────────────────────────────────────────────────────── */
const CLASS_COLORS = [
  '#2563eb', '#059669', '#d97706', '#7c3aed',
  '#db2777', '#0891b2', '#65a30d', '#dc2626',
]
const getColor = (i) => CLASS_COLORS[i % CLASS_COLORS.length]

/* ─────────────────────────────────────────────────────────────
   Group students → Map<className, Map<sectionName, student[]>>
───────────────────────────────────────────────────────────── */
function groupByClass(students) {
  const map = new Map()
  students.forEach((student) => {
    const en  = student.current_enrollment
    const cls = en?.class   || 'Unassigned'
    const sec = en?.section || 'N/A'
    if (!map.has(cls)) map.set(cls, new Map())
    if (!map.get(cls).has(sec)) map.get(cls).set(sec, [])
    map.get(cls).get(sec).push(student)
  })
  return map
}

/* ═══════════════════════════════════════════════════════════
   EnrollmentsPage
═══════════════════════════════════════════════════════════ */
export default function EnrollmentsPage() {
  usePageTitle('Enrollments')

  const navigate = useNavigate()
  const { toastError } = useToast()
  const { students, pagination, isLoading, fetchStudents } = useStudentStore()
  const { classes, fetchClasses } = useClasses()
  const { sessions, currentSession, fetchSessions, fetchCurrentSession } = useSessionStore()

  const [filters, setFilters] = useState({ session_id: '', class_id: '', section_id: '' })
  const [sections, setSections] = useState([])
  const [loadingSections, setLoadingSections] = useState(false)

  /* fetch on mount */
  useEffect(() => {
    fetchClasses().catch(() => toastError('Failed to load classes'))
    fetchSessions().catch(() => toastError('Failed to load sessions'))
    fetchCurrentSession().catch(() => {})
  }, [fetchClasses, fetchSessions, fetchCurrentSession, toastError])

  /* auto-select current session */
  useEffect(() => {
    if (!filters.session_id && currentSession?.id)
      setFilters((p) => ({ ...p, session_id: String(currentSession.id) }))
  }, [currentSession, filters.session_id])

  /* fetch students on filter change */
  useEffect(() => {
    fetchStudents({
      page: 1, perPage: 100,
      class_id:   filters.class_id   || undefined,
      section_id: filters.section_id || undefined,
      session_id: filters.session_id || undefined,
    }).catch(() => toastError('Failed to load enrollments'))
  }, [filters, fetchStudents, toastError])

  /* fetch sections when class changes */
  useEffect(() => {
    if (!filters.class_id) { setSections([]); return }
    setLoadingSections(true)
    getSections(filters.class_id)
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : []
        setSections(rows.map((s) => ({ value: String(s.id), label: `Section ${s.name}` })))
      })
      .catch(() => { setSections([]); toastError('Failed to load sections') })
      .finally(() => setLoadingSections(false))
  }, [filters.class_id, toastError])

  /* derived */
  const sessionOptions = useMemo(() => sessions.map((s) => ({ value: String(s.id), label: s.name })), [sessions])
  const classOptions   = useMemo(() => classes.map((c)  => ({ value: String(c.id),  label: c.display_name || c.name })), [classes])
  const activeCount    = students.filter((s) => s.current_enrollment?.id).length
  const grouped        = useMemo(() => groupByClass(students), [students])
  const classKeys      = [...grouped.keys()]

  return (
    <div className="ep-page">

      {/* ── Header ── */}
      <div className="ep-header">
        <div>
          <h1 className="ep-title">Enrollments</h1>
          <p className="ep-subtitle">View student enrollments by session, class, and section.</p>
        </div>
        <Button icon={Plus} onClick={() => navigate(ROUTES.STUDENT_NEW)}>
          New Admission
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="ep-stats">
        <StatCard icon={Users}    label="Total Students"  value={pagination.total || students.length} color="#2563eb" />
        <StatCard icon={BookOpen} label="With Enrollment" value={activeCount}                         color="#059669" />
        <StatCard icon={BookOpen} label="Current Session" value={currentSession?.name || '—'}         color="#7c3aed" compact />
      </div>

      {/* ── Filters ── */}
      <div className="ep-filters">
        <Select
          label="Session"
          value={filters.session_id}
          options={sessionOptions}
          placeholder="All sessions"
          onChange={(e) => setFilters((p) => ({ ...p, session_id: e.target.value }))}
        />
        <Select
          label="Class"
          value={filters.class_id}
          options={classOptions}
          placeholder="All classes"
          onChange={(e) => setFilters((p) => ({ ...p, class_id: e.target.value, section_id: '' }))}
        />
        <Select
          label="Section"
          value={filters.section_id}
          options={sections}
          placeholder={
            !filters.class_id  ? 'Select class first'
            : loadingSections  ? 'Loading…'
            : 'All sections'
          }
          disabled={!filters.class_id || loadingSections}
          onChange={(e) => setFilters((p) => ({ ...p, section_id: e.target.value }))}
        />
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <SkeletonCards />
      ) : classKeys.length === 0 ? (
        <div className="ep-empty-wrap">
          <EmptyState
            icon={BookOpen}
            title="No enrollments found"
            description="Try a different session, class, or section filter."
          />
        </div>
      ) : (
        <div className="ep-card-list">
          {classKeys.map((cls, idx) => (
            <ClassCard
              key={cls}
              className={cls}
              sectionsMap={grouped.get(cls)}
              color={getColor(idx)}
              onRowClick={(id) => navigate(`${ROUTES.STUDENTS}/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   ClassCard — one card per class, section pills inside
═══════════════════════════════════════════════════════════ */
function ClassCard({ className, sectionsMap, color, onRowClick }) {
  const sectionKeys = [...sectionsMap.keys()].sort()
  const [activeSection, setActiveSection] = useState('all')
  const [collapsed, setCollapsed] = useState(false)

  const totalStudents = sectionKeys.reduce((n, s) => n + sectionsMap.get(s).length, 0)

  const visibleStudents = useMemo(() => {
    if (activeSection === 'all') return sectionKeys.flatMap((s) => sectionsMap.get(s))
    return sectionsMap.get(activeSection) || []
  }, [activeSection, sectionsMap, sectionKeys])

  return (
    <div className="ep-card">

      {/* header */}
      <div className="ep-card-head" style={{ borderLeft: `3px solid ${color}` }}>
        <div className="ep-head-left">
          <span className="ep-cls-dot" style={{ background: color }} />
          <span className="ep-cls-name">{className}</span>
          <span className="ep-cls-count">{totalStudents} student{totalStudents !== 1 ? 's' : ''}</span>
        </div>

        <div className="ep-head-right">
          <div className="ep-pills">
            <Pill label="All"  active={activeSection === 'all'} onClick={() => setActiveSection('all')} />
            {sectionKeys.map((sec) => (
              <Pill key={sec} label={`Sec ${sec}`} active={activeSection === sec} onClick={() => setActiveSection(sec)} />
            ))}
          </div>

          <button
            className="ep-toggle"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand class' : 'Collapse class'}
          >
            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        </div>
      </div>

      {/* body */}
      {!collapsed && (
        <>
          {/* ── Desktop: scrollable table ── */}
          <div className="ep-table-wrap">
            <table className="ep-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Admission No</th>
                  <th>Section</th>
                  <th>Session</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleStudents.map((student) => {
                  const en = student.current_enrollment
                  return (
                    <tr key={student.id} onClick={() => onRowClick(student.id)}>
                      <td>
                        <p className="ep-s-name">{student.first_name} {student.last_name}</p>
                        <p className="ep-s-dob">DOB {formatDate(student.date_of_birth)}</p>
                      </td>
                      <td><span className="ep-mono">{student.admission_no}</span></td>
                      <td>{en?.section ? `Section ${en.section}` : '—'}</td>
                      <td>{en?.session || '—'}</td>
                      <td>{en?.joined_date ? formatDate(en.joined_date) : '—'}</td>
                      <td><EnrollmentBadge enrollment={en} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile: stacked detail rows ── */}
          <div className="ep-mob-rows">
            {visibleStudents.map((student) => {
              const en = student.current_enrollment
              return (
                <div key={student.id} className="ep-mob-row" onClick={() => onRowClick(student.id)}>
                  <div className="ep-mob-top">
                    <div>
                      <p className="ep-s-name">{student.first_name} {student.last_name}</p>
                      <p className="ep-s-dob">DOB {formatDate(student.date_of_birth)}</p>
                    </div>
                    <EnrollmentBadge enrollment={en} />
                  </div>
                  <div className="ep-mob-meta">
                    <div>
                      <span className="ep-mob-key">Admission No</span>
                      <span className="ep-mob-val ep-mono">{student.admission_no}</span>
                    </div>
                    <div>
                      <span className="ep-mob-key">Section</span>
                      <span className="ep-mob-val">{en?.section ? `Section ${en.section}` : '—'}</span>
                    </div>
                    <div>
                      <span className="ep-mob-key">Session</span>
                      <span className="ep-mob-val">{en?.session || '—'}</span>
                    </div>
                    <div>
                      <span className="ep-mob-key">Joined</span>
                      <span className="ep-mob-val">{en?.joined_date ? formatDate(en.joined_date) : '—'}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Tiny components
═══════════════════════════════════════════════════════════ */
function StatCard({ icon: Icon, label, value, color, compact }) {
  return (
    <div className="ep-stat">
      <div className="ep-stat-icon" style={{ background: `${color}18`, color }}>
        <Icon size={17} />
      </div>
      <div>
        <p className="ep-stat-label">{label}</p>
        <p className={`ep-stat-value${compact ? ' sm' : ''}`}>{value}</p>
      </div>
    </div>
  )
}

function Pill({ label, active, onClick }) {
  return (
    <button className={`ep-pill ${active ? 'on' : 'off'}`} onClick={onClick}>
      {label}
    </button>
  )
}

function EnrollmentBadge({ enrollment }) {
  if (enrollment?.status === 'active') return <Badge variant="green" dot>Active</Badge>
  if (enrollment?.id)                  return <Badge variant="grey"  dot>Inactive</Badge>
  return                                      <Badge variant="grey"  dot>Not enrolled</Badge>
}

function SkeletonCards() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="ep-skeleton animate-pulse" />
      ))}
    </div>
  )
}