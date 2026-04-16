import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { toast } from '@/composables/useToast'

export type Base64Mode = 'encode' | 'decode'

export interface FileInfo {
  name: string
  size: number
  type: string
  dataUrl: string
}

export function useBase64() {
  // ====== State ======
  const mode = ref<Base64Mode>('encode')
  const inputText = ref('')
  const outputText = ref('')
  const urlSafe = ref(false)
  const error = ref('')
  const copied = ref(false)
  const fileInputRef = ref<HTMLInputElement | null>(null)

  // 文件相关
  const fileInfo = ref<FileInfo | null>(null)
  const isDragOver = ref(false)

  // 预览相关
  const previewUrl = ref<string>('')
  const previewArrayBuffer = ref<ArrayBuffer | null>(null)
  const previewFileType = ref<string>('')
  const showPreview = ref(true)
  const showFullscreen = ref(false)
  const isPreviewLoading = ref(false)

  // ====== File Type Detection ======
  type PreviewCategory = 'image' | 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'office' | 'other'

  function getPreviewCategory(file: { type: string; name: string } | null): PreviewCategory {
    if (!file) return 'other'
    if (file.type.startsWith('image/')) return 'image'
    if (file.type === 'application/pdf') return 'pdf'
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (ext === 'docx') return 'docx'
    if (ext === 'xlsx' || ext === 'xls') return 'xlsx'
    if (ext === 'pptx') return 'pptx'
    if (ext === 'pdf') return 'pdf'
    return 'other'
  }

  function isOfficeFileType(buf: ArrayBuffer | null, type: string): boolean {
    if (!buf) return false
    const b = new Uint8Array(buf)
    if (b.length < 4 || b[0] !== 0x50 || b[1] !== 0x4B || b[2] !== 0x03 || b[3] !== 0x04) return false
    const text = new TextDecoder().decode(b.slice(0, Math.min(4096, b.length)))
    const map: Record<string, string> = {
      docx: 'word/', xlsx: 'xl/', xls: 'workbook', pptx: 'ppt/', pdf: '%PDF',
    }
    return map[type] ? text.includes(map[type]) : false
  }

  const isPreviewable = computed(() => !!previewUrl.value || !!previewArrayBuffer.value)

  // ====== Encode / Decode ======
  function encode(text: string): string {
    const encoded = btoa(unescape(encodeURIComponent(text)))
    if (urlSafe.value) {
      return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    }
    return encoded
  }

  // 解码后的二进制数据（用于图片等二进制文件的预览和下载）
  const decodedBinary = ref<Uint8Array | null>(null)
  const decodedMime = ref<string>('')

  function base64ToBytes(base64: string): Uint8Array {
    let b64 = base64.trim()
    b64 = b64.replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  }

  function decode(text: string): string {
    let base64Str = text.trim()
    let mimeHint = ''
    // 处理 data:image/png;base64,xxxx 格式
    const dataUrlMatch = base64Str.match(/^data:([^;,]+)?(?:;([^,]*))?,(.*)$/s)
    if (dataUrlMatch) {
      mimeHint = dataUrlMatch[1] || ''
      base64Str = dataUrlMatch[3] || ''
    }
    const bytes = base64ToBytes(base64Str)
    // 如果有 MIME 提示，直接视为二进制
    if (mimeHint && mimeHint !== 'text/plain') {
      decodedBinary.value = bytes
      decodedMime.value = mimeHint
      return '[二进制数据，请使用下载按钮保存为文件]'
    }
    // 尝试作为 UTF-8 文本解码
    try {
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      decodedBinary.value = null
      decodedMime.value = ''
      return decoded
    } catch {
      // 不是有效 UTF-8，视为二进制数据
      decodedBinary.value = bytes
      return '[二进制数据，请使用下载按钮保存为文件]'
    }
  }

  function convert() {
    const text = inputText.value
    if (!text) {
      outputText.value = ''; error.value = ''
      decodedBinary.value = null; decodedMime.value = ''
      return
    }
    try {
      if (mode.value === 'encode') {
        outputText.value = encode(text)
        decodedBinary.value = null
        decodedMime.value = ''
      } else {
        outputText.value = decode(text)
        // 二进制数据时检测 MIME 类型
        if (decodedBinary.value) {
          const mime = detectMimeType(decodedBinary.value)
          decodedMime.value = mime
          if (mime) {
            detectPreviewFromBytes(decodedBinary.value, mime)
          }
        } else {
          clearPreview()
        }
      }
      error.value = ''
    } catch (e: any) {
      error.value = mode.value === 'decode' ? '无效的 Base64 字符串' : (e.message || '转换失败')
      outputText.value = ''
      decodedBinary.value = null
    }
  }

  // ====== Detect MIME type from binary bytes ======
  function detectMimeType(bytes: Uint8Array): string {
    if (bytes.length < 4) return ''
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png'
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'image/jpeg'
    if (bytes[0] === 0x47 && bytes[1] === 0x49) return 'image/gif'
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes.length > 8 && bytes[8] === 0x57) return 'image/webp'
    if (bytes[0] === 0x25 && bytes[1] === 0x50) return 'application/pdf'
    if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
      const text = new TextDecoder().decode(bytes.slice(0, Math.min(4096, bytes.length)))
      if (text.includes('word/')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      if (text.includes('xl/') || text.includes('workbook')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      if (text.includes('ppt/')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      return 'application/zip'
    }
    return ''
  }

  // ====== Generate preview from decoded binary bytes ======
  function detectPreviewFromBytes(bytes: Uint8Array, mime: string) {
    try {
      if (mime.startsWith('image/') || mime === 'application/pdf') {
        const b64 = Array.from(bytes).map(b => String.fromCharCode(b)).join('')
        previewUrl.value = `data:${mime};base64,${btoa(b64)}`
        previewFileType.value = mime.startsWith('image/') ? 'image' : 'pdf'
        previewArrayBuffer.value = null
      } else if (mime.includes('zip') || mime.includes('office') || mime.includes('document') || mime.includes('sheet') || mime.includes('presentation')) {
        previewUrl.value = 'office'
        previewArrayBuffer.value = bytes.buffer as ArrayBuffer
        if (mime.includes('word')) previewFileType.value = 'docx'
        else if (mime.includes('sheet')) previewFileType.value = 'xlsx'
        else if (mime.includes('presentation')) previewFileType.value = 'pptx'
        else previewFileType.value = 'other'
      } else {
        previewUrl.value = ''
        previewArrayBuffer.value = null
        previewFileType.value = ''
      }
    } catch {
      previewUrl.value = ''
      previewArrayBuffer.value = null
      previewFileType.value = ''
    }
  }

  // ====== File Encode ======
  function processFile(file: File) {
    mode.value = 'encode'
    fileInfo.value = {
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      dataUrl: '',
    }
    isPreviewLoading.value = true

    const category = getPreviewCategory(file)
    previewFileType.value = category

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1] || ''
      const result = urlSafe.value
        ? base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
        : base64

      fileInfo.value = { ...fileInfo.value!, dataUrl }
      inputText.value = dataUrl
      outputText.value = result
      error.value = ''

      if (category === 'image' || category === 'pdf') {
        previewUrl.value = dataUrl
        previewArrayBuffer.value = null
        isPreviewLoading.value = false
      } else if (category !== 'other') {
        // Office file: need ArrayBuffer for preview
        previewUrl.value = 'office'
        const ar = new FileReader()
        ar.onload = () => {
          previewArrayBuffer.value = ar.result as ArrayBuffer
        }
        ar.readAsArrayBuffer(file)
      } else {
        previewUrl.value = ''
        previewArrayBuffer.value = null
        isPreviewLoading.value = false
      }
      toast.success('文件已编码')
    }
    reader.onerror = () => {
      error.value = '文件读取失败'
      isPreviewLoading.value = false
    }
    reader.readAsDataURL(file)
  }

  // ====== File Decode ======
  function downloadFromBase64() {
    if (!fileInfo.value || !inputText.value.startsWith('data:')) {
      toast.error('无可用文件数据')
      return
    }
    const parts = inputText.value.split(',')
    const meta = parts[0]
    const data = parts[1]
    const mimeMatch = meta.match(/data:([^;]+)/)
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
    let cleaned = data.replace(/-/g, '+').replace(/_/g, '/')
    while (cleaned.length % 4) cleaned += '='
    const binary = atob(cleaned)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileInfo.value.name || 'decoded-file'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('文件已下载')
  }

  // ====== 通用下载解码后的二进制数据 ======
  function downloadDecodedBinary() {
    if (!decodedBinary.value) {
      toast.error('无可下载的二进制数据')
      return
    }
    const mime = decodedMime.value || 'application/octet-stream'
    const extMap: Record<string, string> = {
      'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp',
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    }
    const ext = extMap[mime] || 'bin'
    const blob = new Blob([new Uint8Array(decodedBinary.value)], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `decoded-file.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('文件已下载')
  }

  // ====== Actions ======
  async function copyOutput() {
    if (!outputText.value) return
    try {
      await navigator.clipboard.writeText(outputText.value)
      copied.value = true
      setTimeout(() => { copied.value = false }, 2000)
      toast.success('已复制到剪贴板', 1500)
    } catch { toast.error('复制失败') }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      inputText.value = text
      fileInfo.value = null
      clearPreview()
      toast.success('已粘贴', 1500)
    } catch { toast.error('粘贴失败') }
  }

  function clearAll() {
    inputText.value = ''
    outputText.value = ''
    error.value = ''
    fileInfo.value = null
    decodedBinary.value = null
    decodedMime.value = ''
    clearPreview()
  }

  function clearPreview() {
    previewUrl.value = ''
    previewArrayBuffer.value = null
    previewFileType.value = ''
    isPreviewLoading.value = false
    showPreview.value = true
  }

  function swap() {
    if (!outputText.value) return
    inputText.value = outputText.value
    fileInfo.value = null
    decodedBinary.value = null
    decodedMime.value = ''
    mode.value = mode.value === 'encode' ? 'decode' : 'encode'
    clearPreview()
  }

  function importFile() {
    fileInputRef.value?.click()
  }

  function handleFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    clearPreview()
    processFile(file)
    ;(event.target as HTMLInputElement).value = ''
  }

  // Preview callbacks
  function onPreviewRendered() { isPreviewLoading.value = false }
  function onPreviewError() { isPreviewLoading.value = false; toast.error('预览加载失败') }

  // Fullscreen
  function openFullscreen() { showFullscreen.value = true }
  function closeFullscreen() { showFullscreen.value = false }

  // ====== Drag & Drop ======
  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    if (e.dataTransfer?.types.includes('Files')) {
      isDragOver.value = true
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
      isDragOver.value = false
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    isDragOver.value = false
    const file = e.dataTransfer?.files?.[0]
    if (file) processFile(file)
  }

  const onGlobalDragOver = (e: DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  }
  const onGlobalDrop = (e: DragEvent) => { e.preventDefault() }

  onMounted(() => {
    document.addEventListener('dragover', onGlobalDragOver)
    document.addEventListener('drop', onGlobalDrop)
  })
  onUnmounted(() => {
    document.removeEventListener('dragover', onGlobalDragOver)
    document.removeEventListener('drop', onGlobalDrop)
  })

  // ====== Computed ======
  const inputByteSize = computed(() => new TextEncoder().encode(inputText.value).length)
  const outputByteSize = computed(() => new TextEncoder().encode(outputText.value).length)
  const hasFile = computed(() => !!fileInfo.value)
  const encodePreviewType = computed(() => {
    if (!fileInfo.value) return ''
    return getPreviewCategory(fileInfo.value)
  })
  const decodePreviewType = computed(() => previewFileType.value)

  // ====== Watch ======
  watch([inputText, urlSafe], () => {
    if (hasFile.value) return
    convert()
  })
  watch(mode, () => {
    if (hasFile.value) return
    convert()
  })

  return {
    mode, inputText, outputText, urlSafe, error, copied,
    fileInfo, isDragOver, fileInputRef, hasFile,
    inputByteSize, outputByteSize,
    // Preview
    previewUrl, previewArrayBuffer, previewFileType,
    showPreview, showFullscreen, isPreviewLoading,
    encodePreviewType, decodePreviewType, isPreviewable,
    isOfficeFileType,
    // Binary decode
    decodedBinary, decodedMime,
    // Methods
    copyOutput, pasteFromClipboard, clearAll, swap,
    importFile, handleFileSelect,
    handleDragOver, handleDragLeave, handleDrop,
    downloadFromBase64, downloadDecodedBinary,
    openFullscreen, closeFullscreen,
    onPreviewRendered, onPreviewError,
    getPreviewCategory,
  }
}
