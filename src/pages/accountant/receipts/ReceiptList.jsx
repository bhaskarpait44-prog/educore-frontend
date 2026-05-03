import { useState, useMemo } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useReceipts from '@/hooks/useReceipts'
import ReceiptPrint from '@/components/accountant/ReceiptPrint'
import Modal from '@/components/ui/Modal'
import { formatCurrency, formatDate } from '@/utils/helpers'

const PAYMENT_MODE_COLORS = {
  cash: { bg: '#dcfce7', text: '#15803d' },
  online: { bg: '#dbeafe', text: '#1d4ed8' },
  cheque: { bg: '#fef9c3', text: '#a16207' },
  card: { bg: '#f3e8ff', text: '#7e22ce' },
  default: { bg: '#f1f5f9', text: '#475569' },
}

const StatCard = ({ label, value, accent }) => (
  <div
    className="rounded-2xl p-4 flex flex-col gap-1"
    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
  >
    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
      {label}
    </span>
    <span className="text-2xl font-bold" style={{ color: accent || 'var(--color-text-primary)' }}>
      {value}
    </span>
  </div>
)

const ReceiptList = () => {
  usePageTitle('Receipts')
  const { receipts = [] } = useReceipts()
  const [selected, setSelected] = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentMode, setPaymentMode] = useState('')

  const classes = useMemo(() => {
    const set = new Set(receipts.map((r) => r.class_name).filter(Boolean))
    return Array.from(set).sort()
  }, [receipts])

  const modes = useMemo(() => {
    const set = new Set(receipts.map((r) => r.payment_mode).filter(Boolean))
    return Array.from(set).sort()
  }, [receipts])

  const filtered = useMemo(() => {
    return receipts.filter((r) => {
      if (dateFrom && r.payment_date < dateFrom) return false
      if (dateTo && r.payment_date > dateTo) return false
      if (selectedClass && r.class_name !== selectedClass) return false
      if (paymentMode && r.payment_mode !== paymentMode) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (
          !r.student_name?.toLowerCase().includes(q) &&
          !r.receipt_no?.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [receipts, dateFrom, dateTo, selectedClass, paymentMode, searchQuery])

  const totalAmount = useMemo(
    () => filtered.reduce((sum, r) => sum + Number(r.amount || 0), 0),
    [filtered]
  )

  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setSelectedClass('')
    setPaymentMode('')
    setSearchQuery('')
  }

  const hasFilters = dateFrom || dateTo || selectedClass || paymentMode || searchQuery

  return (
    <div className="space-y-5">
      {/* Header */}
      <div
        className="rounded-[28px] border p-5 flex items-center justify-between"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Receipts
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Fee payment records
          </p>
        </div>
        <div
          className="text-sm font-semibold px-4 py-2 rounded-full"
          style={{ backgroundColor: 'var(--color-brand-subtle, #fff7ed)', color: 'var(--color-brand)' }}
        >
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Receipts" value={filtered.length} />
        <StatCard label="Total Collected" value={formatCurrency(totalAmount)} accent="#15803d" />
        <StatCard
          label="Cash Receipts"
          value={filtered.filter((r) => r.payment_mode === 'cash').length}
          accent="#a16207"
        />
        <StatCard
          label="Online Receipts"
          value={filtered.filter((r) => r.payment_mode === 'online').length}
          accent="#1d4ed8"
        />
      </div>

      {/* Filters */}
      <div
        className="rounded-[24px] border p-4"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Search
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Student name or receipt no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl pl-9 pr-3 py-2 text-sm border outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--color-bg-input, var(--color-surface-2, #f8fafc))',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
          </div>

          {/* Date From */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm border outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--color-bg-input, var(--color-surface-2, #f8fafc))',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          {/* Date To */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm border outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--color-bg-input, var(--color-surface-2, #f8fafc))',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          {/* Class */}
          <div className="min-w-[130px]">
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm border outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--color-bg-input, var(--color-surface-2, #f8fafc))',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Payment Mode */}
          <div className="min-w-[130px]">
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm border outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--color-bg-input, var(--color-surface-2, #f8fafc))',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="">All Modes</option>
              {modes.map((m) => (
                <option key={m} value={m} className="capitalize">{m}</option>
              ))}
            </select>
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl px-4 py-2 text-sm font-semibold border transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        className="overflow-x-auto rounded-[28px] border"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              No receipts match your filters
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Receipt No', 'Date', 'Student', 'Class', 'Amount', 'Mode', 'Generated By', ''].map((head) => (
                  <th
                    key={head}
                    className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((receipt, i) => {
                const modeStyle =
                  PAYMENT_MODE_COLORS[receipt.payment_mode?.toLowerCase()] ||
                  PAYMENT_MODE_COLORS.default
                return (
                  <tr
                    key={receipt.id}
                    className="transition-colors hover:bg-orange-50/30"
                    style={{
                      borderBottom:
                        i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none',
                    }}
                  >
                    <td className="px-4 py-3.5">
                      <span
                        className="text-xs font-bold tracking-wide px-2 py-1 rounded-lg"
                        style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}
                      >
                        {receipt.receipt_no}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(receipt.payment_date)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {receipt.student_name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {receipt.class_name}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold" style={{ color: '#15803d' }}>
                        {formatCurrency(receipt.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="text-xs font-semibold capitalize px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: modeStyle.bg, color: modeStyle.text }}
                      >
                        {receipt.payment_mode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {receipt.received_by_name || (
                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => setSelected(receipt)}
                        className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80"
                        style={{ backgroundColor: 'var(--color-brand)' }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Footer totals row */}
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface-2, #fafaf9)' }}>
                <td colSpan={4} className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  Total ({filtered.length} receipts)
                </td>
                <td className="px-4 py-3 text-sm font-bold" style={{ color: '#15803d' }}>
                  {formatCurrency(totalAmount)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Receipt Preview">
        <ReceiptPrint receipt={selected} />
      </Modal>
    </div>
  )
}

export default ReceiptList