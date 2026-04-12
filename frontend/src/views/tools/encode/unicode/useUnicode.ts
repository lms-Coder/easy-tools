import { ref, computed, watch } from 'vue'
import { toast } from '@/composables/useToast'

export type UnicodeMode = 'encode' | 'decode'
export type UnicodeFormat = 'slash' | 'slash-escape' | 'html' | 'unicode'

export interface FormatOption {
  value: UnicodeFormat
  label: string
  example: string
}

export interface FormatRule {
  from: string
  to: string
  desc: string
}

export const formatOptions: FormatOption[] = [
  { value: 'slash', label: '\\uXXXX', example: '\\u4f60\\u597d' },
  { value: 'slash-escape', label: '\\\\uXXXX', example: '\\\\u4f60\\\\u597d' },
  { value: 'html', label: '&#xXXXX;', example: '&#x4f60;&#x597d;' },
  { value: 'unicode', label: 'U+XXXX', example: 'U+4F60 U+597D' },
]

export function useUnicode() {
  const currentMode = ref<UnicodeMode>('encode')
  const currentFormat = ref<UnicodeFormat>('slash')
  const inputText = ref('')
  const outputText = ref('')
  const copied = ref(false)

  const inputStats = computed(() => ({
    chars: inputText.value.length,
    lines: inputText.value ? inputText.value.split('\n').length : 0,
  }))

  const outputStats = computed(() => ({
    chars: outputText.value.length,
    lines: outputText.value ? outputText.value.split('\n').length : 0,
  }))

  const formatRules = computed<FormatRule[]>(() => {
    const char = '你'
    const hex = '4F60'
    switch (currentFormat.value) {
      case 'slash': return [{ from: char, to: `\\u${hex}`, desc: '标准格式' }]
      case 'slash-escape': return [{ from: char, to: `\\\\u${hex}`, desc: '双反斜杠' }]
      case 'html': return [{ from: char, to: `&#x${hex};`, desc: 'HTML 实体' }]
      case 'unicode': return [{ from: char, to: `U+${hex}`, desc: 'Unicode 表示法' }]
      default: return []
    }
  })

  // ====== Core ======
  const formatCodePoint = (code: number, format: UnicodeFormat): string => {
    const hex = code.toString(16).toUpperCase().padStart(4, '0')
    switch (format) {
      case 'slash': return `\\u${hex}`
      case 'slash-escape': return `\\\\u${hex}`
      case 'html': return `&#x${hex};`
      case 'unicode': return `U+${hex}`
      default: return `\\u${hex}`
    }
  }

  const encodeUnicode = (text: string, format: UnicodeFormat): string => {
    let result = ''
    for (let i = 0; i < text.length; i++) {
      const code = text.codePointAt(i)!
      if (code > 0xFFFF) {
        i++ // skip surrogate pair
        result += formatCodePoint(code, format)
      } else if (code > 0x7E || code < 0x20) {
        result += formatCodePoint(code, format)
      } else {
        result += text[i]
      }
    }
    return result
  }

  const decodeSlash = (text: string): string => {
    return text.replace(/\\u([0-9a-fA-F]{4,6})/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
  }

  const decodeSlashEscape = (text: string): string => {
    return text.replace(/\\\\u([0-9a-fA-F]{4,6})/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
  }

  const decodeHtml = (text: string): string => {
    return text.replace(/&#x([0-9a-fA-F]{2,6});/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
  }

  const decodeUnicodeNotation = (text: string): string => {
    return text.replace(/U\+([0-9a-fA-F]{4,6})/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
  }

  const decodeUnicode = (text: string, format: UnicodeFormat): string => {
    switch (format) {
      case 'slash': return decodeSlash(text)
      case 'slash-escape': return decodeSlashEscape(text)
      case 'html': return decodeHtml(text)
      case 'unicode': return decodeUnicodeNotation(text)
      default: return decodeSlash(text)
    }
  }

  const convert = () => {
    if (!inputText.value) {
      outputText.value = ''
      return
    }
    try {
      outputText.value = currentMode.value === 'encode'
        ? encodeUnicode(inputText.value, currentFormat.value)
        : decodeUnicode(inputText.value, currentFormat.value)
    } catch (e: any) {
      outputText.value = ''
      toast.error(`转换失败: ${e.message}`)
    }
  }

  // ====== Actions ======
  const swapDirection = () => {
    const temp = inputText.value
    inputText.value = outputText.value
    currentMode.value = currentMode.value === 'encode' ? 'decode' : 'encode'
    toast.success(currentMode.value === 'encode' ? '切换为编码模式' : '切换为解码模式')
  }

  const copyOutput = async () => {
    if (!outputText.value) return
    try {
      await navigator.clipboard.writeText(outputText.value)
      copied.value = true
      toast.success('已复制')
      setTimeout(() => copied.value = false, 2000)
    } catch { toast.error('复制失败') }
  }

  const clearAll = () => {
    inputText.value = ''
    outputText.value = ''
    copied.value = false
  }

  const pasteFromClipboard = async () => {
    try {
      inputText.value = await navigator.clipboard.readText()
      toast.success('已粘贴')
    } catch { toast.error('粘贴失败') }
  }

  const loadExample = () => {
    if (currentMode.value === 'encode') {
      inputText.value = '你好，世界！Hello 🌍'
    } else {
      switch (currentFormat.value) {
        case 'slash':
          inputText.value = '\\u4f60\\u597d\\uff0c\\u4e16\\u754c\\uff01Hello \\ud83c\\udf0d'
          break
        case 'slash-escape':
          inputText.value = '\\\\u4f60\\\\u597d\\\\uff0c\\\\u4e16\\\\u754c\\\\uff01'
          break
        case 'html':
          inputText.value = '&#x4f60;&#x597d;&#xff0c;&#x4e16;&#x754c;&#xff01;'
          break
        case 'unicode':
          inputText.value = 'U+4F60 U+597D U+FF0C U+4E16 U+754C U+FF01'
          break
      }
    }
  }

  watch([inputText, currentMode, currentFormat], () => {
    convert()
  })

  return {
    currentMode, currentFormat, inputText, outputText, copied,
    inputStats, outputStats, formatRules,
    convert, swapDirection, copyOutput, clearAll, pasteFromClipboard, loadExample,
  }
}
