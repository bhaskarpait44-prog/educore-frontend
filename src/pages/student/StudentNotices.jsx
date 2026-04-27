import { useEffect, useMemo, useState } from 'react'
import { BellRing, RefreshCw } from 'lucide-react'
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
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {!selectedNotice.is_read && (
                <span className="rounded-full bg-[rgba(37,99,235,0.10)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
                  Unread
                </span>
              )}
              <span className="rounded-full bg-[rgba(124,58,237,0.10)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--student-accent)]">
                {selectedNotice.category}
              </span>
            </div>

            <div className="rounded-[22px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Posted by {selectedNotice.posted_by || 'School'} on {formatDate(selectedNotice.publish_date, 'long')}
              </p>
              {selectedNotice.expiry_date && (
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Expires on {formatDate(selectedNotice.expiry_date, 'long')}
                </p>
              )}
            </div>

            <div className="whitespace-pre-wrap text-sm leading-7 text-[var(--color-text-primary)]">
              {selectedNotice.content}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default StudentNotices
