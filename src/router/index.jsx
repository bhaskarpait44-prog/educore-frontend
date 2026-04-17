// src/router/index.jsx
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES, ROLES } from '@/constants/app'
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))

import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'


// Lazy-loaded pages
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage'))
// Add these imports:
const SessionsPage = lazy(() => import('@/pages/sessions/SessionsPage'))
const CreateSessionPage = lazy(() => import('@/pages/sessions/CreateSessionPage'))
const SessionDetailPage = lazy(() => import('@/pages/sessions/SessionDetailPage'))
const StudentsPage = lazy(() => import('@/pages/students/StudentsPage'))
const AdmitStudentPage = lazy(() => import('@/pages/students/AdmitStudentPage'))
const StudentDetailPage = lazy(() => import('@/pages/students/StudentDetailPage'))

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div
      className="w-8 h-8 rounded-full border-2 animate-spin"
      style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}
    />
  </div>
)

const Lazy = ({ component: Component, ...props }) => (
  <Suspense fallback={<PageLoader />}>
    <Component {...props} />
  </Suspense>
)

const router = createBrowserRouter([
  // Public
  { path: ROUTES.LOGIN, element: <LoginPage /> },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: <Lazy component={ForgotPasswordPage} />,
  },
  {
    path: ROUTES.RESET_PASSWORD,
    element: <Lazy component={ResetPasswordPage} />,
  },

  // Protected shell
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },

      { path: ROUTES.DASHBOARD, element: <Lazy component={DashboardPage} /> },




      // Academics
      {
        path: ROUTES.STUDENTS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={PlaceholderPage} title="Students" />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT_NEW,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={PlaceholderPage} title="Admit Student" />
          </ProtectedRoute>
        ),
      },


      // Inside protected children:
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
        path: ROUTES.STUDENT_DETAIL,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={PlaceholderPage} title="Student Detail" />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ENROLLMENTS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={PlaceholderPage} title="Enrollments" />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ATTENDANCE,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={PlaceholderPage} title="Attendance" />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.EXAMS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={PlaceholderPage} title="Exams" />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.RESULTS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={PlaceholderPage} title="Results" />
          </ProtectedRoute>
        ),
      },

      // Administration
      {
        path: ROUTES.SESSIONS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={PlaceholderPage} title="Sessions" />
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
        path: ROUTES.FEES,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <Lazy component={PlaceholderPage} title="Fee Management" />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.AUDIT,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={PlaceholderPage} title="Audit Logs" />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SETTINGS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={PlaceholderPage} title="Settings" />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // 404
  { path: '*', element: <NotFoundPage /> },
])

export default router
