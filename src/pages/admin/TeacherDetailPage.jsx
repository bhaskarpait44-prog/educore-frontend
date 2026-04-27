import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CalendarDays,
  Copy,
  GraduationCap,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ScrollText,
  Trash2,
  User,
} from 'lucide-react'
import * as userApi from '@/api/userManagementApi'
import { getTeacherControlTimetable } from '@/api/adminTeacherControlApi'
import { ROUTES } from '@/constants/app'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import TimetableGrid from '@/components/teacher/TimetableGrid'
import { formatDate, getInitials } from '@/utils/helpers'

const TABS = [
  { key: 'identity', label: 'Identity', icon: User },
  { key: 'professional', label: 'Professional', icon: GraduationCap },
  { key: 'timetable', label: 'Timetable', icon: CalendarDays },
  { key: 'audit', label: 'Audit Log', icon: ScrollText },
]

const Field = ({ icon: Icon, label, value, full = false }) => (
  <div
    className={`rounded-2xl p-4 ${full ? 'sm:col-span-2 lg:col-span-3' : ''}`}
    style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
  >
    <p className="text-xs font-semibold uppercase tracking-[0.16em] flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
      <Icon size={12} />
      {label}
    </p>
    <p className="mt-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
      {value || 'Not provided'}
    </p>
  </div>
)

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

const TeacherAuditTab = ({ userId }) => {
  const { toastError } = useToast()
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadAudit = async () => {
      setIsLoading(true)
      try {
        const response = await userApi.getUserAudit(userId, { page: 1, limit: 30 })
        setLogs(response?.data?.logs || [])
      } catch (error) {
        setLogs([])
        toastError(error.message || 'Failed to load audit logs')
      } finally {
        setIsLoading(false)
      }
    }

    loadAudit()
  }, [userId, toastError])

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No audit records found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div
          key={log.id}
          className="rounded-2xl p-4"
          style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{log.field_name}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatDate(log.created_at, 'short')}</p>
          </div>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {`${log.old_value || 'Empty'} -> ${log.new_value || 'Empty'}`}
          </p>
          {log.reason && (
            <p className="mt-1 text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
              "{log.reason}"
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

const TeacherTimetableTab = ({ teacherId }) => {
  const { toastError } = useToast()
  const [slots, setSlots] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadTimetable = async () => {
      setIsLoading(true)
      try {
        const response = await getTeacherControlTimetable()
        const rows = response?.data?.timetable || []
        const filtered = rows.filter((slot) => Number(slot.teacher_id) === Number(teacherId) && slot.is_active !== false)
        setSlots(filtered)
      } catch (error) {
        setSlots([])
        toastError(error.message || 'Failed to load teacher timetable')
      } finally {
        setIsLoading(false)
      }
    }

    loadTimetable()
  }, [teacherId, toastError])

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        ))}
      </div>
    )
  }

  if (!slots.length) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          No final timetable assigned by admin for this teacher.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Final weekly timetable assigned by admin (calendar view).
      </p>
      <TimetableGrid slots={slots} />
    </div>
  )
}

const TeacherDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toastError, toastSuccess } = useToast()
  const [teacher, setTeacher] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('identity')

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [resetResult, setResetResult] = useState(null)

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    employee_id: '',
    department: '',
    designation: '',
    joining_date: '',
    address: '',
    highest_qualification: '',
    specialization: '',
    university_name: '',
    graduation_year: '',
    years_of_experience: '',
    internal_notes: '',
  })

  usePageTitle(teacher ? teacher.name : 'Teacher Detail')

  const loadTeacher = async () => {
    try {
      const response = await userApi.getUser(id)
      if (response?.data?.role !== 'teacher') {
        toastError('Selected user is not a teacher')
        navigate(ROUTES.TEACHERS)
        return
      }
      setTeacher(response.data)
    } catch (error) {
      toastError(error.message || 'Failed to load teacher details')
      navigate(ROUTES.TEACHERS)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    loadTeacher().finally(() => setIsLoading(false))
  }, [id])

  const syncEditFormFromTeacher = () => {
    if (!teacher) return
    setEditForm({
      name: teacher.name || '',
      phone: teacher.phone || '',
      employee_id: teacher.employee_id || '',
      department: teacher.department || '',
      designation: teacher.designation || '',
      joining_date: teacher.joining_date ? String(teacher.joining_date).slice(0, 10) : '',
      address: teacher.address || '',
      highest_qualification: teacher.highest_qualification || '',
      specialization: teacher.specialization || '',
      university_name: teacher.university_name || '',
      graduation_year: teacher.graduation_year ? String(teacher.graduation_year) : '',
      years_of_experience: teacher.years_of_experience ? String(teacher.years_of_experience) : '',
      internal_notes: teacher.internal_notes || '',
    })
  }

  const handleSaveEdit = async () => {
    setIsSavingEdit(true)
    try {
      await userApi.updateUser(id, {
        ...editForm,
        graduation_year: editForm.graduation_year ? Number(editForm.graduation_year) : null,
        years_of_experience: editForm.years_of_experience ? Number(editForm.years_of_experience) : null,
        reason: 'Updated from teacher detail page',
      })
      toastSuccess('Teacher updated successfully')
      setEditOpen(false)
      await loadTeacher()
    } catch (error) {
      toastError(error.message || 'Failed to update teacher')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteTeacher = async () => {
    setIsDeleting(true)
    try {
      await userApi.deleteUser(id)
      toastSuccess('Teacher deleted successfully')
      navigate(ROUTES.TEACHERS)
    } catch (error) {
      toastError(error.message || 'Failed to delete teacher')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleResetPassword = async () => {
    setIsResettingPassword(true)
    try {
      const response = await userApi.resetUserPassword(id, {
        new_password: tempPassword.trim() || undefined,
        force_change: true,
      })
      setResetResult(response?.data || null)
      setTempPassword('')
      toastSuccess('Teacher login password reset successfully')
    } catch (error) {
      toastError(error.message || 'Failed to reset login password')
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

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
        <div className="h-10 w-44 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        <div className="h-36 rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        <div className="h-56 rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
      </div>
    )
  }

  if (!teacher) return null

  const canDelete = confirmName.trim() === teacher.name

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate(ROUTES.TEACHERS)}
          className="p-2 rounded-xl transition-colors mt-1"
          style={{ color: 'var(--color-text-secondary)' }}
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
            {getInitials(teacher.name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {teacher.name}
              </h1>
              <Badge variant={teacher.is_active ? 'green' : 'grey'} dot>
                {teacher.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="blue">Teacher</Badge>
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {teacher.email}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {teacher.employee_id || 'No Employee ID'} {teacher.department ? `• ${teacher.department}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Pencil}
              onClick={() => {
                syncEditFormFromTeacher()
                setEditOpen(true)
              }}
            >
              Edit
            </Button>
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
              Reset Login Password
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
          {activeTab === 'identity' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field icon={Mail} label="Email" value={teacher.email} />
              <Field icon={Phone} label="Phone" value={teacher.phone} />
              <Field icon={Briefcase} label="Employee ID" value={teacher.employee_id} />
              <Field icon={Briefcase} label="Department" value={teacher.department} />
              <Field icon={Briefcase} label="Designation" value={teacher.designation} />
              <Field icon={Calendar} label="Joining Date" value={teacher.joining_date ? String(teacher.joining_date).slice(0, 10) : ''} />
              <Field icon={MapPin} label="Address" value={teacher.address} full />
            </div>
          )}

          {activeTab === 'professional' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field icon={GraduationCap} label="Highest Qualification" value={teacher.highest_qualification} />
              <Field icon={GraduationCap} label="Specialization" value={teacher.specialization} />
              <Field icon={GraduationCap} label="University Name" value={teacher.university_name} />
              <Field icon={GraduationCap} label="Graduation Year" value={teacher.graduation_year} />
              <Field icon={GraduationCap} label="Experience (Years)" value={teacher.years_of_experience} />
            </div>
          )}

          {activeTab === 'timetable' && <TeacherTimetableTab teacherId={id} />}
          {activeTab === 'audit' && <TeacherAuditTab userId={id} />}
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => !isSavingEdit && setEditOpen(false)}
        title="Edit Teacher"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={isSavingEdit}>
              Cancel
            </Button>
            <Button icon={Pencil} onClick={handleSaveEdit} loading={isSavingEdit}>
              Save Changes
            </Button>
          </>
        )}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} />
          <Input label="Employee ID" value={editForm.employee_id} onChange={(e) => setEditForm((p) => ({ ...p, employee_id: e.target.value }))} />
          <Input label="Department" value={editForm.department} onChange={(e) => setEditForm((p) => ({ ...p, department: e.target.value }))} />
          <Input label="Designation" value={editForm.designation} onChange={(e) => setEditForm((p) => ({ ...p, designation: e.target.value }))} />
          <Input label="Joining Date" type="date" value={editForm.joining_date} onChange={(e) => setEditForm((p) => ({ ...p, joining_date: e.target.value }))} />
          <Input label="Highest Qualification" value={editForm.highest_qualification} onChange={(e) => setEditForm((p) => ({ ...p, highest_qualification: e.target.value }))} />
          <Input label="Specialization" value={editForm.specialization} onChange={(e) => setEditForm((p) => ({ ...p, specialization: e.target.value }))} />
          <Input label="University" value={editForm.university_name} onChange={(e) => setEditForm((p) => ({ ...p, university_name: e.target.value }))} />
          <Input label="Graduation Year" type="number" value={editForm.graduation_year} onChange={(e) => setEditForm((p) => ({ ...p, graduation_year: e.target.value }))} />
          <Input label="Experience (Years)" type="number" step="0.5" value={editForm.years_of_experience} onChange={(e) => setEditForm((p) => ({ ...p, years_of_experience: e.target.value }))} />
          <div className="sm:col-span-2">
            <Input label="Address" value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => !isDeleting && setDeleteOpen(false)}
        title="Delete Teacher"
        size="sm"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" icon={Trash2} onClick={handleDeleteTeacher} loading={isDeleting} disabled={!canDelete}>
              Delete Teacher
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="flex gap-3 rounded-xl p-3" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
            <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
            <div className="text-sm leading-relaxed" style={{ color: '#991b1b' }}>
              <p className="font-semibold">This will deactivate and delete the teacher account from active lists.</p>
              <p>Type the full teacher name exactly to confirm.</p>
            </div>
          </div>

          <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>
            Teacher name: <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{teacher.name}</span>
          </div>

          <Input
            label="Type teacher name"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={teacher.name}
            autoFocus
            error={confirmName && !canDelete ? 'Name does not match' : undefined}
          />
        </div>
      </Modal>

      <Modal
        open={passwordOpen}
        onClose={() => !isResettingPassword && setPasswordOpen(false)}
        title="Reset Login Password"
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
          <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>
            Leave password blank to auto-generate a secure temporary password.
          </div>

          <Input
            label="New Password"
            value={tempPassword}
            onChange={(e) => setTempPassword(e.target.value)}
            placeholder="Leave blank for auto-generated password"
          />

          {resetResult && (
            <div className="space-y-3">
              <div className="rounded-xl p-3" style={{ backgroundColor: '#ecfdf5', border: '1px solid #bbf7d0' }}>
                <p className="text-sm font-semibold" style={{ color: '#166534' }}>
                  Share these updated login credentials now.
                </p>
              </div>

              <CredentialRow icon={Mail} label="Login Email" value={resetResult.email || teacher.email} onCopy={handleCopy} />
              <CredentialRow icon={KeyRound} label="Temporary Password" value={resetResult.generated_password || tempPassword || 'Custom password set'} onCopy={handleCopy} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default TeacherDetailPage

