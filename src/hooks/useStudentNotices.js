import { useCallback, useEffect, useState } from 'react'
import * as studentApi from '@/api/studentApi'
import { isStudentPortalSetupError } from '@/utils/studentPortal'

const useStudentNotices = () => {
  const [notices, setNotices] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async ({ silent = false, category } = {}) => {
    setError(null)
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await studentApi.getStudentNotices(category && category !== 'all' ? { category } : {})
      const rows = res?.data?.notices || []
      setNotices(rows)
      setUnreadCount(Number(res?.data?.unread_count || 0))
      setLoading(false)
      setRefreshing(false)
      return rows
    } catch (err) {
      if (isStudentPortalSetupError(err)) {
        setNotices([])
        setUnreadCount(0)
        setLoading(false)
        setRefreshing(false)
        return []
      }

      setError(err?.message || 'Unable to load notices.')
      setLoading(false)
      setRefreshing(false)
      throw err
    }
  }, [])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  const markRead = useCallback(async (noticeId) => {
    setActionId(noticeId)
    try {
      await studentApi.markStudentNoticeRead(noticeId)
      setNotices((prev) => prev.map((notice) => (
        Number(notice.id) === Number(noticeId) ? { ...notice, is_read: true } : notice
      )))
      setUnreadCount((prev) => Math.max(prev - 1, 0))
      setActionId(null)
    } catch (err) {
      setActionId(null)
      throw err
    }
  }, [])

  const togglePin = useCallback(async (notice) => {
    setActionId(notice.id)
    try {
      if (notice.is_pinned) await studentApi.unpinStudentNotice(notice.id)
      else await studentApi.pinStudentNotice(notice.id)

      setNotices((prev) => prev
        .map((row) => Number(row.id) === Number(notice.id) ? { ...row, is_pinned: !row.is_pinned } : row)
        .sort(sortNotices))
      setActionId(null)
    } catch (err) {
      setActionId(null)
      throw err
    }
  }, [])

  return {
    notices,
    unreadCount,
    loading,
    refreshing,
    actionId,
    error,
    refresh: (category) => load({ silent: true, category }),
    loadCategory: (category) => load({ category }),
    markRead,
    togglePin,
  }
}

function sortNotices(a, b) {
  if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) return a.is_pinned ? -1 : 1
  if (Boolean(a.is_read) !== Boolean(b.is_read)) return a.is_read ? 1 : -1
  return String(b.publish_date || '').localeCompare(String(a.publish_date || ''))
}

export default useStudentNotices
