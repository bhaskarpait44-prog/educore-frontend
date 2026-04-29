import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency } from '@/utils/helpers'

const StudentSearchBox = ({ onSelect, autoFocus = false }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }

    const timer = window.setTimeout(async () => {
      try {
        const response = await accountantApi.searchStudents({ q: query })
        setResults(response.data?.students || [])
        setActiveIndex(0)
      } catch {
        setResults([])
      }
    }, 180)

    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
    }
    if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault()
      onSelect(results[activeIndex])
      setQuery(`${results[activeIndex].first_name} ${results[activeIndex].last_name}`)
      setResults([])
    }
  }

  return (
    <div className="relative">
      <div
        className="flex items-center gap-3 rounded-[22px] border px-4 py-3"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <Search size={18} style={{ color: 'var(--color-text-muted)' }} />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by student name or admission number"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--color-text-primary)' }}
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setResults([]) }}>
            <X size={16} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div
          className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-[22px] border"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          {results.map((student, index) => (
            <button
              key={student.id}
              type="button"
              onClick={() => {
                onSelect(student)
                setQuery(`${student.first_name} ${student.last_name}`)
                setResults([])
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
              style={{ backgroundColor: index === activeIndex ? '#fff7ed' : 'transparent' }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                {student.first_name?.[0]}{student.last_name?.[0]}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {student.first_name} {student.last_name}
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {student.admission_no} | {student.class_name || '-'} {student.section_name ? `Section ${student.section_name}` : ''}
                </div>
              </div>
              <div
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: Number(student.pending_amount || 0) > 0 ? '#fef2f2' : '#ecfdf5', color: Number(student.pending_amount || 0) > 0 ? '#dc2626' : '#15803d' }}
              >
                {formatCurrency(student.pending_amount || 0)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default StudentSearchBox
