import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Printer, Search, Wallet } from 'lucide-react'
import useAccountant from '@/hooks/useAccountant'
import usePageTitle from '@/hooks/usePageTitle'
import { ROUTES } from '@/constants/app'
import { formatCurrency, formatDate } from '@/utils/helpers'
import Badge from '@/components/ui/Badge'

function getStatusMeta(status) {
  switch (status) {
    case 'fully_paid':
      return { label: 'Fully Paid', variant: 'green' }
    case 'pending':
      return { label: 'Pending', variant: 'red' }
    case 'partial':
      return { label: 'Partial', variant: 'yellow' }
    case 'overdue':
      return { label: 'Overdue', variant: 'red' }
    case 'waived':
      return { label: 'Waived', variant: 'grey' }
    default:
      return { label: status || 'Unknown', variant: 'grey' }
  }
}

export default function StudentFeeList() {
  usePageTitle('Student Fees')
  const navigate = useNavigate()
  const { students, isLoading, fetchStudents } = useAccountant()
  const [filters, setFilters] = useState({
    search    : '',
    status    : '',
    class_id  : '',
    section_id: '',
  })
  const [sortBy, setSortBy] = useState('name')

  useEffect(() => {
    const backendFilters = {
      ...filters,
      status:
        filters.status === 'fully_paid' ? 'paid'
          : filters.status === 'overdue' ? 'pending'
            : filters.status,
    }
    fetchStudents(backendFilters).catch(() => {})
  }, [fetchStudents, filters])

  const sortedStudents = useMemo(() => {
    const items = [...students]
    items.sort((a, b) => {
      if (sortBy === 'amount_due') return Number(b.balance || 0) - Number(a.balance || 0)
      if (sortBy === 'last_payment') return new Date(b.last_payment || 0) - new Date(a.last_payment || 0)
      if (sortBy === 'class') return String(a.class_name || '').localeCompare(String(b.class_name || ''))
      return String(a.student_name || a.name || '').localeCompare(String(b.student_name || b.name || ''))
    })
    return items
  }, [sortBy, students])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Student Fees</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Search students, review balances, and jump straight into fee collection.
          </p>
        </div>
      </div>

      <div className="grid gap-4 rounded-[1.7rem] border p-5 lg:grid-cols-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Search</label>
          <div className="flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
            <Search size={16} style={{ color: 'var(--color-text-muted)' }} />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Name or admission number"
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Fee Status</label>
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <option value="">All</option>
            <option value="fully_paid">Fully Paid</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
            <option value="waived">Waived</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Class</label>
          <input
            value={filters.class_id}
            onChange={(event) => setFilters((current) => ({ ...current, class_id: event.target.value }))}
            placeholder="Class ID"
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Sort</label>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <option value="name">By Name</option>
            <option value="amount_due">By Amount Due</option>
            <option value="class">By Class</option>
            <option value="last_payment">By Last Payment</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.7rem] border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>
                {['Adm No', 'Name', 'Class', 'Section', 'Total Due', 'Paid', 'Balance', 'Last Payment', 'Status', 'Actions'].map((heading) => (
                  <th key={heading} className="px-5 py-4">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td colSpan="10" className="px-5 py-5">
                      <div className="h-12 animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
                    </td>
                  </tr>
                ))
              ) : sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-5 py-16 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    No students found for the selected filters.
                  </td>
                </tr>
              ) : sortedStudents.map((student) => {
                const status = getStatusMeta(student.status)
                return (
                  <tr key={student.id} className="border-t transition-colors hover:bg-amber-50/40 dark:hover:bg-white/5" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-5 py-4 text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>{student.admission_no}</td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{student.student_name || student.name}</div>
                    </td>
                    <td className="px-5 py-4 text-sm">{student.class_name}</td>
                    <td className="px-5 py-4 text-sm">{student.section_name || '—'}</td>
                    <td className="px-5 py-4 text-sm font-semibold">{formatCurrency(student.total_due || 0)}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: '#15803d' }}>{formatCurrency(student.paid || 0)}</td>
                    <td className="px-5 py-4 text-sm font-semibold" style={{ color: Number(student.balance || 0) > 0 ? '#dc2626' : '#15803d' }}>
                      {formatCurrency(student.balance || 0)}
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(student.last_payment)}</td>
                    <td className="px-5 py-4"><Badge variant={status.variant}>{status.label}</Badge></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/accountant/students/${student.id}/fees`)}
                          className="rounded-xl p-2"
                          style={{ backgroundColor: 'rgba(37,99,235,0.08)', color: '#2563eb' }}
                          title="View fees"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(ROUTES.ACCOUNTANT_COLLECTION)}
                          className="rounded-xl p-2"
                          style={{ backgroundColor: 'rgba(221,141,31,0.12)', color: '#dd8d1f' }}
                          title="Collect payment"
                        >
                          <Wallet size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/accountant/students/${student.id}/fees?statement=1`)}
                          className="rounded-xl p-2"
                          style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#059669' }}
                          title="Print statement"
                        >
                          <Printer size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
