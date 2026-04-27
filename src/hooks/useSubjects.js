import { useCallback } from 'react'
import * as subjectApi from '@/api/subjectApi'
import useClassStore from '@/store/useClassStore'
import useToast from '@/hooks/useToast'

const normalizeList = (payload) => (Array.isArray(payload) ? payload : [])

const useSubjects = () => {
  const store = useClassStore()
  const { toastSuccess, toastError } = useToast()

  const fetchSubjects = useCallback(async (classId) => {
    if (!classId) {
      store.setSubjects([])
      return []
    }

    try {
      const res = await subjectApi.getSubjects(classId)
      const subjects = normalizeList(res.data).sort((a, b) => a.order_number - b.order_number)
      store.setSubjects(subjects)
      return subjects
    } catch (err) {
      toastError(err.message || 'Failed to load subjects')
      store.setSubjects([])
      return []
    }
  }, [])

  const createSubject = useCallback(async (classId, data) => {
    store.setSaving(true)
    try {
      const res = await subjectApi.createSubject(classId, data)
      store.addSubject(res.data)
      toastSuccess('Subject added successfully')
      return { success: true, data: res.data }
    } catch (err) {
      const msg = err.message || 'Failed to add subject'
      toastError(msg)
      return { success: false, message: msg, errors: err.errors || [] }
    } finally {
      store.setSaving(false)
    }
  }, [])

  const updateSubject = useCallback(async (classId, subjectId, data) => {
    store.setSaving(true)
    try {
      const res = await subjectApi.updateSubject(classId, subjectId, data)
      store.updateSubject(subjectId, res.data)
      toastSuccess('Subject updated successfully')
      return { success: true, data: res.data }
    } catch (err) {
      const msg = err.message || 'Failed to update subject'
      toastError(msg)
      return { success: false, message: msg, errors: err.errors || [] }
    } finally {
      store.setSaving(false)
    }
  }, [])

  const deleteSubject = useCallback(async (classId, subjectId, reason = '') => {
    store.setSaving(true)
    try {
      await subjectApi.deleteSubject(classId, subjectId, reason)
      store.removeSubject(subjectId)
      toastSuccess('Subject deleted successfully')
      return { success: true }
    } catch (err) {
      const msg = err.message || 'Failed to delete subject'
      toastError(msg)
      return { success: false, message: msg, errors: err.errors || [] }
    } finally {
      store.setSaving(false)
    }
  }, [])

  const reorderSubjects = useCallback(async (classId, orderedSubjects) => {
    const subjectOrders = (orderedSubjects || []).map((sub, index) => ({
      id: Number(sub.id),
      order_number: index + 1,
    }))

    if (!classId || subjectOrders.length === 0) {
      return { success: false, message: 'No subjects to reorder' }
    }

    store.setSaving(true)
    try {
      const res = await subjectApi.reorderSubjects(classId, subjectOrders)
      const subjects = normalizeList(res.data).sort((a, b) => a.order_number - b.order_number)
      store.reorderSubjects(subjects)
      toastSuccess('Subject order updated')
      return { success: true, data: subjects }
    } catch (err) {
      const msg = err.message || 'Failed to reorder subjects'
      toastError(msg)
      return { success: false, message: msg, errors: err.errors || [] }
    } finally {
      store.setSaving(false)
    }
  }, [])

  return {
    subjects: store.subjects,
    isSaving: store.isSaving,
    fetchSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    reorderSubjects,
  }
}

export default useSubjects
