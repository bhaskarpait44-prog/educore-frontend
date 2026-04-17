// src/hooks/useToast.js
import useUiStore from '@/store/uiStore'

const useToast = () => {
  const { toastSuccess, toastError, toastWarning, toastInfo, removeToast } = useUiStore()
  return { toastSuccess, toastError, toastWarning, toastInfo, removeToast }
}

export default useToast
