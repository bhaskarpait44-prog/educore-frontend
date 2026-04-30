import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, Trash2, User, MapPin, BookOpen, ScrollText, KeyRound, Copy, Mail, IdCard, CalendarCheck, GraduationCap, Wallet,
} from 'lucide-react'
import useStudentStore from '@/store/studentStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { getInitials } from '@/utils/helpers'
import { ROUTES } from '@/constants/app'
import * as studentApi from '@/api/students'
import useAuth from '@/hooks/useAuth'
import TabIdentity from './tabs/TabIdentity'
import TabProfile from './tabs/TabProfile'
import TabEnrollment from './tabs/TabEnrollment'
import TabAuditLog from './tabs/TabAuditLog'
import TabAttendance from './tabs/TabAttendance'
import TabResults from './tabs/TabResults'
import TabFees from './tabs/TabFees'

const TABS = [
  { key: 'identity', label: 'Identity', icon: User },
  { key: 'profile', label: 'Profile', icon: MapPin },
  { key: 'enrollment', label: 'Enrollment', icon: BookOpen },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { key: 'results', label: 'Results', icon: GraduationCap },
  { key: 'fees', label: 'Fees', icon: Wallet },
  { key: 'audit', label: 'Audit Log', icon: ScrollText },
]

const formatStream = (stream) => {
  if (!stream) return null
  const label = stream.charAt(0).toUpperCase() + stream.slice(1)
  return stream === 'regular' ? label : `${label} Stream`
}

const CredentialRow = ({ icon: Icon, label, value, onCopy }) => (
  <div
    className="flex items-center justify-between gap-3 rounded-xl p-3"
    style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
        style={{ backgroundColor: '#eef2ff', color: '#4338ca' }}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
          {value || '--'}
        </p>
      </div>
    </div>
    <Button variant="secondary" size="sm" icon={Copy} onClick={() => onCopy(value)}>
      Copy
    </Button>
  </div>
)

const StudentDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toastError, toastSuccess } = useToast()
  const { isAdmin } = useAuth()
  const { selectedStudent: student, fetchStudent, clearSelected, deleteStudent, isSaving } = useStudentStore()
  const [activeTab, setActiveTab] = useState('identity')
  const [pageLoading, setPageLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [resetResult, setResetResult] = useState(null)
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  usePageTitle(student ? `${student.first_name} ${student.last_name}` : 'Student')

  useEffect(() => {
    setPageLoading(true)
    fetchStudent(id).catch(() => {
      toastError('Student not found')
      navigate(ROUTES.STUDENTS)
    }).finally(() => {
      setPageLoading(false)
    })
    return () => clearSelected()
  }, [id, fetchStudent, clearSelected, navigate, toastError])

  if (pageLoading || !student) return <DetailSkeleton />

  const fullName = `${student.first_name} ${student.last_name}`.trim()
  const canDelete = confirmName.trim() === fullName

  const handleDelete = async () => {
    if (!canDelete) return
    const result = await deleteStudent(id, {
      confirm_name: confirmName.trim(),
      reason: `Student deleted after confirming name ${fullName}`,
    })
    if (result.success) {
      toastSuccess('Student deleted successfully')
      navigate(ROUTES.STUDENTS)
    } else {
      toastError(result.message || 'Failed to delete student')
    }
  }

  const handleResetPassword = async () => {
    setIsResettingPassword(true)
    try {
      const response = await studentApi.resetPassword(id, {
        new_password: tempPassword.trim() || undefined,
      })
      setResetResult(response.data)
      setTempPassword('')
      toastSuccess('Student password reset successfully')
    } catch (error) {
      toastError(error.message || 'Failed to reset student password')
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleCopy = async (value) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      toastSuccess('Copied to clipboard')
    } catch {
      toastError('Unable to copy')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate(ROUTES.STUDENTS)}
          className="p-2 rounded-xl transition-colors mt-1"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <ArrowLeft size={20} />
        </button>

        <div
          className="flex items-center gap-4 flex-1 p-5 rounded-2xl"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            {getInitials(`${student.first_name} ${student.last_name}`)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {fullName}
              </h1>
              <Badge variant={student.is_deleted ? 'grey' : 'green'} dot>
                {student.is_deleted ? 'Inactive' : 'Active'}
              </Badge>
            </div>
            <p className="text-sm font-mono" style={{ color: 'var(--color-text-muted)' }}>
              {student.admission_no}
            </p>
            {student.current_enrollment && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {[
                  student.current_enrollment.class,
                  formatStream(student.current_enrollment.stream),
                  `Section ${student.current_enrollment.section}`,
                  `Roll ${student.current_enrollment.roll_number || '—'}`,
                ].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={KeyRound}
                onClick={() => {
                  setTempPassword('')
                  setResetResult(null)
                  setPasswordOpen(true)
                }}
              >
                Reset Password
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => {
                  setConfirmName('')
                  setDeleteOpen(true)
                }}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex overflow-x-auto" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
              style={{
                borderBottomColor: activeTab === tab.key ? 'var(--color-brand)' : 'transparent',
                color: activeTab === tab.key ? 'var(--color-brand)' : 'var(--color-text-secondary)',
              }}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'identity' && <TabIdentity student={student} studentId={id} />}
          {activeTab === 'profile' && <TabProfile student={student} studentId={id} />}
          {activeTab === 'enrollment' && <TabEnrollment studentId={id} />}
          {activeTab === 'attendance' && <TabAttendance enrollmentId={student?.current_enrollment?.id} />}
          {activeTab === 'results' && <TabResults studentId={id} />}
          {activeTab === 'fees' && <TabFees enrollmentId={student?.current_enrollment?.id} />}
          {activeTab === 'audit' && <TabAuditLog studentId={id} />}
        </div>
      </div>

      <Modal
        open={isAdmin && deleteOpen}
        onClose={() => !isSaving && setDeleteOpen(false)}
        title="Delete Student"
        size="sm"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="danger" icon={Trash2} onClick={handleDelete} loading={isSaving} disabled={!canDelete}>
              Delete Student
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div
            className="flex gap-3 rounded-xl p-3"
            style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
          >
            <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
            <div className="text-sm leading-relaxed" style={{ color: '#991b1b' }}>
              <p className="font-semibold">This will delete the student record from active lists.</p>
              <p>Type the full name exactly to confirm.</p>
            </div>
          </div>

          <div
            className="rounded-xl p-3 text-sm"
            style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
          >
            Student name: <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{fullName}</span>
          </div>

          <Input
            label="Type student name"
            value={confirmName}
            onChange={e => setConfirmName(e.target.value)}
            placeholder={fullName}
            autoFocus
            error={confirmName && !canDelete ? 'Name does not match' : undefined}
          />
        </div>
      </Modal>

      <Modal
        open={isAdmin && passwordOpen}
        onClose={() => !isResettingPassword && setPasswordOpen(false)}
        title="Reset Student Password"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setPasswordOpen(false)} disabled={isResettingPassword}>
              Close
            </Button>
            <Button icon={KeyRound} onClick={handleResetPassword} loading={isResettingPassword}>
              Reset Password
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div
            className="rounded-xl p-3 text-sm"
            style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
          >
            Leave the password blank to auto-generate a secure student portal password.
          </div>

          <Input
            label="New Password"
            value={tempPassword}
            onChange={e => setTempPassword(e.target.value)}
            placeholder="Leave blank for auto-generated password"
          />

          {resetResult && (
            <div className="space-y-3">
              <div
                className="rounded-xl p-3"
                style={{ backgroundColor: '#ecfdf5', border: '1px solid #bbf7d0' }}
              >
                <p className="text-sm font-semibold" style={{ color: '#166534' }}>
                  Share these updated student credentials now.
                </p>
              </div>

              <CredentialRow icon={IdCard} label="Admission Number" value={resetResult.admission_no} onCopy={handleCopy} />
              <CredentialRow icon={Mail} label="Login Email" value={resetResult.email} onCopy={handleCopy} />
              <CredentialRow icon={KeyRound} label="Temporary Password" value={resetResult.generated_password} onCopy={handleCopy} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

const DetailSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
    <div className="h-24 rounded-2xl" style={{ backgroundColor: 'var(--color-surface)' }} />
    <div className="h-96 rounded-2xl" style={{ backgroundColor: 'var(--color-surface)' }} />
  </div>
)

export default StudentDetailPage
