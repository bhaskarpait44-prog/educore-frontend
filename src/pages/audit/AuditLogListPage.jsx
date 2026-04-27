// src/pages/audit/AuditLogListPage.jsx
import { useEffect, useState, useCallback } from 'react'
import { FileSpreadsheet, ChevronLeft, ChevronRight, Eye, Filter, X } from 'lucide-react'
import useAuditStore from '@/store/auditStore'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'
import TableSkeleton from '@/components/ui/TableSkeleton'
import DateRangePicker from '@/components/ui/DateRangePicker'
import { OldValue, NewValue } from '@/components/ui/ValueDiff'
import AuditDetailModal from './AuditDetailModal'
import { formatDate, debounce, truncate } from '@/utils/helpers'
import { ScrollText } from 'lucide-react'

const TABLE_OPTIONS = [
  { value: 'students',         label: 'Students'         },
  { value: 'student_profiles', label: 'Student Profiles' },
  { value: 'student_results',  label: 'Results'          },
  { value: 'enrollments',      label: 'Enrollments'      },
  { value: 'attendance',       label: 'Attendance'       },
  { value: 'fee_invoices',     label: 'Fee Invoices'     },
  { value: 'sessions',         label: 'Sessions'         },
]

const AuditLogListPage = () => {
  const { toastError } = useToast()
  const { logs, pagination, admins, isLoading, fetchLogs, fetchAdmins } = useAuditStore()

  const [fromDate,   setFromDate]   = useState('')
  const [toDate,     setToDate]     = useState('')
  const [adminId,    setAdminId]    = useState('')
  const [tableName,  setTableName]  = useState('')
  const [recordId,   setRecordId]   = useState('')
  const [page,       setPage]       = useState(1)
  const [detail,     setDetail]     = useState(null)

  useEffect(() => {
    fetchAdmins().catch(() => {})
  }, [])

  const buildParams = useCallback(() => ({
    page,
    limit     : 30,
    from      : fromDate   || undefined,
    to        : toDate     || undefined,
    admin_id  : adminId    || undefined,
    table_name: tableName  || undefined,
    record_id : recordId   || undefined,
  }), [page, fromDate, toDate, adminId, tableName, recordId])

  useEffect(() => {
    fetchLogs(buildParams())
      .catch(() => toastError('Failed to load audit logs'))
  }, [page, fromDate, toDate, adminId, tableName, recordId])

  const clearFilters = () => {
    setFromDate(''); setToDate(''); setAdminId('')
    setTableName(''); setRecordId(''); setPage(1)
  }

  const hasFilters = fromDate || toDate || adminId || tableName || recordId

  const handleExport = () => {
    // Build CSV from current logs
    const headers = ['Timestamp','Admin','Table','Record ID','Field','Old Value','New Value','Reason','IP']
    const rows = logs.map(log => [
      new Date(log.created_at).toISOString(),
      log.changed_by_name || log.changed_by || '—',
      log.table_name,
      log.record_id,
      log.field_name,
      log.old_value || '',
      log.new_value || '',
      log.reason    || '',
      log.ip_address|| '',
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(c => `"${String(c).replace(/"/g,'""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTimestamp = (ts) => {
    if (!ts) return '—'
    const d = new Date(ts)
    return d.toLocaleString('en-IN', {
      day    : '2-digit', month  : 'short', year  : 'numeric',
      hour   : '2-digit', minute : '2-digit', second: '2-digit',
      timeZoneName: 'short',
    })
  }

  return (
    <div className="space-y-5">

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div
        className="p-4 rounded-2xl space-y-3"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* Row 1 — date range + export */}
        <div className="flex flex-wrap items-end gap-3">
          <DateRangePicker
            fromDate={fromDate} toDate={toDate}
            onFromChange={v => { setFromDate(v); setPage(1) }}
            onToChange={v   => { setToDate(v);   setPage(1) }}
          />
          <div className="ml-auto flex items-end gap-2">
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-colors"
                style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={13} /> Clear
              </button>
            )}
            <Button variant="secondary" size="sm" icon={FileSpreadsheet} onClick={handleExport}>
              Export CSV
            </Button>
          </div>
        </div>

        {/* Row 2 — dropdowns + record id search */}
        <div className="flex flex-wrap gap-3">
          <Select
            label="Admin"
            value={adminId}
            onChange={e => { setAdminId(e.target.value); setPage(1) }}
            options={(admins || []).map(a => ({ value: String(a.id), label: a.name }))}
            placeholder="All admins"
            containerClassName="flex-1 min-w-36"
          />
          <Select
            label="Table"
            value={tableName}
            onChange={e => { setTableName(e.target.value); setPage(1) }}
            options={TABLE_OPTIONS}
            placeholder="All tables"
            containerClassName="flex-1 min-w-36"
          />
          <div className="flex flex-col gap-1.5 flex-1 min-w-36">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Record ID
            </label>
            <input
              type="number"
              value={recordId}
              onChange={e => { setRecordId(e.target.value); setPage(1) }}
              placeholder="Search by ID…"
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-surface)',
                border         : '1.5px solid var(--color-border)',
                color          : 'var(--color-text-primary)',
              }}
              onFocus={e  => e.target.style.borderColor = 'var(--color-brand)'}
              onBlur={e   => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 pt-1">
            {tableName && (
              <FilterChip label={`Table: ${tableName}`} onRemove={() => setTableName('')} />
            )}
            {adminId && (
              <FilterChip
                label={`Admin: ${admins.find(a => String(a.id) === adminId)?.name || adminId}`}
                onRemove={() => setAdminId('')}
              />
            )}
            {(fromDate || toDate) && (
              <FilterChip
                label={`${fromDate || '…'} to ${toDate || '…'}`}
                onRemove={() => { setFromDate(''); setToDate('') }}
              />
            )}
            {recordId && (
              <FilterChip label={`Record: #${recordId}`} onRemove={() => setRecordId('')} />
            )}
          </div>
        )}
      </div>

      {/* ── Results count ───────────────────────────────────────────── */}
      {!isLoading && (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {pagination.total} record{pagination.total !== 1 ? 's' : ''} found
            {hasFilters && ' (filtered)'}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Page {pagination.page} of {pagination.totalPages}
          </p>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {isLoading ? (
          <TableSkeleton cols={8} rows={6} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No audit logs found"
            description={hasFilters ? 'Try adjusting your filters.' : 'No changes have been recorded yet.'}
            className="border-0 rounded-none py-12"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Timestamp','Admin','Table','Rec ID','Field','Old Value','New Value','Reason',''].map(h => (
                    <th key={h}
                      className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log.id}
                    className="cursor-pointer transition-colors"
                    onClick={() => setDetail(log)}
                    style={{ borderBottom: i < logs.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Timestamp */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatTimestamp(log.created_at)}
                      </p>
                    </td>

                    {/* Admin */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ backgroundColor: 'var(--color-brand)' }}
                        >
                          {(log.changed_by_name || log.admin_name || 'S')[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>
                          {log.changed_by_name || log.admin_name || `User #${log.changed_by}`}
                        </span>
                      </div>
                    </td>

                    {/* Table */}
                    <td className="px-4 py-3.5">
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded"
                        style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-brand)' }}
                      >
                        {log.table_name}
                      </span>
                    </td>

                    {/* Record ID */}
                    <td className="px-4 py-3.5 text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      #{log.record_id}
                    </td>

                    {/* Field */}
                    <td className="px-4 py-3.5">
                      <span
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}
                      >
                        {log.field_name}
                      </span>
                    </td>

                    {/* Old value */}
                    <td className="px-4 py-3.5 max-w-28">
                      <OldValue value={truncate(log.old_value, 20)} />
                    </td>

                    {/* New value */}
                    <td className="px-4 py-3.5 max-w-28">
                      <NewValue value={truncate(log.new_value, 20)} />
                    </td>

                    {/* Reason */}
                    <td className="px-4 py-3.5 max-w-40">
                      <p className="text-xs italic truncate" style={{ color: 'var(--color-text-secondary)' }}>
                        {log.reason ? `"${truncate(log.reason, 35)}"` : '—'}
                      </p>
                    </td>

                    {/* View icon */}
                    <td className="px-4 py-3.5">
                      <Eye size={15} style={{ color: 'var(--color-text-muted)' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary" size="sm" icon={ChevronLeft}
            disabled={pagination.page <= 1}
            onClick={() => setPage(p => p - 1)}
          />
          {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
            const offset = Math.max(0, pagination.page - 4)
            const p = i + 1 + offset
            if (p > pagination.totalPages) return null
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: p === pagination.page ? 'var(--color-brand)' : 'var(--color-surface)',
                  color          : p === pagination.page ? '#fff' : 'var(--color-text-secondary)',
                  border         : '1px solid var(--color-border)',
                }}
              >
                {p}
              </button>
            )
          })}
          <Button
            variant="secondary" size="sm" icon={ChevronRight}
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
          />
        </div>
      )}

      {/* Detail modal */}
      <AuditDetailModal
        open={!!detail}
        log={detail}
        onClose={() => setDetail(null)}
      />
    </div>
  )
}

const FilterChip = ({ label, onRemove }) => (
  <span
    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
    style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
  >
    {label}
    <button onClick={onRemove} className="hover:opacity-70 transition-opacity">
      <X size={11} />
    </button>
  </span>
)

export default AuditLogListPage