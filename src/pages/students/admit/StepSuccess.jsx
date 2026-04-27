// src/pages/students/admit/StepSuccess.jsx
import { CheckCircle2, Copy, Eye, Plus } from 'lucide-react'
import { useState } from 'react'
import Button from '@/components/ui/Button'

const CredentialRow = ({ label, value, onCopy }) => (
  <div
    className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
    style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
  >
    <div className="min-w-0 text-left">
      <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      <p className="text-sm font-semibold break-all" style={{ color: 'var(--color-text-primary)' }}>{value || '--'}</p>
    </div>
    {value && (
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-colors"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
        title={`Copy ${label}`}
      >
        <Copy size={15} />
      </button>
    )}
  </div>
)

const StepSuccess = ({ student, onViewStudent, onAdmitAnother }) => {
  const [copiedField, setCopiedField] = useState('')
  const credentials = student?.login_credentials || {}

  const handleCopy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(label)
      window.setTimeout(() => setCopiedField(''), 1800)
    } catch {
      setCopiedField('')
    }
  }

  return (
    <div
      className="rounded-2xl p-6 sm:p-10 text-center"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ backgroundColor: '#f0fdf4' }}
      >
        <CheckCircle2 size={32} style={{ color: '#16a34a' }} />
      </div>

      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
        Student Admitted!
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
        {student?.first_name} {student?.last_name} has been successfully admitted.
      </p>

      <div className="grid gap-3 max-w-xl mx-auto mb-6">
        {student?.admission_no && (
          <CredentialRow
            label="Admission Number"
            value={student.admission_no}
            onCopy={(value) => handleCopy(value, 'admission')}
          />
        )}
        <CredentialRow
          label="Student Email Login"
          value={credentials.email}
          onCopy={(value) => handleCopy(value, 'email')}
        />
        <CredentialRow
          label="Auto-Generated Password"
          value={credentials.password}
          onCopy={(value) => handleCopy(value, 'password')}
        />
      </div>

      <div
        className="mx-auto mb-8 max-w-xl rounded-xl px-4 py-3 text-left"
        style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.24)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Student can log in using email or admission number.
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Share this password now. It is only shown here after admission.
          {copiedField ? ` ${copiedField} copied.` : ''}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button icon={Eye} onClick={onViewStudent}>View Student Profile</Button>
        <Button variant="secondary" icon={Plus} onClick={onAdmitAnother}>Admit Another</Button>
      </div>
    </div>
  )
}

export default StepSuccess
