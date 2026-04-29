import { useEffect, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import usePermissions from '@/hooks/usePermissions'
import * as accountantApi from '@/api/accountantApi'
import { LockedView } from '@/pages/accountant/concessions/ConcessionList'
import { formatCurrency, formatDate } from '@/utils/helpers'

const RefundList = () => {
  usePageTitle('Refunds')
  const { can } = usePermissions()
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (!can('fees.refund')) return
    accountantApi.getRefunds().then((response) => setRows(response.data?.refunds || [])).catch(() => {})
  }, [can])

  if (!can('fees.refund')) return <LockedView title="Refund Management" />

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Refund List</h1>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between rounded-[22px] border px-4 py-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.student_name}</div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.reason} • {formatDate(row.processed_at)}</div>
            </div>
            <div className="text-sm font-semibold text-red-700">{formatCurrency(row.amount)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RefundList
