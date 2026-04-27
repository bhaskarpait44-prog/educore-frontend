// src/components/ui/ToastContainer.jsx
import { Toaster } from 'react-hot-toast'

const ToastContainer = () => {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
        },
        success: {
          duration: 4000,
          iconTheme: {
            primary: 'var(--color-success)',
            secondary: 'white',
          },
        },
        error: {
          duration: 6000,
          iconTheme: {
            primary: 'var(--color-danger)',
            secondary: 'white',
          },
        },
      }}
      containerStyle={{
        top: 24,
      }}
    />
  )
}

export default ToastContainer
