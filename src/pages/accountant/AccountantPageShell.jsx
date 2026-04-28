import { Link } from 'react-router-dom'
import usePageTitle from '@/hooks/usePageTitle'

const AccountantPageShell = ({
  title,
  eyebrow = 'Accountant Portal',
  description,
  action = null,
  children,
}) => {
  usePageTitle(title)

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(180,83,9,0.18), rgba(245,158,11,0.08) 45%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#92400e' }}>
              {eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-text-primary)' }}>
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
                {description}
              </p>
            )}
          </div>
          {action}
        </div>
      </section>

      {children}
    </div>
  )
}

export const Surface = ({ className = '', children }) => (
  <div
    className={`rounded-2xl border ${className}`.trim()}
    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
  >
    {children}
  </div>
)

export const QuickLink = ({ to, label, helper }) => (
  <Link
    to={to}
    className="rounded-2xl border p-4 transition-all hover:-translate-y-0.5"
    style={{
      backgroundColor: 'var(--color-surface)',
      borderColor: 'var(--color-border)',
    }}
  >
    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
    {helper && <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>{helper}</p>}
  </Link>
)

export default AccountantPageShell
