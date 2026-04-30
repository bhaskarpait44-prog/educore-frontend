import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentFees from '@/hooks/useStudentFees'
import { ROUTES } from '@/constants/app'
import { formatCurrency, formatDate } from '@/utils/helpers'

const StudentFeeList = () => {
  usePageTitle('Student Fees')
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { students, isLoading, error } = useStudentFees({ search, sort: 'due' })

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Student Fees</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Search and review student fee positions for the current session.</p>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or admission number"
          className="mt-4 w-full rounded-2xl border px-4 py-3 text-sm"
          style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        />
      </div>

      <div className="overflow-x-auto rounded-[28px] border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Adm No', 'Name', 'Class', 'Due', 'Paid', 'Balance', 'Last Payment', 'Status', 'Actions'].map((head) => (
                <th key={head} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(students || []).map((student) => (
              <tr key={student.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{student.admission_no}</td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{student.student_name}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{student.class_name} {student.section_name ? `- ${student.section_name}` : ''}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(student.total_due)}</td>
                <td className="px-4 py-3 text-sm text-green-700">{formatCurrency(student.total_paid)}</td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: Number(student.balance || 0) > 0 ? '#dc2626' : '#15803d' }}>{formatCurrency(student.balance)}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{student.last_payment_date ? formatDate(student.last_payment_date) : '--'}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: student.fee_status === 'fully_paid' ? '#dcfce7' : '#fef2f2', color: student.fee_status === 'fully_paid' ? '#15803d' : '#b91c1c' }}>
                    {String(student.fee_status || '').replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.ACCOUNTANT_STUDENT_FEES.replace(':id', student.id))}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: 'var(--color-brand)' }}
                  >
                    View Fees
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <div className="px-4 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>}
        {!isLoading && error && <div className="px-4 py-4 text-sm" style={{ color: '#dc2626' }}>{error}</div>}
        {!isLoading && !error && students.length === 0 && (
          <div className="px-4 py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No students found.
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentFeeList
