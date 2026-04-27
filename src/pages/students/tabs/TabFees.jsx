import { useEffect, useMemo, useState } from 'react'
import { Wallet } from 'lucide-react'
import * as feesApi from '@/api/fees'
import useToast from '@/hooks/useToast'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/utils/helpers'

const STATUS_CONFIG = {
  pending: { label: 'Pending', variant: 'red' },
  partial: { label: 'Partial', variant: 'yellow' },
  paid: { label: 'Paid', variant: 'green' },
  carried_forward: { label: 'Carried Forward', variant: 'blue' },
  waived: { label: 'Waived', variant: 'grey' },
}

const SummaryCard = ({ label, value, color = 'var(--color-text-primary)' }) => (
  <div
    className="rounded-xl p-4"
    style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
  >
    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
      {label}
    </p>
    <p className="mt-1 text-xl font-bold" style={{ color }}>
      {value}
    </p>
  </div>
)

const TabFees = ({ enrollmentId }) => {
  const { toastError } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [feeData, setFeeData] = useState(null)

  useEffect(() => {
    if (!enrollmentId) return

    const loadFees = async () => {
      setIsLoading(true)
      try {
        const res = await feesApi.getStudentFees(enrollmentId)
        setFeeData(res.data || { invoices: [], summary: {} })
      } catch (error) {
        setFeeData({ invoices: [], summary: {} })
        toastError(error.message || 'Failed to load fee details')
      } finally {
        setIsLoading(false)
      }
    }

    loadFees()
  }, [enrollmentId, toastError])

  const invoices = feeData?.invoices || []
  const summary = useMemo(() => feeData?.summary || {}, [feeData])

  if (!enrollmentId) {
    return (
      <EmptyState
        icon={Wallet}
        title="No active enrollment found"
        description="Fee details can be shown after the student is enrolled."
        className="border-0 py-10"
      />
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total Due" value={formatCurrency(summary.total_due || 0)} />
        <SummaryCard label="Total Paid" value={formatCurrency(summary.total_paid || 0)} color="#16a34a" />
        <SummaryCard label="Balance" value={formatCurrency(summary.total_balance || 0)} color={Number(summary.total_balance || 0) > 0 ? '#dc2626' : '#16a34a'} />
        <SummaryCard label="Pending Invoices" value={summary.pending_count || 0} color="#d97706" />
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No fee invoices found"
          description="No fee invoices have been generated for this student yet."
          className="border-0 py-10"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Fee Name', 'Due Date', 'Amount Due', 'Paid', 'Balance', 'Status'].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider pr-4" style={{ color: 'var(--color-text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => {
                const statusCfg = STATUS_CONFIG[inv.status] || { label: inv.status, variant: 'grey' }
                return (
                  <tr
                    key={inv.id}
                    style={{ borderBottom: i < invoices.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                  >
                    <td className="py-3.5 pr-4 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {inv.fee_name}
                    </td>
                    <td className="py-3.5 pr-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(inv.due_date)}
                    </td>
                    <td className="py-3.5 pr-4 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {formatCurrency(inv.amount_due)}
                    </td>
                    <td className="py-3.5 pr-4 text-sm" style={{ color: '#16a34a' }}>
                      {formatCurrency(inv.amount_paid || 0)}
                    </td>
                    <td className="py-3.5 pr-4 text-sm font-semibold" style={{ color: Number(inv.balance || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                      {formatCurrency(inv.balance || 0)}
                    </td>
                    <td className="py-3.5 pr-4">
                      <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default TabFees
