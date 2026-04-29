import { useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useDefaulters from '@/hooks/useDefaulters'
import ReminderModal from '@/components/accountant/ReminderModal'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency, formatDate } from '@/utils/helpers'

const DefaulterList = () => {
  usePageTitle('Defaulters')
  const { defaulters } = useDefaulters()
  const [selected, setSelected] = useState([])
  const [open, setOpen] = useState(false)

  const send = async ({ type, message }) => {
    await accountantApi.sendReminderBulk({ student_ids: selected, type, message }).catch(() => {})
    setOpen(false)
    setSelected([])
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Defaulter List</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Track due today, overdue, and chronic pending students.</p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: 'var(--color-brand)' }}>
          Send Reminders
        </button>
      </div>

      <div className="overflow-x-auto rounded-[28px] border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['', 'Student', 'Class', 'Total Due', 'Overdue Since', 'Open Invoices', 'Actions'].map((head) => (
                <th key={head} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {defaulters.map((row) => (
              <tr key={row.student_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(row.student_id)} onChange={() => setSelected((current) => current.includes(row.student_id) ? current.filter((id) => id !== row.student_id) : [...current, row.student_id])} /></td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.student_name}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{row.class_name}</td>
                <td className="px-4 py-3 text-sm font-semibold text-red-700">{formatCurrency(row.balance)}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{row.first_due_date ? formatDate(row.first_due_date) : '--'}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{row.open_invoices}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => { setSelected([row.student_id]); setOpen(true) }} className="rounded-full px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: 'var(--color-brand)' }}>
                    Remind
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ReminderModal open={open} onClose={() => setOpen(false)} onSend={send} selectedCount={selected.length} />
    </div>
  )
}

export default DefaulterList
