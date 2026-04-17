// src/pages/PlaceholderPage.jsx
// Temporary page shown for routes not yet built (Steps 3–10)

import { Construction } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'

const PlaceholderPage = ({ title = 'Coming Soon' }) => {
  usePageTitle(title)

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] text-center rounded-2xl"
      style={{
        backgroundColor: 'var(--color-surface)',
        border         : '1px solid var(--color-border)',
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--color-surface-raised)' }}
      >
        <Construction size={24} style={{ color: 'var(--color-brand)' }} />
      </div>
      <h2
        className="text-xl font-semibold mb-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {title}
      </h2>
      <p
        className="text-sm max-w-xs"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        This section is being built. It will be ready in an upcoming step.
      </p>
    </div>
  )
}

export default PlaceholderPage
