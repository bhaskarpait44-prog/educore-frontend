import { useEffect, useMemo, useState } from 'react'
import { BookOpenText, Download, Eye, FileText, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import * as studentApi from '@/api/studentApi'
import { formatDate } from '@/utils/helpers'
import { isStudentPortalSetupError } from '@/utils/studentPortal'

const StudyMaterials = () => {
  usePageTitle('Study Materials')

  const { toastError, toastInfo } = useToast()
  const [materials, setMaterials] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState(null)

  const subjectOptions = useMemo(
    () => ['all', ...new Map(materials.map((item) => [item.subject_name, item.subject_name])).values()],
    [materials]
  )

  const filteredMaterials = useMemo(() => {
    if (selectedSubject === 'all') return materials
    return materials.filter((item) => item.subject_name === selectedSubject)
  }, [materials, selectedSubject])

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  useEffect(() => {
    loadMaterials().catch(() => {})
  }, [])

  const loadMaterials = async ({ silent = false } = {}) => {
    setError(null)
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await studentApi.getStudentMaterials()
      setMaterials(res?.data?.materials || [])
      setLoading(false)
      setRefreshing(false)
    } catch (err) {
      if (isStudentPortalSetupError(err)) {
        setMaterials([])
        setLoading(false)
        setRefreshing(false)
        return
      }

      setError(err?.message || 'Unable to load study materials.')
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    toastInfo('Refreshing study materials')
    await loadMaterials({ silent: true })
  }

  const handleOpenMaterial = async (materialId) => {
    setDetailLoading(true)
    try {
      const res = await studentApi.getStudentMaterialDetail(materialId)
      setSelectedMaterial(res?.data || null)
      setDetailLoading(false)
    } catch (err) {
      setDetailLoading(false)
      toastError(err?.message || 'Unable to open study material.')
    }
  }

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(109,40,217,0.16), rgba(34,197,94,0.06) 52%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--student-accent)' }}>
              Materials
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Study Materials</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
              Open notes, worksheets, and subject resources shared by your teachers for your class.
            </p>
          </div>

          <Button variant="secondary" onClick={handleRefresh} loading={refreshing} icon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </section>

      <section
        className="rounded-[28px] border p-5"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              Filter by Subject
            </span>
            <select
              value={selectedSubject}
              onChange={(event) => setSelectedSubject(event.target.value)}
              className="min-h-12 w-full rounded-[20px] border px-4 py-3 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>
                  {subject === 'all' ? 'All subjects' : subject}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-[20px] border px-4 py-3 text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Available Items</p>
            <p className="mt-1 font-semibold text-[var(--color-text-primary)]">{filteredMaterials.length}</p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 rounded-[26px] bg-[var(--color-surface)]" />
          ))}
        </div>
      ) : filteredMaterials.length > 0 ? (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredMaterials.map((item) => (
            <article
              key={item.id}
              className="rounded-[26px] border p-5"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                boxShadow: '0 14px 34px rgba(76,29,149,0.05)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[rgba(124,58,237,0.10)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--student-accent)]">
                      {item.subject_name}
                    </span>
                    <span className="rounded-full bg-[rgba(37,99,235,0.10)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
                      {prettyFileType(item.file_type)}
                    </span>
                  </div>

                  <h2 className="mt-3 text-lg font-semibold text-[var(--color-text-primary)]">{item.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-[var(--color-text-secondary)]">
                    {item.description || 'Study material shared by your teacher.'}
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(124,58,237,0.10)] text-[var(--student-accent)]">
                  <FileText size={20} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <InfoCard label="Teacher" value={item.teacher_name} />
                <InfoCard label="Added" value={formatDate(item.created_at, 'short')} />
                <InfoCard label="Size" value={formatFileSize(item.file_size)} />
                <InfoCard label="Viewed" value={item.last_viewed_at ? formatDate(item.last_viewed_at, 'short') : 'Not yet'} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => handleOpenMaterial(item.id)} icon={Eye}>
                  Open Detail
                </Button>
                {item.file_path ? (
                  <Button size="sm" variant="secondary" onClick={() => window.open(item.file_path, '_blank', 'noopener,noreferrer')} icon={Download}>
                    Open File
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          icon={BookOpenText}
          title="No study materials available"
          description="New teacher-uploaded notes and resources will appear here."
        />
      )}

      <Modal
        open={Boolean(selectedMaterial) || detailLoading}
        onClose={() => setSelectedMaterial(null)}
        title={selectedMaterial?.title || 'Study Material'}
        size="lg"
      >
        {detailLoading && !selectedMaterial ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 rounded-2xl bg-[var(--color-surface-raised)]" />
            <div className="h-48 rounded-2xl bg-[var(--color-surface-raised)]" />
          </div>
        ) : selectedMaterial ? (
          <div className="space-y-4">
            <InfoCard label="Subject" value={selectedMaterial.subject_name} />
            <InfoCard label="Teacher" value={selectedMaterial.teacher_name} />
            <InfoCard label="Created" value={formatDate(selectedMaterial.created_at, 'long')} />
            <InfoCard label="File Type" value={prettyFileType(selectedMaterial.file_type)} />
            <InfoCard label="File Size" value={formatFileSize(selectedMaterial.file_size)} />
            <InfoCard label="Description" value={selectedMaterial.description || 'No description provided.'} />
            <InfoCard label="File Path" value={selectedMaterial.file_path || 'No file path available.'} />

            {selectedMaterial.file_path ? (
              <div className="flex justify-end">
                <Button onClick={() => window.open(selectedMaterial.file_path, '_blank', 'noopener,noreferrer')} icon={Download}>
                  Open Material File
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

const InfoCard = ({ label, value }) => (
  <div className="rounded-[20px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-2 text-sm text-[var(--color-text-primary)]">{value || '--'}</p>
  </div>
)

function prettyFileType(value) {
  return String(value || 'file')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatFileSize(value) {
  const size = Number(value || 0)
  if (!size) return 'Unknown'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default StudyMaterials
