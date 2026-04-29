import { useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useCheques from '@/hooks/useCheques'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency, formatDate } from '@/utils/helpers'

const ChequeManagement = () => {
  usePageTitle('Cheque Management')
  const { cheques } = useCheques()
  const [statusFilter, setStatusFilter] = useState('all')
  const rows = cheques.filter((row) => statusFilter === 'all' ? true : row.status === statusFilter)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Cheque Management</h1>
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border px-4 py-2 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="cleared">Cleared</option>
          <option value="bounced">Bounced</option>
        </select>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-[22px] border p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.cheque_number} • {row.student_name}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.bank_name} • Cheque date {formatDate(row.cheque_date)} • Received {formatDate(row.received_date)}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(row.amount)}</div>
                {row.status === 'pending' && (
                  <>
                    <button type="button" onClick={() => accountantApi.clearCheque(row.id, {}).catch(() => {})} className="rounded-full px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: '#15803d' }}>Clear</button>
                    <button type="button" onClick={() => accountantApi.bounceCheque(row.id, {}).catch(() => {})} className="rounded-full px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: '#b91c1c' }}>Bounce</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChequeManagement
