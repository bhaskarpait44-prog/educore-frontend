// src/pages/exams/ReportCardModal.jsx
import { useEffect, useRef } from 'react'
import { Printer, Download, GraduationCap } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import useExamStore from '@/store/examStore'
import { formatDate, formatPercent } from '@/utils/helpers'
import { APP_NAME } from '@/constants/app'

const GRADE_COLOR = {
  'A+':'#15803d','A':'#16a34a','B+':'#2563eb',
  'B':'#1d4ed8','C':'#d97706','D':'#ea580c','F':'#dc2626'
}

const RESULT_COLOR = {
  pass:'#16a34a', fail:'#dc2626', compartment:'#d97706', detained:'#7f1d1d'
}

const ReportCardModal = ({ open, student, onClose }) => {
  const { studentResult, fetchStudentResult } = useExamStore()
  const printRef = useRef(null)

  useEffect(() => {
    if (open && student?.enrollment_id) {
      fetchStudentResult(student.enrollment_id).catch(() => {})
    }
  }, [open, student])

  const handlePrint = () => {
    const content = printRef.current?.innerHTML
    if (!content) return
    const win = window.open('', '_blank')
    win.document.write(`
      <html>
        <head>
          <title>Report Card — ${student?.student_name}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Georgia', serif; font-size: 12px; color: #111; padding: 20px; }
            h1 { font-size: 20px; } h2 { font-size: 15px; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; }
            th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
            th { background: #f4f4f4; font-weight: 600; }
            .pass { color: #16a34a; } .fail { color: #dc2626; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 16px; }
            .grade-box { display: inline-block; padding: 4px 12px; border-radius: 6px; font-weight: 700; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `)
    win.document.close()
    win.print()
  }

  const subjectResults = studentResult?.subject_results || []
  const examSummaries = studentResult?.exam_summaries || []
  const finalResult    = studentResult?.final_result    || student
  const gradeColor     = GRADE_COLOR[finalResult?.grade]  || '#333'
  const resultColor    = RESULT_COLOR[finalResult?.result] || '#333'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Student Report Card"
      size="lg"
      footer={
        <div className="flex gap-3 w-full">
          <Button variant="secondary" onClick={onClose} className="flex-1">Close</Button>
          <Button variant="secondary" icon={Download} className="flex-1">Download PDF</Button>
          <Button icon={Printer} onClick={handlePrint} className="flex-1">Print</Button>
        </div>
      }
    >
      <div ref={printRef}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div
          className="header text-center pb-5 mb-5"
          style={{ borderBottom: '2px solid var(--color-border)' }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            <GraduationCap size={22} color="#fff" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Greenwood Academy
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Academic Report Card
          </p>
        </div>

        {/* ── Student details ─────────────────────────────────────────── */}
        <div
          className="grid grid-cols-2 gap-4 p-4 rounded-xl mb-5"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
        >
          {[
            { label: 'Student Name',     value: student?.student_name || student?.name },
            { label: 'Admission No.',    value: student?.admission_no },
            { label: 'Class',            value: student?.class_name   || student?.class },
            { label: 'Roll Number',      value: student?.roll_number },
            { label: 'Session',          value: student?.session_name },
            { label: 'Date of Report',   value: formatDate(new Date()) },
          ].map(f => (
            <div key={f.label}>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{f.label}</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {f.value || '—'}
              </p>
            </div>
          ))}
        </div>

        {/* ── Marks table ─────────────────────────────────────────────── */}
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
          Subject-wise Marks
        </h3>

        {subjectResults.length > 0 ? (
          <div
            className="rounded-xl overflow-hidden mb-5"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                  {['Subject','Total Marks','Obtained','%','Grade','Status'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase"
                      style={{ color: 'var(--color-text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subjectResults.map((sr, i) => {
                  const pct    = sr.total_marks > 0 ? (sr.marks_obtained / sr.total_marks * 100).toFixed(1) : 0
                  const passed = !sr.is_absent && sr.is_pass
                  return (
                    <tr
                      key={i}
                      style={{ borderBottom: i < subjectResults.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {sr.subject}
                        </p>
                        {sr.is_core && (
                          <p className="text-[10px]" style={{ color: 'var(--color-brand)' }}>Core Subject</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {sr.total_marks}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold" style={{ color: sr.is_absent ? '#94a3b8' : 'var(--color-text-primary)' }}>
                          {sr.is_absent ? 'AB' : sr.marks_obtained}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {sr.is_absent ? '—' : `${pct}%`}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold" style={{ color: GRADE_COLOR[sr.grade] || '#64748b' }}>
                          {sr.is_absent ? '—' : (sr.grade || '—')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: sr.is_absent ? '#f1f5f9' : passed ? '#f0fdf4' : '#fef2f2',
                            color          : sr.is_absent ? '#94a3b8' : passed ? '#16a34a' : '#dc2626',
                          }}
                        >
                          {sr.is_absent ? 'Absent' : passed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className="flex items-center justify-center py-8 rounded-xl mb-5 text-sm"
            style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}
          >
            Marks not yet entered or calculated
          </div>
        )}

        {/* ── Result summary ──────────────────────────────────────────── */}
        {examSummaries.length > 0 && (
          <>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Exam-wise Summary
            </h3>

            <div
              className="rounded-xl overflow-hidden mb-5"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                    {['Exam', 'Total Marks', 'Obtained', 'Percentage', 'Grade', 'Result'].map((head) => (
                      <th key={head} className="px-4 py-2.5 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {examSummaries.map((exam, index) => (
                    <tr key={`${exam.exam_name}-${index}`} style={{ borderBottom: index < examSummaries.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{exam.exam_name}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{exam.total_marks}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{exam.marks_obtained}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{formatPercent(exam.percentage)}</td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: GRADE_COLOR[exam.grade] || '#64748b' }}>{exam.grade || '—'}</td>
                      <td className="px-4 py-3 text-sm font-semibold capitalize" style={{ color: RESULT_COLOR[exam.result] || 'var(--color-text-primary)' }}>{exam.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Total Marks',     value: finalResult?.total_marks   || '—' },
            { label: 'Marks Obtained',  value: finalResult?.marks_obtained || '—' },
            { label: 'Percentage',      value: finalResult?.percentage ? formatPercent(finalResult.percentage) : '—' },
            { label: 'Attendance',      value: student?.attendance_pct ? formatPercent(student.attendance_pct) : '—' },
          ].map(c => (
            <div
              key={c.label}
              className="p-3 rounded-xl text-center"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{c.label}</p>
              <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Grade + Result */}
        <div className="flex items-center justify-center gap-6 p-5 rounded-xl mb-5"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
        >
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Overall Grade</p>
            <p className="text-4xl font-bold" style={{ color: gradeColor }}>
              {finalResult?.grade || '—'}
            </p>
          </div>
          <div className="w-px h-12" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Result</p>
            <p
              className="text-2xl font-bold capitalize"
              style={{ color: resultColor }}
            >
              {finalResult?.result || 'Pending'}
            </p>
          </div>
        </div>

        {/* Teacher remarks */}
        <div
          className="p-4 rounded-xl"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
            CLASS TEACHER REMARKS
          </p>
          <div className="h-10 w-full rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          <div className="flex justify-between mt-8">
            <div className="text-center">
              <div className="w-32 h-px mb-1" style={{ backgroundColor: 'var(--color-text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Class Teacher</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-px mb-1" style={{ backgroundColor: 'var(--color-text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Principal</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ReportCardModal
