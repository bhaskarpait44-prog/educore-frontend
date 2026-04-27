import { useEffect, useMemo, useState } from 'react'
import { Copy, FileCog, Plus, Save, Sparkles, ShieldAlert } from 'lucide-react'
import { getClasses, getClassOptions } from '@/api/classApi'
import {
  copyFeeStructureFromSession,
  createFeeStructure,
  generateFeeInvoices,
  getFeeStructure,
  updateFeeStructure,
} from '@/api/accountantApi'
import usePermissions from '@/hooks/usePermissions'
import usePageTitle from '@/hooks/usePageTitle'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import { PERMISSION } from '@/utils/permissions'
import { formatCurrency } from '@/utils/helpers'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
  { value: 'one_time', label: 'One Time' },
]

function normalizeSessionList(rawSessions) {
  if (Array.isArray(rawSessions)) return rawSessions
  if (Array.isArray(rawSessions?.items)) return rawSessions.items
  if (Array.isArray(rawSessions?.sessions)) return rawSessions.sessions
  return []
}

function EmptyLockedState() {
  return (
    <div className="rounded-[1.7rem] border px-6 py-14 text-center" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#dd8d1f' }}>
        <ShieldAlert size={24} />
      </div>
      <h1 className="mt-4 text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Manage Fee Structure Locked</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        This screen needs the <code>fees.edit</code> permission. Contact admin to enable fee structure management.
      </p>
    </div>
  )
}

export default function FeeStructureManage() {
  usePageTitle('Manage Fee Structure')

  const { can } = usePermissions()
  const allowed = can(PERMISSION.FEES_EDIT)
  const { toastError, toastSuccess } = useToast()
  const { sessions, currentSession, fetchSessions, fetchCurrentSession } = useSessionStore()
  const [classes, setClasses] = useState([])
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [rows, setRows] = useState([])
  const [drafts, setDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingRowId, setSavingRowId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [copying, setCopying] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generationSummary, setGenerationSummary] = useState(null)
  const [newComponent, setNewComponent] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    due_day: '10',
    is_active: true,
  })

  const sessionList = useMemo(() => normalizeSessionList(sessions), [sessions])

  useEffect(() => {
    if (!allowed) return
    fetchSessions().catch(() => {})
    fetchCurrentSession?.()
    getClasses()
      .then((response) => setClasses(getClassOptions(response)))
      .catch(() => setClasses([]))
  }, [allowed, fetchCurrentSession, fetchSessions])

  useEffect(() => {
    if (!selectedSessionId && currentSession?.id) {
      setSelectedSessionId(String(currentSession.id))
    }
  }, [currentSession, selectedSessionId])

  const sourceSession = useMemo(() => {
    const currentIndex = sessionList.findIndex((session) => String(session.id) === String(selectedSessionId))
    return currentIndex >= 0 ? sessionList[currentIndex + 1] || null : null
  }, [selectedSessionId, sessionList])

  const reload = async () => {
    if (!selectedSessionId || !allowed) return
    setLoading(true)
    try {
      const response = await getFeeStructure({ session_id: selectedSessionId, class_id: selectedClassId || undefined })
      const items = response.data?.items || []
      setRows(items)
      setDrafts(Object.fromEntries(items.map((item) => [item.id, {
        name: item.name,
        amount: String(item.amount ?? ''),
        frequency: item.frequency,
        due_day: String(item.due_day ?? ''),
        is_active: Boolean(item.is_active),
      }])))
    } catch (error) {
      toastError(error.message || 'Failed to load fee structure')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [allowed, selectedClassId, selectedSessionId])

  const annualTotal = useMemo(
    () => rows.reduce((sum, item) => {
      const multiplier = item.frequency === 'monthly' ? 12 : item.frequency === 'quarterly' ? 4 : 1
      return sum + (Number(item.amount || 0) * multiplier)
    }, 0),
    [rows],
  )

  const updateDraft = (id, field, value) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }))
  }

  const saveRow = async (id) => {
    const draft = drafts[id]
    if (!draft?.name?.trim()) {
      toastError('Fee name is required')
      return
    }
    if (Number(draft.amount) <= 0) {
      toastError('Amount must be a positive number')
      return
    }
    if (Number(draft.due_day) < 1 || Number(draft.due_day) > 28) {
      toastError('Due day must be between 1 and 28')
      return
    }

    setSavingRowId(id)
    try {
      await updateFeeStructure(id, {
        name: draft.name.trim(),
        amount: Number(draft.amount),
        frequency: draft.frequency,
        due_day: Number(draft.due_day),
        is_active: draft.is_active,
      })
      toastSuccess('Fee component updated')
      await reload()
    } catch (error) {
      toastError(error.message || 'Failed to update fee component')
    } finally {
      setSavingRowId(null)
    }
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!selectedSessionId || !selectedClassId) {
      toastError('Select session and class first')
      return
    }
    if (!newComponent.name.trim()) {
      toastError('Fee name is required')
      return
    }
    if (Number(newComponent.amount) <= 0) {
      toastError('Amount must be a positive number')
      return
    }

    setCreating(true)
    try {
      await createFeeStructure({
        session_id: Number(selectedSessionId),
        class_id: Number(selectedClassId),
        name: newComponent.name.trim(),
        amount: Number(newComponent.amount),
        frequency: newComponent.frequency,
        due_day: Number(newComponent.due_day),
        is_active: newComponent.is_active,
      })
      toastSuccess('Fee component added')
      setNewComponent({
        name: '',
        amount: '',
        frequency: 'monthly',
        due_day: '10',
        is_active: true,
      })
      await reload()
    } catch (error) {
      toastError(error.message || 'Failed to create fee component')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    if (!sourceSession || !selectedSessionId) return
    setCopying(true)
    try {
      await copyFeeStructureFromSession({
        source_session_id: sourceSession.id,
        target_session_id: Number(selectedSessionId),
        class_id: selectedClassId ? Number(selectedClassId) : null,
      })
      toastSuccess('Fee structure copied from previous session')
      setCopyOpen(false)
      await reload()
    } catch (error) {
      toastError(error.message || 'Failed to copy fee structure')
    } finally {
      setCopying(false)
    }
  }

  const handleGenerateInvoices = async () => {
    if (!selectedSessionId) return
    setGenerating(true)
    try {
      const response = await generateFeeInvoices({ session_id: Number(selectedSessionId) })
      setGenerationSummary(response.data || null)
      toastSuccess('Invoices generated successfully')
      setInvoiceOpen(false)
    } catch (error) {
      toastError(error.message || 'Failed to generate invoices')
    } finally {
      setGenerating(false)
    }
  }

  if (!allowed) return <EmptyLockedState />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Manage Fee Structure</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Update fee components inline, add new ones, copy last session structure, and generate invoices for active enrollments.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" icon={Copy} onClick={() => setCopyOpen(true)} disabled={!sourceSession}>
            Copy From Last Session
          </Button>
          <Button icon={Sparkles} onClick={() => setInvoiceOpen(true)}>
            Generate Invoices
          </Button>
        </div>
      </div>

      <section
        className="grid gap-4 rounded-[1.7rem] border p-5 lg:grid-cols-4"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Session</label>
          <select
            value={selectedSessionId}
            onChange={(event) => setSelectedSessionId(event.target.value)}
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <option value="">Select session</option>
            {sessionList.map((session) => (
              <option key={session.id} value={session.id}>{session.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Class</label>
          <select
            value={selectedClassId}
            onChange={(event) => setSelectedClassId(event.target.value)}
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <option value="">Select class</option>
            {classes.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
          <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>Components</div>
          <div className="mt-2 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{rows.length}</div>
        </div>

        <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
          <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>Annual Total</div>
          <div className="mt-2 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(annualTotal)}</div>
        </div>
      </section>

      <section
        className="overflow-hidden rounded-[1.7rem] border"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="border-b px-5 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Editable Structure Table</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Update each row inline and save changes one component at a time.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <FileCog size={28} className="mx-auto" style={{ color: 'var(--color-text-muted)' }} />
            <h3 className="mt-4 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>No components found</h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Pick a session and class, or add the first fee component below.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>
                  <th className="px-5 py-4">Fee Name</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Frequency</th>
                  <th className="px-5 py-4">Due Day</th>
                  <th className="px-5 py-4">Active</th>
                  <th className="px-5 py-4">Save</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const draft = drafts[row.id] || {}
                  return (
                    <tr key={row.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="px-5 py-4">
                        <input
                          value={draft.name || ''}
                          onChange={(event) => updateDraft(row.id, 'name', event.target.value)}
                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                          style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={draft.amount || ''}
                          onChange={(event) => updateDraft(row.id, 'amount', event.target.value)}
                          className="w-32 rounded-xl border px-3 py-2 text-sm outline-none"
                          style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={draft.frequency || 'monthly'}
                          onChange={(event) => updateDraft(row.id, 'frequency', event.target.value)}
                          className="rounded-xl border px-3 py-2 text-sm outline-none"
                          style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                        >
                          {FREQUENCY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <input
                          type="number"
                          min="1"
                          max="28"
                          value={draft.due_day || ''}
                          onChange={(event) => updateDraft(row.id, 'due_day', event.target.value)}
                          className="w-24 rounded-xl border px-3 py-2 text-sm outline-none"
                          style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <label className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(draft.is_active)}
                            onChange={(event) => updateDraft(row.id, 'is_active', event.target.checked)}
                          />
                          {draft.is_active ? 'Active' : 'Inactive'}
                        </label>
                      </td>
                      <td className="px-5 py-4">
                        <Button size="sm" icon={Save} loading={savingRowId === row.id} onClick={() => saveRow(row.id)}>
                          Save Row
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        className="rounded-[1.7rem] border p-5"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Add Component</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Add a new fee component for the selected session and class.
          </p>
        </div>

        <form onSubmit={handleCreate} className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Fee name</label>
            <input
              value={newComponent.name}
              onChange={(event) => setNewComponent((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
              placeholder="Tuition Fee"
              style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Amount</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={newComponent.amount}
              onChange={(event) => setNewComponent((current) => ({ ...current, amount: event.target.value }))}
              className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Frequency</label>
            <select
              value={newComponent.frequency}
              onChange={(event) => setNewComponent((current) => ({ ...current, frequency: event.target.value }))}
              className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Due day</label>
            <input
              type="number"
              min="1"
              max="28"
              value={newComponent.due_day}
              onChange={(event) => setNewComponent((current) => ({ ...current, due_day: event.target.value }))}
              className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <div className="lg:col-span-5 flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
              <input
                type="checkbox"
                checked={newComponent.is_active}
                onChange={(event) => setNewComponent((current) => ({ ...current, is_active: event.target.checked }))}
              />
              Component active
            </label>
            <Button type="submit" icon={Plus} loading={creating}>
              Add Component
            </Button>
          </div>
        </form>
      </section>

      {generationSummary ? (
        <section
          className="rounded-[1.7rem] border p-5"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Latest Invoice Generation Summary</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
              <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>Session</div>
              <div className="mt-2 text-sm font-semibold">{generationSummary.sessionName || generationSummary.sessionId}</div>
            </div>
            <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
              <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>Students</div>
              <div className="mt-2 text-sm font-semibold">{generationSummary.totalEnrollments ?? 0}</div>
            </div>
            <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
              <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>Created</div>
              <div className="mt-2 text-sm font-semibold">{generationSummary.invoicesCreated ?? 0}</div>
            </div>
            <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
              <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>Skipped</div>
              <div className="mt-2 text-sm font-semibold">{generationSummary.invoicesSkipped ?? 0}</div>
            </div>
          </div>
        </section>
      ) : null}

      <Modal
        open={copyOpen}
        onClose={() => setCopyOpen(false)}
        title="Copy Fee Structure"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setCopyOpen(false)}>Cancel</Button>
            <Button icon={Copy} loading={copying} onClick={handleCopy}>Confirm Copy</Button>
          </>
        )}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          This will replace the selected target structure with the previous session setup.
        </p>
        <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
          <div className="text-sm"><strong>From:</strong> {sourceSession?.name || 'Previous session not available'}</div>
          <div className="mt-2 text-sm"><strong>To:</strong> {sessionList.find((session) => String(session.id) === String(selectedSessionId))?.name || 'Not selected'}</div>
          <div className="mt-2 text-sm"><strong>Class:</strong> {classes.find((item) => item.value === selectedClassId)?.label || 'All classes in target session'}</div>
        </div>
      </Modal>

      <Modal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        title="Generate Invoices For Session"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setInvoiceOpen(false)}>Cancel</Button>
            <Button icon={Sparkles} loading={generating} onClick={handleGenerateInvoices}>Generate Invoices</Button>
          </>
        )}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Generate invoices for all active enrollments in the selected session using the current fee structure.
        </p>
        <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
          <div className="text-sm"><strong>Session:</strong> {sessionList.find((session) => String(session.id) === String(selectedSessionId))?.name || 'Not selected'}</div>
          <div className="mt-2 text-sm"><strong>Class filter:</strong> {selectedClassId ? classes.find((item) => item.value === selectedClassId)?.label || 'Selected class' : 'All classes'}</div>
          <div className="mt-2 text-sm"><strong>Components ready:</strong> {rows.length}</div>
        </div>
      </Modal>
    </div>
  )
}
