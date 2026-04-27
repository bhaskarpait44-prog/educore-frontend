import { useEffect, useMemo, useRef } from 'react'
import { AlertTriangle, CheckCircle2, Save } from 'lucide-react'
import Button from '@/components/ui/Button'

const MarksEntryTable = ({
  rows = [],
  subject,
  state,
  locked = false,
  reviewStatus = null,
  saving = false,
  lastSavedAt,
  onChange,
  onSaveAll,
  onSubmit,
}) => {
  const inputRefs = useRef({})

  const progress = useMemo(() => {
    const entered = rows.filter((row) => {
      const record = state[row.enrollment_id] || {}
      if (record.is_absent) return true
      if (subject?.subject_type === 'both') {
        return record.theory_marks_obtained !== '' && record.theory_marks_obtained != null &&
          record.practical_marks_obtained !== '' && record.practical_marks_obtained != null
      }
      return record.marks_obtained !== '' && record.marks_obtained != null
    }).length

    return {
      entered,
      total: rows.length,
      remaining: rows.length - entered,
    }
  }, [rows, state, subject])

  const incompleteStudents = useMemo(() => rows.filter((row) => {
    const record = state[row.enrollment_id] || {}
    if (record.is_absent) return false
    if (subject?.subject_type === 'both') {
      return record.theory_marks_obtained === '' || record.theory_marks_obtained == null ||
        record.practical_marks_obtained === '' || record.practical_marks_obtained == null
    }
    return record.marks_obtained === '' || record.marks_obtained == null
  }), [rows, state, subject])

  const borderlineStudents = useMemo(() => rows.filter((row) => {
    const record = state[row.enrollment_id] || {}
    if (record.is_absent) return false
    if (subject?.subject_type === 'both') {
      const theory = Number(record.theory_marks_obtained || 0)
      const practical = Number(record.practical_marks_obtained || 0)
      return theory + practical === Number(subject.combined_passing_marks || 0)
    }
    return Number(record.marks_obtained || 0) === Number(subject?.combined_passing_marks || 0)
  }), [rows, state, subject])

  useEffect(() => {
    const handleSaveShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        onSaveAll()
      }
    }

    window.addEventListener('keydown', handleSaveShortcut)
    return () => window.removeEventListener('keydown', handleSaveShortcut)
  }, [onSaveAll])

  const focusNext = (rowIndex, columnIndex, columns) => {
    const nextColumn = columnIndex + 1 < columns.length ? columnIndex + 1 : 0
    const nextRow = columnIndex + 1 < columns.length ? rowIndex : rowIndex + 1
    const targetKey = `${nextRow}:${columns[nextColumn]}`
    inputRefs.current[targetKey]?.focus()
  }

  const columns = subject?.subject_type === 'both'
    ? ['theory_marks_obtained', 'practical_marks_obtained']
    : ['marks_obtained']

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div
          className="rounded-[28px] border p-5"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Marks entered: {progress.entered} of {progress.total} students
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Remaining: {progress.remaining} | {lastSavedAt ? `Last saved at ${lastSavedAt}` : 'Autosave every 30 seconds'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" icon={Save} loading={saving} onClick={onSaveAll} disabled={locked}>
                Save Now
              </Button>
              <Button onClick={onSubmit} disabled={locked || incompleteStudents.length > 0}>
                Submit for Review
              </Button>
            </div>
          </div>

          <div className="mt-4 h-3 rounded-full" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress.total ? (progress.entered / progress.total) * 100 : 0}%`,
                backgroundColor: '#10b981',
              }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <InsightCard
            title="Incomplete Detection"
            value={String(incompleteStudents.length)}
            tone={incompleteStudents.length ? '#ef4444' : '#10b981'}
            description={incompleteStudents.length ? 'Students still need marks or an absent flag before submit.' : 'All students are ready for review.'}
          />
          <InsightCard
            title="Borderline Students"
            value={String(borderlineStudents.length)}
            tone={borderlineStudents.length ? '#f59e0b' : '#0f766e'}
            description={borderlineStudents.length ? borderlineStudents.map((student) => `${student.first_name} ${student.last_name}`).join(', ') : 'No borderline cases right now.'}
          />
          <InsightCard
            title="Review Status"
            value={reviewStatus?.status === 'completed' ? 'Completed' : 'Pending'}
            tone={reviewStatus?.status === 'completed' ? '#10b981' : '#f59e0b'}
            description={reviewStatus?.label || 'Review not completed'}
          />
          {locked && (
            <InsightCard
              title="Locked"
              value="Submitted"
              tone="#0f766e"
              description="Marks have been submitted for review and are read-only until unlocked."
            />
          )}
        </div>
      </section>

      <section
        className="rounded-[28px] border"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                {[
                  'Roll',
                  'Name',
                  ...(subject?.subject_type === 'both' ? ['Theory', 'Practical', 'Combined'] : [subject?.subject_type === 'practical' ? 'Practical' : 'Marks']),
                  'Grade',
                  'Absent',
                ].map((head) => (
                  <th key={head} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => {
                const record = state[row.enrollment_id] || {}
                const theory = Number(record.theory_marks_obtained || 0)
                const practical = Number(record.practical_marks_obtained || 0)
                const combined = subject?.subject_type === 'both' ? theory + practical : Number(record.marks_obtained || 0)
                const passing = Number(subject?.combined_passing_marks || 0)
                const color = record.is_absent
                  ? '#94a3b8'
                  : combined < passing
                    ? '#ef4444'
                    : combined === passing
                      ? '#f59e0b'
                      : '#10b981'

                return (
                  <tr key={row.enrollment_id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{row.roll_number || '--'}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {row.first_name} {row.last_name}
                    </td>

                    {subject?.subject_type === 'both' ? (
                      <>
                        <td className="px-4 py-3">
                          <MarkInput
                            refKey={`${rowIndex}:theory_marks_obtained`}
                            inputRefs={inputRefs}
                            disabled={locked || record.is_absent}
                            value={record.theory_marks_obtained}
                            max={subject.theory_total_marks}
                            tone={Number(record.theory_marks_obtained || 0) < Number(subject.theory_passing_marks || 0) ? '#ef4444' : '#10b981'}
                            onChange={(value) => onChange(row.enrollment_id, 'theory_marks_obtained', value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === 'Tab') {
                                event.preventDefault()
                                focusNext(rowIndex, 0, columns)
                              }
                            }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <MarkInput
                            refKey={`${rowIndex}:practical_marks_obtained`}
                            inputRefs={inputRefs}
                            disabled={locked || record.is_absent}
                            value={record.practical_marks_obtained}
                            max={subject.practical_total_marks}
                            tone={Number(record.practical_marks_obtained || 0) < Number(subject.practical_passing_marks || 0) ? '#ef4444' : '#10b981'}
                            onChange={(value) => onChange(row.enrollment_id, 'practical_marks_obtained', value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === 'Tab') {
                                event.preventDefault()
                                focusNext(rowIndex, 1, columns)
                              }
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold" style={{ color }}>
                          {record.is_absent ? 'AB' : combined || 0}
                        </td>
                      </>
                    ) : (
                      <td className="px-4 py-3">
                        <MarkInput
                          refKey={`${rowIndex}:marks_obtained`}
                          inputRefs={inputRefs}
                          disabled={locked || record.is_absent}
                          value={record.marks_obtained}
                          max={subject?.combined_total_marks}
                          tone={color}
                          onChange={(value) => onChange(row.enrollment_id, 'marks_obtained', value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === 'Tab') {
                              event.preventDefault()
                              focusNext(rowIndex, 0, columns)
                            }
                          }}
                        />
                      </td>
                    )}

                    <td className="px-4 py-3 text-sm font-semibold" style={{ color }}>
                      {record.is_absent ? 'AB' : combined >= passing ? 'P' : 'F'}
                    </td>
                    <td className="px-4 py-3">
                      <label className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        <input
                          type="checkbox"
                          checked={!!record.is_absent}
                          disabled={locked}
                          onChange={(event) => onChange(row.enrollment_id, 'is_absent', event.target.checked)}
                        />
                        Absent
                      </label>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {incompleteStudents.length > 0 && (
        <div
          className="rounded-[28px] border px-4 py-3"
          style={{ borderColor: '#ef444455', backgroundColor: 'rgba(239, 68, 68, 0.10)' }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} style={{ color: '#ef4444' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Submission blocked until all students are complete
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Missing: {incompleteStudents.map((student) => `${student.first_name} ${student.last_name}`).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const MarkInput = ({ refKey, inputRefs, disabled, value, max, tone, onChange, onKeyDown }) => (
  <input
    ref={(element) => { inputRefs.current[refKey] = element }}
    type="number"
    min="0"
    max={max}
    step="0.5"
    disabled={disabled}
    value={value ?? ''}
    onChange={(event) => onChange(event.target.value)}
    onKeyDown={onKeyDown}
    className="w-24 rounded-xl px-3 py-2 text-sm outline-none"
    style={{
      border: `1.5px solid ${tone}`,
      backgroundColor: disabled ? 'var(--color-surface-raised)' : 'var(--color-surface)',
      color: 'var(--color-text-primary)',
      opacity: disabled ? 0.65 : 1,
    }}
  />
)

const InsightCard = ({ title, value, tone, description }) => (
  <div
    className="rounded-[28px] border p-4"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>{title}</p>
    <div className="mt-2 flex items-center gap-2">
      <CheckCircle2 size={16} style={{ color: tone }} />
      <p className="text-xl font-bold" style={{ color: tone }}>{value}</p>
    </div>
    <p className="mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
  </div>
)

export default MarksEntryTable
