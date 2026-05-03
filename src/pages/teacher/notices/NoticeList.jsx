import { useMemo, useState } from 'react'
import { BellPlus, BellRing, CheckCheck, Edit3, Eye, Filter, Search, UserRoundPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import usePageTitle from '@/hooks/usePageTitle'
import usePermissions from '@/hooks/usePermissions'
import useTeacherNotices from '@/hooks/useTeacherNotices'
import useToast from '@/hooks/useToast'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import { ROUTES } from '@/constants/app'
import { formatDate } from '@/utils/helpers'

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'homework', label: 'Homework' },
  { value: 'exam', label: 'Exam' },
  { value: 'event', label: 'Event' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'other', label: 'Other' },
]

const NoticeList = () => {
  usePageTitle('Notice')

  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { can } = usePermissions()
  const { toastSuccess, toastError } = useToast()
  const { notices, loadingBase, loadingNotices, markAsRead } = useTeacherNotices()
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    readState: '',
    mineOnly: false,
  })
  const [selectedNotice, setSelectedNotice] = useState(null)
  const [markingId, setMarkingId] = useState(null)

  const canPost = can('notices.post')

  const filteredNotices = useMemo(() => notices.filter((notice) => {
    const haystack = `${notice.title} ${notice.content} ${notice.teacher_name || ''}`.toLowerCase()
    const matchesSearch = !filters.search.trim() || haystack.includes(filters.search.trim().toLowerCase())
    const matchesCategory = !filters.category || notice.category === filters.category
    const matchesRead = !filters.readState || (
      filters.readState === 'read' ? notice.is_read : !notice.is_read
    )
    const matchesMine = !filters.mineOnly || Number(notice.teacher_id) === Number(user?.id)
    return matchesSearch && matchesCategory && matchesRead && matchesMine
  }), [filters, notices, user?.id])

  const stats = useMemo(() => (
    filteredNotices.reduce((acc, notice) => {
      acc.total += 1
      if (!notice.is_read) acc.unread += 1
      if (Number(notice.teacher_id) === Number(user?.id)) acc.mine += 1
      if (notice.target_scope === 'my_class_only') acc.classOnly += 1
      return acc
    }, { total: 0, unread: 0, mine: 0, classOnly: 0 })
  ), [filteredNotices, user?.id])

  const openNotice = async (notice) => {
    setSelectedNotice(notice)
    if (!notice.is_read) {
      try {
        setMarkingId(notice.id)
        await markAsRead(notice.id)
        toastSuccess('Notice marked as read.')
        setSelectedNotice((prev) => prev ? { ...prev, is_read: true, read_count: Number(prev.read_count || 0) + 1 } : prev)
      } catch (error) {
        toastError(error?.message || 'Unable to mark notice as read.')
      } finally {
        setMarkingId(null)
      }
    }
  }

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.18), rgba(16, 185, 129, 0.06) 58%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Notice Board
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              View teacher and class-targeted notices, mark them as read, and manage your own posted notices.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" icon={UserRoundPlus} onClick={() => navigate(ROUTES.TEACHER_NOTICE_NEW, { state: { targetMode: 'student' } })}>
              Student Notice
            </Button>
            <Button variant="primary" icon={BellPlus} onClick={() => navigate(ROUTES.TEACHER_NOTICE_NEW)}>
              Create Notice
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard title="Visible Notices" value={stats.total} tone="#0f766e" />
          <StatCard title="Unread" value={stats.unread} tone="#ef4444" />
          <StatCard title="My Posts" value={stats.mine} tone="#14b8a6" />
          <StatCard title="Class Only" value={stats.classOnly} tone="#10b981" />
        </div>
      </section>

      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Filter size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Filter Notices
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <Input
            label="Search"
            icon={Search}
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search title or content"
          />
          <Select
            label="Category"
            value={filters.category}
            onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
            options={CATEGORY_OPTIONS}
            placeholder="All categories"
          />
          <Select
            label="Read Status"
            value={filters.readState}
            onChange={(event) => setFilters((prev) => ({ ...prev, readState: event.target.value }))}
            options={[
              { value: 'unread', label: 'Unread' },
              { value: 'read', label: 'Read' },
            ]}
            placeholder="All notices"
          />
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, mineOnly: !prev.mineOnly }))}
              className="flex min-h-11 w-full items-center justify-center rounded-2xl px-4 text-sm font-semibold"
              style={{
                backgroundColor: filters.mineOnly ? '#0f766e' : 'var(--color-surface-raised)',
                color: filters.mineOnly ? '#fff' : 'var(--color-text-primary)',
              }}
            >
              My Posts Only
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {loadingBase || loadingNotices ? (
          [...Array(4)].map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-[28px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          ))
        ) : filteredNotices.length === 0 ? (
          <EmptyState
            icon={BellRing}
            title="No notices found"
            description="There are no notices matching your current filters."
            action={canPost ? (
              <Button variant="primary" onClick={() => navigate(ROUTES.TEACHER_NOTICE_NEW)}>
                Create Notice
              </Button>
            ) : null}
          />
        ) : (
          filteredNotices.map((notice) => (
            <article
              key={notice.id}
              className="rounded-[24px] border p-4 sm:p-5"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={notice.is_read ? 'grey' : 'red'}>{notice.is_read ? 'Read' : 'Unread'}</Badge>
                    <Badge variant="blue">{labelForCategory(notice.category)}</Badge>
                    <Badge variant="green">{labelForTarget(notice.target_scope)}</Badge>
                    {Number(notice.teacher_id) === Number(user?.id) ? <Badge variant="yellow">My Notice</Badge> : null}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {notice.title}
                  </h3>
                  <p className="mt-2 text-sm line-clamp-3" style={{ color: 'var(--color-text-secondary)' }}>
                    {notice.content}
                  </p>
                </div>

                <div className="rounded-2xl px-4 py-3 lg:min-w-56" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                    Published
                  </p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {formatDate(notice.publish_date, 'long')}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    By {notice.teacher_name || 'Teacher'} | Read by {notice.read_count || 0}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button variant="primary" icon={Eye} onClick={() => openNotice(notice)} fullWidth>
                  Open Notice
                </Button>
                {canPost && Number(notice.teacher_id) === Number(user?.id) ? (
                  <Button
                    variant="secondary"
                    icon={Edit3}
                    onClick={() => navigate(ROUTES.TEACHER_NOTICE_NEW, { state: { notice } })}
                    fullWidth
                  >
                    Edit
                  </Button>
                ) : null}
                {!notice.is_read ? (
                  <Button
                    variant="outline"
                    icon={CheckCheck}
                    onClick={() => openNotice(notice)}
                    loading={markingId === notice.id}
                    fullWidth
                  >
                    Mark Read
                  </Button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>

      <Modal
        open={Boolean(selectedNotice)}
        onClose={() => setSelectedNotice(null)}
        title={selectedNotice?.title || 'Notice'}
        size="lg"
        footer={(
          <>
            {canPost && Number(selectedNotice?.teacher_id) === Number(user?.id) ? (
              <Button
                variant="secondary"
                onClick={() => navigate(ROUTES.TEACHER_NOTICE_NEW, { state: { notice: selectedNotice } })}
              >
                Edit Notice
              </Button>
            ) : null}
            <Button variant="primary" onClick={() => setSelectedNotice(null)}>
              Close
            </Button>
          </>
        )}
      >
        {selectedNotice ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={selectedNotice.is_read ? 'grey' : 'red'}>{selectedNotice.is_read ? 'Read' : 'Unread'}</Badge>
              <Badge variant="blue">{labelForCategory(selectedNotice.category)}</Badge>
              <Badge variant="green">{labelForTarget(selectedNotice.target_scope)}</Badge>
            </div>
            <div className="rounded-[22px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Posted by {selectedNotice.teacher_name || 'Teacher'} on {formatDate(selectedNotice.publish_date, 'long')}
              </p>
              {selectedNotice.expiry_date ? (
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Expires on {formatDate(selectedNotice.expiry_date, 'long')}
                </p>
              ) : null}
              {selectedNotice.class_name && selectedNotice.section_name ? (
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Targeted to {selectedNotice.class_name} {selectedNotice.section_name}
                </p>
              ) : null}
            </div>
            <div className="whitespace-pre-wrap text-sm leading-7" style={{ color: 'var(--color-text-primary)' }}>
              {selectedNotice.content}
            </div>
            {selectedNotice.attachment_path ? (
              <div className="rounded-[20px] border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                  Attachment
                </p>
                <p className="mt-2 break-all text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {selectedNotice.attachment_path}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

const StatCard = ({ title, value, tone }) => (
  <div className="rounded-[22px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
      {title}
    </p>
    <p className="mt-2 text-2xl font-bold" style={{ color: tone }}>
      {value}
    </p>
  </div>
)

const labelForCategory = (value) => CATEGORY_OPTIONS.find((item) => item.value === value)?.label || value

const labelForTarget = (value) => {
  if (value === 'teachers') return 'Teachers'
  if (value === 'my_class_only') return 'My Class Only'
  if (value === 'specific_section') return 'Specific Section'
  return value
}

export default NoticeList
