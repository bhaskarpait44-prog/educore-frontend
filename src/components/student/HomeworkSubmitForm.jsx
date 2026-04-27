import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'

const HomeworkSubmitForm = ({ homework, loading, onSubmit }) => {
  const [submissionContent, setSubmissionContent] = useState('')
  const [attachmentPath, setAttachmentPath] = useState('')

  useEffect(() => {
    setSubmissionContent(homework?.submission_content || '')
    setAttachmentPath(homework?.submission_attachment_path || '')
  }, [homework?.id, homework?.submission_content, homework?.submission_attachment_path])

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onSubmit?.({
      submission_content: submissionContent.trim() || null,
      attachment_path: attachmentPath.trim() || null,
    })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Submission Content
        </span>
        <textarea
          value={submissionContent}
          onChange={(event) => setSubmissionContent(event.target.value)}
          rows={5}
          className="w-full rounded-[20px] border px-4 py-3 text-sm"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          placeholder="Write your answer or summary of submitted work"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Attachment Path
        </span>
        <input
          type="text"
          value={attachmentPath}
          onChange={(event) => setAttachmentPath(event.target.value)}
          className="w-full rounded-[20px] border px-4 py-3 text-sm"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          placeholder="Optional file path or uploaded file reference"
        />
      </label>

      <div className="rounded-[20px] border px-4 py-4 text-sm text-[var(--color-text-secondary)]" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
        Review your content before submitting. If your teacher already graded this homework, the grade will stay visible after resubmission.
      </div>

      <Button type="submit" loading={loading} fullWidth>
        Submit Homework
      </Button>
    </form>
  )
}

export default HomeworkSubmitForm
