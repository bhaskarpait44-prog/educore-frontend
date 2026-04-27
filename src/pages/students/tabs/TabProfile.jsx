// src/pages/students/tabs/TabProfile.jsx
import { useEffect, useMemo, useState } from 'react'
import { Pencil, Clock } from 'lucide-react'
import { formatDate } from '@/utils/helpers'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import useStudentStore from '@/store/studentStore'
import useToast from '@/hooks/useToast'
import { useForm } from 'react-hook-form'

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown']
  .map(v => ({ value: v, label: v }))

const PROFILE_FIELDS = [
  'address',
  'city',
  'state',
  'pincode',
  'phone',
  'email',
  'father_name',
  'father_phone',
  'mother_name',
  'mother_phone',
  'emergency_contact',
  'blood_group',
  'medical_notes',
]

const InfoRow = ({ label, value }) => (
  <div className="py-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
    <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
    <p className="text-sm" style={{ color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
      {value || '—'}
    </p>
  </div>
)

const TabProfile = ({ student, studentId }) => {
  const [editOpen,     setEditOpen]     = useState(false)
  const [historyOpen,  setHistoryOpen]  = useState(false)
  const { updateProfile, isSaving } = useStudentStore()
  const { toastSuccess, toastError } = useToast()

  const defaultValues = useMemo(
    () => PROFILE_FIELDS.reduce((acc, field) => {
      acc[field] = student?.[field] ?? ''
      return acc
    }, { change_reason: '' }),
    [student]
  )

  const { register, handleSubmit, reset } = useForm({ defaultValues })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const onSave = async (data) => {
    const { change_reason, ...profileData } = data
    const sanitizedProfileData = PROFILE_FIELDS.reduce((acc, field) => {
      acc[field] = profileData[field] ?? ''
      return acc
    }, {})

    const result = await updateProfile(studentId, { ...sanitizedProfileData, change_reason })
    if (result.success) {
      toastSuccess('Profile updated')
      setEditOpen(false)
    } else {
      toastError(result.message || 'Failed to update profile')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Current Profile
          </h3>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Version active since {formatDate(student.valid_from || student.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={Clock} onClick={() => setHistoryOpen(true)}>
            History
          </Button>
          <Button size="sm" icon={Pencil} onClick={() => setEditOpen(true)}>
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Profile grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        <InfoRow label="Class Name"       value={student.current_enrollment?.class} />
        <InfoRow label="Section"          value={student.current_enrollment?.section} />
        <InfoRow label="Address"          value={[student.address, student.city, student.state, student.pincode].filter(Boolean).join(', ')} />
        <InfoRow label="Phone"            value={student.phone} />
        <InfoRow label="Email"            value={student.email} />
        <InfoRow label="Emergency Contact"value={student.emergency_contact} />
        <InfoRow label="Father's Name"    value={student.father_name} />
        <InfoRow label="Father's Phone"   value={student.father_phone} />
        <InfoRow label="Mother's Name"    value={student.mother_name} />
        <InfoRow label="Mother's Phone"   value={student.mother_phone} />
        <InfoRow label="Blood Group"      value={student.blood_group} />
        <InfoRow label="Medical Notes"    value={student.medical_notes} />
      </div>

      {/* Edit profile modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Profile"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSubmit(onSave)} loading={isSaving}>Save Profile</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Textarea label="Address" rows={2} {...register('address')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City"    {...register('city')} />
            <Input label="State"   {...register('state')} />
            <Input label="Pincode" {...register('pincode')} />
            <Input label="Phone"   {...register('phone')} />
          </div>
          <Input label="Email" type="email" {...register('email')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Father Name"  {...register('father_name')} />
            <Input label="Father Phone" {...register('father_phone')} />
            <Input label="Mother Name"  {...register('mother_name')} />
            <Input label="Mother Phone" {...register('mother_phone')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Emergency Contact" {...register('emergency_contact')} />
            <Select label="Blood Group" options={BLOOD_GROUPS} {...register('blood_group')} />
          </div>
          <Textarea label="Medical Notes" rows={2} {...register('medical_notes')} />
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <Textarea
              label="Reason for change"
              placeholder="Why is this profile being updated? (required)"
              rows={2}
              required
              {...register('change_reason')}
            />
          </div>
        </form>
      </Modal>

      {/* Version history modal — simplified */}
      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Profile Version History"
        size="md"
      >
        <div
          className="flex flex-col items-center py-8 text-center"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Clock size={28} className="mb-3 opacity-30" />
          <p className="text-sm">Version history loads from the enrollment history tab.</p>
        </div>
      </Modal>
    </div>
  )
}

export default TabProfile
