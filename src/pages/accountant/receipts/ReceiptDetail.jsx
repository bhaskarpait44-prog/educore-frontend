import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import usePageTitle from '@/hooks/usePageTitle'
import * as accountantApi from '@/api/accountantApi'
import ReceiptPrint from '@/components/accountant/ReceiptPrint'
import { formatCurrency, formatDate } from '@/utils/helpers'

const PAYMENT_MODE_COLORS = {
  cash: { bg: '#dcfce7', text: '#15803d' },
  online: { bg: '#dbeafe', text: '#1d4ed8' },
  cheque: { bg: '#fef9c3', text: '#a16207' },
  card: { bg: '#f3e8ff', text: '#7e22ce' },
  default: { bg: '#f1f5f9', text: '#475569' },
}

const InfoRow = ({ label, value, accent }) => (
  <div className="flex items-start justify-between py-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
      {label}
    </span>
    <span className="text-sm font-semibold text-right" style={{ color: accent || 'var(--color-text-primary)' }}>
      {value || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
    </span>
  </div>
)

const ReceiptDetail = () => {
  usePageTitle('Receipt Detail')
  const { id } = useParams()
  const navigate = useNavigate()
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [printMode, setPrintMode] = useState(false)

  useEffect(() => {
    setLoading(true)
    accountantApi
      .getReceiptById(id)
      .then((response) => setReceipt(response.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handlePrint = () => {
    setPrintMode(true)
    setTimeout(() => {
      window.print()
      setPrintMode(false)
    }, 200)
  }

  const modeStyle = receipt
    ? PAYMENT_MODE_COLORS[receipt.payment_mode?.toLowerCase()] || PAYMENT_MODE_COLORS.default
    : PAYMENT_MODE_COLORS.default

  if (loading) {
    return (
      <div className="space-y-5">
        <div
          className="rounded-[28px] border p-5"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="h-8 w-48 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--color-border)' }} />
        </div>
        <div
          className="rounded-[28px] border p-6 space-y-4"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-5 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--color-border)', width: `${60 + i * 8}%` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div
        className="rounded-[28px] border p-5 flex items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center border transition-colors hover:bg-orange-50"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Receipt Detail
            </h1>
            {receipt && (
              <p className="text-sm mt-0.5 font-semibold" style={{ color: '#c2410c' }}>
                {receipt.receipt_no}
              </p>
            )}
          </div>
        </div>

        {receipt && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition-colors hover:bg-orange-50"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        )}
      </div>

      {receipt ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Summary sidebar */}
          <div className="lg:col-span-2 space-y-4">
            {/* Student card */}
            <div
              className="rounded-[24px] border p-5"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>
                Student
              </p>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}
                >
                  {(receipt.student_name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-base leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                    {receipt.student_name}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {receipt.class_name}
                  </p>
                </div>
              </div>
              <div>
                <InfoRow label="Payment Date" value={formatDate(receipt.payment_date)} />
                <InfoRow label="Generated By" value={receipt.received_by_name} />
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    Mode
                  </span>
                  <span
                    className="text-xs font-bold capitalize px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: modeStyle.bg, color: modeStyle.text }}
                  >
                    {receipt.payment_mode}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount card */}
            <div
              className="rounded-[24px] border p-5"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Total Paid
              </p>
              <p className="text-3xl font-bold" style={{ color: '#15803d' }}>
                {formatCurrency(receipt.amount)}
              </p>
              {receipt.remarks && (
                <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  "{receipt.remarks}"
                </p>
              )}
            </div>
          </div>

          {/* Receipt print view */}
          <div className="lg:col-span-3">
            <div
              className="rounded-[24px] border overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                  Receipt Preview
                </p>
                <span
                  className="text-xs font-bold px-2 py-1 rounded-lg"
                  style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}
                >
                  {receipt.receipt_no}
                </span>
              </div>
              <div className="p-5">
                <ReceiptPrint receipt={receipt} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rounded-[28px] border p-16 flex flex-col items-center justify-center gap-3"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Receipt not found
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-2 text-sm font-semibold rounded-full px-4 py-2 text-white"
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  )
}

export default ReceiptDetail