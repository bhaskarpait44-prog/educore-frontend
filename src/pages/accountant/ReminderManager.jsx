import { useEffect, useMemo, useState } from 'react'
import { BellRing, PhoneCall, Send } from 'lucide-react'
import * as accountantApi from '@/api/accountantApi'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import TableSkeleton from '@/components/ui/TableSkeleton'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { AccountantHero, AccountantSection, MetricCard, SummaryTable } from './portalUtils'

export default function ReminderManager() {
  usePageTitle('Reminder Manager')
  const { toastError, toastSuccess } = useToast()
  const [days, setDays] = useState('30')
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [type, setType] = useState('whatsapp')
  const [message, setMessage] = useState('')

  useEffect(() => {
    setLoading(true)
    accountantApi.getDefaulters({ days })
      .then((res) => setItems(res.data?.items || []))
      .catch((error) => toastError(error.message || 'Failed to load defaulters'))
      .finally(() => setLoading(false))
  }, [days, toastError])

  const selectedRows = useMemo(() => items.filter((item) => selected.includes(item.id)), [items, selected])
  const totalDue = useMemo(() => selectedRows.reduce((sum, item) => sum + Number(item.total_due || 0), 0), [selectedRows])

  const handleSend = async () => {
    setSending(true)
    try {
      await accountantApi.sendBulkReminder({
        student_ids: selected,
        type,
        message,
      })
      toastSuccess('Reminders queued successfully')
      setSelected([])
    } catch (error) {
      toastError(error.message || 'Failed to queue reminders')
    } finally {
      setSending(false)
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
          onChange={() => setSelected((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id])}
          className="h-4 w-4 accent-amber-500"
        />
      ),
      csv: () => '',
    },
    { key: 'student_name', label: 'Student' },
    { key: 'admission_no', label: 'Adm No' },
    { key: 'class_name', label: 'Class', render: (row) => `${row.class_name} ${row.section_name || ''}` },
    { key: 'total_due', label: 'Total Due', render: (row) => formatCurrency(row.total_due) },
    { key: 'overdue_since', label: 'Overdue Since', render: (row) => formatDate(row.overdue_since) },
    { key: 'days_overdue', label: 'Days', render: (row) => `${row.days_overdue} days` },
    { key: 'parent_phone', label: 'Parent Phone' },
    {
      key   : 'call',
      label : 'Call',
      render: (row) => row.parent_phone ? (
        <a href={`tel:${row.parent_phone}`} className="inline-flex items-center gap-2 font-semibold" style={{ color: 'var(--color-brand)' }}>
          <PhoneCall size={14} />
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
        title="Reminder Manager"
        description="Prepare reminder batches with a previewable message and send them to selected fee defaulters in one pass."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Selected Students" value={selectedRows.length} />
        <MetricCard label="Selected Due" value={formatCurrency(totalDue)} accent="#dc2626" />
        <MetricCard label="Reminder Type" value={type.toUpperCase()} accent="#2563eb" />
      </div>
      <AccountantSection title="Reminder Setup" subtitle="Choose aging bucket, reminder channel, and message content before queuing reminders.">
        <div className="grid gap-4 xl:grid-cols-4">
          <Select
            label="Aging Bucket"
            value={days}
            onChange={(event) => setDays(event.target.value)}
            options={[
              { value: '0', label: 'Due Today' },
              { value: '30', label: '1-30 Days Overdue' },
              { value: '60', label: '31-60 Days Overdue' },
              { value: '90', label: '60+ Days Overdue' },
            ]}
          />
          <Select
            label="Reminder Type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            options={[
              { value: 'sms', label: 'SMS Message' },
              { value: 'whatsapp', label: 'WhatsApp Message' },
              { value: 'letter', label: 'Print Letter' },
            ]}
          />
          <div className="xl:col-span-2">
            <Input
              label="Message Preview"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Dear Parent, your ward has pending school fees..."
              hint="Leave blank to let the backend use its default reminder message."
            />
          </div>
        </div>
        <div className="mt-4">
          <Button icon={Send} loading={sending} disabled={!selected.length} onClick={handleSend}>
            Queue Reminder Batch
          </Button>
        </div>
      </AccountantSection>
      <AccountantSection title="Reminder Candidates" subtitle="Select one or more students from the current aging bucket.">
        {loading ? <TableSkeleton cols={9} rows={8} /> : <SummaryTable columns={columns} rows={items} emptyTitle="No defaulters found for this bucket" emptyDescription="Pick another aging bucket to continue." />}
      </AccountantSection>
    </div>
  )
}
