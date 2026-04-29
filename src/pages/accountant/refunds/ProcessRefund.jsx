import { useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import usePermissions from '@/hooks/usePermissions'
import StudentSearchBox from '@/components/accountant/StudentSearchBox'
import * as accountantApi from '@/api/accountantApi'
import { LockedView } from '@/pages/accountant/concessions/ConcessionList'

const ProcessRefund = () => {
  usePageTitle('Process Refund')
  const { can } = usePermissions()
  const [student, setStudent] = useState(null)
  const [payments, setPayments] = useState([])
  const [form, setForm] = useState({ amount: '', reason: '', refund_method: 'cash', reference_number: '' })

  if (!can('fees.refund')) return <LockedView title="Process Refund" />

  const selectStudent = async (selectedStudent) => {
    setStudent(selectedStudent)
    const response = await accountantApi.getStudentPayments(selectedStudent.id)
    setPayments(response.data?.payments || [])
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Process Refund</h1>
      </div>
      <StudentSearchBox onSelect={selectStudent} />
      {student && (
        <div className="space-y-4 rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <select value={form.payment_id || ''} onChange={(event) => setForm((current) => ({ ...current, payment_id: event.target.value }))} className="w-full rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
            <option value="">Select payment to refund</option>
            {payments.map((payment) => <option key={payment.id} value={payment.id}>{payment.receipt_no} • {payment.fee_name} • {payment.amount}</option>)}
          </select>
          <input value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Refund amount" className="w-full rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
          <input value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Reason" className="w-full rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
          <select value={form.refund_method} onChange={(event) => setForm((current) => ({ ...current, refund_method: event.target.value }))} className="w-full rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
            <option value="cash">Cash</option>
            <option value="online">Online transfer</option>
            <option value="adjustment">Adjustment</option>
          </select>
          <input value={form.reference_number} onChange={(event) => setForm((current) => ({ ...current, reference_number: event.target.value }))} placeholder="Reference number" className="w-full rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
          <button type="button" onClick={() => accountantApi.processRefund({ student_id: student.id, ...form }).catch(() => {})} className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: 'var(--color-brand)' }}>
            Record Refund
          </button>
        </div>
      )}
    </div>
  )
}

export default ProcessRefund
