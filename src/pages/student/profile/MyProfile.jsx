import { useEffect } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import AchievementBadge from '@/components/student/AchievementBadge'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentProfile from '@/hooks/useStudentProfile'
import useToast from '@/hooks/useToast'
import { ROUTES } from '@/constants/app'
import { formatDate, getInitials } from '@/utils/helpers'

const MyProfile = () => {
  usePageTitle('My Profile')

  const navigate = useNavigate()
  const { toastError } = useToast()
  const { profile, sharedRemarks, achievements, loading, error } = useStudentProfile()

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="rounded-[28px] bg-[var(--color-surface)] p-16" />
        <div className="rounded-[28px] bg-[var(--color-surface)] p-20" />
      </div>
    )
  }

  if (!profile) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Profile unavailable"
        description="Your profile details could not be loaded right now."
      />
    )
  }

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(109,40,217,0.16), rgba(34,197,94,0.05) 52%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--student-accent)] text-xl font-bold text-white">
              {getInitials(profile.full_name)}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold sm:text-3xl text-[var(--color-text-primary)]">{profile.full_name}</h1>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Admission No: {profile.admission_no}</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {profile.class_name} {profile.section_name} • Roll No. {profile.roll_number}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate(ROUTES.STUDENT_PROFILE_CORRECTION)}>
              Request Correction
            </Button>
            <Button onClick={() => navigate(ROUTES.STUDENT_PROFILE_PASSWORD)}>
              Change Password
            </Button>
          </div>
        </div>
      </section>

      <Section title="Identity Details">
        <InfoGrid items={[
          ['Date of Birth', formatDate(profile.date_of_birth, 'long')],
          ['Gender', profile.gender],
          ['Blood Group', profile.blood_group],
          ['Medical Notes', profile.medical_notes || 'No medical notes'],
        ]} />
      </Section>

      <Section title="Contact Details">
        <InfoGrid items={[
          ['Student Phone', profile.phone],
          ['Student Email', profile.email],
          ['Address', profile.address],
          ['City', profile.city],
        ]} />
      </Section>

      <Section title="Parent Details">
        <InfoGrid items={[
          ['Father Name', profile.father_name],
          ['Father Phone', profile.father_phone],
          ['Mother Name', profile.mother_name],
          ['Mother Phone', profile.mother_phone],
          ['Emergency Contact', profile.emergency_contact],
          ['Mother Email', profile.mother_email],
        ]} />
      </Section>

      <Section title="Academic Info">
        <InfoGrid items={[
          ['Current Session', profile.session_name],
          ['Class Teacher', profile.class_teacher_name],
          ['Joining Date', formatDate(profile.joined_date, 'long')],
          ['Joining Type', profile.joining_type],
        ]} />
      </Section>

      <Section title="Shared Remarks">
        {sharedRemarks.length ? (
          <div className="space-y-3">
            {sharedRemarks.map((remark) => (
              <div
                key={remark.id}
                className="rounded-[20px] border px-4 py-4"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    {String(remark.remark_type || 'general').replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {formatDate(remark.created_at, 'long')}
                  </p>
                </div>
                <p className="mt-3 text-sm text-[var(--color-text-primary)]">{remark.remark_text}</p>
                <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
                  Shared by {remark.teacher_name || profile.class_teacher_name || 'Teacher'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] border px-4 py-6 text-sm text-[var(--color-text-secondary)]" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
            Teachers have not shared any remarks with you yet.
          </div>
        )}
      </Section>

      <section
        className="rounded-[24px] border px-4 py-4 text-sm"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
      >
        To request a change to these details, contact your class teacher or submit a correction request.
      </section>

      <Section title="Achievement Badges">
        {achievements.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {achievements.map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] border px-4 py-6 text-sm text-[var(--color-text-secondary)]" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
            Your badges will appear here as you earn them.
          </div>
        )}
      </Section>
    </div>
  )
}

const Section = ({ title, children }) => (
  <section
    className="rounded-[28px] border p-5"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
    <div className="mt-4">{children}</div>
  </section>
)

const InfoGrid = ({ items }) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    {items.map(([label, value]) => (
      <div key={label} className="rounded-[20px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p>
        <p className="mt-2 text-sm text-[var(--color-text-primary)]">{value || '--'}</p>
      </div>
    ))}
  </div>
)

export default MyProfile
