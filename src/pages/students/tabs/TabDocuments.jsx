// src/pages/students/tabs/TabDocuments.jsx
import { useEffect, useState } from 'react'
import { 
  FileText, Upload, Trash2, Download, 
  Eye, AlertCircle, FilePlus, Shield,
  MoreVertical, Clock
} from 'lucide-react'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import * as studentApi from '@/api/students'

const TabDocuments = ({ studentId }) => {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const { toastError, toastSuccess } = useToast()

  const fetchDocs = async () => {
    try {
      const res = await studentApi.getDocuments(studentId)
      setDocuments(res.data || [])
    } catch (err) {
      toastError('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocs()
  }, [studentId])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('document', file)
    formData.append('name', file.name)
    formData.append('document_type', 'other')

    setUploading(true)
    try {
      await studentApi.uploadDocument(studentId, formData)
      toastSuccess('Document uploaded')
      fetchDocs()
    } catch (err) {
      toastError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      await studentApi.deleteDocument(studentId, docId)
      toastSuccess('Document deleted')
      setDocuments(docs => docs.filter(d => d.id !== docId))
    } catch (err) {
      toastError('Delete failed')
    }
  }

  const getFileUrl = (path) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin)
    // Remove /api from end of base URL if present
    const rootUrl = baseUrl.replace(/\/api$/, '')
    return `${rootUrl}/${path}`
  }

  if (loading) return <div className="py-12 animate-pulse space-y-4">
    {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
  </div>

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header & Upload */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Student Documents</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage birth certificates, ID proofs, and other records.</p>
        </div>

        <label className="relative flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-95">
          {uploading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : <Upload size={16} />}
          {uploading ? 'Uploading...' : 'Upload Document'}
          <input 
            type="file" 
            className="hidden" 
            onChange={handleUpload} 
            disabled={uploading}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
        </label>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm mb-4">
            <FilePlus size={32} className="text-gray-300" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No documents uploaded yet</p>
          <p className="text-xs text-gray-400 mt-1">Upload ID proofs or certificates for quick access.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map(doc => (
            <div key={doc.id} className="group bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <FileText size={24} />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate" title={doc.name}>{doc.name}</h4>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter mt-0.5">{doc.document_type || 'Other'}</p>
                
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                    <Clock size={12} />
                    {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                    <Shield size={12} />
                    {doc.uploader_name || 'System'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => window.open(getFileUrl(doc.file_path), '_blank')}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
                  title="View/Download"
                >
                  <Eye size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex gap-3">
        <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-tight">Security Note</p>
          <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-1 leading-relaxed">
            All documents are encrypted at rest. Access is limited to authorized staff only. Ensure you are uploading the correct file before saving.
          </p>
        </div>
      </div>
    </div>
  )
}

export default TabDocuments
