import { useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'

const ACCOUNTANT_THEME = {
  '--color-brand': '#d97706',
  '--color-brand-light': '#f59e0b',
  '--color-brand-dark': '#b45309',
  '--color-sidebar-bg': '#fffaf0',
  '--color-sidebar-active': '#d97706',
  '--color-sidebar-hover': '#ffedd5',
  '--color-sidebar-border': '#fed7aa',
}

const AccountantLayout = () => {
  useEffect(() => {
    const root = document.documentElement
    const previous = {}

    Object.entries(ACCOUNTANT_THEME).forEach(([key, value]) => {
      previous[key] = root.style.getPropertyValue(key)
      root.style.setProperty(key, value)
    })

    return () => {
      Object.entries(previous).forEach(([key, value]) => {
        if (value) root.style.setProperty(key, value)
        else root.style.removeProperty(key)
      })
    }
  }, [])

  return <AppLayout />
}

export default AccountantLayout
