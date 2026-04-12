import { ref } from 'vue'

export interface DialogOptions {
  title: string
  message: string
  type?: 'info' | 'warning' | 'error' | 'success' | 'confirm'
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
}

interface DialogState extends DialogOptions {
  visible: boolean
  resolve: ((value: boolean) => void) | null
}

const dialogState = ref<DialogState>({
  visible: false,
  title: '',
  message: '',
  type: 'info',
  confirmText: '确定',
  cancelText: '取消',
  showCancel: true,
  resolve: null,
})

function showDialog(options: DialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    dialogState.value = {
      visible: true,
      title: options.title,
      message: options.message,
      type: options.type || 'info',
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      showCancel: options.showCancel !== false,
      resolve,
    }
  })
}

function confirm(title: string, message: string): Promise<boolean> {
  return showDialog({ title, message, type: 'confirm', showCancel: true })
}

function info(title: string, message: string): Promise<boolean> {
  return showDialog({ title, message, type: 'info', showCancel: false })
}

function warning(title: string, message: string): Promise<boolean> {
  return showDialog({ title, message, type: 'warning', showCancel: false })
}

function success(title: string, message: string): Promise<boolean> {
  return showDialog({ title, message, type: 'success', showCancel: false })
}

function error(title: string, message: string): Promise<boolean> {
  return showDialog({ title, message, type: 'error', showCancel: false })
}

function handleConfirm(): void {
  dialogState.value.resolve?.(true)
  dialogState.value.visible = false
}

function handleCancel(): void {
  dialogState.value.resolve?.(false)
  dialogState.value.visible = false
}

export function useDialog() {
  return {
    dialogState,
    showDialog,
    confirm,
    info,
    warning,
    success,
    error,
    handleConfirm,
    handleCancel,
  }
}
