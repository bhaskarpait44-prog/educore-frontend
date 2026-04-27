// src/components/layout/AppLayout.jsx
import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header  from './Header'
import useUiStore from '@/store/uiStore'
import useSessionStore from '@/store/sessionStore'
import useAuth from '@/hooks/useAuth'

const AppLayout = () => {
  const { sidebarCollapsed } = useUiStore()
  const { fetchCurrentSession } = useSessionStore()
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  // Handle window resize for responsive layout
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  // Fetch current session once on mount
  useEffect(() => {
    if (isAuthenticated) fetchCurrentSession()
  }, [isAuthenticated])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const sidebarW = sidebarCollapsed ? 72 : 256

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Desktop sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Fixed header — offset by sidebar on desktop */}
      <div
        className="fixed top-0 right-0 z-30 transition-all duration-300"
        style={{
          left: `${sidebarW}px`,
          height: 'var(--header-height)',
        }}
      >
        <Header onMenuClick={() => setMobileOpen(true)} />
      </div>

      {/* Main content area */}
      <main
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{
          // On desktop: offset by sidebar. On mobile: no offset.
          marginLeft  : isDesktop ? `${sidebarW}px` : 0,
          paddingTop  : 'var(--header-height)',
        }}
      >
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div
            className="p-4 sm:p-6 page-enter"
            key={location.pathname}   // Re-trigger animation on route change
          >
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

export default AppLayout
