import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, Trash2, BookOpen, ScrollText,
  KeyRound, Copy, Mail, IdCard, CalendarCheck, GraduationCap, Wallet,
  Phone, Heart, User, ChevronLeft, ChevronRight as ChevronRIcon,
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

// ─── Palette ──────────────────────────────────────────────────────────────────
const PALETTES = [
  { a: '#4f46e5', b: '#818cf8', light: '#eef2ff', text: '#3730a3' },
  { a: '#0891b2', b: '#38bdf8', light: '#e0f2fe', text: '#0e7490' },
  { a: '#059669', b: '#34d399', light: '#d1fae5', text: '#065f46' },
  { a: '#d97706', b: '#fbbf24', light: '#fef3c7', text: '#92400e' },
  { a: '#dc2626', b: '#f87171', light: '#fee2e2', text: '#991b1b' },
  { a: '#7c3aed', b: '#a78bfa', light: '#ede9fe', text: '#5b21b6' },
]
const getPalette  = (name = '') => PALETTES[name.charCodeAt(0) % PALETTES.length]
const formatStream = (s) => { if (!s) return null; const l = s[0].toUpperCase() + s.slice(1); return s === 'regular' ? l : `${l} Stream` }

// ─── Primitives ───────────────────────────────────────────────────────────────
const Divider = () => <div style={{ height: 1, background: 'var(--color-border)', margin: '10px 0' }} />

const FieldItem = ({ label, value }) => (
  <div style={{ padding: '7px 0' }}>
    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{label}</p>
    <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 500, color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontStyle: value ? 'normal' : 'italic' }}>{value || 'Not provided'}</p>
  </div>
)

const SecLabel = ({ icon: Icon, title, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '14px 0 4px' }}>
    <div style={{ width: 20, height: 20, borderRadius: 5, backgroundColor: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={11} style={{ color }} />
    </div>
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{title}</span>
  </div>
)

// ─── LEFT PANEL ───────────────────────────────────────────────────────────────
const LeftPanel = ({ student, palette, isAdmin, onResetPassword, onDelete }) => {
  const fullName   = `${student.first_name} ${student.last_name}`.trim()
  const enrollment = student.current_enrollment

  return (
    <div style={{
      width: 248, flexShrink: 0, alignSelf: 'flex-start',
      position: 'sticky', top: 16,
      borderRadius: 18, overflow: 'hidden',
      backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
    }}>
      {/* Avatar block */}
      <div style={{ padding: '22px 18px 14px', background: `linear-gradient(160deg, ${palette.light} 0%, transparent 90%)`, textAlign: 'center' }}>
        <div style={{
          width: 68, height: 68, borderRadius: '50%', margin: '0 auto 11px',
          background: `linear-gradient(135deg, ${palette.a}, ${palette.b})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em',
          boxShadow: `0 6px 20px ${palette.a}45`,
        }}>
          {getInitials(fullName)}
        </div>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', lineHeight: 1.25 }}>{fullName}</h2>
        <p style={{ margin: '4px 0 8px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-muted)' }}>{student.admission_no}</p>
        <span style={{
          display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
          padding: '3px 10px', borderRadius: 99,
          backgroundColor: student.is_deleted ? 'var(--color-surface-raised)' : '#dcfce7',
          color: student.is_deleted ? 'var(--color-text-muted)' : '#15803d',
          border: `1px solid ${student.is_deleted ? 'var(--color-border)' : '#bbf7d0'}`,
        }}>
          {student.is_deleted ? 'Inactive' : 'Active'}
        </span>
      </div>

      <div style={{ padding: '0 14px 16px' }}>
        {/* Enrollment */}
        {enrollment && <>
          <Divider />
          <SecLabel icon={BookOpen} title="Enrollment" color={palette.a} />
          <FieldItem label="Class" value={[enrollment.class, formatStream(enrollment.stream)].filter(Boolean).join(' — ')} />
          <FieldItem label="Section · Roll" value={`Sec ${enrollment.section}  ·  Roll ${enrollment.roll_number || '—'}`} />
          {student.session_name && <FieldItem label="Session" value={student.session_name} />}
        </>}

        {/* Identity */}
        <Divider />
        <SecLabel icon={User} title="Identity" color="#0891b2" />
        <FieldItem label="Date of Birth" value={formatDate(student.date_of_birth, 'long')} />
        <FieldItem label="Gender" value={student.gender} />
        <FieldItem label="Blood Group" value={student.blood_group} />
        {student.medical_notes && <FieldItem label="Medical Notes" value={student.medical_notes} />}

        {/* Contact */}
        <Divider />
        <SecLabel icon={Phone} title="Contact" color="#059669" />
        <FieldItem label="Phone" value={student.phone} />
        <FieldItem label="Email" value={student.email} />
        <FieldItem label="Address" value={[student.city, student.address].filter(Boolean).join(', ')} />

        {/* Parents */}
        <Divider />
        <SecLabel icon={Heart} title="Parents" color="#d97706" />
        <FieldItem label="Father" value={student.father_name} />
        <FieldItem label="Father Phone" value={student.father_phone} />
        <FieldItem label="Mother" value={student.mother_name} />
        <FieldItem label="Emergency" value={student.emergency_contact} />

        {/* Admin actions */}
        {isAdmin && <>
          <Divider />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 2 }}>
            <button onClick={onResetPassword} style={{ width: '100%', padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
              <KeyRound size={12} /> Reset Password
            </button>
            <button onClick={onDelete} style={{ width: '100%', padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              <Trash2 size={12} /> Delete Student
            </button>
          </div>
        </>}
      </div>
    </div>
  )
}

// ─── ATTENDANCE CALENDAR ──────────────────────────────────────────────────────
const WDAYS  = ['Su','Mo','Tu','We','Th','Fr','Sa']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const mockAttendance = (year, month) => {
  const days = new Date(year, month + 1, 0).getDate()
  const out  = {}
  for (let d = 1; d <= days; d++) {
    const dow = new Date(year, month, d).getDay()
    if (dow === 0 || dow === 6) continue
    const r = Math.random()
    out[d] = r < 0.07 ? 'absent' : r < 0.12 ? 'late' : r < 0.15 ? 'holiday' : 'present'
  }
  return out
}

const DOT = {
  present: { bg: '#dcfce7', border: '#86efac', dot: '#16a34a' },
  absent:  { bg: '#fee2e2', border: '#fca5a5', dot: '#dc2626' },
  late:    { bg: '#fef3c7', border: '#fde68a', dot: '#d97706' },
  holiday: { bg: '#f1f5f9', border: '#cbd5e1', dot: '#94a3b8' },
}

const AttendanceCalendar = ({ enrollmentId }) => {
  const today = new Date()
  const [year, setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [data, setData]   = useState({})

  useEffect(() => {
    // TODO: replace with real API call
    setData(mockAttendance(year, month))
  }, [year, month, enrollmentId])

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const firstDay  = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const cells     = Array(firstDay).fill(null).concat(Array.from({ length: totalDays }, (_, i) => i + 1))

  const counts = Object.values(data).reduce((a, v) => { a[v] = (a[v] || 0) + 1; return a }, {})
  const total  = (counts.present || 0) + (counts.absent || 0) + (counts.late || 0)
  const pct    = total ? Math.round(((counts.present || 0) + (counts.late || 0)) * 100 / total) : null

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 22 }}>
        {[
          { label: 'Present', value: counts.present || 0, color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
          { label: 'Absent',  value: counts.absent  || 0, color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
          { label: 'Late',    value: counts.late    || 0, color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
          { label: 'Rate',    value: pct !== null ? `${pct}%` : '—', color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' },
        ].map(s => (
          <div key={s.label} style={{ padding: '13px 14px', borderRadius: 13, backgroundColor: s.bg, border: `1px solid ${s.border}` }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.color + 'bb' }}>{s.label}</p>
            <p style={{ margin: '5px 0 0', fontSize: 24, fontWeight: 800, color: s.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={prev} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
          <ChevronLeft size={15} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>{MONTHS[month]} {year}</span>
        <button onClick={next} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
          <ChevronRIcon size={15} />
        </button>
      </div>

      {/* Day names */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {WDAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)', padding: '3px 0' }}>{d}</div>
        ))}
      </div>

      {/* Calendar cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e${idx}`} />
          const status  = data[day]
          const s       = DOT[status]
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          return (
            <div key={day} title={status || 'No school'} style={{
              aspectRatio: '1', borderRadius: 9, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              backgroundColor: s ? s.bg : 'var(--color-surface-raised)',
              border: `1.5px solid ${isToday ? '#4f46e5' : (s ? s.border : 'var(--color-border)')}`,
              boxShadow: isToday ? '0 0 0 2.5px #4f46e535' : 'none',
            }}>
              <span style={{ fontSize: 12, fontWeight: isToday ? 800 : 500, color: isToday ? '#4f46e5' : (s ? s.dot : 'var(--color-text-muted)') }}>{day}</span>
              {s && <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: s.dot }} />}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
        {['present','absent','late','holiday'].map(k => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: DOT[k].bg, border: `1.5px solid ${DOT[k].border}`, display: 'inline-block' }} />
            {k}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-muted)' }}>Today outlined in indigo</span>
      </div>
    </div>
  )
}

// ─── RIGHT PANEL TABS ─────────────────────────────────────────────────────────
const RIGHT_TABS = [
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { key: 'results',   label: 'Results',    icon: GraduationCap },
  { key: 'fees',      label: 'Fees',       icon: Wallet },
  { key: 'audit',     label: 'Audit Log',  icon: ScrollText },
]

const RightPanel = ({ student, palette, activeTab, setActiveTab }) => (
  <div style={{ flex: 1, minWidth: 0, borderRadius: 18, overflow: 'hidden', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
    {/* Tab strip */}
    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', overflowX: 'auto', scrollbarWidth: 'none' }}>
      {RIGHT_TABS.map(tab => {
        const active = activeTab === tab.key
        return (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '13px 20px', fontSize: 13, fontWeight: active ? 700 : 500,
            whiteSpace: 'nowrap', cursor: 'pointer', border: 'none',
            borderBottom: `2.5px solid ${active ? palette.a : 'transparent'}`,
            backgroundColor: active ? palette.light : 'transparent',
            color: active ? palette.text : 'var(--color-text-secondary)',
            transition: 'all 0.15s',
          }}>
            <tab.icon size={14} style={{ opacity: active ? 1 : 0.6 }} />
            {tab.label}
          </button>
        )
      })}
    </div>
    {/* Content */}
    <div style={{ padding: 24 }}>
      {activeTab === 'attendance' && <AttendanceCalendar enrollmentId={student.current_enrollment?.id} />}
      {activeTab === 'results'    && <TabResults  studentId={student.id} />}
      {activeTab === 'fees'       && <TabFees     enrollmentId={student.current_enrollment?.id} />}
      {activeTab === 'audit'      && <TabAuditLog studentId={student.id} />}
    </div>
  </div>
)

// ─── Credential copy row ──────────────────────────────────────────────────────
const CredRow = ({ icon: Icon, label, value, onCopy }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '11px 14px', borderRadius: 12, backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={13} style={{ color: '#4338ca' }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{label}</p>
        <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</p>
      </div>
    </div>
    <button onClick={() => onCopy(value)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
      <Copy size={11} /> Copy
    </button>
  </div>
)

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Pulse = ({ h, w = '100%', r = 8 }) => (
  <div style={{ height: h, width: w, borderRadius: r, backgroundColor: 'var(--color-border)', animation: 'sk 1.6s ease-in-out infinite' }} />
)
const DetailSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <style>{`@keyframes sk{0%,100%{opacity:1}50%{opacity:.38}}`}</style>
    <Pulse h={34} w={140} r={9} />
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ width: 248, flexShrink: 0, borderRadius: 18, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <Pulse h={68} w={68} r={34} />
        <Pulse h={16} w="75%" />
        <Pulse h={11} w="50%" />
        {[1,2,3,4,5,6,7,8,9,10].map(i => <Pulse key={i} h={36} />)}
      </div>
      <div style={{ flex: 1, borderRadius: 18, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div style={{ height: 48, borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
          {[100, 80, 60, 90].map((w, i) => <Pulse key={i} h={14} w={w} r={6} />)}
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
            {[1,2,3,4].map(i => <Pulse key={i} h={72} r={12} />)}
          </div>
          <Pulse h={36} r={6} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginTop: 14 }}>
            {Array(35).fill(0).map((_,i) => <Pulse key={i} h={40} r={8} />)}
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
  const { toastError, toastSuccess } = useToast()
  const { isAdmin } = useAuth()
  const { selectedStudent: student, fetchStudent, clearSelected, deleteStudent, isSaving } = useStudentStore()

  const [activeTab,       setActiveTab]       = useState('attendance')
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

  if (pageLoading || !student) return <DetailSkeleton />

  const fullName  = `${student.first_name} ${student.last_name}`.trim()
  const canDelete = confirmName.trim() === fullName
  const palette   = getPalette(fullName)

  const handleDelete = async () => {
    if (!canDelete) return
    const r = await deleteStudent(id, { confirm_name: confirmName.trim(), reason: `Deleted after confirming name ${fullName}` })
    if (r.success) { toastSuccess('Student deleted'); navigate(ROUTES.STUDENTS) }
    else toastError(r.message || 'Failed to delete')
  }

  const handleResetPassword = async () => {
    setIsResettingPass(true)
    try {
      const res = await studentApi.resetPassword(id, { new_password: tempPassword.trim() || undefined })
      setResetResult(res.data); setTempPassword(''); toastSuccess('Password reset')
    } catch (err) { toastError(err.message || 'Failed') }
    finally { setIsResettingPass(false) }
  }

  const handleCopy = async (v) => {
    if (!v) return
    try { await navigator.clipboard.writeText(v); toastSuccess('Copied') }
    catch { toastError('Unable to copy') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.sdt{animation:fadeUp .3s ease both}`}</style>

      {/* Back */}
      <button onClick={() => navigate(ROUTES.STUDENTS)} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
        <ArrowLeft size={14} /> Back to students
      </button>

      {/* Two-col */}
      <div className="sdt" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <LeftPanel
          student={student}
          palette={palette}
          isAdmin={isAdmin}
          onResetPassword={() => { setTempPassword(''); setResetResult(null); setPasswordOpen(true) }}
          onDelete={() => { setConfirmName(''); setDeleteOpen(true) }}
        />
        <RightPanel student={student} palette={palette} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Delete modal */}
      <Modal open={isAdmin && deleteOpen} onClose={() => !isSaving && setDeleteOpen(false)} title="Delete student record" size="sm"
        footer={<><Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={isSaving}>Cancel</Button><Button variant="danger" icon={Trash2} onClick={handleDelete} loading={isSaving} disabled={!canDelete}>Delete permanently</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 12, backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
            <AlertTriangle size={15} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#991b1b' }}>This action cannot be undone.</p>
              <p style={{ margin: '2px 0 0', color: '#b91c1c' }}>The student will be removed from all active lists permanently.</p>
            </div>
          </div>
          <div style={{ padding: '10px 14px', borderRadius: 12, backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', fontSize: 13 }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Confirm name: </span>
            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{fullName}</span>
          </div>
          <Input label="Type the full student name" value={confirmName} onChange={e => setConfirmName(e.target.value)} placeholder={fullName} autoFocus error={confirmName && !canDelete ? 'Name does not match' : undefined} />
        </div>
      </Modal>

      {/* Reset password modal */}
      <Modal open={isAdmin && passwordOpen} onClose={() => !isResettingPass && setPasswordOpen(false)} title="Reset student password"
        footer={<><Button variant="secondary" onClick={() => setPasswordOpen(false)} disabled={isResettingPass}>Close</Button><Button icon={KeyRound} onClick={handleResetPassword} loading={isResettingPass}>Reset password</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: '10px 14px', borderRadius: 12, backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Leave blank to auto-generate a secure password for the student portal.
          </div>
          <Input label="New password" value={tempPassword} onChange={e => setTempPassword(e.target.value)} placeholder="Leave blank to auto-generate" />
          {resetResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: '10px 14px', borderRadius: 12, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#166534' }}>Share these credentials with the student immediately.</p>
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