// src/App.jsx
// Root component — initializes theme on mount, provides router

import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import router from '@/router'
import useUiStore from '@/store/uiStore'
import ToastContainer from '@/components/ui/ToastContainer'

const App = () => {
  const { initTheme } = useUiStore()

  // Apply saved theme class to <html> on first load
  useEffect(() => {
    initTheme()
  }, [])

  return (
    <>
      <RouterProvider router={router} />
      {/* Global toast notifications — rendered outside router */}
      <ToastContainer />
    </>
  )
}

export default App
