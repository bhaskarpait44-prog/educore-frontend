import { useState } from 'react'
import Modal from '@/components/ui/Modal'

const ReminderModal = ({ open, onClose, onSend, selectedCount = 1 }) => {
  const [type, setType] = useState('sms')
  const [message, setMessage] = useState('')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send Reminder"
      footer={(
        <>
          <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSend({ type, message })}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            Send Reminder
          </button>
        </>
      )}
    >
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Sending reminder for {selectedCount} student{selectedCount > 1 ? 's' : ''}.
        </p>
        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="w-full rounded-xl border px-3 py-2 text-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          <option value="sms">SMS Message</option>
          <option value="whatsapp">WhatsApp Message</option>
          <option value="letter">Print Letter</option>
        </select>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          placeholder="Reminder message preview..."
          className="w-full rounded-xl border px-3 py-2 text-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        />
      </div>
    </Modal>
  )
}

export default ReminderModal
