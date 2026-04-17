// src/pages/DashboardPage.jsx
import usePageTitle from '@/hooks/usePageTitle'
import useAuth from '@/hooks/useAuth'

const DashboardPage = () => {
  usePageTitle('Dashboard')
  const { user } = useAuth()

  return (
    <div>
      <div
        className="p-6 rounded-2xl mb-6"
        style={{
          backgroundColor: 'var(--color-surface)',
          border         : '1px solid var(--color-border)',
        }}
      >
        <h2
          className="text-xl font-semibold mb-1"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
          Dashboard widgets and analytics coming in Step 2.
        </p>
      </div>

      {/* Placeholder grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Students', 'Attendance', 'Fees', 'Results'].map((label) => (
          <div
            key={label}
            className="p-6 rounded-2xl"
            style={{
              backgroundColor: 'var(--color-surface)',
              border         : '1px solid var(--color-border)',
            }}
          >
            <p
              className="text-xs uppercase tracking-widest mb-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {label}
            </p>
            <div
              className="h-6 w-16 rounded animate-pulse"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardPage
