import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentProfile from '@/hooks/useStudentProfile'
import useToast from '@/hooks/useToast'
import { formatDate } from '@/utils/helpers'

const fieldOptions = [
  'Name spelling',
  'Date of birth',
  'Gender',
  'Phone number',
  'Address',
  'Parent details',
  'Photo',
  'Other',
]

const CorrectionRequest = () => {
  usePageTitle('Request Correction')

  const { toastError, toastSuccess } = useToast()
  const { profile, correctionRequests, loading, saving, error, submitCorrectionRequest } = useStudentProfile()

  const [fieldName, setFieldName] = useState(fieldOptions[0])
  const [requestedValue, setRequestedValue] = useState('')
  const [reason, setReason] = useState('')
  const [supportingDocumentPath, setSupportingDocumentPath] = useState('')

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const currentValue = useMemo(() => {
    if (!profile) return ''
    const mapping = {
      'Name spelling': profile.full_name,
      'Date of birth': formatDate(profile.date_of_birth, 'long'),
      Gender: profile.gender,
      'Phone number': profile.phone,
      Address: profile.address,
      'Parent details': [profile.father_name, profile.mother_name].filter(Boolean).join(' / '),
      Photo: profile.photo_path || 'Photo on file',
      Other: '',
    }
    return mapping[fieldName] || ''
  }, [fieldName, profile])

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const res = await submitCorrectionRequest({
        field_name: fieldName,
        current_value: currentValue || null,
        requested_value: requestedValue,
        reason,
        supporting_document_path: supportingDocumentPath || null,
      })
      toastSuccess(`Your request has been submitted. Reference #${res?.request?.id || ''}`)
      setRequestedValue('')
      setReason('')
      setSupportingDocumentPath('')
    } catch (err) {
      toastError(err?.message || 'Unable to submit correction request.')
    }
  }

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(109,40,217,0.16), rgba(245,158,11,0.06) 52%, var(--color-surface) 100%)',
        }}
      >
        <h1 className="text-2xl font-bold sm:text-3xl text-[var(--color-text-primary)]">Request Correction</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
          Pick the field, confirm the current value, and explain the correction clearly so the school can review it quickly.
        </p>
      </section>

      <section
        className="rounded-[28px] border p-5"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <select
            value={fieldName}
            onChange={(event) => setFieldName(event.target.value)}
            className="min-h-12 w-full rounded-[20px] border px-4 py-3 text-sm"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            {fieldOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>

          <Field label="Current Value" value={currentValue || 'No current value available'} readOnly />
          <Field label="Correct Value" value={requestedValue} onChange={setRequestedValue} />
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Reason</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={5}
              className="w-full rounded-[20px] border px-4 py-3 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              required
            />
          </label>
          <Field label="Supporting Document Path" value={supportingDocumentPath} onChange={setSupportingDocumentPath} />

          <Button type="submit" loading={saving}>
            Submit Request
          </Button>
        </form>
      </section>

      <section
        className="rounded-[28px] border p-5"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Request Status</h2>
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-24 rounded-[20px] bg-[var(--color-surface-raised)]" />)}
            </div>
          ) : correctionRequests.length ? (
            correctionRequests.map((request) => (
              <div key={request.id} className="rounded-[20px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]" style={statusStyle(request.status)}>
                    {request.status}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">{formatDate(request.created_at, 'long')}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">{request.field_name}</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Requested value: {request.requested_value}</p>
                {request.admin_response && (
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Admin response: {request.admin_response}</p>
                )}
              </div>
            ))
          ) : (
            <EmptyState
              title="No correction requests yet"
              description="Your submitted correction requests will appear here."
            />
          )}
        </div>
      </section>
    </div>
  )
}

const Field = ({ label, value, onChange, readOnly = false }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</span>
    <input
      type="text"
      value={value}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      readOnly={readOnly}
      className="min-h-12 w-full rounded-[20px] border px-4 py-3 text-sm"
      style={{ borderColor: 'var(--color-border)', backgroundColor: readOnly ? 'var(--color-surface-raised)' : 'var(--color-surface)' }}
    />
  </label>
)

function statusStyle(status) {
  if (status === 'approved') return { backgroundColor: '#dcfce7', color: '#15803d' }
  if (status === 'rejected') return { backgroundColor: '#fee2e2', color: '#dc2626' }
  return { backgroundColor: '#fef3c7', color: '#b45309' }
}

export default CorrectionRequest
