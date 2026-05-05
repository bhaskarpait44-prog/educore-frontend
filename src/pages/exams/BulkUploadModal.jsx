// src/pages/exams/BulkUploadModal.jsx
import { useState } from 'react'
import { Upload, Download, FileSpreadsheet, X, CheckCircle, AlertCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import useExamStore from '@/store/examStore'
import useToast from '@/hooks/useToast'
import * as api from '@/api/exams'

const BulkUploadModal = ({ open, onClose, examId, subjects = [] }) => {
  const { toastSuccess, toastError } = useToast()
  const [selectedSubject, setSelectedSubject] = useState('')
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState(null)

  const handleDownloadTemplate = async () => {
    if (!selectedSubject) {
      toastError('Please select a subject first')
      return
    }
    try {
      const response = await api.getMarksTemplate(examId, selectedSubject)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const subjectName = subjects.find(s => String(s.id) === selectedSubject)?.name || 'Subject'
      link.setAttribute('download', `MarksTemplate_${subjectName}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      toastError('Failed to download template')
    }
  }

  const handleUpload = async () => {
    if (!selectedSubject || !file) {
      toastError('Please select a subject and a file')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.uploadMarksExcel(examId, selectedSubject, formData)
      setResult({ success: true, message: res.data?.message || `Successfully processed ${res.data?.processed} rows.` })
      toastSuccess('Marks uploaded successfully')
    } catch (err) {
      setResult({ success: false, message: err.message || 'Upload failed' })
      toastError('Failed to upload marks')
    } finally {
      setIsUploading(false)
    }
  }

  const reset = () => {
    setSelectedSubject('')
    setFile(null)
    setResult(null)
    setIsUploading(false)
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose() }}
      title="Bulk Mark Entry (Excel)"
      size="md"
    >
      <div className="space-y-6 p-1">
        {!result ? (
          <>
            <div className="space-y-4">
              <Select
                label="Select Subject"
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                options={subjects.map(s => ({ value: String(s.id), label: s.name }))}
                placeholder="Choose a subject..."
              />

              <div className="p-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center gap-3">
                <FileSpreadsheet size={32} className="text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Step 1: Get the template</p>
                  <p className="text-xs text-gray-500 mt-1">Download a pre-filled Excel sheet with student names.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={Download} 
                  onClick={handleDownloadTemplate}
                  disabled={!selectedSubject}
                >
                  Download Template
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Step 2: Upload filled sheet</label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 transition-colors hover:border-brand-500 group">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={e => setFile(e.target.files[0])}
                  />
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <Upload size={24} className="text-gray-400 group-hover:text-brand-500" />
                    <p className="text-sm text-gray-600">
                      {file ? <span className="font-bold text-brand-600">{file.name}</span> : 'Click or drag to select file'}
                    </p>
                    <p className="text-xs text-gray-400">Only .xlsx or .xls files supported</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
              <Button 
                className="flex-1" 
                onClick={handleUpload} 
                loading={isUploading}
                disabled={!selectedSubject || !file}
              >
                Start Upload
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-6 text-center space-y-4">
            {result.success ? (
              <CheckCircle size={48} className="text-green-500" />
            ) : (
              <AlertCircle size={48} className="text-red-500" />
            )}
            <div>
              <h3 className="text-lg font-bold">{result.success ? 'Success!' : 'Upload Failed'}</h3>
              <p className="text-sm text-gray-600 mt-2">{result.message}</p>
            </div>
            <Button onClick={() => { reset(); onClose() }}>Done</Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default BulkUploadModal
