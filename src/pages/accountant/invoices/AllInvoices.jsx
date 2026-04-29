import { useEffect, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency, formatDate } from '@/utils/helpers'

const AllInvoices = () => {
  usePageTitle('All Invoices')
  const [rows, setRows] = useState([])

  useEffect(() => {
    accountantApi.getInvoices().then((response) => setRows(response.data?.invoices || [])).catch(() => {})
  }, [])

  return <InvoiceTable title="All Invoices" rows={rows} />
}

export const InvoiceTable = ({ title, rows }) => (
  <div className="space-y-5">
    <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h1>
    </div>
    <div className="overflow-x-auto rounded-[28px] border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['Invoice', 'Student', 'Class', 'Fee Type', 'Due Date', 'Amount', 'Paid', 'Balance', 'Status'].map((head) => (
              <th key={head} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>INV-{row.id}</td>
              <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.student_name}</td>
              <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{row.class_name}</td>
              <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{row.fee_name}</td>
              <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(row.due_date)}</td>
              <td className="px-4 py-3 text-sm">{formatCurrency(row.amount_due)}</td>
              <td className="px-4 py-3 text-sm text-green-700">{formatCurrency(row.amount_paid)}</td>
              <td className="px-4 py-3 text-sm font-semibold" style={{ color: Number(row.balance || 0) > 0 ? '#dc2626' : '#15803d' }}>{formatCurrency(row.balance)}</td>
              <td className="px-4 py-3 text-sm capitalize" style={{ color: 'var(--color-text-secondary)' }}>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

export default AllInvoices
