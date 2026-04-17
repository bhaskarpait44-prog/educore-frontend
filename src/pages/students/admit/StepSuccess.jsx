// src/pages/students/admit/StepSuccess.jsx
import { CheckCircle2, Eye, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'

const StepSuccess = ({ student, onViewStudent, onAdmitAnother }) => (
  <div
    className="rounded-2xl p-10 text-center"
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

    {student?.admission_no && (
      <div
        className="inline-block px-5 py-2.5 rounded-xl mb-8"
        style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
      >
        <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Admission Number</p>
        <p className="text-lg font-bold font-mono" style={{ color: 'var(--color-brand)' }}>
          {student.admission_no}
        </p>
      </div>
    )}

    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <Button icon={Eye} onClick={onViewStudent}>View Student Profile</Button>
      <Button variant="secondary" icon={Plus} onClick={onAdmitAnother}>Admit Another</Button>
    </div>
  </div>
)

export default StepSuccess