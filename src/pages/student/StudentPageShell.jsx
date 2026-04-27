import { ArrowUpRight, Sparkles } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import { cn } from '@/utils/helpers'

const StudentPageShell = ({
  title,
  eyebrow,
  description,
  highlights = [],
}) => {
  usePageTitle(title)

  return (
    <div className="space-y-4 sm:space-y-5">
      <section
        className="overflow-hidden rounded-3xl border px-4 py-5 sm:px-6"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.16), rgba(79,70,229,0.08) 52%, rgba(255,255,255,0.78) 100%)',
          borderColor: 'var(--color-border)',
          boxShadow: '0 22px 56px rgba(109,40,217,0.10)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--student-accent)]">
              {eyebrow}
            </p>
            <h1 className="text-2xl font-semibold leading-tight sm:text-[28px]">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-[15px]">
              {description}
            </p>
          </div>

          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:flex" style={{ backgroundColor: 'rgba(124,58,237,0.12)', color: 'var(--student-accent)' }}>
            <Sparkles size={20} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {highlights.map((item) => (
          <article
            key={item.title}
            className={cn('rounded-2xl border p-4')}
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              boxShadow: '0 14px 34px rgba(76, 29, 149, 0.06)',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{item.body}</p>
            <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--student-accent)]">
              <span>Ready for feature build</span>
              <ArrowUpRight size={14} />
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export default StudentPageShell
