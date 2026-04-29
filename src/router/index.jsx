import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES, ROLES } from '@/constants/app'
import useAuthStore from '@/store/authStore'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import StudentLayout from '@/layouts/StudentLayout'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'

const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))

const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const TeacherDashboard = lazy(() => import('@/pages/teacher/TeacherDashboard'))
const TeacherMyClasses = lazy(() => import('@/pages/teacher/TeacherMyClasses'))
const TeacherMarkAttendance = lazy(() => import('@/pages/teacher/attendance/MarkAttendance'))
const TeacherAttendanceRegister = lazy(() => import('@/pages/teacher/attendance/AttendanceRegister'))
const TeacherAttendanceReports = lazy(() => import('@/pages/teacher/attendance/AttendanceReports'))
const TeacherEnterMarks = lazy(() => import('@/pages/teacher/marks/EnterMarks'))
const TeacherMarksSummary = lazy(() => import('@/pages/teacher/marks/MarksSummary'))
const TeacherStudentList = lazy(() => import('@/pages/teacher/students/StudentList'))
const TeacherStudentDetail = lazy(() => import('@/pages/teacher/students/StudentDetail'))
const TeacherStudentRemarks = lazy(() => import('@/pages/teacher/students/StudentRemarks'))
const TeacherTimetable = lazy(() => import('@/pages/teacher/TeacherTimetable'))
const TeacherHomeworkList = lazy(() => import('@/pages/teacher/homework/HomeworkList'))
const TeacherChat = lazy(() => import('@/pages/teacher/TeacherChat'))
const TeacherNoticeList = lazy(() => import('@/pages/teacher/notices/NoticeList'))
const TeacherNoticeForm = lazy(() => import('@/pages/teacher/notices/NoticeForm'))
const TeacherLeave = lazy(() => import('@/pages/teacher/TeacherLeave'))
const TeacherProfile = lazy(() => import('@/pages/teacher/TeacherProfile'))
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage'))
const SessionsPage = lazy(() => import('@/pages/sessions/SessionsPage'))
const CreateSessionPage = lazy(() => import('@/pages/sessions/CreateSessionPage'))
const SessionDetailPage = lazy(() => import('@/pages/sessions/SessionDetailPage'))
const StudentsPage = lazy(() => import('@/pages/students/StudentsPage'))
const AdmitStudentPage = lazy(() => import('@/pages/students/AdmitStudentPage'))
const StudentDetailPage = lazy(() => import('@/pages/students/StudentDetailPage'))
const EnrollmentsPage = lazy(() => import('@/pages/enrollments/EnrollmentsPage'))
const AttendancePage = lazy(() => import('@/pages/attendance/AttendancePage'))
const FeeStructurePage = lazy(() => import('@/pages/fees/FeeStructurePage'))
const FeeReportPage = lazy(() => import('@/pages/fees/FeeReportPage'))
const ExamsPage = lazy(() => import('@/pages/exams/ExamsPage'))
const AuditPage = lazy(() => import('@/pages/audit/AuditPage'))
const ClassListPage = lazy(() => import('@/pages/classes/ClassListPage'))
const UserManagementHomePage = lazy(() => import('@/components/admin/users/UserManagementHomePage'))
const UserListPage = lazy(() => import('@/components/admin/users/UserListPage'))
const CreateUserPage = lazy(() => import('@/components/admin/users/CreateUserPage'))
const BulkImportPage = lazy(() => import('@/components/admin/users/BulkImportPage'))
const CreateTeacherPage = lazy(() => import('@/pages/admin/CreateTeacherPage'))
const TeacherDetailPage = lazy(() => import('@/pages/admin/TeacherDetailPage'))
const ClassDetailPage = lazy(() => import('@/pages/classes/ClassDetailPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const AdminTeacherControlPage = lazy(() => import('@/pages/admin/AdminTeacherControlPage'))
const AdminPromotionPage = lazy(() => import('@/pages/admin/AdminPromotionPage'))

const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard'))
const MyAttendance = lazy(() => import('@/pages/student/attendance/MyAttendance'))
const MyResults = lazy(() => import('@/pages/student/results/MyResults'))
const StudentReportCard = lazy(() => import('@/pages/student/results/ReportCard'))
const MyFees = lazy(() => import('@/pages/student/fees/MyFees'))
const StudentPaymentHistory = lazy(() => import('@/pages/student/fees/PaymentHistory'))
const StudentTimetable = lazy(() => import('@/pages/student/StudentTimetable'))
const StudentHomeworkList = lazy(() => import('@/pages/student/homework/HomeworkList'))
const StudentSubmissions = lazy(() => import('@/pages/student/homework/MySubmissions'))
const StudentChat = lazy(() => import('@/pages/student/StudentChat'))
const StudentNotices = lazy(() => import('@/pages/student/StudentNotices'))
const MyProfile = lazy(() => import('@/pages/student/profile/MyProfile'))
const CorrectionRequest = lazy(() => import('@/pages/student/profile/CorrectionRequest'))
const ChangePassword = lazy(() => import('@/pages/student/profile/ChangePassword'))
const AcademicHistory = lazy(() => import('@/pages/student/AcademicHistory'))
const StudyMaterials = lazy(() => import('@/pages/student/StudyMaterials'))

const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div
      className="h-8 w-8 animate-spin rounded-full border-2"
      style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}
    />
  </div>
)

const Lazy = ({ component: Component, ...props }) => (
  <Suspense fallback={<PageLoader />}>
    <Component {...props} />
  </Suspense>
)

const DashboardGate = () => {
  const role = useAuthStore((state) => state.user?.role)

  if (role === ROLES.STUDENT) {
    return <Navigate to={ROUTES.STUDENT_DASHBOARD} replace />
  }

  if (role === ROLES.TEACHER) {
    return <Lazy component={TeacherDashboard} />
  }

  return <Lazy component={DashboardPage} />
}

const StaffShell = () => {
  const role = useAuthStore((state) => state.user?.role)
  if (role === ROLES.STUDENT) {
    return <Navigate to={ROUTES.STUDENT_DASHBOARD} replace />
  }
  return <AppLayout />
}

const router = createBrowserRouter([
  { path: ROUTES.LOGIN, element: <LoginPage /> },
  { path: ROUTES.FORGOT_PASSWORD, element: <Lazy component={ForgotPasswordPage} /> },
  { path: ROUTES.RESET_PASSWORD, element: <Lazy component={ResetPasswordPage} /> },

  {
    path: ROUTES.STUDENT_ROOT,
    element: (
      <ProtectedRoute roles={[ROLES.STUDENT]}>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to={ROUTES.STUDENT_DASHBOARD} replace /> },
      { path: ROUTES.STUDENT_DASHBOARD, element: <Lazy component={StudentDashboard} /> },
      { path: ROUTES.STUDENT_ATTENDANCE, element: <Lazy component={MyAttendance} /> },
      { path: ROUTES.STUDENT_RESULTS, element: <Lazy component={MyResults} /> },
      { path: ROUTES.STUDENT_REPORT_CARD, element: <Lazy component={StudentReportCard} /> },
      { path: ROUTES.STUDENT_FEES, element: <Lazy component={MyFees} /> },
      { path: ROUTES.STUDENT_FEE_PAYMENTS, element: <Lazy component={StudentPaymentHistory} /> },
      { path: ROUTES.STUDENT_TIMETABLE, element: <Lazy component={StudentTimetable} /> },
      { path: ROUTES.STUDENT_HOMEWORK, element: <Lazy component={StudentHomeworkList} /> },
      { path: ROUTES.STUDENT_HOMEWORK_SUBMISSIONS, element: <Lazy component={StudentSubmissions} /> },
      { path: ROUTES.STUDENT_CHAT, element: <Lazy component={StudentChat} /> },
      { path: ROUTES.STUDENT_NOTICES, element: <Lazy component={StudentNotices} /> },
      { path: ROUTES.STUDENT_PROFILE, element: <Lazy component={MyProfile} /> },
      { path: ROUTES.STUDENT_PROFILE_CORRECTION, element: <Lazy component={CorrectionRequest} /> },
      { path: ROUTES.STUDENT_PROFILE_PASSWORD, element: <Lazy component={ChangePassword} /> },
      { path: ROUTES.STUDENT_HISTORY, element: <Lazy component={AcademicHistory} /> },
      { path: ROUTES.STUDENT_MATERIALS, element: <Lazy component={StudyMaterials} /> },
      { path: ROUTES.STUDENT_ACHIEVEMENTS, element: <Navigate to={ROUTES.STUDENT_PROFILE} replace /> },
    ],
  },

  {
    path: '/',
    element: (
      <ProtectedRoute>
        <StaffShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },
      { path: ROUTES.DASHBOARD, element: <DashboardGate /> },

      {
        path: ROUTES.CLASSES,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={ClassListPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.CLASS_DETAIL,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={ClassDetailPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENTS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={StudentsPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT_NEW,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={AdmitStudentPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT_DETAIL,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={StudentDetailPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ENROLLMENTS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={EnrollmentsPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ATTENDANCE,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={AttendancePage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SESSIONS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={SessionsPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SESSION_NEW,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={CreateSessionPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SESSION_DETAIL,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={SessionDetailPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SETTINGS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={SettingsPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_TEACHER_CONTROL,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={AdminTeacherControlPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_PROMOTIONS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={AdminPromotionPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.EXAMS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={ExamsPage} />
          </ProtectedRoute>
        ),
      },
      { path: ROUTES.RESULTS, element: <Navigate to={ROUTES.EXAMS} replace /> },
      {
        path: ROUTES.AUDIT,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={AuditPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.USERS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={UserManagementHomePage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.USER_MANAGE,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={UserListPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.USER_NEW,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={CreateUserPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.USER_IMPORT,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={BulkImportPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHERS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={CreateTeacherPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_NEW,
        element: <Navigate to={ROUTES.TEACHERS} replace />,
      },
      {
        path: ROUTES.TEACHER_DETAIL,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={TeacherDetailPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_CLASSES,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherMyClasses} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_ATTENDANCE_MARK,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherMarkAttendance} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_ATTENDANCE_REGISTER,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherAttendanceRegister} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_ATTENDANCE_REPORTS,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherAttendanceReports} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_MARKS_ENTER,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherEnterMarks} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_MARKS_SUMMARY,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherMarksSummary} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_STUDENTS,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherStudentList} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_STUDENT_DETAIL,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherStudentDetail} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_STUDENT_REMARKS,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherStudentRemarks} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_TIMETABLE,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherTimetable} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_HOMEWORK,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherHomeworkList} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_CHAT,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherChat} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_NOTICES,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherNoticeList} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_NOTICE_NEW,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherNoticeForm} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_LEAVE,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherLeave} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_PROFILE,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherProfile} />
          </ProtectedRoute>
        ),
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
])

export default router
