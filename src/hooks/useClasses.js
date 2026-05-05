// src/hooks/useClasses.js
import { useCallback } from 'react'
import * as classApi from '@/api/classApi'
import useClassStore from '@/store/useClassStore'
import useToast from '@/hooks/useToast'

const useClasses = () => {
  const store = useClassStore()
  const { toastSuccess, toastError } = useToast()

  // ── Fetch all classes ──────────────────────────────────────────────────
  const fetchClasses = useCallback(async (params = {}) => {
    store.setLoading(true)
    store.setError(null)
    try {
      const res = await classApi.getClasses(params)
      store.setClasses(res.data.classes, res.data.stats)
      return res.data
    } catch (err) {
      const msg = err.message || 'Failed to load classes'
      store.setError(msg)
      toastError(msg)
      throw err
    } finally {
      store.setLoading(false)
    }
  }, [])

  // ── Fetch single class ─────────────────────────────────────────────────
  const fetchClassById = useCallback(async (id) => {
    store.setLoading(true)
    try {
      const res = await classApi.getClassById(id)
      store.setSelectedClass(res.data)
      // Hydrate store with sections + subjects from the detail response
      if (res.data.sections) store.setSections(res.data.sections)
      if (res.data.subjects) store.setSubjects(res.data.subjects)
      return res.data
    } catch (err) {
      const msg = err.message || 'Failed to load class'
      store.setError(msg)
      toastError(msg)
      throw err
    } finally {
      store.setLoading(false)
    }
  }, [])

  // ── Create class ───────────────────────────────────────────────────────
  const createClass = useCallback(async (data) => {
    store.setSaving(true)
    try {
      const res = await classApi.createClass(data)
      store.addClass(res.data)
      toastSuccess('Class created successfully')
      return { success: true, data: res.data }
    } catch (err) {
      const msg = err.message || 'Failed to create class'
      toastError(msg)
      return { success: false, message: msg, errors: err.errors || [] }
    } finally {
      store.setSaving(false)
    }
  }, [])

  // ── Update class ───────────────────────────────────────────────────────
  const updateClass = useCallback(async (id, data) => {
    store.setSaving(true)
    try {
      const res = await classApi.updateClass(id, data)
      store.updateClass(id, res.data)
      toastSuccess('Class updated successfully')
      return { success: true, data: res.data }
    } catch (err) {
      const msg = err.message || 'Failed to update class'
      toastError(msg)
      return { success: false, message: msg, errors: err.errors || [] }
    } finally {
      store.setSaving(false)
    }
  }, [])

  // ── Delete class ───────────────────────────────────────────────────────
  const deleteClass = useCallback(async (id, reason, options = {}) => {
    store.setSaving(true)
    try {
      await classApi.deleteClass(id, reason, options)
      store.removeClass(id)
      toastSuccess('Class deleted successfully')
      return { success: true }
    } catch (err) {
      const msg = err.message || 'Failed to delete class'
      toastError(msg)
      return { success: false, message: msg }
    } finally {
      store.setSaving(false)
    }
  }, [])

  // ── Toggle active status ───────────────────────────────────────────────
  const toggleClassStatus = useCallback(async (id) => {
    try {
      const res = await classApi.toggleClassActive(id)
      store.updateClass(id, { is_active: res.data.is_active })
      toastSuccess(`Class ${res.data.is_active ? 'activated' : 'deactivated'}`)
      return { success: true }
    } catch (err) {
      toastError(err.message || 'Failed to toggle class status')
      return { success: false }
    }
  }, [])

  // ── Teachers for selection ─────────────────────────────────────────────
  const fetchTeachers = useCallback(async () => {
    try {
      const res = await classApi.getClassTeachers()
      return res.data
    } catch (err) {
      toastError(err.message || 'Failed to load teachers')
      return []
    }
  }, [])

  // ── Sections ───────────────────────────────────────────────────────────
  const fetchSections = useCallback(async (classId) => {
    try {
      const res = await classApi.getSections(classId)
      store.setSections(res.data)
      return res.data
    } catch (err) {
      toastError(err.message || 'Failed to load sections')
      throw err
    }
  }, [])

  const createSection = useCallback(async (classId, data) => {
    store.setSaving(true)
    try {
      const res = await classApi.createSection(classId, data)
      store.addSection(res.data)
      toastSuccess('Section added successfully')
      return { success: true, data: res.data }
    } catch (err) {
      const msg = err.message || 'Failed to add section'
      toastError(msg)
      return { success: false, message: msg, errors: err.errors || [] }
    } finally {
      store.setSaving(false)
    }
  }, [])

  const updateSection = useCallback(async (classId, sectionId, data) => {
    store.setSaving(true)
    try {
      const res = await classApi.updateSection(classId, sectionId, data)
      store.updateSection(sectionId, res.data)
      toastSuccess('Section updated successfully')
      return { success: true }
    } catch (err) {
      toastError(err.message || 'Failed to update section')
      return { success: false, message: err.message, errors: err.errors || [] }
    } finally {
      store.setSaving(false)
    }
  }, [])

  const deleteSection = useCallback(async (classId, sectionId) => {
    store.setSaving(true)
    try {
      await classApi.deleteSection(classId, sectionId)
      store.removeSection(sectionId)
      toastSuccess('Section removed successfully')
      return { success: true }
    } catch (err) {
      toastError(err.message || 'Failed to delete section')
      return { success: false, message: err.message }
    } finally {
      store.setSaving(false)
    }
  }, [])

  return {
    // State
    classes       : store.classes,
    stats         : store.stats,
    selectedClass : store.selectedClass,
    sections      : store.sections,
    isLoading     : store.isLoading,
    isSaving      : store.isSaving,
    error         : store.error,
    // Actions
    fetchClasses,
    fetchClassById,
    createClass,
    updateClass,
    deleteClass,
    toggleClassStatus,
    fetchTeachers,
    fetchSections,
    createSection,
    updateSection,
    deleteSection,
  }
}

export default useClasses
