// src/pages/audit/AuditDetailModal.jsx
import { ExternalLink, Monitor, MapPin, User, Clock, Database, FileText } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { OldValue, NewValue } from '@/components/ui/ValueDiff'
import { ROUTES } from '@/constants/app'
import { useNavigate } from 'react-router-dom'

const TABLE_ROUTE_MAP = {
  students         : ROUTES.STUDENTS,
  student_profiles : ROUTES.STUDENTS,
  student_results  : ROUTES.STUDENTS,
  enrollments      : ROUTES.ENROLLMENTS,
  sessions         : ROUTES.SESSIONS,
  fee_invoices     : ROUTES.FEES,
  attendance       : ROUTES.ATTENDANCE,
}

const AuditDetailModal = ({ open, log, onClose }) => {
  const navigate = useNavigate()

  if (!log) return null

  const formatTs = (ts) => {
    if (!ts) return '—'
    return new Date(ts).toLocaleString('en-IN', {
      weekday  : 'long',
      day      : '2-digit', month    : 'long', year: 'numeric',
      hour     : '2-digit', minute   : '2-digit', second: '2-digit',
      timeZoneName: 'long',
    })
  }

  const linkedRoute = TABLE_ROUTE_MAP[log.table_name]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Audit Log Detail"
      size="md"
      footer={
        <div className="flex gap-3 w-full">
          <Button variant="secondary" onClick={onClose} className="flex-1">Close</Button>
          {linkedRoute && (
            <Button
              variant="outline"
              icon={ExternalLink}
              onClick={() => { navigate(`${linkedRoute}/${log.record_id}`); onClose() }}
              className="flex-1"
            >
              View Record
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5">

        {/* Who + when */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
        >
          <DetailItem
            icon={Clock}
            label="Timestamp"
            value={formatTs(log.created_at)}
            mono
          />
          <DetailItem
            icon={User}
            label="Changed By"
            value={log.changed_by_name || log.admin_name || `User #${log.changed_by}` || 'System'}
          />
          <DetailItem
            icon={MapPin}
            label="IP Address"
            value={log.ip_address || '—'}
            mono
          />
          <DetailItem
            icon={Monitor}
            label="Device"
            value={log.device_info ? truncateTo(log.device_info, 60) : '—'}
          />
        </div>

        {/* What changed */}
        <div
          className="p-4 rounded-xl space-y-3"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Database size={14} style={{ color: 'var(--color-brand)' }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Change Details
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Table</p>
              <span
                className="text-sm font-mono px-2 py-0.5 rounded"
                style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}
              >
                {log.table_name}
              </span>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Record ID</p>
              <span className="text-sm font-mono font-bold" style={{ color: 'var(--color-text-primary)' }}>
                #{log.record_id}
              </span>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Field Changed</p>
              <span
                className="text-sm font-mono px-2 py-0.5 rounded"
                style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}
              >
                {log.field_name}
              </span>
            </div>
          </div>
        </div>

        {/* Value diff */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
          >
            <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#dc2626' }}>
              Old Value
            </p>
            <p
              className="text-sm font-mono break-all"
              style={{ color: '#991b1b' }}
            >
              {log.old_value || <span className="italic opacity-60">empty</span>}
            </p>
          </div>
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
          >
            <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#16a34a' }}>
              New Value
            </p>
            <p
              className="text-sm font-mono break-all"
              style={{ color: '#14532d' }}
            >
              {log.new_value || <span className="italic opacity-60">empty</span>}
            </p>
          </div>
        </div>

        {/* Reason */}
        {log.reason && (
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} style={{ color: 'var(--color-brand)' }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                Reason Given
              </p>
            </div>
            <p className="text-sm italic" style={{ color: 'var(--color-text-primary)' }}>
              "{log.reason}"
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}

const DetailItem = ({ icon: Icon, label, value, mono }) => (
  <div>
    <div className="flex items-center gap-1.5 mb-0.5">
      <Icon size={12} style={{ color: 'var(--color-text-muted)' }} />
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
    </div>
    <p
      className={`text-sm ${mono ? 'font-mono' : 'font-medium'} break-all`}
      style={{ color: 'var(--color-text-primary)' }}
    >
      {value}
    </p>
  </div>
)

const truncateTo = (str, n) => str?.length > n ? str.slice(0, n) + '…' : str

export default AuditDetailModal