// src/pages/attendance/RetroactiveHolidayModal.jsx
import { AlertTriangle, CheckCircle2, X } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

const STATUS_COLOR = {
  present  : { label: 'Present',  color: '#16a34a', bg: '#f0fdf4' },
  absent   : { label: 'Absent',   color: '#dc2626', bg: '#fef2f2' },
  late     : { label: 'Late',     color: '#d97706', bg: '#fffbeb' },
  half_day : { label: 'Half Day', color: '#2563eb', bg: '#eff6ff' },
}

const RetroactiveHolidayModal = ({
  open,
  onClose,
  onConfirm,
  date,
  holidayName,
  affectedStudents = [],
  isConfirming = false,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Retroactive Holiday Warning"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isConfirming}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={isConfirming}
            icon={CheckCircle2}
          >
            Yes, Apply Holiday
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Warning banner */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
        >
          <AlertTriangle size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#dc2626' }}>
              Attendance already recorded on this date
            </p>
            <p className="text-sm" style={{ color: '#7f1d1d' }}>
              Declaring <strong>{holidayName}</strong> on <strong>{date}</strong> will
              retroactively change all existing attendance records to <strong>Holiday</strong>.
              This cannot be undone.
            </p>
          </div>
        </div>

        {/* Affected count */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold"
            style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}
          >
            {affectedStudents.length}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {affectedStudents.length} student{affectedStudents.length !== 1 ? 's' : ''} affected
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Their existing records will be overwritten
            </p>
          </div>
        </div>

        {/* Affected list */}
        {affectedStudents.length > 0 && (
          <div
            className="rounded-xl overflow-hidden max-h-60 overflow-y-auto"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <div
              className="sticky top-0 grid grid-cols-3 px-4 py-2 text-xs font-semibold uppercase tracking-wide"
              style={{
                backgroundColor : 'var(--color-surface-raised)',
                borderBottom    : '1px solid var(--color-border)',
                color           : 'var(--color-text-muted)',
              }}
            >
              <span>Student</span>
              <span className="text-center">Current</span>
              <span className="text-center">After</span>
            </div>

            {affectedStudents.map((s, i) => {
              const oldCfg = STATUS_COLOR[s.oldStatus] || { label: s.oldStatus, color: '#64748b', bg: '#f1f5f9' }
              return (
                <div
                  key={i}
                  className="grid grid-cols-3 items-center px-4 py-3"
                  style={{ borderBottom: i < affectedStudents.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                >
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {s.studentName || s.name}
                  </p>

                  {/* Old status */}
                  <div className="flex justify-center">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: oldCfg.bg, color: oldCfg.color }}
                    >
                      {oldCfg.label}
                    </span>
                  </div>

                  {/* New status — always Holiday */}
                  <div className="flex justify-center">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                    >
                      Holiday
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* No existing records case */}
        {affectedStudents.length === 0 && (
          <div
            className="flex items-center gap-3 p-3 rounded-xl text-sm"
            style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}
          >
            <CheckCircle2 size={16} />
            No existing attendance records found for this date. Holiday will be added cleanly.
          </div>
        )}
      </div>
    </Modal>
  )
}

export default RetroactiveHolidayModal