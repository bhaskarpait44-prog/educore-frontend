import { useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft, CalendarClock, Layers3, School2 } from 'lucide-react'
import { getClasses, getClassOptions } from '@/api/classApi'
import { getFeeStructure } from '@/api/accountantApi'
import usePageTitle from '@/hooks/usePageTitle'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import { formatCurrency } from '@/utils/helpers'

const FREQUENCY_MULTIPLIER = {
  monthly: 12,
  quarterly: 4,
  annual: 1,
  one_time: 1,
}

const FREQUENCY_LABEL = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
  one_time: 'One Time',
}

function annualTotal(item) {
  return Number(item.amount || 0) * (FREQUENCY_MULTIPLIER[item.frequency] || 1)
}

function normalizeSessionList(rawSessions) {
  if (Array.isArray(rawSessions)) return rawSessions
  if (Array.isArray(rawSessions?.items)) return rawSessions.items
  if (Array.isArray(rawSessions?.sessions)) return rawSessions.sessions
  return []
}

function TableBlock({ className, items, compareMap, compareEnabled, compareSessionName }) {
  const totalAnnual = items.reduce((sum, item) => sum + annualTotal(item), 0)

  return (
    <section
      className="overflow-hidden rounded-[1.7rem] border"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
      >
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{className}</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Structured fee components for this class.
          </p>
        </div>
        <div className="rounded-2xl px-4 py-2 text-sm font-semibold" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#c26b12' }}>
          Total Annual Fee {formatCurrency(totalAnnual)}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>
              <th className="px-5 py-4">Component</th>
              <th className="px-5 py-4">Frequency</th>
              <th className="px-5 py-4">Amount</th>
              <th className="px-5 py-4">Annual Total</th>
              <th className="px-5 py-4">Due Day</th>
              <th className="px-5 py-4">Status</th>
              {compareEnabled ? <th className="px-5 py-4">{compareSessionName || 'Previous Session'}</th> : null}
              {compareEnabled ? <th className="px-5 py-4">Change</th> : null}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const previous = compareMap?.get(`${item.class_id}:${item.name}`) || null
              const change = previous ? Number(item.amount || 0) - Number(previous.amount || 0) : null
              const isPositive = change > 0
              const isNegative = change < 0

              return (
                <tr key={item.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.name}</div>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {FREQUENCY_LABEL[item.frequency] || item.frequency}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-5 py-4 text-sm">{formatCurrency(annualTotal(item))}</td>
                  <td className="px-5 py-4 text-sm">{item.due_day}</td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: item.is_active ? 'rgba(22,163,74,0.12)' : 'rgba(100,116,139,0.12)',
                        color: item.is_active ? '#15803d' : '#64748b',
                      }}
                    >
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {compareEnabled ? (
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {previous ? formatCurrency(previous.amount) : '—'}
                    </td>
                  ) : null}
                  {compareEnabled ? (
                    <td className="px-5 py-4 text-sm font-semibold" style={{ color: isPositive ? '#15803d' : isNegative ? '#dc2626' : 'var(--color-text-secondary)' }}>
                      {change === null ? 'New' : change === 0 ? 'No change' : `${isPositive ? '+' : '-'}${formatCurrency(Math.abs(change))}`}
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
              <td className="px-5 py-4 text-sm font-semibold" colSpan={compareEnabled ? 8 : 6}>
                Annual total for {className}: {formatCurrency(totalAnnual)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}

export default function FeeStructureView() {
  usePageTitle('View Fee Structure')

  const { toastError } = useToast()
  const { sessions, currentSession, fetchSessions, fetchCurrentSession } = useSessionStore()
  const [classes, setClasses] = useState([])
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [comparePrevious, setComparePrevious] = useState(false)
  const [rows, setRows] = useState([])
  const [previousRows, setPreviousRows] = useState([])
  const [loading, setLoading] = useState(true)

  const sessionList = useMemo(() => normalizeSessionList(sessions), [sessions])

  useEffect(() => {
    fetchSessions().catch(() => {})
    fetchCurrentSession?.()
    getClasses()
      .then((response) => setClasses(getClassOptions(response)))
      .catch(() => setClasses([]))
  }, [fetchSessions, fetchCurrentSession])

  useEffect(() => {
    if (!selectedSessionId && currentSession?.id) {
      setSelectedSessionId(String(currentSession.id))
    }
  }, [currentSession, selectedSessionId])

  const currentSessionIndex = useMemo(
    () => sessionList.findIndex((session) => String(session.id) === String(selectedSessionId)),
    [sessionList, selectedSessionId],
  )

  const previousSession = currentSessionIndex >= 0 ? sessionList[currentSessionIndex + 1] || null : null

  useEffect(() => {
    if (!selectedSessionId) return
    setLoading(true)

    Promise.all([
      getFeeStructure({ session_id: selectedSessionId, class_id: selectedClassId || undefined }),
      comparePrevious && previousSession
        ? getFeeStructure({ session_id: previousSession.id, class_id: selectedClassId || undefined })
        : Promise.resolve({ data: { items: [] } }),
    ])
      .then(([currentRes, previousRes]) => {
        setRows(currentRes.data?.items || [])
        setPreviousRows(previousRes.data?.items || [])
      })
      .catch((error) => {
        toastError(error.message || 'Failed to load fee structure')
      })
      .finally(() => setLoading(false))
  }, [comparePrevious, previousSession, selectedClassId, selectedSessionId, toastError])

  const classGroups = useMemo(() => {
    return rows.reduce((acc, item) => {
      const key = item.class_name || 'Unassigned Class'
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})
  }, [rows])

  const previousMap = useMemo(
    () => new Map(previousRows.map((item) => [`${item.class_id}:${item.name}`, item])),
    [previousRows],
  )

  const currentSessionName = sessionList.find((session) => String(session.id) === String(selectedSessionId))?.name

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Fee Structure</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Review class-wise fee components, annual totals, and compare them with the previous session.
          </p>
        </div>
      </div>

      <section
        className="grid gap-4 rounded-[1.7rem] border p-5 lg:grid-cols-4"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Session</label>
          <select
            value={selectedSessionId}
            onChange={(event) => setSelectedSessionId(event.target.value)}
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <option value="">Select session</option>
            {sessionList.map((session) => (
              <option key={session.id} value={session.id}>{session.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Class</label>
          <select
            value={selectedClassId}
            onChange={(event) => setSelectedClassId(event.target.value)}
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <option value="">All classes</option>
            {classes.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
            <span className="flex items-center gap-2">
              <ArrowRightLeft size={16} />
              Compare with last session
            </span>
            <input
              type="checkbox"
              checked={comparePrevious}
              onChange={(event) => setComparePrevious(event.target.checked)}
              disabled={!previousSession}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>
              <School2 size={14} />
              Session
            </div>
            <div className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{currentSessionName || 'Not selected'}</div>
          </div>
          <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>
              <Layers3 size={14} />
              Components
            </div>
            <div className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{rows.length}</div>
          </div>
          <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>
              <CalendarClock size={14} />
              Compare Base
            </div>
            <div className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{previousSession?.name || 'Not available'}</div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-[1.7rem]" style={{ backgroundColor: 'var(--color-surface)' }} />
          ))}
        </div>
      ) : Object.keys(classGroups).length === 0 ? (
        <div className="rounded-[1.7rem] border px-6 py-14 text-center" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>No fee structure found</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No fee components are available for the selected session and class.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(classGroups).map(([className, items]) => (
            <TableBlock
              key={className}
              className={className}
              items={items}
              compareMap={previousMap}
              compareEnabled={comparePrevious && !!previousSession}
              compareSessionName={previousSession?.name}
            />
          ))}
        </div>
      )}
    </div>
  )
}
