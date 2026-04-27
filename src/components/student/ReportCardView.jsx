import { formatDate, formatPercent } from '@/utils/helpers'

const ReportCardView = ({ data, examName }) => {
  const school = data?.school || {}
  const student = data?.student || {}
  const marks = data?.marks || []
  const attendance = data?.attendance || {}
  const totals = data?.totals || {}
  const remarks = data?.remarks || {}

  return (
    <article className="student-report-print-root mx-auto w-full max-w-[210mm] rounded-[20px] border bg-white text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.10)] print:max-w-none print:rounded-none print:border-0 print:shadow-none">
      <div className="border-b px-5 py-6 sm:px-8" style={{ borderColor: '#cbd5e1' }}>
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 text-lg font-bold" style={{ borderColor: '#7c3aed', color: '#7c3aed', backgroundColor: '#f5f3ff' }}>
            EC
          </div>
          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-2xl font-bold tracking-wide sm:text-3xl">{school.name || 'EduCore School'}</h1>
            <p className="mt-1 text-sm text-slate-600">{school.address || 'Main Campus'}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Report Card</p>
            <p className="mt-2 text-sm font-medium text-slate-700">Academic Session: {data?.session_name || '--'}</p>
            {examName && <p className="mt-1 text-sm text-slate-600">Exam: {examName}</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-b px-5 py-5 sm:grid-cols-[minmax(0,1fr)_120px] sm:px-8" style={{ borderColor: '#cbd5e1' }}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoRow label="Name" value={student.name} />
          <InfoRow label="Admission No" value={student.admission_no} />
          <InfoRow label="Class" value={student.class_name} />
          <InfoRow label="Section" value={student.section_name} />
          <InfoRow label="Roll No" value={student.roll_number} />
          <InfoRow label="Date of Birth" value={formatDate(student.date_of_birth, 'long')} />
        </div>
        <div className="flex items-center justify-center">
          <div className="flex h-[110px] w-[92px] items-center justify-center border text-center text-[11px] font-medium text-slate-500" style={{ borderColor: '#94a3b8', backgroundColor: '#f8fafc' }}>
            {student.photo_path ? 'Photo on file' : 'Photo'}
          </div>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-8">
        <div className="overflow-hidden rounded-[16px] border" style={{ borderColor: '#cbd5e1' }}>
          <table className="w-full border-collapse text-left text-[12px] sm:text-[13px]">
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>
                {['Sr', 'Subject', 'Max', 'Theory', 'Practical', 'Total', 'Grade', 'Remarks'].map((head) => (
                  <th key={head} className="border-b px-3 py-3 font-semibold uppercase tracking-[0.12em] text-slate-500" style={{ borderColor: '#cbd5e1' }}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {marks.map((row, index) => {
                const theory = row.theory_marks_obtained ?? row.marks_obtained
                const practical = row.practical_marks_obtained
                const total = numberValue(row.marks_obtained) ?? sumValues(row.theory_marks_obtained, row.practical_marks_obtained)
                return (
                  <tr key={`${row.subject_name}-${index}`}>
                    <td className="border-b px-3 py-3 align-top" style={{ borderColor: '#e2e8f0' }}>{index + 1}</td>
                    <td className="border-b px-3 py-3 align-top font-medium" style={{ borderColor: '#e2e8f0' }}>{row.subject_name || '--'}</td>
                    <td className="border-b px-3 py-3 align-top" style={{ borderColor: '#e2e8f0' }}>{numberValue(row.combined_total_marks || row.total_marks) ?? '--'}</td>
                    <td className="border-b px-3 py-3 align-top" style={{ borderColor: '#e2e8f0' }}>{numberValue(theory) ?? '--'}</td>
                    <td className="border-b px-3 py-3 align-top" style={{ borderColor: '#e2e8f0' }}>{numberValue(practical) ?? '--'}</td>
                    <td className="border-b px-3 py-3 align-top font-semibold" style={{ borderColor: '#e2e8f0' }}>{total ?? '--'}</td>
                    <td className="border-b px-3 py-3 align-top font-semibold" style={{ borderColor: '#e2e8f0', color: gradeTone(row.grade) }}>{row.grade || '--'}</td>
                    <td className="border-b px-3 py-3 align-top text-slate-600" style={{ borderColor: '#e2e8f0' }}>
                      {row.grade ? gradeRemark(row.grade) : '--'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot style={{ backgroundColor: '#f8fafc' }}>
              <tr>
                <td colSpan={5} className="px-3 py-3 font-semibold uppercase tracking-[0.12em] text-slate-600">Total / Percentage</td>
                <td className="px-3 py-3 font-bold">{numberValue(totals.obtained) ?? '--'} / {numberValue(totals.maximum) ?? '--'}</td>
                <td className="px-3 py-3 font-bold" colSpan={2}>{formatPercent(totals.percentage || 0, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid gap-4 border-t px-5 py-5 sm:grid-cols-3 sm:px-8" style={{ borderColor: '#cbd5e1' }}>
        <SummaryBlock label="Total Working Days" value={attendance.working_days} />
        <SummaryBlock label="Days Present" value={attendance.present_days} />
        <SummaryBlock label="Attendance %" value={formatPercent(attendance.percentage || 0, 0)} />
      </div>

      <div className="grid gap-4 border-t px-5 py-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:px-8" style={{ borderColor: '#cbd5e1' }}>
        <div className="rounded-[16px] border px-4 py-4" style={{ borderColor: '#cbd5e1', backgroundColor: '#f8fafc' }}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Result</p>
          <p className="mt-2 text-2xl font-bold uppercase" style={{ color: resultTone(data?.result) }}>{data?.result || '--'}</p>
          <p className="mt-2 text-sm text-slate-600">
            {data?.result === 'pass' ? 'Promoted to next class subject to school rules.' : 'Requires academic follow-up.'}
          </p>
        </div>

        <div className="rounded-[16px] border px-4 py-4" style={{ borderColor: '#cbd5e1' }}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Remarks</p>
          <p className="mt-3 min-h-[56px] text-sm leading-6 text-slate-700">{remarks.teacher || 'No remarks provided.'}</p>
          <div className="mt-10 grid grid-cols-2 gap-6">
            <SignatureLine label={remarks.class_teacher_name || 'Class Teacher'} />
            <SignatureLine label="Principal" />
          </div>
        </div>
      </div>
    </article>
  )
}

const InfoRow = ({ label, value }) => (
  <div className="rounded-[14px] border px-3 py-3" style={{ borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-medium text-slate-900">{value || '--'}</p>
  </div>
)

const SummaryBlock = ({ label, value }) => (
  <div className="rounded-[16px] border px-4 py-4 text-center" style={{ borderColor: '#cbd5e1', backgroundColor: '#f8fafc' }}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
    <p className="mt-2 text-xl font-bold text-slate-900">{value || value === 0 ? value : '--'}</p>
  </div>
)

const SignatureLine = ({ label }) => (
  <div className="pt-6 text-center">
    <div className="border-t" style={{ borderColor: '#94a3b8' }} />
    <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
  </div>
)

function numberValue(value) {
  if (value === null || value === undefined || value === '') return null
  return Number(value)
}

function sumValues(a, b) {
  const first = numberValue(a)
  const second = numberValue(b)
  if (first === null && second === null) return null
  return Number((Number(first || 0) + Number(second || 0)).toFixed(2))
}

function gradeTone(grade) {
  if (grade === 'A+') return '#14532d'
  if (grade === 'A') return '#15803d'
  if (grade === 'B') return '#0f766e'
  if (grade === 'C') return '#1d4ed8'
  if (grade === 'D') return '#b45309'
  return '#dc2626'
}

function gradeRemark(grade) {
  if (grade === 'A+' || grade === 'A') return 'Excellent'
  if (grade === 'B') return 'Very Good'
  if (grade === 'C') return 'Good'
  if (grade === 'D') return 'Needs Attention'
  return 'Unsatisfactory'
}

function resultTone(result) {
  if (result === 'pass') return '#15803d'
  return '#dc2626'
}

export default ReportCardView
