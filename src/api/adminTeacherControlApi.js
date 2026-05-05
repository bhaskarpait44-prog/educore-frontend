import api from './axios'

export const getTeacherControlOverview = () => api.get('/admin/teacher-control/overview')
export const getTeacherControlTeachers = () => api.get('/admin/teacher-control/teachers')
export const getTeacherControlAssignments = () => api.get('/admin/teacher-control/assignments')
export const createTeacherControlAssignment = (data) => api.post('/admin/teacher-control/assignments', data)
export const updateTeacherControlAssignment = (id, data) => api.patch(`/admin/teacher-control/assignments/${id}`, data)

export const getTeacherControlTimetable = () => api.get('/admin/teacher-control/timetable')
export const createTeacherControlTimetableSlot = (data) => api.post('/admin/teacher-control/timetable', data)
export const updateTeacherControlTimetableSlot = (id, data) => api.patch(`/admin/teacher-control/timetable/${id}`, data)

export const getTeacherControlHomework = () => api.get('/admin/teacher-control/homework')
export const updateTeacherControlHomework = (id, data) => api.patch(`/admin/teacher-control/homework/${id}`, data)

export const getTeacherControlNotices = (params) => api.get('/admin/teacher-control/notices', { params })
export const createTeacherControlNotice = (data) => api.post('/admin/teacher-control/notices', data)
export const updateTeacherControlNotice = (id, data) => api.patch(`/admin/teacher-control/notices/${id}`, data)

export const getTeacherControlAttendance = () => api.get('/admin/teacher-control/attendance')
export const updateTeacherControlAttendance = (id, data) => api.patch(`/admin/teacher-control/attendance/${id}`, data)

export const getTeacherControlMarks = () => api.get('/admin/teacher-control/marks')
export const updateTeacherControlMark = (id, data) => api.patch(`/admin/teacher-control/marks/${id}`, data)

export const getTeacherControlRemarks = () => api.get('/admin/teacher-control/remarks')
export const updateTeacherControlRemark = (id, data) => api.patch(`/admin/teacher-control/remarks/${id}`, data)

export const getTeacherControlLeave = () => api.get('/admin/teacher-control/leave')
export const reviewTeacherControlLeave = (id, data) => api.patch(`/admin/teacher-control/leave/${id}/review`, data)

export const getTeacherControlCorrections = () => api.get('/admin/teacher-control/correction-requests')
export const reviewTeacherControlCorrection = (id, data) => api.patch(`/admin/teacher-control/correction-requests/${id}/review`, data)
