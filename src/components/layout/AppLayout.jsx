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

  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop]   = useState(false)

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  useEffect(() => {
    if (isAuthenticated) fetchCurrentSession()
  }, [isAuthenticated])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

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
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Fixed header */}
      <div
        className="fixed top-0 right-0 z-30"
        style={{
          left             : isDesktop ? `${sidebarW}px` : 0,
          height           : 'var(--header-height)',
          transition       : 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter   : 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <Header onMenuClick={() => setMobileOpen(true)} />
      </div>

      {/* Main content */}
      <main
        className="flex flex-col min-h-screen"
        style={{
          marginLeft : isDesktop ? `${sidebarW}px` : 0,
          paddingTop : 'var(--header-height)',
          transition : 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="flex-1 overflow-y-auto">
          <div
            className="p-4 sm:p-6 page-enter"
            key={location.pathname}
          >
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

export default AppLayout