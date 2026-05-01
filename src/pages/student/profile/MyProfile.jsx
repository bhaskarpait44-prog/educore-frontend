import { useEffect } from 'react'
import {
  ShieldCheck, User, Phone, BookOpen, Award,
  MessageSquare, ChevronRight, Pencil, KeyRound,
  Heart, MapPin, GraduationCap, Users
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '@/components/ui/EmptyState'
import AchievementBadge from '@/components/student/AchievementBadge'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentProfile from '@/hooks/useStudentProfile'
import useToast from '@/hooks/useToast'
import { ROUTES } from '@/constants/app'
import { formatDate, getInitials } from '@/utils/helpers'

// ─── Skeleton ────────────────────────────────────────────────────────────────
const Skeleton = ({ h = 20, w = '100%', r = 8 }) => (
  <div style={{
    height: h, width: w, borderRadius: r,
    background: 'var(--color-border)',
    animation: 'pulse 1.6s ease-in-out infinite',
  }} />
)

// ─── Section Wrapper ─────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{
    borderRadius: 20,
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
    ...style,
  }}>
    {children}
  </div>
)

const CardHeader = ({ icon: Icon, title, accent = '#6366f1' }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 20px',
    borderBottom: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface-raised)',
  }}>
    <div style={{
      width: 30, height: 30, borderRadius: 8, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: accent + '18',
    }}>
      <Icon size={15} style={{ color: accent }} />
    </div>
    <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
      {title}
    </span>
  </div>
)

// ─── Info Field ───────────────────────────────────────────────────────────────
const Field = ({ label, value, full = false }) => (
  <div style={{
    gridColumn: full ? '1 / -1' : undefined,
    padding: '14px 0',
    borderBottom: '1px solid var(--color-border)',
  }}>
    <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
      {label}
    </p>
    <p style={{ margin: '5px 0 0', fontSize: 14, fontWeight: 500, color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontStyle: value ? 'normal' : 'italic' }}>
      {value || 'Not provided'}
    </p>
  </div>
)

const FieldGrid = ({ items }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    columnGap: 32,
    padding: '0 20px',
  }}>
    {items.map(([label, value, full]) => (
      <Field key={label} label={label} value={value} full={full} />
    ))}
    {/* spacer to close bottom border */}
    <div style={{ height: 8, gridColumn: '1 / -1' }} />
  </div>
)

// ─── Main ─────────────────────────────────────────────────────────────────────
const MyProfile = () => {
  usePageTitle('My Profile')
  const navigate = useNavigate()
  const { toastError } = useToast()
  const { profile, sharedRemarks, achievements, loading, error } = useStudentProfile()

  useEffect(() => { if (error) toastError(error) }, [error, toastError])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>
        <div style={{ borderRadius: 20, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 24 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <Skeleton h={72} w={72} r={36} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton h={22} w="55%" />
              <Skeleton h={14} w="35%" />
              <Skeleton h={14} w="40%" />
            </div>
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ borderRadius: 20, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 24 }}>
            <Skeleton h={16} w="30%" />
            <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Skeleton h={48} /><Skeleton h={48} /><Skeleton h={48} /><Skeleton h={48} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!profile) return (
    <EmptyState icon={ShieldCheck} title="Profile unavailable" description="Your profile details could not be loaded right now." />
  )

  const initials = getInitials(profile.full_name)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .profile-card { animation: fadeUp 0.35s ease both; }
        .profile-card:nth-child(2) { animation-delay: 0.05s }
        .profile-card:nth-child(3) { animation-delay: 0.1s }
        .profile-card:nth-child(4) { animation-delay: 0.15s }
        .profile-card:nth-child(5) { animation-delay: 0.2s }
        .profile-card:nth-child(6) { animation-delay: 0.25s }
        .profile-card:nth-child(7) { animation-delay: 0.3s }
        .profile-card:nth-child(8) { animation-delay: 0.35s }
        .action-btn:hover { opacity: 0.82; transform: translateY(-1px); }
        .action-btn { transition: all 0.15s ease; }
      `}</style>

      {/* ── Hero Card ─────────────────────────────────────────────────────── */}
      <Card className="profile-card" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Decorative accent stripe */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)',
        }} />

        <div style={{ padding: '28px 24px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 76, height: 76, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 800, color: '#fff',
                letterSpacing: '-0.02em',
              }}>
                {initials}
              </div>
              {/* Online dot */}
              <div style={{
                position: 'absolute', bottom: 4, right: 4,
                width: 14, height: 14, borderRadius: '50%',
                backgroundColor: '#22c55e',
                border: '2.5px solid var(--color-surface)',
              }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
                {profile.full_name}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 12px', marginTop: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  {profile.class_name} {profile.section_name}
                </span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: 'var(--color-text-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  Roll No. {profile.roll_number}
                </span>
              </div>

              {/* Tags row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                <Chip label={`Adm. ${profile.admission_no}`} />
                {profile.blood_group && <Chip label={profile.blood_group} color="#ef4444" />}
                {profile.gender && <Chip label={profile.gender} />}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              <ActionButton
                icon={Pencil}
                label="Request correction"
                onClick={() => navigate(ROUTES.STUDENT_PROFILE_CORRECTION)}
                variant="outline"
              />
              <ActionButton
                icon={KeyRound}
                label="Change password"
                onClick={() => navigate(ROUTES.STUDENT_PROFILE_PASSWORD)}
                variant="primary"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* ── Identity ──────────────────────────────────────────────────────── */}
      <Card className="profile-card">
        <CardHeader icon={User} title="Identity details" accent="#6366f1" />
        <FieldGrid items={[
          ['Date of Birth', formatDate(profile.date_of_birth, 'long')],
          ['Gender', profile.gender],
          ['Blood Group', profile.blood_group],
          ['Medical Notes', profile.medical_notes, true],
        ]} />
      </Card>

      {/* ── Contact ───────────────────────────────────────────────────────── */}
      <Card className="profile-card">
        <CardHeader icon={Phone} title="Contact details" accent="#0ea5e9" />
        <FieldGrid items={[
          ['Student Phone', profile.phone],
          ['Student Email', profile.email],
          ['City', profile.city],
          ['Address', profile.address, true],
        ]} />
      </Card>

      {/* ── Parents ───────────────────────────────────────────────────────── */}
      <Card className="profile-card">
        <CardHeader icon={Users} title="Parent details" accent="#f59e0b" />
        <FieldGrid items={[
          ['Father Name', profile.father_name],
          ['Father Phone', profile.father_phone],
          ['Mother Name', profile.mother_name],
          ['Mother Phone', profile.mother_phone],
          ['Mother Email', profile.mother_email],
          ['Emergency Contact', profile.emergency_contact],
        ]} />
      </Card>

      {/* ── Academic ──────────────────────────────────────────────────────── */}
      <Card className="profile-card">
        <CardHeader icon={GraduationCap} title="Academic info" accent="#10b981" />
        <FieldGrid items={[
          ['Current Session', profile.session_name],
          ['Class Teacher', profile.class_teacher_name],
          ['Joining Date', formatDate(profile.joined_date, 'long')],
          ['Joining Type', profile.joining_type],
        ]} />
      </Card>

      {/* ── Remarks ───────────────────────────────────────────────────────── */}
      <Card className="profile-card">
        <CardHeader icon={MessageSquare} title="Shared remarks" accent="#8b5cf6" />
        <div style={{ padding: 16 }}>
          {sharedRemarks.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sharedRemarks.map(remark => (
                <div key={remark.id} style={{
                  padding: '14px 16px', borderRadius: 12,
                  backgroundColor: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: '#8b5cf6',
                      backgroundColor: '#8b5cf618', padding: '3px 9px', borderRadius: 99,
                    }}>
                      {String(remark.remark_type || 'general').replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {formatDate(remark.created_at, 'long')}
                    </span>
                  </div>
                  <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.6, color: 'var(--color-text-primary)' }}>
                    {remark.remark_text}
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                    — {remark.teacher_name || profile.class_teacher_name || 'Teacher'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyInline text="No remarks have been shared with you yet." />
          )}
        </div>
      </Card>

      {/* ── Achievements ──────────────────────────────────────────────────── */}
      <Card className="profile-card">
        <CardHeader icon={Award} title="Achievement badges" accent="#f59e0b" />
        <div style={{ padding: 16 }}>
          {achievements.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {achievements.map(a => <AchievementBadge key={a.id} achievement={a} />)}
            </div>
          ) : (
            <EmptyInline text="Your badges will appear here as you earn them." />
          )}
        </div>
      </Card>

      {/* ── Footer Note ───────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 20px', borderRadius: 14, backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          To request changes to your details, contact your class teacher or use the correction request feature above.
        </p>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Chip = ({ label, color }) => (
  <span style={{
    fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 99,
    backgroundColor: color ? color + '15' : 'var(--color-surface-raised)',
    color: color || 'var(--color-text-secondary)',
    border: `1px solid ${color ? color + '30' : 'var(--color-border)'}`,
  }}>
    {label}
  </span>
)

const ActionButton = ({ icon: Icon, label, onClick, variant = 'outline' }) => (
  <button
    className="action-btn"
    onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 600,
      cursor: 'pointer', whiteSpace: 'nowrap',
      ...(variant === 'primary' ? {
        backgroundColor: 'var(--color-text-primary)',
        color: 'var(--color-surface)',
        border: 'none',
      } : {
        backgroundColor: 'transparent',
        color: 'var(--color-text-secondary)',
        border: '1.5px solid var(--color-border)',
      }),
    }}
  >
    <Icon size={13} />
    {label}
  </button>
)

const EmptyInline = ({ text }) => (
  <div style={{
    padding: '20px 16px', borderRadius: 12, textAlign: 'center',
    backgroundColor: 'var(--color-surface-raised)', border: '1px dashed var(--color-border)',
  }}>
    <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>{text}</p>
  </div>
)

export default MyProfile