// src/pages/fees/StudentFeePage.jsx
import { useState, useCallback } from 'react'
import { Search, X, AlertCircle, ArrowRightLeft } from 'lucide-react'
import { getStudents } from '@/api/students'
import useFeeStore from '@/store/feeStore'
import useToast from '@/hooks/useToast'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import StatCard from '@/components/ui/StatCard'
import EmptyState from '@/components/ui/EmptyState'
import TableSkeleton from '@/components/ui/TableSkeleton'
import RecordPaymentModal from './RecordPaymentModal'
import CarryForwardModal  from './CarryForwardModal'
import { formatCurrency, formatDate, debounce } from '@/utils/helpers'

const STATUS_CONFIG = {
  pending         : { label: 'Pending',          variant: 'red'   },
  partial         : { label: 'Partial',          variant: 'yellow'},
  paid            : { label: 'Paid',             variant: 'green' },
  carried_forward : { label: 'Carried Forward',  variant: 'blue'  },
  waived          : { label: 'Waived',           variant: 'grey'  },
}

const StudentFeePage = () => {
  const { toastError } = useToast()
  const { studentFees, isLoading, fetchStudentFees, clearStudentFees } = useFeeStore()

  const [search,    setSearch]    = useState('')
  const [results,   setResults]   = useState([])
  const [selected,  setSelected]  = useState(null)
  const [searching, setSearching] = useState(false)
  const [payTarget, setPayTarget] = useState(null)
  const [carryOpen, setCarryOpen] = useState(false)

  const doSearch = useCallback(
    debounce(async (q) => {
      if (!q.trim()) { setResults([]); return }
      setSearching(true)
      try {
        const res  = await getStudents({ search: q, perPage: 8 })
        const data = Array.isArray(res.data) ? res.data : (res.data?.students || [])
        setResults(data)
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 350),
    []
  )

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    doSearch(e.target.value)
  }

  const selectStudent = (student) => {
    setSelected(student)
    setResults([])
    setSearch(`${student.first_name} ${student.last_name}`)
    clearStudentFees()

    const enrollmentId = student.current_enrollment?.id
    if (enrollmentId) {
      fetchStudentFees(enrollmentId).catch(() => toastError('Failed to load fee data'))
    }
  }

  const clearSelection = () => {
    setSearch('')
    setSelected(null)
    clearStudentFees()
    setResults([])
  }

  const invoices = studentFees?.invoices || []
  const summary  = studentFees?.summary  || {}

  // Pending invoices for carry forward
  const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'partial')

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <Search size={18} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search student by name or admission number…"
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: 'var(--color-text-primary)' }}
          />
          {search && (
            <button onClick={clearSelection}>
              <X size={16} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {results.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-2xl shadow-xl z-20 overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            {results.map(s => (
              <button
                key={s.id}
                onClick={() => selectStudent(s)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: 'var(--color-brand)' }}
                >
                  {s.first_name?.[0]}{s.last_name?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {s.first_name} {s.last_name}
                  </p>
                  <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                    {s.admission_no}
                    {s.current_enrollment && ` · ${s.current_enrollment.class}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Student header + carry forward */}
      {selected && (
        <div
          className="flex items-center gap-4 p-4 rounded-2xl"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold shrink-0"
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            {selected.first_name?.[0]}{selected.last_name?.[0]}
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {selected.first_name} {selected.last_name}
            </p>
            <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
              {selected.admission_no}
              {selected.current_enrollment && ` · ${selected.current_enrollment.class} · Section ${selected.current_enrollment.section}`}
            </p>
          </div>

          {pendingInvoices.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={ArrowRightLeft}
              onClick={() => setCarryOpen(true)}
            >
              Carry Forward ({pendingInvoices.length})
            </Button>
          )}
        </div>
      )}

      {/* Summary cards */}
      {selected && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Due"   value={formatCurrency(summary.total_due   || 0)} color="var(--color-text-primary)" />
          <StatCard label="Total Paid"  value={formatCurrency(summary.total_paid  || 0)} color="#16a34a" />
          <StatCard label="Balance"     value={formatCurrency(summary.total_balance || 0)} color={parseFloat(summary.total_balance || 0) > 0 ? '#dc2626' : '#16a34a'} />
          <StatCard label="Pending"     value={summary.pending_count || 0} sub="invoices" color="#d97706" />
        </div>
      )}

      {/* Invoices table */}
      {selected && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {isLoading ? (
            <TableSkeleton cols={6} rows={5} />
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="No invoices found"
              description="No fee invoices have been generated for this student yet."
              className="border-0 rounded-none py-12"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Fee Name', 'Due Date', 'Amount Due', 'Paid', 'Balance', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--color-text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, i) => {
                    const statusCfg = STATUS_CONFIG[inv.status] || { label: inv.status, variant: 'grey' }
                    const balance   = Number(inv.balance ?? inv.balance_remaining ?? 0)
                    const isOverdue = new Date(inv.due_date) < new Date() && inv.status !== 'paid' && inv.status !== 'waived'

                    return (
                      <tr
                        key={inv.id}
                        style={{ borderBottom: i < invoices.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                      >
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {inv.fee_name || inv.fee_type_name || inv.name}
                          </p>
                          {inv.carry_from_invoice_id && (
                            <p className="text-[10px] mt-0.5" style={{ color: '#2563eb' }}>↗ Carried forward</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm" style={{ color: isOverdue ? '#dc2626' : 'var(--color-text-secondary)' }}>
                            {formatDate(inv.due_date)}
                          </p>
                          {isOverdue && (
                            <p className="text-[10px]" style={{ color: '#dc2626' }}>Overdue</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {formatCurrency(inv.amount_due)}
                        </td>
                        <td className="px-4 py-3.5 text-sm" style={{ color: '#16a34a' }}>
                          {formatCurrency(inv.amount_paid || 0)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-semibold" style={{ color: balance > 0 ? '#dc2626' : '#16a34a' }}>
                            {formatCurrency(balance)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          {(inv.status === 'pending' || inv.status === 'partial') && (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => setPayTarget({ ...inv, enrollment_id: selected.current_enrollment?.id })}
                            >
                              Pay
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>

                {/* Totals footer */}
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                    <td colSpan={2} className="px-4 py-3.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      Total
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {formatCurrency(summary.total_due || 0)}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold" style={{ color: '#16a34a' }}>
                      {formatCurrency(summary.total_paid || 0)}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold" style={{ color: Number(summary.total_balance || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                      {formatCurrency(summary.total_balance || 0)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Empty — no student selected */}
      {!selected && (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl text-center"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <Search size={36} className="mb-3" style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Search for a student above
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Their fee invoices and payment status will appear here
          </p>
        </div>
      )}

      {/* Record payment modal */}
      <RecordPaymentModal
        open={!!payTarget}
        invoice={payTarget}
        onClose={() => setPayTarget(null)}
        onSuccess={() => {
          setPayTarget(null)
          if (selected?.current_enrollment?.id) {
            fetchStudentFees(selected.current_enrollment.id)
          }
        }}
      />

      {/* Carry forward modal */}
      <CarryForwardModal
        open={carryOpen}
        onClose={() => setCarryOpen(false)}
        student={selected}
        pendingInvoices={pendingInvoices}
        onSuccess={() => {
          setCarryOpen(false)
          if (selected?.current_enrollment?.id) fetchStudentFees(selected.current_enrollment.id)
        }}
      />
    </div>
  )
}

export default StudentFeePage
