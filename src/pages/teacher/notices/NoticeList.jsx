import { useMemo, useState } from 'react'
import {
  BellPlus,
  BellRing,
  CheckCheck,
  Edit3,
  Eye,
  Filter,
  Search,
  UserRoundPlus,
  CalendarDays,
  User2,
  Users,
  Paperclip,
  Clock,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import usePageTitle from '@/hooks/usePageTitle'
import usePermissions from '@/hooks/usePermissions'
import useTeacherNotices from '@/hooks/useTeacherNotices'
import useToast from '@/hooks/useToast'
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

const CATEGORY_BADGE_VARIANT = {
  general: 'blue',
  homework: 'purple',
  exam: 'red',
  event: 'green',
  holiday: 'teal',
  other: 'grey',
}

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

  const filteredNotices = useMemo(
    () =>
      notices.filter((notice) => {
        const haystack =
          `${notice.title} ${notice.content} ${notice.teacher_name || ''}`.toLowerCase()
        const matchesSearch =
          !filters.search.trim() ||
          haystack.includes(filters.search.trim().toLowerCase())
        const matchesCategory =
          !filters.category || notice.category === filters.category
        const matchesRead =
          !filters.readState ||
          (filters.readState === 'read' ? notice.is_read : !notice.is_read)
        const matchesMine =
          !filters.mineOnly || Number(notice.teacher_id) === Number(user?.id)
        return matchesSearch && matchesCategory && matchesRead && matchesMine
      }),
    [filters, notices, user?.id],
  )

  const stats = useMemo(
    () =>
      filteredNotices.reduce(
        (acc, notice) => {
          acc.total += 1
          if (!notice.is_read) acc.unread += 1
          if (Number(notice.teacher_id) === Number(user?.id)) acc.mine += 1
          if (notice.target_scope === 'my_class_only') acc.classOnly += 1
          return acc
        },
        { total: 0, unread: 0, mine: 0, classOnly: 0 },
      ),
    [filteredNotices, user?.id],
  )

  const openNotice = async (notice) => {
    setSelectedNotice(notice)
    if (!notice.is_read) {
      try {
        setMarkingId(notice.id)
        await markAsRead(notice.id)
        toastSuccess('Notice marked as read.')
        setSelectedNotice((prev) =>
          prev
            ? {
                ...prev,
                is_read: true,
                read_count: Number(prev.read_count || 0) + 1,
              }
            : prev,
        )
      } catch (error) {
        toastError(error?.message || 'Unable to mark notice as read.')
      } finally {
        setMarkingId(null)
      }
    }
  }

  const isMyNotice = (notice) =>
    Number(notice?.teacher_id) === Number(user?.id)

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <section
        className="rounded-[24px] border px-4 py-3 sm:px-5 sm:py-4"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        {/* Top row: icon + title + buttons */}
        <div className="flex items-center gap-3">
          {/* Icon pill */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'rgba(13,148,136,0.12)' }}
          >
            <BellRing size={16} style={{ color: '#0f766e' }} />
          </div>

          {/* Title block */}
          <div className="min-w-0 flex-1">
            <h1
              className="text-base font-semibold leading-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Notice Board
            </h1>
            <p
              className="truncate text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Manage and view all teacher &amp; class notices
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="secondary"
              icon={UserRoundPlus}
              size="sm"
              onClick={() =>
                navigate(ROUTES.TEACHER_NOTICE_NEW, {
                  state: { targetMode: 'student' },
                })
              }
            >
              <span className="hidden sm:inline">Student Notice</span>
            </Button>
            <Button
              variant="primary"
              icon={BellPlus}
              size="sm"
              onClick={() => navigate(ROUTES.TEACHER_NOTICE_NEW)}
            >
              <span className="hidden sm:inline">Create</span>
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div
          className="my-3 h-px"
          style={{ backgroundColor: 'var(--color-border)' }}
        />

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          <CompactStat label="Total" value={stats.total} color="#0f766e" />
          <CompactStat label="Unread" value={stats.unread} color="#ef4444" />
          <CompactStat label="My Posts" value={stats.mine} color="#14b8a6" />
          <CompactStat label="Class Only" value={stats.classOnly} color="#10b981" />
        </div>
      </section>

      {/* ── Filters ── */}
      <section
        className="rounded-[18px] border px-3 py-3"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
          >
            <Filter size={13} style={{ color: 'var(--color-text-muted)' }} />
          </div>

          <div className="relative flex-1 min-w-[130px]">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Search notices…"
              className="w-full rounded-[10px] border py-1.5 pl-7 pr-3 text-xs outline-none transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface-raised)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <select
            value={filters.category}
            onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
            className="rounded-[10px] border py-1.5 px-2.5 text-xs outline-none"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface-raised)',
              color: filters.category ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            }}
          >
            <option value="">All categories</option>
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            value={filters.readState}
            onChange={(e) => setFilters((prev) => ({ ...prev, readState: e.target.value }))}
            className="rounded-[10px] border py-1.5 px-2.5 text-xs outline-none"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface-raised)',
              color: filters.readState ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            }}
          >
            <option value="">All status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>

          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, mineOnly: !prev.mineOnly }))}
            className="rounded-[10px] border px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              borderColor: filters.mineOnly ? '#0f766e' : 'var(--color-border)',
              backgroundColor: filters.mineOnly ? '#0f766e' : 'var(--color-surface-raised)',
              color: filters.mineOnly ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            Mine only
          </button>
        </div>
      </section>

      {/* ── Notice Cards ── */}
      <section className="space-y-4">
        {loadingBase || loadingNotices ? (
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-[28px]"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            />
          ))
        ) : filteredNotices.length === 0 ? (
          <EmptyState
            icon={BellRing}
            title="No notices found"
            description="There are no notices matching your current filters."
            action={
              canPost ? (
                <Button
                  variant="primary"
                  onClick={() => navigate(ROUTES.TEACHER_NOTICE_NEW)}
                >
                  Create Notice
                </Button>
              ) : null
            }
          />
        ) : (
          filteredNotices.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              userId={user?.id}
              canPost={canPost}
              markingId={markingId}
              onOpen={openNotice}
              onEdit={() =>
                navigate(ROUTES.TEACHER_NOTICE_NEW, {
                  state: { notice },
                })
              }
            />
          ))
        )}
      </section>

      {/* ── Detail Modal ── */}
      <Modal
        open={Boolean(selectedNotice)}
        onClose={() => setSelectedNotice(null)}
        title=""
        size="xl"
        footer={
          <>
            {canPost && isMyNotice(selectedNotice) ? (
              <Button
                variant="secondary"
                icon={Edit3}
                onClick={() =>
                  navigate(ROUTES.TEACHER_NOTICE_NEW, {
                    state: { notice: selectedNotice },
                  })
                }
              >
                Edit Notice
              </Button>
            ) : null}
            <Button
              variant="primary"
              onClick={() => setSelectedNotice(null)}
            >
              Close
            </Button>
          </>
        }
      >
        {selectedNotice ? (
          <NoticeDetail notice={selectedNotice} />
        ) : null}
      </Modal>
    </div>
  )
}

/* ─────────────────────────────────────────
   NoticeCard
───────────────────────────────────────── */
const CATEGORY_ACCENT = {
  general:  { bg: 'rgba(56,130,221,0.08)',  border: 'rgba(56,130,221,0.22)',  dot: '#378ADD' },
  homework: { bg: 'rgba(127,119,221,0.08)', border: 'rgba(127,119,221,0.22)', dot: '#7F77DD' },
  exam:     { bg: 'rgba(226,75,74,0.08)',   border: 'rgba(226,75,74,0.22)',   dot: '#E24B4A' },
  event:    { bg: 'rgba(99,153,34,0.08)',   border: 'rgba(99,153,34,0.22)',   dot: '#639922' },
  holiday:  { bg: 'rgba(29,158,117,0.08)',  border: 'rgba(29,158,117,0.22)',  dot: '#1D9E75' },
  other:    { bg: 'rgba(136,135,128,0.08)', border: 'rgba(136,135,128,0.22)', dot: '#888780' },
}

const NoticeCard = ({ notice, userId, canPost, markingId, onOpen, onEdit }) => {
  const isOwn = Number(notice.teacher_id) === Number(userId)
  const accent = CATEGORY_ACCENT[notice.category] || CATEGORY_ACCENT.other

  return (
    <article
      className="overflow-hidden rounded-[22px] border transition-all duration-200 hover:-translate-y-[1px]"
      style={{
        borderColor: notice.is_read ? 'var(--color-border)' : 'rgba(226,75,74,0.3)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {/* Coloured top accent bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: accent.dot, opacity: notice.is_read ? 0.35 : 0.8 }}
      />

      <div className="p-5 sm:p-6">
        {/* ── Top row: category icon + title + unread dot ── */}
        <div className="flex items-start gap-3">
          {/* Category icon box */}
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border"
            style={{ backgroundColor: accent.bg, borderColor: accent.border }}
          >
            <CategoryIcon category={notice.category} color={accent.dot} />
          </div>

          {/* Title + badges */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {!notice.is_read && (
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: '#E24B4A' }}
                />
              )}
              <Badge variant={CATEGORY_BADGE_VARIANT[notice.category] || 'blue'}>
                {labelForCategory(notice.category)}
              </Badge>
              <Badge variant="green">{labelForTarget(notice.target_scope)}</Badge>
              {isOwn && <Badge variant="yellow">Mine</Badge>}
            </div>
            <h3
              className="text-[16px] font-semibold leading-snug"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {notice.title}
            </h3>
          </div>

          {/* Read badge pushed right */}
          <span
            className="mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={
              notice.is_read
                ? { backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }
                : { backgroundColor: 'rgba(226,75,74,0.1)', color: '#A32D2D' }
            }
          >
            {notice.is_read ? 'Read' : 'Unread'}
          </span>
        </div>

        {/* ── Content preview ── */}
        <p
          className="mt-3 line-clamp-2 text-sm leading-[1.7]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {notice.content}
        </p>

        {/* ── Meta strip ── */}
        <div
          className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-[14px] px-3 py-2.5"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
        >
          <MetaItem icon={User2}>{notice.teacher_name || 'Teacher'}</MetaItem>
          <MetaDot />
          <MetaItem icon={CalendarDays}>{formatDate(notice.publish_date, 'long')}</MetaItem>
          <MetaDot />
          <MetaItem icon={Users}>{notice.read_count || 0} read</MetaItem>
          {notice.expiry_date ? (
            <>
              <MetaDot />
              <MetaItem icon={Clock} warn>
                Expires {formatDate(notice.expiry_date, 'short')}
              </MetaItem>
            </>
          ) : null}
        </div>
      </div>

      {/* ── Action footer ── */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 sm:px-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={Eye} onClick={() => onOpen(notice)} size="sm">
            Open Notice
          </Button>
          {canPost && isOwn ? (
            <Button variant="secondary" icon={Edit3} onClick={onEdit} size="sm">
              Edit
            </Button>
          ) : null}
        </div>
        {!notice.is_read ? (
          <Button
            variant="outline"
            icon={CheckCheck}
            onClick={() => onOpen(notice)}
            loading={markingId === notice.id}
            size="sm"
          >
            Mark as Read
          </Button>
        ) : (
          <span
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <CheckCheck size={13} />
            Marked read
          </span>
        )}
      </div>
    </article>
  )
}

/* ─────────────────────────────────────────
   NoticeDetail  (modal body)
───────────────────────────────────────── */
const NoticeDetail = ({ notice }) => {
  const accent = CATEGORY_ACCENT[notice.category] || CATEGORY_ACCENT.other

  return (
    <div>
      {/* ── Hero band ── */}
      <div
        className="rounded-[18px] border p-5 mb-5"
        style={{ backgroundColor: accent.bg, borderColor: accent.border }}
      >
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ backgroundColor: accent.dot + '22', color: accent.dot }}
          >
            <CategoryIcon category={notice.category} color={accent.dot} size={11} />
            {labelForCategory(notice.category)}
          </span>
          <Badge variant="green">{labelForTarget(notice.target_scope)}</Badge>
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={
              notice.is_read
                ? { backgroundColor: 'rgba(136,135,128,0.15)', color: '#5F5E5A' }
                : { backgroundColor: 'rgba(226,75,74,0.12)', color: '#A32D2D' }
            }
          >
            {notice.is_read ? '✓ Read' : '● Unread'}
          </span>
        </div>

        {/* Title */}
        <h2
          className="text-[22px] font-bold leading-tight sm:text-[26px]"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {notice.title}
        </h2>

        {/* Byline */}
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Posted by{' '}
          <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {notice.teacher_name || 'Teacher'}
          </span>
          {' · '}
          {formatDate(notice.publish_date, 'long')}
        </p>
      </div>

      {/* ── Meta cards row ── */}
      <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
        <ModalMetaCard icon={CalendarDays} label="Published" value={formatDate(notice.publish_date, 'long')} />
        <ModalMetaCard icon={User2} label="Posted By" value={notice.teacher_name || 'Teacher'} />
        <ModalMetaCard
          icon={Users}
          label="Read By"
          value={`${notice.read_count || 0} teacher${notice.read_count !== 1 ? 's' : ''}`}
        />
        <ModalMetaCard
          icon={Clock}
          label="Expires"
          value={notice.expiry_date ? formatDate(notice.expiry_date, 'long') : 'No expiry'}
          warn={Boolean(notice.expiry_date)}
        />
      </div>

      {/* ── Target class ── */}
      {notice.class_name && notice.section_name ? (
        <div
          className="flex items-center gap-2.5 rounded-[14px] border px-4 py-3 mb-5"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
        >
          <Users size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Targeted to{' '}
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {notice.class_name} – {notice.section_name}
            </span>
          </p>
        </div>
      ) : null}

      {/* ── Notice body ── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          <div
            className="h-px flex-1"
            style={{ backgroundColor: 'var(--color-border)' }}
          />
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.15em] px-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Notice Content
          </p>
          <div
            className="h-px flex-1"
            style={{ backgroundColor: 'var(--color-border)' }}
          />
        </div>
        <div
          className="rounded-[18px] border px-5 py-5"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface-raised)',
          }}
        >
          <p
            className="whitespace-pre-wrap text-[15px] leading-[1.9]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {notice.content}
          </p>
        </div>
      </div>

      {/* ── Attachment ── */}
      {notice.attachment_path ? (
        <div
          className="flex items-start gap-3 rounded-[14px] border px-4 py-3.5"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
            style={{ backgroundColor: 'rgba(56,130,221,0.1)' }}
          >
            <Paperclip size={14} style={{ color: '#378ADD' }} />
          </div>
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Attachment
            </p>
            <p className="break-all text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {notice.attachment_path}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ─────────────────────────────────────────
   Small helpers
───────────────────────────────────────── */
const CompactStat = ({ label, value, color }) => (
  <div
    className="flex flex-col items-center justify-center rounded-[14px] py-2"
    style={{ backgroundColor: 'var(--color-surface-raised)' }}
  >
    <p
      className="text-lg font-bold leading-none"
      style={{ color }}
    >
      {value}
    </p>
    <p
      className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em]"
      style={{ color: 'var(--color-text-muted)' }}
    >
      {label}
    </p>
  </div>
)

const MetaItem = ({ icon: Icon, children, warn }) => (
  <span
    className="inline-flex items-center gap-1 text-xs font-medium"
    style={{ color: warn ? '#854F0B' : 'var(--color-text-secondary)' }}
  >
    <Icon size={11} style={{ flexShrink: 0 }} />
    {children}
  </span>
)

const MetaDot = () => (
  <span
    className="inline-block h-1 w-1 rounded-full"
    style={{ backgroundColor: 'var(--color-text-muted)', opacity: 0.5 }}
  />
)

const ModalMetaCard = ({ icon: Icon, label, value, warn }) => (
  <div
    className="rounded-[14px] border px-3 py-3"
    style={{
      borderColor: warn ? 'rgba(186,117,23,0.25)' : 'var(--color-border)',
      backgroundColor: warn ? 'rgba(250,238,218,0.4)' : 'var(--color-surface-raised)',
    }}
  >
    <div className="flex items-center gap-1.5 mb-1.5">
      <Icon size={12} style={{ color: warn ? '#854F0B' : 'var(--color-text-muted)', flexShrink: 0 }} />
      <p
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: warn ? '#854F0B' : 'var(--color-text-muted)' }}
      >
        {label}
      </p>
    </div>
    <p
      className="text-[13px] font-semibold leading-snug"
      style={{ color: 'var(--color-text-primary)' }}
    >
      {value}
    </p>
  </div>
)

const CategoryIcon = ({ category, color, size = 14 }) => {
  const props = { size, style: { color, flexShrink: 0 } }
  if (category === 'exam')     return <Eye {...props} />
  if (category === 'homework') return <Edit3 {...props} />
  if (category === 'event')    return <CalendarDays {...props} />
  if (category === 'holiday')  return <Clock {...props} />
  if (category === 'general')  return <BellRing {...props} />
  return <BellRing {...props} />
}

const labelForCategory = (value) =>
  CATEGORY_OPTIONS.find((item) => item.value === value)?.label || value

const labelForTarget = (value) => {
  if (value === 'teachers') return 'Teachers'
  if (value === 'my_class_only') return 'My Class Only'
  if (value === 'specific_section') return 'Specific Section'
  return value
}

export default NoticeList