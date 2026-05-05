import { useEffect, useMemo, useState } from 'react'
import { BellRing, RefreshCw, CalendarDays, User2, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import NoticeCard from '@/components/student/NoticeCard'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentNotices from '@/hooks/useStudentNotices'
import useToast from '@/hooks/useToast'
import { formatDate } from '@/utils/helpers'

const categories = ['all', 'general', 'exam', 'fee', 'holiday', 'event']

const StudentNotices = () => {
  usePageTitle('Notice Board')

  const { toastError, toastInfo, toastSuccess } = useToast()
  const {
    notices,
    unreadCount,
    loading,
    refreshing,
    actionId,
    error,
    refresh,
    loadCategory,
    markRead,
    togglePin,
  } = useStudentNotices()

  const [category, setCategory] = useState('all')
  const [selectedNotice, setSelectedNotice] = useState(null)

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const sortedNotices = useMemo(
    () => [...notices].sort((a, b) => {
      if (Boolean(a.is_important) !== Boolean(b.is_important)) return a.is_important ? -1 : 1
      if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) return a.is_pinned ? -1 : 1
      if (Boolean(a.is_read) !== Boolean(b.is_read)) return a.is_read ? 1 : -1
      return String(b.publish_date || '').localeCompare(String(a.publish_date || ''))
    }),
    [notices]
  )

  const handleOpen = async (notice) => {
    setSelectedNotice(notice)
    if (!notice.is_read) {
      try {
        await markRead(notice.id)
        setSelectedNotice((prev) => prev ? { ...prev, is_read: true } : prev)
      } catch (err) {
        toastError(err?.message || 'Unable to mark notice as read.')
      }
    }
  }

  const handleTogglePin = async (notice) => {
    try {
      await togglePin(notice)
      toastSuccess(notice.is_pinned ? 'Notice unpinned.' : 'Notice pinned.')
    } catch (err) {
      toastError(err?.message || 'Unable to update notice pin.')
    }
  }

  const handleCategory = async (value) => {
    setCategory(value)
    try {
      await loadCategory(value)
    } catch {}
  }

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(109,40,217,0.16), rgba(37,99,235,0.05) 52%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--student-accent)' }}>
              Notices
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Notice Board</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
              Read school notices, keep important ones pinned, and stay on top of unread exam, fee, holiday, and event updates.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Unread Notices</p>
              <p className="mt-1 text-xl font-bold text-red-600">{unreadCount}</p>
            </div>
            <Button variant="secondary" onClick={async () => {
              toastInfo('Refreshing notices')
              await refresh(category)
            }} loading={refreshing} icon={RefreshCw}>
              Refresh
            </Button>
          </div>
        </div>
      </section>

      <section
        className="rounded-[28px] border p-5"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleCategory(item)}
              className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] whitespace-nowrap"
              style={{
                backgroundColor: category === item ? 'var(--student-accent)' : 'var(--color-surface-raised)',
                color: category === item ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-[28px]" style={{ backgroundColor: 'var(--color-surface)' }} />
          ))
        ) : sortedNotices.length ? (
          sortedNotices.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              onOpen={handleOpen}
              onTogglePin={handleTogglePin}
              loading={actionId === notice.id}
            />
          ))
        ) : (
          <EmptyState
            icon={BellRing}
            title="No notices here right now"
            description="This category is clear for the moment."
          />
        )}
      </section>

      <Modal
        open={Boolean(selectedNotice)}
        onClose={() => setSelectedNotice(null)}
        title={selectedNotice?.title || 'Notice'}
        size="lg"
      >
        {selectedNotice && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {!selectedNotice.is_read && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  Unread
                </span>
              )}
              <span className="rounded-full bg-purple-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-700">
                {selectedNotice.category}
              </span>
              {selectedNotice.is_important && (
                <span className="rounded-full bg-red-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700">
                  Important
                </span>
              )}
            </div>

            <div className="grid gap-3 rounded-[24px] border p-4 sm:grid-cols-2" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm">
                  <User2 size={18} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Posted By</p>
                  <p className="text-sm font-semibold">{selectedNotice.posted_by || 'School'} ({selectedNotice.posted_by_role})</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm">
                  <CalendarDays size={18} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Published Date</p>
                  <p className="text-sm font-semibold">{formatDate(selectedNotice.publish_date, 'long')}</p>
                </div>
              </div>
              {selectedNotice.expiry_date && (
                <div className="flex items-center gap-3 sm:col-span-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/20 shadow-sm">
                    <Clock size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Expires On</p>
                    <p className="text-sm font-semibold text-orange-700">{formatDate(selectedNotice.expiry_date, 'long')}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[24px] bg-slate-50 dark:bg-slate-900/40 p-5 border border-slate-100 dark:border-slate-800">
              <p className="whitespace-pre-wrap text-sm leading-8 text-[var(--color-text-primary)]">
                {selectedNotice.content}
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedNotice(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default StudentNotices
