// src/pages/NotFoundPage.jsx
import { useNavigate } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import { ROUTES } from '@/constants/app'

const NotFoundPage = () => {
  usePageTitle('Page Not Found')
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="text-center px-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <AlertCircle size={28} style={{ color: 'var(--color-danger)' }} />
        </div>

        <h1
          className="text-6xl font-bold mb-3"
          style={{ color: 'var(--color-text-primary)' }}
        >
          404
        </h1>
        <p
          className="text-lg mb-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Page not found
        </p>
        <p
          className="text-sm mb-8"
          style={{ color: 'var(--color-text-muted)' }}
        >
          The page you're looking for doesn't exist or was moved.
        </p>

        <button
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-brand)' }}
        >
          <Home size={16} />
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}

export default NotFoundPage
