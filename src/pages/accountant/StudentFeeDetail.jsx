import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, Printer, Wallet } from 'lucide-react'
import useAccountant from '@/hooks/useAccountant'
import usePageTitle from '@/hooks/usePageTitle'
import * as accountantApi from '@/api/accountantApi'
import { ROUTES } from '@/constants/app'
import { formatCurrency, formatDate } from '@/utils/helpers'
import Badge from '@/components/ui/Badge'

function groupInvoices(invoices = []) {
  return {
    overdue : invoices.filter((invoice) => invoice.status === 'pending' && invoice.due_date < new Date().toISOString().split('T')[0]),
    pending : invoices.filter((invoice) => invoice.status === 'pending' && invoice.due_date >= new Date().toISOString().split('T')[0]),
    partial : invoices.filter((invoice) => invoice.status === 'partial'),
    paid    : invoices.filter((invoice) => invoice.status === 'paid'),
    waived  : invoices.filter((invoice) => invoice.status === 'waived'),
  }
}

function statusBadge(status) {
  switch (status) {
    case 'paid': return { label: 'Paid', variant: 'green' }
    case 'partial': return { label: 'Partial', variant: 'yellow' }
    case 'waived': return { label: 'Waived', variant: 'grey' }
    case 'pending': return { label: 'Pending', variant: 'red' }
    default: return { label: status, variant: 'grey' }
  }
}

function SectionCard({ title, subtitle, children, tone = 'var(--color-surface)' }) {
  return (
    <div className="rounded-[1.7rem] border p-5" style={{ backgroundColor: tone, borderColor: 'var(--color-border)' }}>
      <div className="mb-4">
        <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</div>
        {subtitle ? <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</div> : null}
      </div>
      {children}
    </div>
  )
}

export default function StudentFeeDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { fetchStudentFees, studentFeeDetail, isLoading } = useAccountant()
  const [statementInfo, setStatementInfo] = useState(null)
  const [payments, setPayments] = useState([])
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)

  usePageTitle('Student Fee Detail')

  useEffect(() => {
    if (!id) return
    fetchStudentFees(id).catch(() => {})
  }, [fetchStudentFees, id])

  useEffect(() => {
    if (!id) return
    setIsLoadingPayments(true)
    Promise.all([
      accountantApi.getStudentPayments(id),
      accountantApi.getStudentStatement(id),
    ])
      .then(([paymentsRes, statementRes]) => {
        setPayments(paymentsRes.data?.items || [])
        setStatementInfo(statementRes.data || null)
      })
      .finally(() => setIsLoadingPayments(false))
  }, [id])

  const detail = studentFeeDetail || {}
  const student = detail.student || {}
  const invoices = detail.invoices || []
  const summary = detail.summary || {}
  const grouped = useMemo(() => groupInvoices(invoices), [invoices])

  useEffect(() => {
    if (searchParams.get('statement') === '1' && statementInfo) {
      window.print()
    }
  }, [searchParams, statementInfo])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.ACCOUNTANT_STUDENTS)}
            className="mb-3 text-sm font-semibold"
            style={{ color: '#dd8d1f' }}
          >
            <ArrowLeft size={15} className="mr-2 inline" />
            Back to student fees
          </button>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{student.student_name || 'Student Fee Detail'}</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {student.admission_no} · {student.class_name} {student.section_name || ''} · Session {student.session_name || 'Current'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(ROUTES.ACCOUNTANT_COLLECTION)}
            className="rounded-2xl px-4 py-3 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
          >
            <Wallet size={15} className="mr-2 inline" />
            Collect Payment
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-2xl border px-4 py-3 text-sm font-semibold"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <Printer size={15} className="mr-2 inline" />
            Print Statement
          </button>
        </div>
      </div>

      <SectionCard title="Fee Summary" subtitle="Session level fee position for this student">
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
            <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>Total Fee</div>
            <div className="mt-2 text-xl font-bold">{formatCurrency(summary.total_fee || summary.total_due || 0)}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
            <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>Total Paid</div>
            <div className="mt-2 text-xl font-bold" style={{ color: '#15803d' }}>{formatCurrency(summary.total_paid || 0)}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
            <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>Balance</div>
            <div className="mt-2 text-xl font-bold" style={{ color: '#dc2626' }}>{formatCurrency(summary.balance || 0)}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
            <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>Concession</div>
            <div className="mt-2 text-xl font-bold" style={{ color: '#2563eb' }}>{formatCurrency(summary.total_concession || 0)}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
            <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>Late Fee</div>
            <div className="mt-2 text-xl font-bold" style={{ color: '#b45309' }}>{formatCurrency(summary.total_late_fee || 0)}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Invoices" subtitle="Grouped by current payment status">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {[
              { key: 'overdue', title: 'Overdue Invoices', items: grouped.overdue },
              { key: 'pending', title: 'Pending Invoices', items: grouped.pending },
              { key: 'partial', title: 'Partial Invoices', items: grouped.partial },
              { key: 'paid', title: 'Paid Invoices', items: grouped.paid },
              { key: 'waived', title: 'Waived Invoices', items: grouped.waived },
            ].map((group) => (
              group.items.length ? (
                <div key={group.key}>
                  <div className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{group.title}</div>
                  <div className="space-y-3">
                    {group.items.map((invoice) => {
                      const badge = statusBadge(invoice.status)
                      return (
                        <div key={invoice.id} className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{invoice.fee_name}</div>
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                              </div>
                              <div className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                Due {formatDate(invoice.due_date)} · Original {formatCurrency(invoice.amount_due)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">{formatCurrency(invoice.balance || 0)}</div>
                              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                Paid {formatCurrency(invoice.amount_paid || 0)}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs md:grid-cols-4" style={{ color: 'var(--color-text-secondary)' }}>
                            <div>Late fee: {formatCurrency(invoice.late_fee_amount || 0)}</div>
                            <div>Concession: {formatCurrency(invoice.concession_amount || 0)}</div>
                            <div>Paid date: {formatDate(invoice.paid_date)}</div>
                            <div>Reference: {invoice.concession_reference || '—'}</div>
                          </div>
                          {invoice.concession_reason ? (
                            <div className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              Reason: {invoice.concession_reason}
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Payment History" subtitle="All payments recorded for this student">
        {isLoadingPayments ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No payment history found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>
                  {['Date', 'Time', 'Invoice', 'Amount', 'Mode', 'Reference', 'Receipt'].map((heading) => (
                    <th key={heading} className="px-4 py-3">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 text-sm">{formatDate(payment.payment_date)}</td>
                    <td className="px-4 py-3 text-sm">{new Date(payment.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-4 py-3 text-sm">{payment.fee_name}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#15803d' }}>{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-3 text-sm uppercase">{payment.payment_mode_display || payment.payment_mode}</td>
                    <td className="px-4 py-3 text-sm">{payment.transaction_ref || '—'}</td>
                    <td className="px-4 py-3 text-sm font-mono" style={{ color: '#dd8d1f' }}>{payment.receipt_no}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {statementInfo ? (
        <SectionCard title="Statement Export" subtitle="Backend statement payload for printing or download">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-2xl border px-4 py-3 text-sm font-semibold"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              <Printer size={15} className="mr-2 inline" />
              Print Statement
            </button>
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([JSON.stringify(statementInfo, null, 2)], { type: 'application/json;charset=utf-8' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = statementInfo.filename || `student-statement-${id}.json`
                link.click()
                URL.revokeObjectURL(url)
              }}
              className="rounded-2xl border px-4 py-3 text-sm font-semibold"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              <Download size={15} className="mr-2 inline" />
              Download Statement
            </button>
          </div>
        </SectionCard>
      ) : null}
    </div>
  )
}
