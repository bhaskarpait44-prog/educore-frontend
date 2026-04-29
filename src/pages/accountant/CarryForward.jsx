import { useEffect, useMemo, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency } from '@/utils/helpers'
import useSessionStore from '@/store/sessionStore'

const CarryForward = () => {
  usePageTitle('Carry Forward')
  const [rows, setRows] = useState([])
  const [fromSessionId, setFromSessionId] = useState('')
  const [toSessionId, setToSessionId] = useState('')
  const { sessions, currentSession, fetchSessions, fetchCurrentSession } = useSessionStore()

  useEffect(() => {
    fetchSessions().catch(() => {})
    fetchCurrentSession().catch(() => {})
    accountantApi.getCarryForwardEligible().then((response) => setRows(response.data?.students || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (currentSession?.id && !fromSessionId) setFromSessionId(String(currentSession.id))
  }, [currentSession, fromSessionId])

  const nextSession = useMemo(
    () => (sessions || []).find((session) => String(session.id) !== String(fromSessionId)),
    [sessions, fromSessionId]
  )

  useEffect(() => {
    if (nextSession?.id && !toSessionId) setToSessionId(String(nextSession.id))
  }, [nextSession, toSessionId])

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Carry Forward</h1>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <select value={fromSessionId} onChange={(event) => setFromSessionId(event.target.value)} className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
            <option value="">From Session</option>
            {(sessions || []).map((session) => <option key={session.id} value={session.id}>{session.name}</option>)}
          </select>
          <select value={toSessionId} onChange={(event) => setToSessionId(event.target.value)} className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
            <option value="">To Session</option>
            {(sessions || []).map((session) => <option key={session.id} value={session.id}>{session.name}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.student_id} className="flex items-center justify-between rounded-[22px] border px-4 py-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.student_name}</div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.class_name} • {row.invoices_count} invoices</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-red-700">{formatCurrency(row.total_pending)}</div>
              <button
                type="button"
                onClick={() => accountantApi.carryForwardSingle({ student_id: row.student_id, from_session_id: fromSessionId, to_session_id: toSessionId }).catch(() => {})}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                Carry Forward
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CarryForward
