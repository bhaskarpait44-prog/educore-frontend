// src/pages/students/tabs/TabIdentity.jsx
import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { formatDate } from '@/utils/helpers'
import EditIdentityModal from '../EditIdentityModal'

const FIELDS = [
  { key: 'first_name',    label: 'First Name',    type: 'text' },
  { key: 'last_name',     label: 'Last Name',     type: 'text' },
  { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
  { key: 'gender',        label: 'Gender',        type: 'select',
    options: ['male', 'female', 'other'] },
  { key: 'admission_no',  label: 'Admission No',  type: 'text' },
]

const TabIdentity = ({ student, studentId }) => {
  const [editField, setEditField] = useState(null)

  return (
    <div className="space-y-2">
      <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
        Click the edit icon to update any field. All changes are permanently logged.
      </p>

      {FIELDS.map(field => (
        <IdentityRow
          key={field.key}
          field={field}
          value={student[field.key]}
          onEdit={() => setEditField(field)}
        />
      ))}

      {/* Edit modal */}
      <EditIdentityModal
        open={!!editField}
        field={editField}
        currentValue={editField ? student[editField.key] : ''}
        studentId={studentId}
        onClose={() => setEditField(null)}
      />
    </div>
  )
}

const IdentityRow = ({ field, value, onEdit }) => {
  const display = field.type === 'date' ? formatDate(value) : (value || '—')

  return (
    <div
      className="flex items-center justify-between px-4 py-3.5 rounded-xl group transition-colors"
      style={{ border: '1px solid var(--color-border)' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div className="flex-1">
        <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
          {field.label}
        </p>
        <p className="text-sm font-medium capitalize" style={{ color: 'var(--color-text-primary)' }}>
          {display}
        </p>
      </div>

      <button
        onClick={onEdit}
        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
        style={{ color: 'var(--color-brand)' }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eff6ff'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        title={`Edit ${field.label}`}
      >
        <Pencil size={14} />
      </button>
    </div>
  )
}

export default TabIdentity