import { KeyRound, Mail, UserSquare2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { SectionHeading } from './StepIdentity'

const InfoCard = ({ icon: Icon, label, value, hint }) => (
  <div
    className="rounded-2xl p-4"
    style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
  >
    <div className="flex items-start gap-3">
      <div
        className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--color-brand)' }}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="mt-1 break-all text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {value || '--'}
        </p>
        {hint ? <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{hint}</p> : null}
      </div>
    </div>
  </div>
)

const StepAccess = ({ defaultValues, onBack, onSubmit, isSaving }) => (
  <div className="space-y-4">
    <div
      className="rounded-2xl p-6 space-y-5"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <SectionHeading
        title="Access Details"
        subtitle="Review the student login details before completing admission"
      />

      <div
        className="rounded-2xl p-4"
        style={{ backgroundColor: 'rgba(99, 102, 241, 0.10)', border: '1px solid rgba(99, 102, 241, 0.22)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          The password is auto-generated after admission is completed.
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          You can review the registered email here, then the actual password will appear on the next screen.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <InfoCard
          icon={Mail}
          label="Registered Email"
          value={defaultValues.email}
          hint="Student can sign in using this email."
        />
        <InfoCard
          icon={UserSquare2}
          label="Admission Number"
          value={defaultValues.admission_no}
          hint="Student can also sign in using admission number."
        />
        <InfoCard
          icon={KeyRound}
          label="Password"
          value="Generated automatically after admission"
          hint="Shown once on the completion screen."
        />
      </div>
    </div>

    <div className="flex justify-between">
      <Button variant="secondary" type="button" onClick={onBack}>← Back</Button>
      <Button type="button" onClick={() => onSubmit(defaultValues)} loading={isSaving}>
        Complete Admission
      </Button>
    </div>
  </div>
)

export default StepAccess
