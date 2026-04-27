// src/pages/students/tabs/TabAuditLog.jsx  (updated)
// Replace the existing file with this — adds the timeline view
import { useEffect, useState } from 'react'
import { ScrollText, List, GitBranch } from 'lucide-react'
import useStudentStore from '@/store/studentStore'
import EmptyState from '@/components/ui/EmptyState'
import { OldValue, NewValue } from '@/components/ui/ValueDiff'
import StudentHistoryTimeline from '@/pages/audit/StudentHistoryTimeline'
import { truncate } from '@/utils/helpers'

const TabAuditLog = ({ studentId }) => {
  const { auditLogs, isLoading, fetchAuditLog } = useStudentStore()
  const [view, setView] = useState('timeline')   // 'timeline' | 'table'

  useEffect(() => {
    fetchAuditLog('students', studentId).catch(() => {})
  }, [studentId])

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          All changes to this student's data
        </p>
        <div
          className="flex p-0.5 rounded-xl gap-0.5"
          style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
        >
          {[
            { key: 'timeline', icon: GitBranch, label: 'Timeline' },
            { key: 'table',    icon: List,       label: 'Table'    },
          ].map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: view === v.key ? 'var(--color-surface)' : 'transparent',
                color          : view === v.key ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                boxShadow      : view === v.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <v.icon size={13} />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline view */}
      {view === 'timeline' && (
        <StudentHistoryTimeline studentId={studentId} tableName="students" />
      )}

      {/* Table view */}
      {view === 'table' && (
        <>
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
              ))}
            </div>
          ) : auditLogs.length === 0 ? (
            <EmptyState icon={ScrollText} title="No audit records"
              description="Changes to this student's identity will appear here."
              className="border-0 py-10"
            />
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <span
                        className="inline-block px-2 py-0.5 rounded-md text-xs font-mono font-semibold mb-1"
                        style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}
                      >
                        {log.field_name}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <OldValue value={log.old_value} />
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>→</span>
                        <NewValue value={log.new_value} />
                      </div>
                    </div>
                    <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  {log.reason && (
                    <p className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>
                      "{log.reason}"
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {log.changed_by_name && (
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        By <strong>{log.changed_by_name}</strong>
                      </p>
                    )}
                    {log.ip_address && (
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        IP: {log.ip_address}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default TabAuditLog