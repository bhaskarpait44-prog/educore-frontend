// src/pages/audit/AuditPage.jsx
import { useState } from 'react'
import { ScrollText, Activity } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import AuditLogListPage    from './AuditLogListPage'
import AdminActivityPage   from './AdminActivityPage'
import { cn } from '@/utils/helpers'

const TABS = [
  { key: 'logs',     label: 'Audit Logs',      icon: ScrollText },
  { key: 'activity', label: 'Admin Activity',  icon: Activity   },
]

const AuditPage = () => {
  usePageTitle('Audit Logs')
  const [tab, setTab] = useState('logs')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Audit Logs
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Complete read-only record of all system changes
          </p>
        </div>
        <div
          className="flex p-1 rounded-2xl gap-1 w-fit"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                backgroundColor: tab === t.key ? 'var(--color-brand)' : 'transparent',
                color          : tab === t.key ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              <t.icon size={15} />
              <span className="hidden sm:block">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === 'logs'     && <AuditLogListPage />}
      {tab === 'activity' && <AdminActivityPage />}
    </div>
  )
}

export default AuditPage