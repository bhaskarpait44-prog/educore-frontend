// src/hooks/usePageTitle.js
import { useEffect } from 'react'
import { APP_NAME } from '@/constants/app'

/**
 * Sets the document title for the current page.
 * @param {string} title  e.g. "Students" → tab shows "Students | EduCore"
 */
const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME
    return () => { document.title = APP_NAME }
  }, [title])
}

export default usePageTitle
