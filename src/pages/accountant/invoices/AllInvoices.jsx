import { useEffect, useState, useMemo } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency, formatDate } from '@/utils/helpers'

const PAGE_SIZE = 20

const STATUS_STYLES = {
  paid:         { bg: '#dcfce7', text: '#15803d', dot: '#22c55e', label: 'Paid' },
  partial:      { bg: '#fef9c3', text: '#a16207', dot: '#eab308', label: 'Partial' },
  unpaid:       { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444', label: 'Unpaid' },
  overdue:      { bg: '#fff1f2', text: '#9f1239', dot: '#f43f5e', label: 'Overdue' },
  cancelled:    { bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8', label: 'Cancelled' },
}

const getStatus = (s) => STATUS_STYLES[s?.toLowerCase()] || { bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8', label: s || '—' }

const StatCard = ({ label, value, accent, sub }) => (
  <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
    <span className="text-xl font-bold leading-tight truncate" style={{ color: accent || 'var(--color-text-primary)' }}>{value}</span>
    {sub && <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{sub}</span>}
  </div>
)

const AllInvoices = () => {
  usePageTitle('All Invoices')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    accountantApi.getInvoices()
      .then((res) => setRows(res.data?.invoices || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return <InvoiceTable title="All Invoices" rows={rows} loading={loading} />
}

export const InvoiceTable = ({ title, rows = [], loading = false }) => {
  const [search, setSearch]           = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatus]     = useState('')
  const [feeFilter, setFeeFilter]     = useState('')
  const [page, setPage]               = useState(1)

  const classes  = useMemo(() => [...new Set(rows.map((r) => r.class_name).filter(Boolean))].sort(), [rows])
  const feeTypes = useMemo(() => [...new Set(rows.map((r) => r.fee_name).filter(Boolean))].sort(), [rows])
  const statuses = useMemo(() => [...new Set(rows.map((r) => r.status).filter(Boolean))].sort(), [rows])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows.filter((r) => {
      if (classFilter  && r.class_name !== classFilter)  return false
      if (statusFilter && r.status     !== statusFilter)  return false
      if (feeFilter    && r.fee_name   !== feeFilter)     return false
      if (q && !r.student_name?.toLowerCase().includes(q) && !String(r.id).includes(q)) return false
      return true
    })
  }, [rows, search, classFilter, statusFilter, feeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page])

  const totalDue   = useMemo(() => filtered.reduce((s, r) => s + Number(r.amount_due  || 0), 0), [filtered])
  const totalPaid  = useMemo(() => filtered.reduce((s, r) => s + Number(r.amount_paid || 0), 0), [filtered])
  const totalBal   = useMemo(() => filtered.reduce((s, r) => s + Number(r.balance     || 0), 0), [filtered])
  const overdueCount = useMemo(() => filtered.filter((r) => r.status?.toLowerCase() === 'overdue').length, [filtered])

  const resetPage = () => setPage(1)
  const clearAll  = () => { setSearch(''); setClassFilter(''); setStatus(''); setFeeFilter(''); setPage(1) }
  const hasFilter = search || classFilter || statusFilter || feeFilter

  const inputStyle = {
    backgroundColor: 'var(--color-bg-input, var(--color-surface-2, #f8fafc))',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-primary)',
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 rounded-[28px] border p-5"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>Fee invoices across all students</p>
        </div>
        <span className="rounded-full px-4 py-2 text-sm font-semibold"
          style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}>
          {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Invoiced"  value={formatCurrency(totalDue)}  />
        <StatCard label="Total Collected" value={formatCurrency(totalPaid)} accent="#15803d" />
        <StatCard label="Outstanding"     value={formatCurrency(totalBal)}  accent={totalBal > 0 ? '#b91c1c' : '#15803d'} />
        <StatCard label="Overdue"         value={overdueCount}              accent={overdueCount > 0 ? '#b91c1c' : undefined} sub="invoices" />
      </div>

      {/* ── Filters ── */}
      <div className="rounded-[24px] border p-4"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex flex-wrap gap-3 items-end">

          {/* Search */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Student name or invoice no..."
                value={search} onChange={(e) => { setSearch(e.target.value); resetPage() }}
                className="w-full rounded-xl pl-9 pr-3 py-2 text-sm border outline-none" style={inputStyle} />
            </div>
          </div>

          {/* Class */}
          <div className="min-w-[130px]">
            <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Class</label>
            <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); resetPage() }}
              className="w-full rounded-xl px-3 py-2 text-sm border outline-none" style={inputStyle}>
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Fee Type */}
          <div className="min-w-[140px]">
            <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Fee Type</label>
            <select value={feeFilter} onChange={(e) => { setFeeFilter(e.target.value); resetPage() }}
              className="w-full rounded-xl px-3 py-2 text-sm border outline-none" style={inputStyle}>
              <option value="">All Types</option>
              {feeTypes.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Status */}
          <div className="min-w-[130px]">
            <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Status</label>
            <select value={statusFilter} onChange={(e) => { setStatus(e.target.value); resetPage() }}
              className="w-full rounded-xl px-3 py-2 text-sm border outline-none" style={inputStyle}>
              <option value="">All Statuses</option>
              {statuses.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>

          {hasFilter && (
            <button type="button" onClick={clearAll}
              className="rounded-xl px-4 py-2 text-sm font-semibold border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-[28px] border"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>

        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                {[80, 120, 80, 100, 80, 70, 70, 70, 60].map((w, j) => (
                  <div key={j} className="h-4 rounded-lg animate-pulse flex-shrink-0"
                    style={{ width: w, backgroundColor: 'var(--color-border)' }} />
                ))}
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg className="w-10 h-10 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>No invoices match your filters</p>
            {hasFilter && (
              <button type="button" onClick={clearAll}
                className="text-sm font-semibold underline underline-offset-2"
                style={{ color: 'var(--color-brand)' }}>Clear filters</button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Invoice', 'Student', 'Class', 'Fee Type', 'Due Date', 'Amount', 'Paid', 'Balance', 'Status'].map((head) => (
                  <th key={head}
                    className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                    style={{ color: 'var(--color-text-muted)' }}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((row, i) => {
                const st  = getStatus(row.status)
                const bal = Number(row.balance || 0)
                return (
                  <tr key={row.id}
                    className="transition-colors hover:bg-orange-50/20"
                    style={{ borderBottom: i < paginated.length - 1 ? '1px solid var(--color-border)' : 'none' }}>

                    {/* Invoice No */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-bold px-2 py-1 rounded-lg"
                        style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}>
                        INV-{row.id}
                      </span>
                    </td>

                    {/* Student */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                          style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}>
                          {(row.student_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold whitespace-nowrap"
                          style={{ color: 'var(--color-text-primary)' }}>
                          {row.student_name}
                        </span>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="px-4 py-3.5 text-sm whitespace-nowrap"
                      style={{ color: 'var(--color-text-secondary)' }}>
                      {row.class_name}
                    </td>

                    {/* Fee Type */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg whitespace-nowrap"
                        style={{ backgroundColor: 'var(--color-surface-2, #f8fafc)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                        {row.fee_name}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3.5 text-sm whitespace-nowrap"
                      style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(row.due_date)}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 text-sm font-semibold whitespace-nowrap"
                      style={{ color: 'var(--color-text-primary)' }}>
                      {formatCurrency(row.amount_due)}
                    </td>

                    {/* Paid */}
                    <td className="px-4 py-3.5 text-sm font-semibold whitespace-nowrap"
                      style={{ color: '#15803d' }}>
                      {formatCurrency(row.amount_paid)}
                    </td>

                    {/* Balance */}
                    <td className="px-4 py-3.5 text-sm font-bold whitespace-nowrap"
                      style={{ color: bal > 0 ? '#b91c1c' : '#15803d' }}>
                      {formatCurrency(bal)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{ backgroundColor: st.bg, color: st.text }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: st.dot }} />
                        {st.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>

            {/* ── Footer / Pagination ── */}
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface-2, #fafaf9)' }}>
                <td colSpan={5} className="px-4 py-3">
                  <span className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-bold whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>
                  {formatCurrency(totalDue)}
                </td>
                <td className="px-4 py-3 text-sm font-bold whitespace-nowrap" style={{ color: '#15803d' }}>
                  {formatCurrency(totalPaid)}
                </td>
                <td className="px-4 py-3 text-sm font-bold whitespace-nowrap" style={{ color: totalBal > 0 ? '#b91c1c' : '#15803d' }}>
                  {formatCurrency(totalBal)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border disabled:opacity-30 transition-colors hover:bg-orange-50"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>‹</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…'); acc.push(p); return acc }, [])
                      .map((p, idx) => p === '…'
                        ? <span key={`e${idx}`} className="w-7 h-7 flex items-center justify-center text-xs" style={{ color: 'var(--color-text-muted)' }}>…</span>
                        : <button key={p} type="button" onClick={() => setPage(p)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors"
                            style={{ borderColor: p === page ? 'var(--color-brand)' : 'var(--color-border)', backgroundColor: p === page ? 'var(--color-brand)' : 'transparent', color: p === page ? '#fff' : 'var(--color-text-primary)' }}>
                            {p}
                          </button>
                      )}
                    <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border disabled:opacity-30 transition-colors hover:bg-orange-50"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>›</button>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}

export default AllInvoices