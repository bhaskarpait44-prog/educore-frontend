import { useRef } from 'react'
import { Download, Printer, X } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/helpers'

function openPrintWindow(title, content) {
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return null

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #1f2937; background: #ffffff; }
          .receipt-shell { max-width: 760px; margin: 0 auto; position: relative; }
          .receipt-card { border: 1px solid #d1d5db; padding: 22px; }
          .row { display: flex; justify-content: space-between; gap: 16px; margin: 6px 0; }
          .muted { color: #6b7280; }
          .header { border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 22px; font-weight: 700; }
          .section-title { font-size: 12px; font-weight: 700; margin-bottom: 8px; color: #92400e; text-transform: uppercase; letter-spacing: 0.08em; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; font-size: 12px; text-align: left; }
          th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; }
          .total { font-size: 18px; font-weight: 700; }
          .signature { margin-top: 36px; width: 180px; border-top: 1px solid #111827; padding-top: 6px; font-size: 11px; }
          .watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 78px; color: rgba(220,38,38,0.12); transform: rotate(-20deg); font-weight: 700; pointer-events: none; }
        </style>
      </head>
      <body>${content}</body>
    </html>
  `)
  printWindow.document.close()
  return printWindow
}

export default function ReceiptPrint({ receipt, onClose }) {
  const receiptRef = useRef(null)

  const normalizedReceipt = {
    school_name      : receipt.school_name || 'Greenwood School',
    school_address   : receipt.school_address || '123 Education Road, Delhi',
    school_phone     : receipt.school_phone || '011-12345678',
    receipt_no       : receipt.receipt_no || 'Generated',
    payment_date     : receipt.payment_date,
    payment_mode     : receipt.payment_mode_display || receipt.payment_mode || 'cash',
    transaction_ref  : receipt.transaction_ref || null,
    amount_paid      : Number(receipt.amount_paid ?? receipt.amount ?? 0),
    balance_after    : Number(receipt.balance_after ?? 0),
    student_name     : receipt.student?.name || receipt.student_name || 'Student',
    admission_no     : receipt.student?.admission_no || receipt.admission_no || '—',
    class_name       : receipt.student?.class_name || receipt.class_name || '—',
    section_name     : receipt.student?.section_name || receipt.section_name || '',
    roll_number      : receipt.student?.roll_number || receipt.roll_number || '—',
    received_by_name : receipt.received_by_name || 'Accountant',
    invoices         : receipt.invoices || [],
    is_duplicate     : receipt.is_duplicate || false,
  }

  const handlePrint = () => {
    const content = receiptRef.current?.innerHTML
    if (!content) return
    const printWindow = openPrintWindow(`Receipt ${normalizedReceipt.receipt_no}`, content)
    if (!printWindow) return
    printWindow.focus()
    printWindow.print()
  }

  const handleDownload = () => {
    const content = receiptRef.current?.innerHTML
    if (!content) return
    const win = openPrintWindow(`Receipt ${normalizedReceipt.receipt_no}`, content)
    if (!win) return
    win.focus()
    win.print()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-4xl overflow-hidden rounded-[1.8rem] border shadow-2xl" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Receipt Preview</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Prints cleanly on A4 or A5 without browser headers
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handlePrint} className="rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: '#dd8d1f' }}>
              <Printer size={14} className="mr-2 inline" />
              Print
            </button>
            <button type="button" onClick={handleDownload} className="rounded-xl border px-3 py-2 text-sm font-semibold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
              <Download size={14} className="mr-2 inline" />
              Download PDF
            </button>
            <button type="button" onClick={onClose} className="rounded-xl p-2" style={{ color: 'var(--color-text-muted)' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-[80vh] overflow-y-auto bg-[#f8fafc] p-6">
          <div ref={receiptRef} className="receipt-shell">
            <div className="receipt-card relative bg-white">
              {normalizedReceipt.is_duplicate ? <div className="watermark">DUPLICATE</div> : null}

              <div className="header">
                <div className="title">{normalizedReceipt.school_name}</div>
                <div className="muted" style={{ marginTop: 4 }}>{normalizedReceipt.school_address}</div>
                <div className="muted">{normalizedReceipt.school_phone}</div>
              </div>

              <div className="section-title">Fee Receipt</div>
              <div className="row">
                <span className="muted">Receipt No</span>
                <strong>{normalizedReceipt.receipt_no}</strong>
              </div>
              <div className="row">
                <span className="muted">Date</span>
                <strong>{formatDate(normalizedReceipt.payment_date, 'long')}</strong>
              </div>
              <div className="row">
                <span className="muted">Time</span>
                <strong>{new Date(normalizedReceipt.payment_date || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong>
              </div>

              <div style={{ marginTop: 18 }}>
                <div className="section-title">Student Details</div>
                <div className="row"><span className="muted">Student</span><strong>{normalizedReceipt.student_name}</strong></div>
                <div className="row"><span className="muted">Admission No</span><strong>{normalizedReceipt.admission_no}</strong></div>
                <div className="row"><span className="muted">Class</span><strong>{normalizedReceipt.class_name} {normalizedReceipt.section_name}</strong></div>
                <div className="row"><span className="muted">Roll No</span><strong>{normalizedReceipt.roll_number}</strong></div>
              </div>

              <div style={{ marginTop: 18 }}>
                <div className="section-title">Payment Details</div>
                <table>
                  <thead>
                    <tr>
                      <th>Sr</th>
                      <th>Description</th>
                      <th>Due Date</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {normalizedReceipt.invoices.map((invoice, index) => (
                      <tr key={invoice.id || index}>
                        <td>{index + 1}</td>
                        <td>{invoice.fee_name}</td>
                        <td>{formatDate(invoice.due_date)}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(invoice.balance ?? invoice.amount_due)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="row total">
                <span>Total Paid</span>
                <span>{formatCurrency(normalizedReceipt.amount_paid)}</span>
              </div>
              <div className="row">
                <span className="muted">Mode</span>
                <strong>{String(normalizedReceipt.payment_mode).toUpperCase()}</strong>
              </div>
              <div className="row">
                <span className="muted">Reference</span>
                <strong>{normalizedReceipt.transaction_ref || '—'}</strong>
              </div>
              <div className="row">
                <span className="muted">Balance After</span>
                <strong>{formatCurrency(normalizedReceipt.balance_after)}</strong>
              </div>
              <div className="row">
                <span className="muted">Received by</span>
                <strong>{normalizedReceipt.received_by_name}</strong>
              </div>

              <div className="signature">Authorized Signature</div>

              <div style={{ marginTop: 18, fontSize: 11, color: '#6b7280' }}>
                Thank you for the payment. Please keep this receipt for school fee records.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
