import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { getClasses, getClassOptions, getSections } from '@/api/classApi'

const PromoteStudentsModal = ({
  open,
  onClose,
  loading,
  currentSessionId,
  currentClassId,
  sessions = [],
  onConfirm,
}) => {
  const [targetSessionId, setTargetSessionId] = useState('')
  const [targetClassId, setTargetClassId] = useState('')
  const [targetSectionId, setTargetSectionId] = useState('')
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) return
    getClasses().then(r => setClasses(getClassOptions(r))).catch(() => setClasses([]))
  }, [open])

  useEffect(() => {
    if (!open) return
    setTargetSessionId('')
    setTargetClassId('')
    setTargetSectionId('')
    setSections([])
    setErrors({})
  }, [open, currentClassId, currentSessionId])

  useEffect(() => {
    if (!targetClassId) {
      setSections([])
      setTargetSectionId('')
      return
    }

    getSections(targetClassId)
      .then(r => {
        const rows = Array.isArray(r.data) ? r.data : (r.data?.sections || [])
        setSections(rows.map(section => ({ value: String(section.id), label: `Section ${section.name}` })))
      })
      .catch(() => setSections([]))
  }, [targetClassId])

  const sessionOptions = useMemo(
    () => (sessions || []).map(session => ({ value: String(session.id), label: session.name })),
    [sessions]
  )

  const submit = () => {
    const nextErrors = {}
    if (!targetSessionId) nextErrors.targetSessionId = 'Select target session'
    if (!targetClassId) nextErrors.targetClassId = 'Select target class'
    if (!targetSectionId) nextErrors.targetSectionId = 'Select target section'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onConfirm({
      new_session_id: Number(targetSessionId),
      new_class_id: Number(targetClassId),
      new_section_id: Number(targetSectionId),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Promote Students"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={submit} loading={loading}>Promote Students</Button>
        </>
      )}
    >
      <div className="space-y-4">
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Choose the next academic placement.
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Promotions will move all students with final result `pass` into the selected session, class, and section.
          </p>
        </div>

        <Select
          label="Target Session"
          value={targetSessionId}
          onChange={(e) => setTargetSessionId(e.target.value)}
          options={sessionOptions}
          error={errors.targetSessionId}
          required
        />

        <Select
          label="Target Class"
          value={targetClassId}
          onChange={(e) => setTargetClassId(e.target.value)}
          options={classes}
          error={errors.targetClassId}
          required
        />

        <Select
          label="Target Section"
          value={targetSectionId}
          onChange={(e) => setTargetSectionId(e.target.value)}
          options={sections}
          error={errors.targetSectionId}
          required
          disabled={!targetClassId}
        />
      </div>
    </Modal>
  )
}

export default PromoteStudentsModal
