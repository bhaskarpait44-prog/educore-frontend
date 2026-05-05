// src/store/examStore.js
import { create } from 'zustand'
import * as api from '@/api/exams'

const useExamStore = create((set, get) => ({
  exams        : [],
  subjects     : [],
  examSubjects : {},
  classResults : [],
  classResultsMeta: null,
  studentResult: null,
  isLoading    : false,
  isSaving     : false,
  error        : null,

  fetchExams: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const res  = await api.getExams(params)
      const data = Array.isArray(res.data) ? res.data : (res.data?.exams || res.data?.data || [])
      set({ exams: data, isLoading: false })
      return data
    } catch (err) {
      set({ error: err.message, isLoading: false }); throw err
    }
  },

  createExam: async (data) => {
    set({ isSaving: true })
    try {
      const res = await api.createExam(data)
      set(s => ({ exams: [res.data, ...s.exams], isSaving: false }))
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  changeExamStatus: async (id, data) => {
    set({ isSaving: true })
    try {
      const res = await api.updateExamStatus(id, data)
      set(s => ({
        exams: s.exams.map(exam =>
          exam.id === Number(id)
            ? { ...exam, status: res.data?.status || data.status }
            : exam
        ),
        isSaving: false,
      }))
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  deleteExam: async (id) => {
    set({ isSaving: true })
    try {
      await api.deleteExam(id)
      set(s => ({
        exams: s.exams.filter(exam => exam.id !== id),
        isSaving: false,
      }))
      return { success: true }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  fetchSubjects: async (classId) => {
    try {
      const res  = await api.getSubjects(classId)
      const data = Array.isArray(res.data) ? res.data : (res.data?.subjects || res.data?.data || [])
      set({ subjects: data })
      return data
    } catch { set({ subjects: [] }); return [] }
  },

  enterMarks: async (data) => {
    set({ isSaving: true })
    try {
      const res = await api.enterMarks(data)
      set({ isSaving: false })
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  fetchClassResults: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const res  = await api.getClassResults(params)
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || res.data?.data || [])
      set({
        classResults: data,
        classResultsMeta: res.data?.review_summary || res.data?.data?.review_summary || null,
        isLoading: false,
      })
      return data
    } catch (err) {
      set({ error: err.message, isLoading: false }); throw err
    }
  },

  fetchStudentResult: async (enrollmentId) => {
    set({ isLoading: true })
    try {
      const res = await api.getResults(enrollmentId)
      set({ studentResult: res.data, isLoading: false })
      return res.data
    } catch (err) {
      set({ isLoading: false }); throw err
    }
  },

  calculateResults: async (data) => {
    set({ isSaving: true })
    try {
      const res = await api.calculateResults(data)
      set({ isSaving: false })
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  overrideResult: async (data) => {
    set({ isSaving: true })
    try {
      const res = await api.overrideResult(data)
      // Update in classResults list
      set(s => ({
        isSaving    : false,
        classResults: s.classResults.map(r =>
          r.enrollment_id === data.enrollment_id
            ? { ...r, result: data.new_result, is_promoted: data.new_result === 'pass' }
            : r
        ),
      }))
      return { success: true }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  fetchExamSubjects: async (examId) => {
    try {
      const res  = await api.getExamSubjects(examId)
      const data = Array.isArray(res.data) ? res.data : (res.data?.subjects || [])
      set(s => ({ examSubjects: { ...s.examSubjects, [examId]: data }, subjects: data.map((row) => ({
        id: row.subject_id || row.id,
        name: row.name,
        code: row.code,
        subject_type: row.subject_type,
        total_marks: row.combined_total_marks,
        passing_marks: row.combined_passing_marks,
        combined_total_marks: row.combined_total_marks,
        combined_passing_marks: row.combined_passing_marks,
        theory_total_marks: row.theory_total_marks,
        theory_passing_marks: row.theory_passing_marks,
        practical_total_marks: row.practical_total_marks,
        practical_passing_marks: row.practical_passing_marks,
      })) }))
      return data
    } catch {
      set(s => ({ examSubjects: { ...s.examSubjects, [examId]: [] }, subjects: [] }))
      return []
    }
  },

  reviewExamSubject: async (examId, subjectId, data) => {
    set({ isSaving: true })
    try {
      const res = await api.reviewExamSubject(examId, subjectId, data)
      const refreshed = await api.getExamSubjects(examId)
      const rows = Array.isArray(refreshed.data) ? refreshed.data : (refreshed.data?.subjects || [])
      set(s => ({
        examSubjects: {
          ...s.examSubjects,
          [examId]: rows,
        },
        isSaving: false,
      }))
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  approveAllExamSubjects: async (examId) => {
    set({ isSaving: true })
    try {
      const res = await api.approveAllExamSubjects(examId)
      const refreshed = await api.getExamSubjects(examId)
      const rows = Array.isArray(refreshed.data) ? refreshed.data : (refreshed.data?.subjects || [])
      set(s => ({
        examSubjects: {
          ...s.examSubjects,
          [examId]: rows,
        },
        isSaving: false,
      }))
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  overrideExamMark: async (data) => {
    set({ isSaving: true })
    try {
      const res = await api.overrideExamMark(data)
      set({ isSaving: false })
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  deleteResult: async (enrollmentId, sessionId) => {
    set({ isSaving: true })
    try {
      await api.deleteResult(enrollmentId, sessionId)
      set(s => ({
        isSaving: false,
        classResults: s.classResults.map(row =>
          row.enrollment_id === enrollmentId
            ? {
                ...row,
                marks_obtained: null,
                total_marks: null,
                percentage: null,
                grade: null,
                result: null,
                is_promoted: false,
                compartment_subjects: null,
              }
            : row
        ),
      }))
      return { success: true }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  promoteStudents: async (data) => {
    set({ isSaving: true })
    try {
      const res = await api.promoteStudents(data)
      set({ isSaving: false })
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  downloadReportCard: async (enrollmentId) => {
    try {
      const response = await api.getReportCard(enrollmentId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ReportCard_${enrollmentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  clearResults: () => set({ classResults: [], classResultsMeta: null, studentResult: null }),
}))

export default useExamStore
