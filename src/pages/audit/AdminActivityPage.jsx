// src/pages/audit/AdminActivityPage.jsx
import { useEffect, useState } from 'react'
import { Activity, BarChart3, Clock } from 'lucide-react'
import useAuditStore from '@/store/auditStore'
import useToast from '@/hooks/useToast'
import Select from '@/components/ui/Select'
import DateRangePicker from '@/components/ui/DateRangePicker'
import StatCard from '@/components/ui/StatCard'
import EmptyState from '@/components/ui/EmptyState'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { OldValue, NewValue } from '@/components/ui/ValueDiff'
import { truncate } from '@/utils/helpers'

const TABLE_LABELS = {
  students         : 'Students',
  student_profiles : 'Profiles',
  student_results  : 'Results',
  enrollments      : 'Enrollments',
  attendance       : 'Attendance',
  fee_invoices     : 'Fees',
  sessions         : 'Sessions',
}

const BAR_COLORS = [
  '#2563eb','#16a34a','#d97706','#dc2626',
  '#7c3aed','#db2777','#0891b2','#65a30d',
]

const AdminActivityPage = () => {
  const { toastError } = useToast()
  const { admins, adminActivity, isLoading, fetchAdmins, fetchAdminActivity } = useAuditStore()

  const [adminId,  setAdminId]  = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate,   setToDate]   = useState('')

  useEffect(() => {
    fetchAdmins().catch(() => {})
  }, [])

  useEffect(() => {
    if (!adminId) return
    fetchAdminActivity(adminId, {
      from  : fromDate || undefined,
      to    : toDate   || undefined,
      limit : 100,
    }).catch(() => toastError('Failed to load admin activity'))
  }, [adminId, fromDate, toDate])

  const logs  = adminActivity?.logs  || (Array.isArray(adminActivity) ? adminActivity : [])
  const total = adminActivity?.total || logs.length
  const admin = admins.find(a => String(a.id) === adminId)

  // Build per-table breakdown
  const byTable = logs.reduce((acc, log) => {
    const t = log.table_name
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})

  const sortedTables = Object.entries(byTable)
    .sort(([,a],[,b]) => b - a)

  const maxCount = Math.max(...Object.values(byTable), 1)

  const formatTs = (ts) => {
    if (!ts) return '—'
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div
        className="flex flex-wrap gap-4 p-4 rounded-2xl"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <Select
          label="Select Admin"
          value={adminId}
          onChange={e => setAdminId(e.target.value)}
          options={(admins || []).map(a => ({ value: String(a.id), label: `${a.name} (${a.role})` }))}
          placeholder="Choose an admin…"
          containerClassName="min-w-56"
        />
        <DateRangePicker
          fromDate={fromDate} toDate={toDate}
          onFromChange={setFromDate}
          onToChange={setToDate}
        />
      </div>

      {/* No admin selected */}
      {!adminId && (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl text-center"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <Activity size={36} className="mb-3" style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Select an admin to view their activity report
          </p>
        </div>
      )}

      {adminId && (
        <>
          {/* Admin header */}
          {admin && (
            <div
              className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                {admin.name[0]}
              </div>
              <div>
                <p className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{admin.name}</p>
                <p className="text-xs capitalize" style={{ color: 'var(--color-text-muted)' }}>
                  {admin.role} · {admin.email}
                </p>
              </div>
              <div
                className="ml-auto px-4 py-2 rounded-xl text-center"
                style={{ backgroundColor: 'var(--color-surface-raised)' }}
              >
                <p className="text-2xl font-bold" style={{ color: 'var(--color-brand)' }}>{total}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>total changes</p>
              </div>
            </div>
          )}

          {/* Per-table bar chart */}
          {sortedTables.length > 0 && (
            <div
              className="p-5 rounded-2xl"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} style={{ color: 'var(--color-brand)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Changes by Table
                </p>
              </div>
              <div className="space-y-3">
                {sortedTables.map(([table, count], i) => (
                  <div key={table} className="flex items-center gap-3">
                    <p className="text-xs w-32 shrink-0 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      {TABLE_LABELS[table] || table}
                    </p>
                    <div className="flex-1 relative h-7 rounded-lg overflow-hidden"
                      style={{ backgroundColor: 'var(--color-surface-raised)' }}
                    >
                      <div
                        className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                        style={{
                          width           : `${(count / maxCount) * 100}%`,
                          backgroundColor : BAR_COLORS[i % BAR_COLORS.length] + '30',
                          borderRight     : `3px solid ${BAR_COLORS[i % BAR_COLORS.length]}`,
                          minWidth        : '40px',
                        }}
                      >
                        <span
                          className="text-xs font-bold"
                          style={{ color: BAR_COLORS[i % BAR_COLORS.length] }}
                        >
                          {count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity timeline / table */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div
              className="flex items-center gap-2 px-5 py-3.5"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <Clock size={14} style={{ color: 'var(--color-brand)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Activity Timeline
              </p>
              <span
                className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}
              >
                {logs.length} records
              </span>
            </div>

            {isLoading ? (
              <TableSkeleton cols={5} rows={6} />
            ) : logs.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No activity found"
                description="No changes recorded for this admin in the selected period."
                className="border-0 py-10 rounded-none"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {['Timestamp','Table','Record','Field','Change','Reason'].map(h => (
                        <th key={h}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
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
                        style={{ borderBottom: i < logs.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                            {formatTs(log.created_at)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}
                          >
                            {TABLE_LABELS[log.table_name] || log.table_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                          #{log.record_id}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-mono px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}
                          >
                            {log.field_name}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <OldValue value={truncate(log.old_value, 15)} />
                            <span style={{ color: '#94a3b8', fontSize: 11 }}>→</span>
                            <NewValue value={truncate(log.new_value, 15)} />
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-40">
                          <p className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
                            {log.reason ? `"${truncate(log.reason, 40)}"` : '—'}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminActivityPage