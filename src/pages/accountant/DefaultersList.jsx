import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, BellRing, Phone } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import PermissionGate from '@/components/ui/PermissionGate'
import useAccountant from '@/hooks/useAccountant'
import usePageTitle from '@/hooks/usePageTitle'
import { PERMISSION } from '@/utils/permissions'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { AccountantHero, AccountantSection, MetricCard, SummaryTable } from './portalUtils'

const DefaultersList = () => {
  usePageTitle('Defaulters List')
  const { defaulters, isLoading, isSaving, fetchDefaulters, sendReminder } = useAccountant()
  const [days, setDays] = useState('30')
  const [selected, setSelected] = useState([])
  const [showReminder, setShowReminder] = useState(false)
  const [reminderType, setReminderType] = useState('whatsapp')

  useEffect(() => {
    fetchDefaulters({ days }).catch(() => {})
  }, [days, fetchDefaulters])

  const totalDue = useMemo(
    () => defaulters.reduce((sum, row) => sum + Number(row.total_due || 0), 0),
    [defaulters]
  )

  const toggleSelect = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const handleSendReminder = async () => {
    const result = await sendReminder({
      student_ids: selected,
      type       : reminderType,
      message    : 'Pending school fee amount is due. Please clear dues at the earliest.',
    })
    if (result.success) {
      setShowReminder(false)
      setSelected([])
    }
  }

  const columns = [
    {
      key   : 'select',
      label : '',
      render: (row) => (
        <input
          type="checkbox"
          checked={selected.includes(row.id)}
          onChange={() => toggleSelect(row.id)}
          className="h-4 w-4 cursor-pointer accent-amber-500"
        />
      ),
      csv: () => '',
    },
    { key: 'rank', label: 'Rank', render: (_, index) => `#${index + 1}` },
    {
      key   : 'student',
      label : 'Student',
      render: (row) => (
        <div>
          <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{row.student_name}</p>
          <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{row.admission_no}</p>
        </div>
      ),
    },
    { key: 'class_name', label: 'Class', render: (row) => `${row.class_name} ${row.section_name || ''}` },
    { key: 'total_due', label: 'Amount Due', render: (row) => <span style={{ color: '#dc2626', fontWeight: 700 }}>{formatCurrency(row.total_due)}</span> },
    { key: 'days_overdue', label: 'Days Overdue', render: (row) => `${Math.round(row.days_overdue || 0)} days` },
    { key: 'last_payment', label: 'Last Payment', render: (row) => row.last_payment ? formatDate(row.last_payment) : 'Never' },
    { key: 'parent_phone', label: 'Parent Phone' },
    {
      key   : 'actions',
      label : 'Actions',
      render: (row) => row.parent_phone ? (
        <a href={`tel:${row.parent_phone}`} className="inline-flex items-center gap-2 font-semibold" style={{ color: 'var(--color-brand)' }}>
          <Phone size={14} />
          Call
        </a>
      ) : '-',
      csv: () => '',
    },
  ]

  return (
    <div className="space-y-6">
      <AccountantHero
        eyebrow="Step 10"
        title="Defaulter List"
        description="Review overdue students by aging bucket, call parents directly, and queue reminders for selected students."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Defaulters" value={defaulters.length} />
        <MetricCard label="Amount At Risk" value={formatCurrency(totalDue)} accent="#dc2626" />
        <MetricCard label="Selected" value={selected.length} accent="#2563eb" />
      </div>

      <AccountantSection
        title="Defaulter Queue"
        subtitle="Choose an aging bucket and then select students for reminders."
        actions={(
          <div className="flex flex-wrap gap-3">
            <select
              value={days}
              onChange={(event) => setDays(event.target.value)}
              className="rounded-xl border px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              {['30', '60', '90'].map((value) => (
                <option key={value} value={value}>{value}+ days overdue</option>
              ))}
            </select>
            {selected.length > 0 && (
              <PermissionGate requires={PERMISSION.FEES_COLLECT}>
                <Button onClick={() => setShowReminder(true)} icon={BellRing}>
                  Send Reminder ({selected.length})
                </Button>
              </PermissionGate>
            )}
          </div>
        )}
      >
        {isLoading ? (
          <div className="p-2"><div className="h-32 animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} /></div>
        ) : defaulters.length === 0 ? (
          <EmptyState title={`No defaulters found for ${days}+ days`} description="This list refreshes from the current fee dues automatically." icon={AlertCircle} />
        ) : (
          <SummaryTable columns={columns} rows={defaulters} />
        )}
      </AccountantSection>

      {showReminder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
          onClick={(event) => event.target === event.currentTarget && setShowReminder(false)}
        >
          <div className="w-full max-w-sm rounded-2xl border shadow-2xl" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="border-b px-6 py-4" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Send Reminder</h2>
            </div>
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Send reminder to <strong>{selected.length}</strong> student(s)
              </p>
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Reminder Type</label>
                {['whatsapp', 'sms', 'letter'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setReminderType(type)}
                    className="mb-1 w-full rounded-lg px-3 py-2 text-left text-sm capitalize transition-colors"
                    style={{
                      backgroundColor : reminderType === type ? '#fffbeb' : 'transparent',
                      color           : reminderType === type ? '#b45309' : 'var(--color-text-secondary)',
                      border          : `1px solid ${reminderType === type ? '#f59e0b' : 'var(--color-border)'}`,
                    }}
                  >
                    {type === 'whatsapp' ? 'WhatsApp' : type === 'sms' ? 'SMS' : 'Print Letter'}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowReminder(false)} className="flex-1 rounded-xl border py-2.5 text-sm font-medium" style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>Cancel</button>
                <button onClick={handleSendReminder} disabled={isSaving} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#f59e0b' }}>
                  {isSaving ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DefaultersList
