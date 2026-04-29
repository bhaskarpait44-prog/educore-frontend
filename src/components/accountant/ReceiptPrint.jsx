import { formatCurrency, formatDate } from '@/utils/helpers'

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 py-1.5">
    <span className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
    <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
  </div>
)

const ReceiptPrint = ({ receipt, schoolName = 'EduCore School' }) => {
  if (!receipt) return null

  return (
    <div className="student-report-print-root rounded-[28px] border p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <div className="text-center">
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{schoolName}</h2>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>FEE RECEIPT</p>
      </div>
      <div className="mt-6 space-y-2">
        <Row label="Receipt No" value={receipt.receipt_no || receipt.transaction_ref || '--'} />
        <Row label="Date" value={formatDate(receipt.payment_date || receipt.date, 'long')} />
        <Row label="Student" value={receipt.student_name || receipt.student?.name || '--'} />
        <Row label="Admission No" value={receipt.admission_no || '--'} />
        <Row label="Class" value={[receipt.class_name, receipt.section_name].filter(Boolean).join(' • ') || '--'} />
        <Row label="Fee" value={receipt.fee_name || '--'} />
        <Row label="Amount" value={formatCurrency(receipt.amount || receipt.total_applied || 0)} />
        <Row label="Mode" value={String(receipt.payment_mode || receipt.meta?.payment_mode || '').toUpperCase() || '--'} />
      </div>
    </div>
  )
}

export default ReceiptPrint
