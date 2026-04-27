// src/pages/audit/StudentHistoryTimeline.jsx
// Used inside student detail page — Tab 4 (Audit Log already built in Step 5)
// This is the TIMELINE version for a richer view

import { useEffect, useState } from 'react'
import { Filter, ArrowRight, User, MapPin, Monitor } from 'lucide-react'
import useAuditStore from '@/store/auditStore'
import { OldValue, NewValue } from '@/components/ui/ValueDiff'
import Select from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'
import { ScrollText } from 'lucide-react'

const FIELD_LABELS = {
  first_name    : 'First Name',
  last_name     : 'Last Name',
  date_of_birth : 'Date of Birth',
  gender        : 'Gender',
  admission_no  : 'Admission Number',
  address       : 'Address',
  city          : 'City',
  phone         : 'Phone',
  email         : 'Email',
  blood_group   : 'Blood Group',
  medical_notes : 'Medical Notes',
  result        : 'Result',
  is_promoted   : 'Promotion Status',
}

const StudentHistoryTimeline = ({ studentId, tableName = 'students' }) => {
  const { recordHistory, isLoading, fetchRecordHistory } = useAuditStore()
  const [fieldFilter, setFieldFilter] = useState('')

  useEffect(() => {
    if (studentId) {
      fetchRecordHistory(tableName, studentId).catch(() => {})
    }
  }, [studentId, tableName])

  const fieldOptions = [...new Set(recordHistory.map(l => l.field_name))]
    .map(f => ({ value: f, label: FIELD_LABELS[f] || f }))

  const filtered = fieldFilter
    ? recordHistory.filter(l => l.field_name === fieldFilter)
    : recordHistory

  const formatTs = (ts) => {
    if (!ts) return '—'
    const d = new Date(ts)
    return {
      date : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time : d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }
  }

  if (isLoading) return (
    <div className="space-y-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="w-24 h-12 rounded-xl shrink-0" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          <div className="flex-1 h-20 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Field filter */}
      <div className="flex items-center gap-3">
        <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
        <Select
          value={fieldFilter}
          onChange={e => setFieldFilter(e.target.value)}
          options={fieldOptions}
          placeholder="All fields"
          containerClassName="w-48"
        />
        <p className="text-xs ml-auto" style={{ color: 'var(--color-text-muted)' }}>
          {filtered.length} change{filtered.length !== 1 ? 's' : ''}{fieldFilter ? ' in this field' : ''}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No changes recorded"
          description="Any changes to this student's data will appear here."
          className="border-0 py-10"
        />
      ) : (
        /* Timeline */
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-28 top-0 bottom-0 w-0.5"
            style={{ backgroundColor: 'var(--color-border)' }}
          />

          <div className="space-y-4">
            {filtered.map((log, i) => {
              const ts = formatTs(log.created_at)
              const isLast = i === filtered.length - 1

              return (
                <div key={log.id} className="flex gap-6 relative">
                  {/* Timestamp column */}
                  <div className="w-28 shrink-0 text-right pt-1">
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {ts.date}
                    </p>
                    <p className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      {ts.time}
                    </p>
                  </div>

                  {/* Timeline dot */}
                  <div
                    className="absolute left-28 -translate-x-1/2 mt-1.5 w-3 h-3 rounded-full border-2 z-10"
                    style={{
                      backgroundColor : 'var(--color-surface)',
                      borderColor     : 'var(--color-brand)',
                    }}
                  />

                  {/* Change card */}
                  <div
                    className="flex-1 ml-2 p-4 rounded-xl"
                    style={{
                      backgroundColor : 'var(--color-surface)',
                      border          : '1px solid var(--color-border)',
                    }}
                  >
                    {/* Field badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded"
                        style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}
                      >
                        {FIELD_LABELS[log.field_name] || log.field_name}
                      </span>
                      {log.table_name !== tableName && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}
                        >
                          {log.table_name}
                        </span>
                      )}
                    </div>

                    {/* Value diff */}
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      <OldValue value={log.old_value} />
                      <ArrowRight size={13} style={{ color: '#94a3b8' }} />
                      <NewValue value={log.new_value} />
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-3 pt-2"
                      style={{ borderTop: '1px solid var(--color-border)' }}
                    >
                      {/* Admin */}
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ backgroundColor: 'var(--color-brand)' }}
                        >
                          {(log.changed_by_name || 'S')[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {log.changed_by_name || `User #${log.changed_by}`}
                        </span>
                      </div>

                      {log.ip_address && (
                        <div className="flex items-center gap-1">
                          <MapPin size={11} style={{ color: 'var(--color-text-muted)' }} />
                          <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                            {log.ip_address}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Reason */}
                    {log.reason && (
                      <p
                        className="text-xs italic mt-2 pt-2"
                        style={{
                          borderTop : '1px solid var(--color-border)',
                          color     : 'var(--color-text-secondary)',
                        }}
                      >
                        "{log.reason}"
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentHistoryTimeline