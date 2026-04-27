import { ArrowRight, CreditCard, FileBarChart2, FileCog, GraduationCap, Receipt, Users, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import usePageTitle from '@/hooks/usePageTitle'
import { ROUTES } from '@/constants/app'
import Button from '@/components/ui/Button'

const adminCards = [
  {
    title: 'Manage Fee Structure',
    description: 'Create or update class-wise fee components for the active session before generating invoices.',
    icon: FileCog,
    path: ROUTES.ACCOUNTANT_FEE_STRUCTURE_MANAGE,
    accent: '#0f766e',
    action: 'Open Structure Manager',
  },
  {
    title: 'View Fee Structure',
    description: 'Review all class fee components and compare them with the previous session.',
    icon: CreditCard,
    path: ROUTES.ACCOUNTANT_FEE_STRUCTURE,
    accent: '#2563eb',
    action: 'Open Structure View',
  },
  {
    title: 'Student Fee Ledger',
    description: 'Open student-wise balances, invoices, concessions, and full payment history.',
    icon: Users,
    path: ROUTES.ACCOUNTANT_STUDENTS,
    accent: '#b45309',
    action: 'Open Student Fees',
  },
  {
    title: 'Fee Collection',
    description: 'Collect payments, generate receipts, and keep invoice balances synced immediately.',
    icon: Wallet,
    path: ROUTES.ACCOUNTANT_COLLECTION,
    accent: '#dc2626',
    action: 'Open Collection Desk',
  },
  {
    title: 'Invoices & Receipts',
    description: 'Track invoice status, overdue balances, and receipt records from the same fee system.',
    icon: Receipt,
    path: ROUTES.ACCOUNTANT_INVOICES,
    accent: '#7c3aed',
    action: 'Open Invoices',
  },
  {
    title: 'Fee Reports',
    description: 'Review class-wise and session-wise collection reports without switching to legacy screens.',
    icon: FileBarChart2,
    path: ROUTES.ACCOUNTANT_REPORT_DAILY,
    accent: '#1d4ed8',
    action: 'Open Reports',
  },
]

const syncSteps = [
  'Set up fee structure class wise in the active session.',
  'Generate invoices from the fee structure manager.',
  'Review student balances and collect payments from the fee portal.',
  'Student portal reads the same invoices and payments automatically.',
]

const FeesPage = () => {
  usePageTitle('Fee Operations')

  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(217,119,6,0.14), rgba(37,99,235,0.10) 58%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: '#b45309' }}>
              Admin Fee Control
            </p>
            <h1 className="mt-2 text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Fee Section Wired to the Live Portal
            </h1>
            <p className="mt-2 text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
              This page now routes admin work into the same fee system used by the student portal and the collection portal, so structures, invoices, payments, and receipts stay in one consistent flow.
            </p>
          </div>

          <div className="rounded-[24px] border px-5 py-4 lg:max-w-sm" style={{ borderColor: 'rgba(180,83,9,0.18)', backgroundColor: 'rgba(255,255,255,0.7)' }}>
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#b45309' }}>
              <GraduationCap size={16} />
              Portal Sync
            </div>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              When admin creates structure and invoices here, the student fee portal shows the same records automatically.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Recommended Flow
        </h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          {syncSteps.map((step, index) => (
            <div
              key={step}
              className="rounded-[22px] border p-4"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-2xl text-sm font-bold text-white"
                style={{ backgroundColor: index === 0 ? '#0f766e' : index === 1 ? '#2563eb' : index === 2 ? '#dc2626' : '#b45309' }}
              >
                {index + 1}
              </div>
              <p className="mt-3 text-sm leading-6" style={{ color: 'var(--color-text-primary)' }}>
                {step}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {adminCards.map((card) => (
          <article
            key={card.title}
            className="rounded-[28px] border p-5 sm:p-6"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-[18px]"
                  style={{ backgroundColor: `${card.accent}18`, color: card.accent }}
                >
                  <card.icon size={22} />
                </div>
                <h3 className="mt-4 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-6" style={{ color: 'var(--color-text-secondary)' }}>
                  {card.description}
                </p>
              </div>

              <Button
                icon={ArrowRight}
                iconRight={<ArrowRight size={14} />}
                onClick={() => navigate(card.path)}
                className="sm:self-end"
              >
                {card.action}
              </Button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export default FeesPage
