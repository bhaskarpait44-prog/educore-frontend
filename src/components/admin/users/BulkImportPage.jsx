import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Upload, FileSpreadsheet, CheckCircle2,
  AlertCircle, Download, Loader2, ArrowRight,
} from 'lucide-react'
import * as api from '@/api/userManagementApi'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { ROUTES } from '@/constants/app'

const STEPS = ['Download Template', 'Upload File', 'Review & Validate', 'Processing', 'Summary']
const IMPORTABLE_ROLES = ['admin', 'teacher', 'accountant', 'student']

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0]
    .split(',')
    .map(h => h.trim().replace(/^"(.*)"$/, '$1').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, ''))

  const rows = []
  for (let i = 1; i < lines.length; i += 1) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'))
    if (values.every(v => !v)) continue

    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }

  return rows
}

const BulkImportPage = () => {
  usePageTitle('Bulk Import Users')

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toastError } = useToast()
  const requestedRole = searchParams.get('role')
  const activeRole = IMPORTABLE_ROLES.includes(requestedRole) ? requestedRole : ''
  const fileRef = useRef(null)
  const pollRef = useRef(null)

  const [step, setStep] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [parseError, setParseError] = useState('')
  const [preview, setPreview] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current)
  }, [])

  const downloadTemplate = () => {
    const csv = [
      ['first_name', 'last_name', 'email', 'role', 'phone', 'employee_id', 'department', 'designation'].join(','),
      ['Priya', 'Sharma', 'priya@school.edu.in', activeRole || 'teacher', '9876543210', 'TCH-001', 'Science', 'Senior Teacher'].join(','),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'educore_user_import_template.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = async (file) => {
    if (!file.name.match(/\.(csv|xlsx)$/i)) {
      setParseError('Please upload a CSV or Excel file.')
      return
    }

    setParseError('')
    setIsLoading(true)

    try {
      const rows = parseCSV(await file.text())
      if (rows.length === 0) {
        setParseError('No data rows found in file.')
        return
      }

      const result = await api.previewImport({ rows })
      setPreview(result.data)
      setStep(2)
    } catch (e) {
      setParseError(e.message || 'Failed to parse file.')
    } finally {
      setIsLoading(false)
    }
  }

  const pollStatus = (jobId) => {
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      try {
        const response = await api.getImportStatus(jobId)
        setJobStatus(response.data)

        if (['completed', 'failed'].includes(response.data?.status)) {
          clearInterval(pollRef.current)
          pollRef.current = null
          setIsLoading(false)
          setStep(4)
        }
      } catch {
        clearInterval(pollRef.current)
        pollRef.current = null
        setIsLoading(false)
        setStep(4)
      }
    }, 1500)
  }

  const handleConfirm = async () => {
    const validRows = (preview?.results || []).filter(row => row.is_valid).map(row => row.data)
    if (!validRows.length) {
      toastError('No valid rows to import.')
      return
    }

    setIsLoading(true)
    setStep(3)

    try {
      const result = await api.confirmImport({ rows: validRows })
      pollStatus(result.data?.job_id)
    } catch (e) {
      toastError(e.message || 'Import failed')
      setIsLoading(false)
      setStep(2)
    }
  }

  const validCount = preview?.summary?.valid || 0
  const invalidCount = preview?.summary?.invalid || 0
  const totalCount = preview?.summary?.total || 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(activeRole ? `${ROUTES.USER_MANAGE}?role=${activeRole}` : ROUTES.USERS)}
          className="flex items-center gap-1.5 text-sm hover:opacity-70"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={15} />
          {activeRole ? `${activeRole.charAt(0).toUpperCase()}${activeRole.slice(1)} Users` : 'Users'}
        </button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Bulk Import Users</h1>
      </div>

      <div className="flex items-center gap-1">
        {STEPS.map((label, index) => (
          <div key={label} className="flex items-center gap-1 flex-1">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${index < step ? 'bg-green-500 text-white' : index === step ? 'text-white' : 'text-gray-400'}`}
              style={index === step ? { backgroundColor: 'var(--color-brand)' } : index < step ? {} : { backgroundColor: 'var(--color-surface-raised)' }}
            >
              {index < step ? 'OK' : index + 1}
            </div>
            {index < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 rounded-full" style={{ backgroundColor: index < step ? '#22c55e' : 'var(--color-border)' }} />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="p-8 rounded-2xl text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <FileSpreadsheet size={40} className="mx-auto mb-4" style={{ color: 'var(--color-brand)' }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Start with the template</h2>
          <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            Download the CSV template, fill in your users, then upload it in the next step.
          </p>
          <div className="text-left p-4 rounded-xl mb-6 text-sm" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
            <p className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Required columns:</p>
            <ul className="space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
              <li><code>first_name</code>, <code>last_name</code>, <code>email</code>, <code>role</code> are required</li>
              <li><code>phone</code>, <code>employee_id</code>, <code>department</code>, <code>designation</code> are optional</li>
              <li>Valid roles: <code>admin</code>, <code>teacher</code>, <code>accountant</code>, <code>student</code></li>
              <li>Passwords will be auto-generated for each user</li>
            </ul>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border"
              style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
            >
              <Download size={15} />
              Download Template
            </button>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl"
              style={{ backgroundColor: 'var(--color-brand)' }}
            >
              I have my file
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              const droppedFile = e.dataTransfer.files[0]
              if (droppedFile) handleFile(droppedFile)
            }}
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center p-12 rounded-2xl cursor-pointer transition-all"
            style={{
              border: `2px dashed ${isDragging ? 'var(--color-brand)' : 'var(--color-border)'}`,
              backgroundColor: isDragging ? '#eff6ff' : 'var(--color-surface)',
            }}
          >
            <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
            {isLoading ? (
              <>
                <Loader2 size={32} className="animate-spin mb-3" style={{ color: 'var(--color-brand)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Validating file...</p>
              </>
            ) : (
              <>
                <Upload size={32} className="mb-3" style={{ color: isDragging ? 'var(--color-brand)' : 'var(--color-text-muted)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Drag and drop your CSV file here</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>or click to browse. CSV and XLSX accepted.</p>
              </>
            )}
          </div>
          {parseError && (
            <div className="flex items-start gap-3 p-3 rounded-xl text-sm" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {parseError}
            </div>
          )}
          <button onClick={() => setStep(0)} className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Back
          </button>
        </div>
      )}

      {step === 2 && preview && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Rows', value: totalCount, color: 'var(--color-text-primary)' },
              { label: 'Valid Rows', value: validCount, color: '#16a34a' },
              { label: 'Error Rows', value: invalidCount, color: invalidCount > 0 ? '#dc2626' : '#16a34a' },
            ].map(card => (
              <div key={card.label} className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{card.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl overflow-hidden max-h-80 overflow-y-auto" style={{ border: '1px solid var(--color-border)' }}>
            <div className="sticky top-0 grid grid-cols-5 gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ backgroundColor: 'var(--color-surface-raised)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              <span>Row</span>
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
            </div>
            {preview.results.map((row, index) => (
              <div
                key={`${row.row_number}-${index}`}
                className={`grid grid-cols-5 gap-2 px-4 py-3 text-sm ${row.is_valid ? '' : 'bg-red-50'}`}
                style={{ borderBottom: index < preview.results.length - 1 ? '1px solid var(--color-border)' : 'none' }}
              >
                <span style={{ color: 'var(--color-text-muted)' }}>#{row.row_number}</span>
                <span style={{ color: 'var(--color-text-primary)' }}>{row.data.first_name} {row.data.last_name}</span>
                <span className="truncate" style={{ color: 'var(--color-text-secondary)' }}>{row.data.email}</span>
                <span className="capitalize" style={{ color: 'var(--color-text-secondary)' }}>{row.data.role}</span>
                <span>
                  {row.is_valid ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 size={13} />
                      Valid
                    </span>
                  ) : (
                    <span className="text-xs text-red-600" title={row.errors?.join(' | ')}>
                      {row.errors?.[0]}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setStep(1); setPreview(null) }} className="px-4 py-2.5 rounded-xl text-sm border" style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>
              Re-upload
            </button>
            <button onClick={handleConfirm} disabled={validCount === 0} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: 'var(--color-brand)' }}>
              Import {validCount} valid user{validCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="p-12 rounded-2xl text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: 'var(--color-brand)' }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Importing users...</h2>
          {jobStatus && (
            <div className="mt-4">
              <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${jobStatus.total_rows > 0 ? (jobStatus.success_count / jobStatus.total_rows) * 100 : 0}%`, backgroundColor: 'var(--color-brand)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{jobStatus.success_count} of {jobStatus.total_rows} created</p>
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="p-8 rounded-2xl text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <CheckCircle2 size={40} className="mx-auto mb-4" style={{ color: '#16a34a' }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Import Complete</h2>
          {jobStatus && (
            <div className="grid grid-cols-2 gap-4 mt-6 mb-8">
              <div className="p-4 rounded-xl" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <p className="text-3xl font-bold" style={{ color: '#16a34a' }}>{jobStatus.success_count}</p>
                <p className="text-sm mt-1" style={{ color: '#15803d' }}>Users created</p>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: jobStatus.failed_count > 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${jobStatus.failed_count > 0 ? '#fecaca' : '#bbf7d0'}` }}>
                <p className="text-3xl font-bold" style={{ color: jobStatus.failed_count > 0 ? '#dc2626' : '#16a34a' }}>{jobStatus.failed_count}</p>
                <p className="text-sm mt-1" style={{ color: jobStatus.failed_count > 0 ? '#991b1b' : '#15803d' }}>Failed</p>
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setStep(0); setPreview(null); setJobStatus(null) }} className="px-4 py-2.5 text-sm font-medium rounded-xl border" style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>
              Import More
            </button>
            <button
              onClick={() => navigate(activeRole ? `${ROUTES.USER_MANAGE}?role=${activeRole}` : ROUTES.USERS)}
              className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl"
              style={{ backgroundColor: 'var(--color-brand)' }}
            >
              View All Users
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BulkImportPage
