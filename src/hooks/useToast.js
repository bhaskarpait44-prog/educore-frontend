// src/hooks/useToast.js
import { useShallow } from 'zustand/react/shallow'
import useUiStore from '@/store/uiStore'

const useToast = () => {
  const { toastSuccess, toastError, toastWarning, toastInfo, removeToast } = useUiStore(useShallow((state) => ({
    toastSuccess : state.toastSuccess,
    toastError   : state.toastError,
    toastWarning : state.toastWarning,
    toastInfo    : state.toastInfo,
    removeToast  : state.removeToast,
  })))
  return { toastSuccess, toastError, toastWarning, toastInfo, removeToast }
}

export default useToast
