// src/store/useClassStore.js
import { create } from 'zustand'

const useClassStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────────────────
  classes       : [],
  stats         : { total_classes: 0, total_sections: 0, total_subjects: 0, total_students: 0 },
  selectedClass : null,
  sections      : [],
  subjects      : [],
  isLoading     : false,
  isSaving      : false,
  error         : null,

  // ── Loading & error ───────────────────────────────────────────────────
  setLoading : (isLoading) => set({ isLoading }),
  setSaving  : (isSaving)  => set({ isSaving }),
  setError   : (error)     => set({ error }),

  // ── Classes ───────────────────────────────────────────────────────────
  setClasses: (classes, stats) =>
    set({ classes, stats: stats || get().stats }),

  setSelectedClass: (cls) =>
    set({ selectedClass: cls }),

  addClass: (cls) =>
    set(s => ({ classes: [...s.classes, cls] })),

  updateClass: (id, data) =>
    set(s => ({
      classes: s.classes.map(c => c.id === id ? { ...c, ...data } : c),
      selectedClass: s.selectedClass?.id === id ? { ...s.selectedClass, ...data } : s.selectedClass,
    })),

  removeClass: (id) =>
    set(s => ({
      classes: s.classes.filter(c => c.id !== id),
    })),

  // ── Sections ──────────────────────────────────────────────────────────
  setSections: (sections) => set({ sections }),

  addSection: (section) =>
    set(s => ({ sections: [...s.sections, section] })),

  updateSection: (id, data) =>
    set(s => ({
      sections: s.sections.map(sec => sec.id === id ? { ...sec, ...data } : sec),
    })),

  removeSection: (id) =>
    set(s => ({ sections: s.sections.filter(sec => sec.id !== id) })),

  // ── Subjects ──────────────────────────────────────────────────────────
  setSubjects: (subjects) => set({ subjects }),

  addSubject: (subject) =>
    set(s => ({
      subjects: [...s.subjects, subject].sort((a, b) => a.order_number - b.order_number),
    })),

  updateSubject: (id, data) =>
    set(s => ({
      subjects: s.subjects
        .map(sub => sub.id === id ? { ...sub, ...data } : sub)
        .sort((a, b) => a.order_number - b.order_number),
    })),

  removeSubject: (id) =>
    set(s => ({ subjects: s.subjects.filter(sub => sub.id !== id) })),

  reorderSubjects: (ordered) =>
    set({ subjects: [...ordered].sort((a, b) => a.order_number - b.order_number) }),

  // ── Reset ─────────────────────────────────────────────────────────────
  reset: () =>
    set({
      classes: [], selectedClass: null, sections: [], subjects: [],
      isLoading: false, isSaving: false, error: null,
    }),
}))

export default useClassStore