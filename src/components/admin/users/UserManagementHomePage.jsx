import { ArrowRight, ShieldCheck, GraduationCap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/app'
import usePageTitle from '@/hooks/usePageTitle'

const USER_CARDS = [
  {
    role: 'admin',
    title: 'Admin Users',
    description: 'Create and manage administrator accounts, permissions, passwords, and access status.',
    accent: '#1d4ed8',
    surface: '#eff6ff',
    icon: ShieldCheck,
  },
  {
    role: 'teacher',
    title: 'Teacher Users',
    description: 'Open the teacher user list and handle account setup, permissions, resets, and profile edits.',
    accent: '#15803d',
    surface: '#f0fdf4',
    icon: GraduationCap,
  },
]

const UserManagementHomePage = () => {
  usePageTitle('User Management')

  const navigate = useNavigate()

  const openRoleManager = (role) => {
    navigate(`${ROUTES.USER_MANAGE}?role=${role}`)
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          User Management
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Choose a user group to open its full list page and manage creation, editing,
          permissions, password reset, activation, and audit history.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {USER_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <button
              key={card.role}
              type="button"
              onClick={() => openRoleManager(card.role)}
              className="group rounded-[28px] p-6 text-left transition-transform hover:-translate-y-1"
              style={{ backgroundColor: card.surface, border: `1px solid ${card.accent}22` }}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: card.accent, color: '#fff' }}
              >
                <Icon size={24} />
              </div>
              <h2 className="mt-6 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {card.title}
              </h2>
              <p className="mt-2 text-sm leading-6" style={{ color: 'var(--color-text-secondary)' }}>
                {card.description}
              </p>
              <div
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: card.accent }}
              >
                Open List
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default UserManagementHomePage
