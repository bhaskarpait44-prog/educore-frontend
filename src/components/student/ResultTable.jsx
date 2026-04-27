import { formatPercent } from '@/utils/helpers'

const ResultTable = ({ subjects = [] }) => {
  if (!subjects.length) return null

  return (
    <div className="space-y-3">
      <div
        className="hidden overflow-hidden rounded-[28px] border lg:block"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead style={{ backgroundColor: 'var(--color-surface-raised)' }}>
              <tr>
                {['Subject', 'Marks', '%', 'Grade', 'Status'].map((head) => (
                  <th
                    key={head}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr
                  key={subject.subject_id}
                  className="border-t align-top"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: subjectRowTone(subject).soft,
                  }}
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[var(--color-text-primary)]">{subject.subject_name}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      {subjectLabel(subject.subject_type)}
                    </p>
                    {subject.borderline && (
                      <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                        This subject result is at minimum passing marks.
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-[var(--color-text-secondary)]">
                    <SubjectMarks subject={subject} />
                  </td>
                  <td className="px-4 py-4 font-semibold text-[var(--color-text-primary)]">
                    {subject.is_absent ? <span className="text-[var(--color-text-muted)]">ABSENT</span> : formatPercent(subject.percentage || 0, 0)}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={gradeBadgeStyle(subject.grade)}>
                      {subject.grade || '--'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={statusBadgeStyle(subject)}>
                      {statusLabel(subject)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {subjects.map((subject) => (
          <article
            key={subject.subject_id}
            className="rounded-[24px] border p-4"
            style={{
              borderColor: subjectRowTone(subject).border,
              backgroundColor: subjectRowTone(subject).soft,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{subject.subject_name}</h3>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{subjectLabel(subject.subject_type)}</p>
              </div>
              <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={statusBadgeStyle(subject)}>
                {statusLabel(subject)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <DataTile label="Marks" value={<SubjectMarks subject={subject} compact />} />
              <DataTile
                label="Percentage"
                value={subject.is_absent ? 'ABSENT' : formatPercent(subject.percentage || 0, 0)}
              />
              <DataTile label="Grade" value={subject.grade || '--'} tone={gradeBadgeStyle(subject.grade).color} />
              <DataTile label="Result" value={statusLabel(subject)} tone={statusBadgeStyle(subject).color} />
            </div>

            {subject.borderline && (
              <div className="mt-4 rounded-2xl border px-3 py-3 text-xs font-medium text-amber-700 dark:text-amber-300" style={{ borderColor: '#fcd34d', backgroundColor: 'rgba(245,158,11,0.10)' }}>
                This subject result is at minimum passing marks.
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

const DataTile = ({ label, value, tone = 'var(--color-text-primary)' }) => (
  <div className="rounded-2xl border px-3 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'rgba(255,255,255,0.55)' }}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p>
    <div className="mt-2 text-sm font-semibold" style={{ color: tone }}>
      {value}
    </div>
  </div>
)

const SubjectMarks = ({ subject, compact = false }) => {
  if (subject.is_absent) return <span className="font-semibold text-red-600">ABSENT</span>

  if (subject.subject_type === 'both') {
    return (
      <div className="space-y-1">
        <div>Theory: {numberOrDash(subject.theory_marks_obtained)} / {numberOrDash(subject.theory_total_marks)}</div>
        <div>Practical: {numberOrDash(subject.practical_marks_obtained)} / {numberOrDash(subject.practical_total_marks)}</div>
        <div className={compact ? '' : 'font-semibold text-[var(--color-text-primary)]'}>
          Total: {numberOrDash(subject.total_obtained)} / {numberOrDash(subject.combined_total_marks)}
        </div>
      </div>
    )
  }

  if (subject.subject_type === 'practical') {
    return (
      <span>
        Practical: {numberOrDash(subject.total_obtained ?? subject.practical_marks_obtained)} / {numberOrDash(subject.practical_total_marks || subject.combined_total_marks)}
      </span>
    )
  }

  return (
    <span>
      Theory: {numberOrDash(subject.total_obtained ?? subject.marks_obtained)} / {numberOrDash(subject.total_marks || subject.combined_total_marks)}
    </span>
  )
}

function subjectLabel(type) {
  if (type === 'both') return 'Theory + Practical'
  if (type === 'practical') return 'Practical'
  return 'Theory'
}

function numberOrDash(value) {
  return value === null || value === undefined || value === '' ? '--' : Number(value)
}

function statusLabel(subject) {
  if (subject.is_absent || subject.status === 'absent') return 'Absent'
  if (subject.status === 'fail') return 'Fail'
  return 'Pass'
}

function subjectRowTone(subject) {
  if (subject.is_absent || subject.status === 'absent') {
    return { soft: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.22)' }
  }
  if (subject.status === 'fail') {
    return { soft: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.22)' }
  }
  return { soft: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.20)' }
}

function gradeBadgeStyle(grade) {
  if (grade === 'A+') return { backgroundColor: '#14532d', color: '#dcfce7' }
  if (grade === 'A') return { backgroundColor: '#dcfce7', color: '#15803d' }
  if (grade === 'B') return { backgroundColor: '#ccfbf1', color: '#0f766e' }
  if (grade === 'C') return { backgroundColor: '#dbeafe', color: '#1d4ed8' }
  if (grade === 'D') return { backgroundColor: '#fef3c7', color: '#b45309' }
  return { backgroundColor: '#fee2e2', color: '#dc2626' }
}

function statusBadgeStyle(subject) {
  if (subject.is_absent || subject.status === 'absent') {
    return { backgroundColor: '#e5e7eb', color: '#4b5563' }
  }
  if (subject.status === 'fail') {
    return { backgroundColor: '#fee2e2', color: '#dc2626' }
  }
  return { backgroundColor: '#dcfce7', color: '#15803d' }
}

export default ResultTable
