import { Pin, Star, Eye, CalendarDays, User2 } from 'lucide-react'
import { formatDate } from '@/utils/helpers'

const NoticeCard = ({ notice, onOpen, onTogglePin, loading = false }) => {
  const categoryTone = categoryStyle(notice.category)

  return (
    <article
      className="rounded-[24px] border p-4 sm:p-5"
      style={{
        borderColor: notice.is_read ? 'var(--color-border)' : '#93c5fd',
        backgroundColor: 'var(--color-surface)',
        boxShadow: notice.is_read ? '0 14px 34px rgba(76,29,149,0.04)' : '0 18px 38px rgba(37,99,235,0.08)',
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {!notice.is_read && (
              <span className="rounded-full bg-[rgba(37,99,235,0.10)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
                Unread
              </span>
            )}
            <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ backgroundColor: categoryTone.soft, color: categoryTone.color }}>
              {notice.category}
            </span>
            {notice.is_pinned && (
              <span className="rounded-full bg-[rgba(124,58,237,0.10)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--student-accent)]">
                Pinned
              </span>
            )}
            {notice.is_important && (
              <span className="rounded-full bg-[rgba(239,68,68,0.10)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-red-600">
                Important
              </span>
            )}
          </div>

          <div className="mt-3 flex items-start gap-2">
            {!notice.is_read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />}
            {notice.is_important && <Star size={15} className="mt-1 shrink-0 text-red-500" />}
            <div className="min-w-0">
              <h3 className={`text-lg font-semibold ${notice.is_read ? '' : 'font-bold'}`} style={{ color: 'var(--color-text-primary)' }}>
                {notice.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {notice.content}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[18px] px-4 py-3 text-[11px]" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
          <span className="flex items-center gap-1.5">
            <User2 size={12} style={{ color: 'var(--color-text-muted)' }} />
            <span className="font-semibold text-[var(--color-text-secondary)]">From:</span>
            <span style={{ color: 'var(--color-text-muted)' }}>{notice.posted_by || 'School'} ({notice.posted_by_role})</span>
          </span>
          <span className="flex items-center gap-1.5 border-l pl-4 border-slate-200 dark:border-slate-800">
            <CalendarDays size={12} style={{ color: 'var(--color-text-muted)' }} />
            <span className="font-semibold text-[var(--color-text-secondary)]">Posted:</span>
            <span style={{ color: 'var(--color-text-muted)' }}>{formatRelative(notice.publish_date)}</span>
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => onOpen?.(notice)}
          className="min-h-11 flex-[2] flex items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white transition-transform active:scale-[0.98]"
          style={{ backgroundColor: 'var(--student-accent)' }}
        >
          <Eye size={16} />
          Read Full Notice
        </button>
        <button
          type="button"
          onClick={() => onTogglePin?.(notice)}
          disabled={loading}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-colors hover:bg-slate-200 dark:hover:bg-slate-800"
          style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)', opacity: loading ? 0.7 : 1 }}
        >
          <Pin size={15} />
          {notice.is_pinned ? 'Unpin' : 'Pin to Top'}
        </button>
      </div>
    </article>
  )
}

function categoryStyle(category) {
  if (category === 'exam') return { soft: 'rgba(37,99,235,0.10)', color: '#2563eb' }
  if (category === 'fee') return { soft: 'rgba(245,158,11,0.10)', color: '#d97706' }
  if (category === 'holiday') return { soft: 'rgba(22,163,74,0.10)', color: '#16a34a' }
  if (category === 'event') return { soft: 'rgba(124,58,237,0.10)', color: '#7c3aed' }
  return { soft: 'rgba(148,163,184,0.12)', color: '#64748b' }
}

function formatRelative(value) {
  if (!value) return '--'
  const date = new Date(value)
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  return formatDate(value, 'long')
}

export default NoticeCard
