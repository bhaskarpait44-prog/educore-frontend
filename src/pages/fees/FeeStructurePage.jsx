// src/pages/fees/FeeStructurePage.jsx
import { useState, useEffect } from 'react'
import { Plus, Trash2, Settings2 } from 'lucide-react'
import useFeeStore from '@/store/feeStore'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import TableSkeleton from '@/components/ui/TableSkeleton'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import AddFeeComponentModal from './AddFeeComponentModal'
import { formatCurrency } from '@/utils/helpers'
import { getClasses, getClassOptions } from '@/api/classApi'

const FREQUENCY_BADGE = {
  monthly    : { label: 'Monthly',    variant: 'blue'  },
  quarterly  : { label: 'Quarterly',  variant: 'green' },
  annual     : { label: 'Annual',     variant: 'yellow'},
  one_time   : { label: 'One Time',   variant: 'grey'  },
}

const FeeStructurePage = () => {
  const { toastSuccess, toastError } = useToast()
  const { structures, isLoading, isSaving, fetchStructures, deleteStructure } = useFeeStore()
  const { sessions, currentSession, fetchSessions } = useSessionStore()

  const [classes,      setClasses]      = useState([])
  const [sessionId,    setSessionId]    = useState('')
  const [classId,      setClassId]      = useState('')
  const [addModal,     setAddModal]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    fetchSessions().catch(() => {})
    getClasses()
      .then(r => setClasses(getClassOptions(r)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (currentSession && !sessionId) setSessionId(String(currentSession.id))
  }, [currentSession])

  useEffect(() => {
    if (!sessionId) return
    fetchStructures({ session_id: sessionId, class_id: classId || undefined })
      .catch(() => toastError('Failed to load fee structures'))
  }, [sessionId, classId])

  const handleDelete = async () => {
    const result = await deleteStructure(deleteTarget.id)
    setDeleteTarget(null)
    if (result.success) toastSuccess('Fee component removed')
    else toastError(result.message || 'Failed to delete')
  }

  return (
    <div className="space-y-5">
      {/* Filters + actions */}
      <div
        className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <Select
          label="Session"
          value={sessionId}
          onChange={e => setSessionId(e.target.value)}
          options={(sessions || []).map(s => ({ value: String(s.id), label: s.name }))}
          containerClassName="flex-1"
        />
        <Select
          label="Class"
          value={classId}
          onChange={e => setClassId(e.target.value)}
          options={classes}
          placeholder="All classes"
          containerClassName="flex-1"
        />
        <div className="flex items-end gap-2">
          <Button icon={Plus} onClick={() => setAddModal(true)}>
            Add Component
          </Button>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {isLoading ? (
          <TableSkeleton cols={5} rows={4} />
        ) : structures.length === 0 ? (
          <EmptyState
            icon={Settings2}
            title="No fee components"
            description="Add fee components to define what students are charged this session."
            action={<Button icon={Plus} onClick={() => setAddModal(true)}>Add Component</Button>}
            className="border-0 rounded-none"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Fee Name', 'Amount', 'Frequency', 'Due Day', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--color-text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {structures.map((fee, i) => {
                  const freqCfg = FREQUENCY_BADGE[fee.frequency] || { label: fee.frequency, variant: 'grey' }
                  return (
                    <tr
                      key={fee.id}
                      style={{ borderBottom: i < structures.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {fee.name}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold" style={{ color: 'var(--color-brand)' }}>
                          {formatCurrency(fee.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={freqCfg.variant}>{freqCfg.label}</Badge>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {fee.due_day}
                        {fee.due_day % 100 >= 11 && fee.due_day % 100 <= 13
                          ? 'th'
                          : ['st', 'nd', 'rd'][fee.due_day % 10 - 1] || 'th'} of month
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={fee.is_active ? 'green' : 'grey'} dot>
                          {fee.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDeleteTarget(fee)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: '#dc2626' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add modal */}
      <AddFeeComponentModal
        open={addModal}
        onClose={() => setAddModal(false)}
        sessionId={sessionId}
        classId={classId}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Fee Component?"
        description={`Remove "${deleteTarget?.name}" from the fee structure? This won't affect already-generated invoices.`}
        confirmLabel="Remove"
        loading={isSaving}
      />
    </div>
  )
}

export default FeeStructurePage
