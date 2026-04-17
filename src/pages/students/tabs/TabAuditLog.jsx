// src/pages/students/tabs/TabAuditLog.jsx
import { useEffect } from 'react'
import { ScrollText, ArrowRight } from 'lucide-react'
import useStudentStore from '@/store/studentStore'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate } from '@/utils/helpers'

const TabAuditLog = ({ studentId }) => {
  const { auditLogs, isLoading, fetchAuditLog } = useStudentStore()

  useEffect(() => {
    fetchAuditLog('students', studentId).catch(() => {})
  }, [studentId])

  if (isLoading) return (
    <div className="space-y-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
      ))}
    </div>
  )

  if (auditLogs.length === 0) return (
    <EmptyState icon={ScrollText} title="No audit records" description="Changes to this student's identity will appear here." className="border-0 py-10" />
  )

  return (
    <div className="space-y-3">
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
                <span
                  className="text-sm line-through"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {log.old_value || '—'}
                </span>
                <ArrowRight size={12} style={{ color: 'var(--color-text-muted)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {log.new_value || '—'}
                </span>
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

          <div className="flex items-center gap-3 mt-2">
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
  )
}

export default TabAuditLog