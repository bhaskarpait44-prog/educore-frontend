import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import usePageTitle from '@/hooks/usePageTitle'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency, formatDate } from '@/utils/helpers'

const StudentFeeDetail = () => {
  usePageTitle('Student Fee Details')
  const { id } = useParams()
  const [data, setData] = useState(null)

  useEffect(() => {
    accountantApi.getStudentFeesDetail(id).then((response) => setData(response.data)).catch(() => {})
  }, [id])

  const summary = data?.summary || {}
  const student = data?.student || {}

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{student.name || 'Student'}</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {student.admission_no} | {student.class_name} {student.section_name ? `Section ${student.section_name}` : ''} | {student.session_name}
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <SummaryCard label="Total Fee" value={formatCurrency(summary.total_fee || 0)} />
          <SummaryCard label="Paid" value={formatCurrency(summary.total_paid || 0)} tone="#15803d" />
          <SummaryCard label="Balance" value={formatCurrency(summary.balance || 0)} tone={Number(summary.balance || 0) > 0 ? '#dc2626' : '#15803d'} />
          <SummaryCard label="Concession" value={formatCurrency(summary.concession || 0)} tone="#2563eb" />
        </div>
      </div>

      <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Invoices</h2>
        <div className="mt-4 space-y-3">
          {(data?.invoices || []).map((invoice) => (
            <div key={invoice.id} className="rounded-[22px] border p-4" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{invoice.fee_name}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Due {formatDate(invoice.due_date)} | Status {invoice.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold" style={{ color: Number(invoice.balance || 0) > 0 ? '#dc2626' : '#15803d' }}>{formatCurrency(invoice.balance)}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Paid {formatCurrency(invoice.amount_paid || 0)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Payment History</h2>
        <div className="mt-4 space-y-3">
          {(data?.payments || []).map((payment) => (
            <div key={payment.id} className="flex items-center justify-between rounded-[22px] border px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{payment.fee_name}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(payment.payment_date)} • {String(payment.payment_mode || '').toUpperCase()} • {payment.receipt_no}</div>
              </div>
              <div className="text-sm font-semibold text-green-700">{formatCurrency(payment.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const SummaryCard = ({ label, value, tone = 'var(--color-text-primary)' }) => (
  <div className="rounded-[22px] border p-4" style={{ borderColor: 'var(--color-border)' }}>
    <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
    <div className="mt-2 text-xl font-bold" style={{ color: tone }}>{value}</div>
  </div>
)

export default StudentFeeDetail
