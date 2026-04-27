import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Pencil, Trash2, ShieldCheck,
  ToggleLeft, ToggleRight, KeyRound, ScrollText, X, Upload,
} from 'lucide-react'
import * as api from '@/api/userManagementApi'
import { ROUTES } from '@/constants/app'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { formatDate } from '@/utils/helpers'
import Modal from '@/components/ui/Modal'
import PermissionSelector from '@/components/admin/PermissionSelector'

const ROLE_STYLES = {
  super_admin : { label: 'Super Admin', bg: '#ede9fe', color: '#5b21b6' },
  admin       : { label: 'Admin', bg: '#dbeafe', color: '#1d4ed8' },
  accountant  : { label: 'Accountant', bg: '#fef3c7', color: '#b45309' },
  teacher     : { label: 'Teacher', bg: '#d1fae5', color: '#065f46' },
  student     : { label: 'Student', bg: '#e0e7ff', color: '#3730a3' },
  parent      : { label: 'Parent', bg: '#dcfce7', color: '#15803d' },
  librarian   : { label: 'Librarian', bg: '#fee2e2', color: '#b91c1c' },
  receptionist: { label: 'Receptionist', bg: '#fce7f3', color: '#be185d' },
}

const EMPTY_EDIT_FORM = {
  name: '',
  phone: '',
  employee_id: '',
  department: '',
  designation: '',
  joining_date: '',
  date_of_birth: '',
  gender: '',
  address: '',
  internal_notes: '',
  force_password_change: false,
}

const RoleBadge = ({ role }) => {
  const s = ROLE_STYLES[role] || { label: role, bg: '#f1f5f9', color: '#475569' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

const SourceBadge = ({ sourceType }) => {
  if (sourceType !== 'student_portal') return null
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ backgroundColor: '#eef2ff', color: '#4338ca' }}
    >
      Student Portal
    </span>
  )
}

const Skeleton = () => (
  <div className="animate-pulse divide-y" style={{ borderColor: 'var(--color-border)' }}>
    {[1, 2, 3, 4, 5, 6].map(i => (
      <div key={i} className="flex items-center gap-4 px-5 py-4">
        <div className="w-9 h-9 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          <div className="h-3 w-28 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        </div>
        <div className="h-5 w-20 rounded-full" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        <div className="h-3 w-24 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
      </div>
    ))}
  </div>
)

const inputClassName = 'w-full px-3 py-2.5 rounded-xl text-sm border outline-none bg-transparent'

const baseInputStyle = {
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
}

const formGrid = 'grid gap-4 sm:grid-cols-2'

const normaliseDate = (value) => {
  if (!value) return ''
  return String(value).slice(0, 10)
}

const getUserRecordId = (user) => user?.source_id ?? user?.id ?? null

const UserListPage = () => {
  usePageTitle('User Management')

  const navigate = useNavigate()
  const { toastSuccess, toastError } = useToast()

  const [users, setUsers] = useState([])
  const [roleCounts, setRoleCounts] = useState({})
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, perPage: 20 })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM)
  const [permissionDraft, setPermissionDraft] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [tempPassword, setTempPassword] = useState('')
  const [forcePasswordChange, setForcePasswordChange] = useState(true)
  const [activeModal, setActiveModal] = useState(null)

  const currentPage = pagination.page || 1

  const load = async (params = {}) => {
    const nextPage = params.page || currentPage
    setIsLoading(true)
    try {
      const response = await api.getUsers({
        page: nextPage,
        perPage: pagination.perPage || 20,
        search,
        role: roleFilter,
        status: statusFilter,
      })

      setUsers(response.data?.users || [])
      setRoleCounts(response.data?.roleCounts || {})
      setPagination(response.data?.pagination || { page: 1, totalPages: 1, total: 0, perPage: 20 })
    } catch (e) {
      toastError(e.message || 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPagination(prev => ({ ...prev, page: 1 }))
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    load({ page: 1 })
  }, [search, roleFilter, statusFilter])

  const closeModal = () => {
    setActiveModal(null)
    setSelectedUser(null)
    setPermissionDraft([])
    setAuditLogs([])
    setTempPassword('')
    setForcePasswordChange(true)
    setEditForm(EMPTY_EDIT_FORM)
  }

  const openEditModal = async (user) => {
    const userId = getUserRecordId(user)
    if (!userId) {
      toastError('Unable to identify this user record')
      return
    }
    setIsSaving(true)
    try {
      const response = await api.getUser(userId)
      const fullUser = response.data
      setSelectedUser(fullUser)
      setEditForm({
        name: fullUser.name || '',
        phone: fullUser.phone || '',
        employee_id: fullUser.employee_id || '',
        department: fullUser.department || '',
        designation: fullUser.designation || '',
        joining_date: normaliseDate(fullUser.joining_date),
        date_of_birth: normaliseDate(fullUser.date_of_birth),
        gender: fullUser.gender || '',
        address: fullUser.address || '',
        internal_notes: fullUser.internal_notes || '',
        force_password_change: !!fullUser.force_password_change,
      })
      setActiveModal('edit')
    } catch (e) {
      toastError(e.message || 'Failed to load user details')
    } finally {
      setIsSaving(false)
    }
  }

  const openPermissionsModal = async (user) => {
    const userId = getUserRecordId(user)
    if (!userId) {
      toastError('Unable to identify this user record')
      return
    }
    setIsSaving(true)
    try {
      const response = await api.getUser(userId)
      setSelectedUser(response.data)
      setPermissionDraft(response.data?.permission_names || [])
      setActiveModal('permissions')
    } catch (e) {
      toastError(e.message || 'Failed to load user permissions')
    } finally {
      setIsSaving(false)
    }
  }

  const openAuditModal = async (user) => {
    const userId = getUserRecordId(user)
    if (!userId) {
      toastError('Unable to identify this user record')
      return
    }
    setIsSaving(true)
    try {
      const response = await api.getUserAudit(userId)
      setSelectedUser(user)
      setAuditLogs(response.data?.logs || [])
      setActiveModal('audit')
    } catch (e) {
      toastError(e.message || 'Failed to load audit history')
    } finally {
      setIsSaving(false)
    }
  }

  const openResetModal = (user) => {
    setSelectedUser(user)
    setTempPassword('')
    setForcePasswordChange(true)
    setActiveModal('password')
  }

  const handleToggle = async (user) => {
    const userId = getUserRecordId(user)
    if (!userId) {
      toastError('Unable to identify this user record')
      return
    }
    setIsSaving(true)
    try {
      const response = await api.toggleUserStatus(userId)
      const nextStatus = response.data?.is_active ?? !user.is_active
      setUsers(prev => prev.map((u) => (
        getUserRecordId(u) === userId ? { ...u, is_active: nextStatus } : u
      )))
      toastSuccess(response.message || `User ${nextStatus ? 'activated' : 'deactivated'}`)
    } catch (e) {
      toastError(e.message || 'Failed to update status')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (user) => {
    const userId = getUserRecordId(user)
    if (user.source_type === 'student_portal') {
      toastError('Manage this student from the Students module')
      return
    }
    if (!userId) {
      toastError('Unable to identify this user record')
      return
    }
    if (!window.confirm(`Delete ${user.name}? This will deactivate their account.`)) return

    setIsSaving(true)
    try {
      await api.deleteUser(userId)
      setUsers(prev => prev.filter((u) => getUserRecordId(u) !== userId))
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }))
      setRoleCounts(prev => ({
        ...prev,
        [user.role]: Math.max(0, (prev[user.role] || 0) - 1),
      }))
      toastSuccess('User deleted')
    } catch (e) {
      toastError(e.message || 'Cannot delete user')
    } finally {
      setIsSaving(false)
    }
  }

  const saveEdit = async () => {
    if (!selectedUser) return
    const userId = getUserRecordId(selectedUser)
    if (!userId) {
      toastError('Unable to identify this user record')
      return
    }

    setIsSaving(true)
    try {
      await api.updateUser(userId, editForm)
      setUsers(prev => prev.map(user => (
        getUserRecordId(user) === userId
          ? {
              ...user,
              name: editForm.name,
              phone: editForm.phone,
              employee_id: editForm.employee_id,
              department: editForm.department,
              designation: editForm.designation,
              force_password_change: editForm.force_password_change,
            }
          : user
      )))
      toastSuccess('User updated successfully')
      closeModal()
    } catch (e) {
      toastError(e.message || 'Failed to update user')
    } finally {
      setIsSaving(false)
    }
  }

  const savePermissions = async () => {
    if (!selectedUser) return
    const userId = getUserRecordId(selectedUser)
    if (!userId) {
      toastError('Unable to identify this user record')
      return
    }

    setIsSaving(true)
    try {
      await api.updateUserPermissions(userId, { permission_names: permissionDraft })
      setUsers(prev => prev.map(user => (
        getUserRecordId(user) === userId
          ? { ...user, permission_count: permissionDraft.length }
          : user
      )))
      toastSuccess('Permissions updated successfully')
      closeModal()
    } catch (e) {
      toastError(e.message || 'Failed to update permissions')
    } finally {
      setIsSaving(false)
    }
  }

  const savePasswordReset = async () => {
    if (!selectedUser) return
    const userId = getUserRecordId(selectedUser)
    if (!userId) {
      toastError('Unable to identify this user record')
      return
    }

    setIsSaving(true)
    try {
      const response = await api.resetUserPassword(userId, {
        new_password: tempPassword.trim() || undefined,
        force_change: forcePasswordChange,
      })

      const generatedPassword = response.data?.generated_password
      toastSuccess(
        generatedPassword
          ? `Password reset. Temporary password: ${generatedPassword}`
          : 'Password reset successfully'
      )
      closeModal()
    } catch (e) {
      toastError(e.message || 'Failed to reset password')
    } finally {
      setIsSaving(false)
    }
  }

  const roleChips = useMemo(
    () => Object.entries(ROLE_STYLES).filter(([role]) => Number(roleCounts[role]) > 0),
    [roleCounts]
  )

  const isManagedFromStudents = (user) => user.source_type === 'student_portal'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>User Management</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {pagination.total} user(s) total
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate(ROUTES.USER_IMPORT)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl"
            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          >
            <Upload size={15} />
            Import Users
          </button>
          <button
            onClick={() => navigate(ROUTES.USER_NEW)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl"
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            <Plus size={15} />
            Add New User
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {roleChips.map(([role, s]) => (
          <button
            key={role}
            onClick={() => setRoleFilter(roleFilter === role ? '' : role)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              backgroundColor: roleFilter === role ? `${s.color}20` : 'var(--color-surface)',
              color: roleFilter === role ? s.color : 'var(--color-text-secondary)',
              border: `1px solid ${roleFilter === role ? s.color : 'var(--color-border)'}`,
            }}
          >
            {s.label}: {roleCounts[role]}
          </button>
        ))}
        {(roleFilter || statusFilter || searchInput) && (
          <button
            onClick={() => {
              setSearchInput('')
              setSearch('')
              setRoleFilter('')
              setStatusFilter('')
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
          >
            <X size={11} />
            Clear filters
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-3 flex-1 min-w-56 px-4 py-2.5 rounded-xl" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
          <Search size={16} style={{ color: 'var(--color-text-muted)' }} />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search name or email..."
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: 'var(--color-text-primary)' }}
          />
          {searchInput && (
            <button onClick={() => setSearchInput('')}>
              <X size={14} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm border outline-none"
          style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        {isLoading ? (
          <Skeleton />
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['User', 'Role', 'Status', 'Permissions', 'Last Login', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr
                    key={user.uid || `${user.source_type || 'user'}-${user.source_id ?? user.id ?? i}`}
                    style={{ borderBottom: i < users.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                    className="transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ backgroundColor: ROLE_STYLES[user.role]?.color || 'var(--color-brand)' }}
                        >
                          {user.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{user.name}</p>
                            <SourceBadge sourceType={user.source_type} />
                          </div>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{user.email || user.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><RoleBadge role={user.role} /></td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {isManagedFromStudents(user)
                          ? 'Managed from Students'
                          : ['admin', 'super_admin'].includes(user.role)
                            ? 'All (Admin)'
                            : `${user.permission_count || 0} permissions`}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {user.last_login_at ? formatDate(user.last_login_at) : 'Never'}
                    </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                        <ActionButton
                          title={isManagedFromStudents(user) ? 'Managed from Students module' : 'Edit'}
                          onClick={() => isManagedFromStudents(user) ? toastError('Edit this student from the Students module') : openEditModal(user)}
                          disabled={isSaving}
                        >
                          <Pencil size={13} />
                        </ActionButton>
                        <ActionButton
                          title={isManagedFromStudents(user) ? 'Managed from Students module' : 'Edit permissions'}
                          onClick={() => isManagedFromStudents(user) ? toastError('Manage this student from the Students module') : openPermissionsModal(user)}
                          disabled={isSaving || isManagedFromStudents(user)}
                        >
                          <ShieldCheck size={13} />
                        </ActionButton>
                        <ActionButton
                          title={isManagedFromStudents(user) ? 'Managed from Students module' : 'Reset password'}
                          onClick={() => isManagedFromStudents(user) ? toastError('Reset this student password from the student portal flow') : openResetModal(user)}
                          disabled={isSaving || isManagedFromStudents(user)}
                        >
                          <KeyRound size={13} />
                        </ActionButton>
                        <ActionButton
                          title={isManagedFromStudents(user) ? 'Managed from Students module' : 'View audit'}
                          onClick={() => isManagedFromStudents(user) ? toastError('View this student from the Students module') : openAuditModal(user)}
                          disabled={isSaving || isManagedFromStudents(user)}
                        >
                          <ScrollText size={13} />
                        </ActionButton>
                        <ActionButton
                          title={user.is_active ? 'Deactivate' : 'Activate'}
                          onClick={() => isManagedFromStudents(user) ? toastError('Change this student status from the Students module') : handleToggle(user)}
                          disabled={isSaving || isManagedFromStudents(user)}
                        >
                          {user.is_active ? <ToggleRight size={15} style={{ color: '#16a34a' }} /> : <ToggleLeft size={15} />}
                        </ActionButton>
                        <ActionButton
                          title="Delete"
                          onClick={() => handleDelete(user)}
                          disabled={isSaving}
                          danger
                        >
                          <Trash2 size={13} />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {[...Array(pagination.totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => load({ page: i + 1 })}
              className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: i + 1 === pagination.page ? 'var(--color-brand)' : 'var(--color-surface)',
                color: i + 1 === pagination.page ? '#fff' : 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <Modal
        open={activeModal === 'edit'}
        onClose={closeModal}
        title={selectedUser ? `Edit ${selectedUser.name}` : 'Edit User'}
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2.5 text-sm font-medium rounded-xl border"
              style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveEdit}
              disabled={isSaving}
              className="px-4 py-2.5 text-sm font-medium rounded-xl text-white disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-brand)' }}
            >
              Save Changes
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className={formGrid}>
            <Field label="Full Name">
              <input className={inputClassName} style={baseInputStyle} value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
            </Field>
            <Field label="Phone">
              <input className={inputClassName} style={baseInputStyle} value={editForm.phone} onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))} />
            </Field>
          </div>
          <div className={formGrid}>
            <Field label="Employee / Admission ID">
              <input className={inputClassName} style={baseInputStyle} value={editForm.employee_id} onChange={e => setEditForm(prev => ({ ...prev, employee_id: e.target.value }))} />
            </Field>
            <Field label="Department">
              <input className={inputClassName} style={baseInputStyle} value={editForm.department} onChange={e => setEditForm(prev => ({ ...prev, department: e.target.value }))} />
            </Field>
          </div>
          <div className={formGrid}>
            <Field label="Designation">
              <input className={inputClassName} style={baseInputStyle} value={editForm.designation} onChange={e => setEditForm(prev => ({ ...prev, designation: e.target.value }))} />
            </Field>
            <Field label="Gender">
              <select className={inputClassName} style={baseInputStyle} value={editForm.gender} onChange={e => setEditForm(prev => ({ ...prev, gender: e.target.value }))}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>
          <div className={formGrid}>
            <Field label="Joining Date">
              <input type="date" className={inputClassName} style={baseInputStyle} value={editForm.joining_date} onChange={e => setEditForm(prev => ({ ...prev, joining_date: e.target.value }))} />
            </Field>
            <Field label="Date of Birth">
              <input type="date" className={inputClassName} style={baseInputStyle} value={editForm.date_of_birth} onChange={e => setEditForm(prev => ({ ...prev, date_of_birth: e.target.value }))} />
            </Field>
          </div>
          <Field label="Address">
            <textarea className={`${inputClassName} min-h-24 resize-none`} style={baseInputStyle} value={editForm.address} onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))} />
          </Field>
          <Field label="Internal Notes">
            <textarea className={`${inputClassName} min-h-24 resize-none`} style={baseInputStyle} value={editForm.internal_notes} onChange={e => setEditForm(prev => ({ ...prev, internal_notes: e.target.value }))} />
          </Field>
          <label className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <input
              type="checkbox"
              checked={editForm.force_password_change}
              onChange={e => setEditForm(prev => ({ ...prev, force_password_change: e.target.checked }))}
            />
            Force password change on next login
          </label>
        </div>
      </Modal>

      <Modal
        open={activeModal === 'permissions'}
        onClose={closeModal}
        title={selectedUser ? `Permissions for ${selectedUser.name}` : 'Permissions'}
        size="xl"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2.5 text-sm font-medium rounded-xl border"
              style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={savePermissions}
              disabled={isSaving}
              className="px-4 py-2.5 text-sm font-medium rounded-xl text-white disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-brand)' }}
            >
              Save Permissions
            </button>
          </>
        }
      >
        <PermissionSelector selected={permissionDraft} onChange={setPermissionDraft} />
      </Modal>

      <Modal
        open={activeModal === 'password'}
        onClose={closeModal}
        title={selectedUser ? `Reset Password for ${selectedUser.name}` : 'Reset Password'}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2.5 text-sm font-medium rounded-xl border"
              style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={savePasswordReset}
              disabled={isSaving}
              className="px-4 py-2.5 text-sm font-medium rounded-xl text-white disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-brand)' }}
            >
              Reset Password
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Leave the password blank to auto-generate a temporary password.
          </p>
          <Field label="New Password">
            <input
              type="password"
              className={inputClassName}
              style={baseInputStyle}
              value={tempPassword}
              onChange={e => setTempPassword(e.target.value)}
              placeholder="Leave blank for auto-generated password"
            />
          </Field>
          <label className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <input type="checkbox" checked={forcePasswordChange} onChange={e => setForcePasswordChange(e.target.checked)} />
            Force password change on next login
          </label>
        </div>
      </Modal>

      <Modal
        open={activeModal === 'audit'}
        onClose={closeModal}
        title={selectedUser ? `Audit History for ${selectedUser.name}` : 'Audit History'}
        size="lg"
      >
        {auditLogs.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No audit entries found for this user.</p>
        ) : (
          <div className="space-y-3">
            {auditLogs.map(log => (
              <div
                key={log.id}
                className="p-4 rounded-2xl"
                style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {log.field_name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {formatDate(log.created_at, 'long')}
                  </p>
                </div>
                <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {`${log.old_value || 'Empty'} -> ${log.new_value || 'Empty'}`}
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  Changed by {log.changed_by_name || 'System'}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
      {label}
    </label>
    {children}
  </div>
)

const ActionButton = ({ children, title, onClick, disabled, danger = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
    title={title}
    style={{ color: danger ? '#dc2626' : 'var(--color-text-muted)' }}
    onMouseEnter={e => {
      e.currentTarget.style.backgroundColor = danger ? '#fef2f2' : 'var(--color-surface-raised)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.backgroundColor = 'transparent'
    }}
  >
    {children}
  </button>
)

export default UserListPage
