// src/components/layout/AppLayout.jsx
// Authenticated shell — every page inside the ERP wraps with this

import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import useUiStore from '@/store/uiStore'

const AppLayout = () => {
  const { sidebarCollapsed } = useUiStore()

  const leftOffset = sidebarCollapsed ? '72px' : '256px'

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Fixed header — offset by sidebar width */}
      <Header />

      {/* Main content — offset by both sidebar and header */}
      <main
        className="transition-all duration-300 min-h-screen"
        style={{
          marginLeft : leftOffset,
          paddingTop : 'var(--header-height)',
        }}
      >
        <div className="p-6">
          {/* Outlet renders the current page with enter animation */}
          <div className="page-enter">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

export default AppLayout
