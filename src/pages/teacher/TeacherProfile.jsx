import { useMemo, useState } from 'react'
import {
  Briefcase, GraduationCap, KeyRound, Mail, MapPin, Phone, ScrollText, UserRound,
} from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useTeacherProfile from '@/hooks/useTeacherProfile'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import ProgressBar from '@/components/ui/ProgressBar'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate } from '@/utils/helpers'

const TeacherProfile = () => {
  usePageTitle('My Profile')

  const { toastSuccess, toastError } = useToast()
  const {
    profile,
    assignments,
    correctionRequests,
    performanceSummary,
    loading,
    saving,
    submitContactUpdate,
    submitPasswordChange,
    submitCorrectionRequest,
  } = useTeacherProfile()

  const [contactForm, setContactForm] = useState({ phone: '', email: '', address: '', reason: '' })
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [correctionForm, setCorrectionForm] = useState({ field_name: '', current_value: '', requested_value: '', reason: '' })

  const subjectsTaught = useMemo(() => {
    const map = new Map()
    assignments.forEach((assignment) => {
      if (assignment.subject_id && !map.has(assignment.subject_id)) {
        map.set(assignment.subject_id, assignment.subject_name)
      }
    })
    return [...map.values()]
  }, [assignments])

  const handleContactSubmit = async (event) => {
    event.preventDefault()
    try {
      await submitContactUpdate(contactForm)
      toastSuccess('Contact correction request submitted.')
      setContactForm((prev) => ({ ...prev, reason: '' }))
    } catch (error) {
      toastError(error?.message || 'Unable to submit contact update.')
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toastError('New password and confirm password must match.')
      return
    }
    try {
      await submitPasswordChange({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      })
      toastSuccess('Password changed successfully.')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (error) {
      toastError(error?.message || 'Unable to change password.')
    }
  }

  const handleCorrectionSubmit = async (event) => {
    event.preventDefault()
    try {
      await submitCorrectionRequest(correctionForm)
      toastSuccess('Correction request submitted.')
      setCorrectionForm({ field_name: '', current_value: '', requested_value: '', reason: '' })
    } catch (error) {
      toastError(error?.message || 'Unable to submit correction request.')
    }
  }

  return (
    <div className="space-y-5 pb-20">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.18), rgba(16, 185, 129, 0.06) 58%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-[28px] text-2xl font-bold"
              style={{ backgroundColor: '#0f766e', color: '#fff' }}
            >
              {profile?.name?.split(' ').map((part) => part[0]).slice(0, 2).join('') || 'T'}
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {profile?.name || 'Teacher Profile'}
              </h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Employee ID: {profile?.employee_id || '--'} | {profile?.designation || 'Teacher'} | {profile?.department || 'Department not set'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="green">{profile?.role || 'teacher'}</Badge>
                <Badge variant="blue">Joined {formatDate(profile?.joining_date, 'long')}</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MiniInfo icon={Phone} label="Phone" value={profile?.phone || '--'} />
            <MiniInfo icon={Mail} label="Email" value={profile?.email || '--'} />
            <MiniInfo icon={Briefcase} label="Designation" value={profile?.designation || '--'} />
            <MiniInfo icon={MapPin} label="Address" value={profile?.address || '--'} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="space-y-5">
          <Panel title="Contact Info" icon={UserRound}>
            {loading ? (
              <Skeleton rows={4} />
            ) : (
              <form className="space-y-4" onSubmit={handleContactSubmit}>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Input label="Phone" value={contactForm.phone} onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))} placeholder={profile?.phone || 'Phone number'} />
                  <Input label="Email" value={contactForm.email} onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))} placeholder={profile?.email || 'Email address'} />
                </div>
                <Textarea label="Address" value={contactForm.address} onChange={(e) => setContactForm((p) => ({ ...p, address: e.target.value }))} rows={3} placeholder={profile?.address || 'Address'} />
                <Textarea label="Reason for correction" value={contactForm.reason} onChange={(e) => setContactForm((p) => ({ ...p, reason: e.target.value }))} rows={2} placeholder="Explain why this contact detail should be updated." required />
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" loading={saving}>Submit Contact Update</Button>
                </div>
              </form>
            )}
          </Panel>

          <Panel title="Change Password" icon={KeyRound}>
            <form className="space-y-4" onSubmit={handlePasswordSubmit}>
              <Input type="password" label="Current Password" value={passwordForm.current_password} onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))} required />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Input type="password" label="New Password" value={passwordForm.new_password} onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))} required />
                <Input type="password" label="Confirm Password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm_password: e.target.value }))} required />
              </div>
              <PasswordStrength password={passwordForm.new_password} />
              <div className="flex justify-end">
                <Button type="submit" variant="primary" loading={saving}>Save Password</Button>
              </div>
            </form>
          </Panel>

          <Panel title="Request Correction" icon={ScrollText}>
            <form className="space-y-4" onSubmit={handleCorrectionSubmit}>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Input label="Field Name" value={correctionForm.field_name} onChange={(e) => setCorrectionForm((p) => ({ ...p, field_name: e.target.value }))} placeholder="designation / department / joining_date" required />
                <Input label="Current Value" value={correctionForm.current_value} onChange={(e) => setCorrectionForm((p) => ({ ...p, current_value: e.target.value }))} placeholder="Current value shown in profile" />
              </div>
              <Input label="Requested Value" value={correctionForm.requested_value} onChange={(e) => setCorrectionForm((p) => ({ ...p, requested_value: e.target.value }))} placeholder="Correct value" required />
              <Textarea label="Reason" value={correctionForm.reason} onChange={(e) => setCorrectionForm((p) => ({ ...p, reason: e.target.value }))} rows={3} placeholder="Why should this be corrected?" required />
              <div className="flex justify-end">
                <Button type="submit" variant="primary" loading={saving}>Submit Correction Request</Button>
              </div>
            </form>
          </Panel>
        </section>

        <section className="space-y-5">
          <Panel title="My Assignments" icon={Briefcase}>
            {loading ? <Skeleton rows={4} /> : assignments.length === 0 ? (
              <EmptyState icon={Briefcase} title="No assignments found" description="No active teaching assignments are available for this profile." />
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={assignment.is_class_teacher ? 'green' : 'blue'}>
                        {assignment.is_class_teacher ? 'Class Teacher' : 'Subject Teacher'}
                      </Badge>
                      <Badge variant="grey">{assignment.class_name} {assignment.section_name}</Badge>
                    </div>
                    <p className="mt-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {assignment.subject_name || 'Full class management'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Professional Profile" icon={GraduationCap}>
            <div className="grid grid-cols-1 gap-3">
              <MiniInfo icon={GraduationCap} label="Highest Qualification" value={profile?.highest_qualification || '--'} />
              <MiniInfo icon={Briefcase} label="Specialization" value={profile?.specialization || '--'} />
              <MiniInfo icon={UserRound} label="University / Institution" value={profile?.university_name || '--'} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MiniInfo icon={ScrollText} label="Graduation Year" value={profile?.graduation_year || '--'} />
                <MiniInfo icon={Briefcase} label="Experience" value={profile?.years_of_experience != null ? `${profile.years_of_experience} years` : '--'} />
              </div>
            </div>
          </Panel>

          <Panel title="My Subjects" icon={Briefcase}>
            {subjectsTaught.length ? (
              <div className="flex flex-wrap gap-2">
                {subjectsTaught.map((subject) => <Badge key={subject} variant="blue">{subject}</Badge>)}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No subject assignments found.</p>
            )}
          </Panel>

          <Panel title="Performance Summary" icon={ScrollText}>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Attendance marking rate</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {performanceSummary?.attendance_marking_rate?.marked || 0} marked records this session
                </p>
                <ProgressBar value={performanceSummary?.attendance_marking_rate?.on_time_rate || 0} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Marks entry completion rate</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {performanceSummary?.marks_entry_completion_rate?.completed || 0} of {performanceSummary?.marks_entry_completion_rate?.total || 0} published exam cycle(s) completed
                </p>
                <ProgressBar value={performanceSummary?.marks_entry_completion_rate?.percentage || 0} />
              </div>
            </div>
          </Panel>

          <Panel title="Recent Correction Requests" icon={ScrollText}>
            {correctionRequests.length ? (
              <div className="space-y-3">
                {correctionRequests.map((request) => (
                  <div key={request.id} className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={request.status === 'approved' ? 'green' : request.status === 'rejected' ? 'red' : 'yellow'}>
                        {request.status}
                      </Badge>
                      <Badge variant="grey">{request.field_name}</Badge>
                    </div>
                    <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {request.current_value || '--'} {'->'} {request.requested_value}
                    </p>
                    <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {formatDate(request.created_at, 'long')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No correction requests submitted yet.</p>
            )}
          </Panel>
        </section>
      </div>
    </div>
  )
}

const Panel = ({ title, icon: Icon, children }) => (
  <section className="rounded-[28px] border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <div className="mb-4 flex items-center gap-2">
      <Icon size={16} style={{ color: 'var(--color-text-secondary)' }} />
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
    </div>
    {children}
  </section>
)

const MiniInfo = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
    <div className="flex items-center gap-2">
      <Icon size={14} style={{ color: '#0f766e' }} />
      <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
    </div>
    <p className="mt-2 text-sm font-semibold break-words" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
  </div>
)

const PasswordStrength = ({ password }) => {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length * 20

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-muted)' }}>
        Password Strength
      </p>
      <ProgressBar value={score} />
    </div>
  )
}

const Skeleton = ({ rows = 3 }) => (
  <div className="space-y-3">
    {[...Array(rows)].map((_, index) => (
      <div key={index} className="h-14 animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    ))}
  </div>
)

export default TeacherProfile
