import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function show(type: ToastType, title: string, message?: string, duration = 4000) {
    const id = Math.random().toString(36).slice(2)
    const toast: Toast = { id, type, title, message, duration }
    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }

    return id
  }

  function dismiss(id: string) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  function success(title: string, message?: string) {
    return show('success', title, message)
  }

  function error(title: string, message?: string) {
    return show('error', title, message, 6000)
  }

  function warning(title: string, message?: string) {
    return show('warning', title, message)
  }

  function info(title: string, message?: string) {
    return show('info', title, message)
  }

  return { toasts, show, dismiss, success, error, warning, info }
}
