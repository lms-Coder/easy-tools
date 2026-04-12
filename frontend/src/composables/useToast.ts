import { ref } from 'vue'

export interface ToastItem {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration: number
}

const toasts = ref<ToastItem[]>([])
let nextId = 0

function addToast(
  type: ToastItem['type'],
  message: string,
  duration: number = 3000
): void {
  const id = nextId++
  const toast: ToastItem = { id, type, message, duration }
  toasts.value.push(toast)

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }
}

function removeToast(id: number): void {
  const index = toasts.value.findIndex((t) => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

function success(message: string, duration?: number): void {
  addToast('success', message, duration)
}

function error(message: string, duration?: number): void {
  addToast('error', message, duration)
}

function warning(message: string, duration?: number): void {
  addToast('warning', message, duration)
}

function info(message: string, duration?: number): void {
  addToast('info', message, duration)
}

export const toast = {
  success,
  error,
  warning,
  info,
}

export function useToast() {
  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }
}
