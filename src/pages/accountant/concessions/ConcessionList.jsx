import usePageTitle from '@/hooks/usePageTitle'
import usePermissions from '@/hooks/usePermissions'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { useEffect, useState } from 'react'
import * as accountantApi from '@/api/accountantApi'

const ConcessionList = () => {
  usePageTitle('Concessions')
  const { can } = usePermissions()
  const [concessions, setConcessions] = useState([])

  useEffect(() => {
    if (!can('fees.waive')) return
    accountantApi.getConcessions().then((response) => setConcessions(response.data?.concessions || [])).catch(() => {})
  }, [can])

  if (!can('fees.waive')) {
    return <LockedView title="Concession Management" />
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Concession List</h1>
      </div>
      <div className="overflow-x-auto rounded-[28px] border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Student', 'Class', 'Fee', 'Original', 'Concession', 'Reason', 'Date'].map((head) => (
                <th key={head} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {concessions.map((row) => (
              <tr key={row.invoice_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.student_name}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{row.class_name}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{row.fee_name}</td>
                <td className="px-4 py-3 text-sm">{formatCurrency(row.original_amount)}</td>
                <td className="px-4 py-3 text-sm font-semibold text-blue-700">{formatCurrency(row.concession_amount)}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{row.concession_reason}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(row.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const LockedView = ({ title }) => (
  <div className="rounded-[28px] border p-8 text-center" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h1>
    <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Contact admin to enable concession management for your account.</p>
  </div>
)

export default ConcessionList
