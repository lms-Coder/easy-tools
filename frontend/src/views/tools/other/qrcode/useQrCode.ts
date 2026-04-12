import { computed, onMounted, ref, watch } from 'vue'
import QRCode from 'qrcode'
import { toast } from '@/composables/useToast'

export type ErrorLevel = 'L' | 'M' | 'Q' | 'H'

export interface ErrorLevelOption {
  id: ErrorLevel
  name: string
  desc: string
}

export interface PresetSample {
  label: string
  value: string
}

export const errorLevels: ErrorLevelOption[] = [
  { id: 'L', name: '低', desc: '约 7%' },
  { id: 'M', name: '中', desc: '约 15%' },
  { id: 'Q', name: '较高', desc: '约 25%' },
  { id: 'H', name: '高', desc: '约 30%' },
]

export const presetSamples: PresetSample[] = [
  { label: '链接', value: 'https://github.com' },
  { label: 'Wi-Fi', value: 'WIFI:T:WPA;S:EasyTools;P:12345678;;' },
  { label: '邮箱', value: 'mailto:hello@example.com' },
  { label: '电话', value: 'tel:13800138000' },
]

export function useQrCode() {
  const inputText = ref('https://github.com')
  const size = ref(280)
  const margin = ref(2)
  const errorCorrectionLevel = ref<ErrorLevel>('M')
  const foregroundColor = ref('#111827')
  const backgroundColor = ref('#ffffff')
  const qrCodeDataUrl = ref('')
  const isGenerating = ref(false)

  const qrFileName = computed(() => {
    const safeText = inputText.value.trim().slice(0, 24).replace(/[\\/:*?"<>|\s]+/g, '-') || 'qrcode'
    return `${safeText}-${Date.now()}.png`
  })

  const charCount = computed(() => inputText.value.length)
  const isUrlLike = computed(() => /^https?:\/\//i.test(inputText.value.trim()))

  const generateQRCode = async () => {
    const value = inputText.value.trim()
    if (!value) { qrCodeDataUrl.value = ''; return }
    isGenerating.value = true
    try {
      qrCodeDataUrl.value = await QRCode.toDataURL(value, {
        width: size.value,
        margin: margin.value,
        errorCorrectionLevel: errorCorrectionLevel.value,
        color: { dark: foregroundColor.value, light: backgroundColor.value },
      })
    } catch {
      qrCodeDataUrl.value = ''
      toast.error('二维码生成失败')
    } finally {
      isGenerating.value = false
    }
  }

  const applySample = (value: string) => { inputText.value = value }

  const downloadQR = () => {
    if (!qrCodeDataUrl.value) return
    const link = document.createElement('a')
    link.download = qrFileName.value
    link.href = qrCodeDataUrl.value
    link.click()
    toast.success('二维码已下载')
  }

  const copyQR = async () => {
    if (!qrCodeDataUrl.value) return
    try {
      const response = await fetch(qrCodeDataUrl.value)
      const blob = await response.blob()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      toast.success('二维码已复制到剪贴板')
    } catch {
      toast.error('复制失败，当前环境可能不支持图片写入剪贴板')
    }
  }

  const clear = () => {
    inputText.value = ''
    qrCodeDataUrl.value = ''
  }

  watch([inputText, size, margin, errorCorrectionLevel, foregroundColor, backgroundColor], generateQRCode)
  onMounted(generateQRCode)

  return {
    inputText, size, margin, errorCorrectionLevel,
    foregroundColor, backgroundColor, qrCodeDataUrl, isGenerating,
    qrFileName, charCount, isUrlLike,
    generateQRCode, applySample, downloadQR, copyQR, clear,
  }
}
