import { ref, computed, watch } from 'vue'
import { toast } from '@/composables/useToast'

export type AsciiMode = 'encode' | 'decode'
export type BaseType = 'dec' | 'hex' | 'bin' | 'oct'
export type Separator = 'space' | 'comma' | 'newline' | 'none'

export interface BaseOption {
  value: BaseType
  label: string
}

export interface SeparatorOption {
  value: Separator
  label: string
}

export const baseOptions: BaseOption[] = [
  { value: 'dec', label: '十进制' },
  { value: 'hex', label: '十六进制' },
  { value: 'bin', label: '二进制' },
  { value: 'oct', label: '八进制' },
]

export const separatorOptions: SeparatorOption[] = [
  { value: 'space', label: '空格' },
  { value: 'comma', label: '逗号' },
  { value: 'newline', label: '换行' },
  { value: 'none', label: '无' },
]

function charToCode(char: string, base: BaseType): string {
  const code = char.charCodeAt(0)
  switch (base) {
    case 'dec': return code.toString(10)
    case 'hex': return code.toString(16).toUpperCase()
    case 'bin': return code.toString(2).padStart(8, '0')
    case 'oct': return code.toString(8)
  }
}

function codeToChar(token: string, base: BaseType): string {
  const code = parseInt(token, getRadix(base))
  if (isNaN(code) || code < 0 || code > 255) return ''
  return String.fromCharCode(code)
}

function getRadix(base: BaseType): number {
  switch (base) {
    case 'dec': return 10
    case 'hex': return 16
    case 'bin': return 2
    case 'oct': return 8
  }
}

function getSeparatorChar(sep: Separator): string {
  switch (sep) {
    case 'space': return ' '
    case 'comma': return ','
    case 'newline': return '\n'
    case 'none': return ''
  }
}

function detectBase(token: string): BaseType | null {
  if (token.startsWith('0x') || token.startsWith('0X')) return 'hex'
  if (token.startsWith('0b') || token.startsWith('0B')) return 'bin'
  if (token.startsWith('0o') || token.startsWith('0O')) return 'oct'
  return null
}

function encode(text: string, base: BaseType, sep: Separator): string {
  const sepChar = getSeparatorChar(sep)
  return Array.from(text).map(ch => charToCode(ch, base)).join(sepChar)
}

function decode(text: string, base: BaseType, sep: Separator): string {
  let tokens: string[]
  if (sep === 'none') {
    // Fixed width based on base
    if (base === 'bin') {
      // 8 bits each
      tokens = text.replace(/\s/g, '').match(/.{1,8}/g) || []
    } else if (base === 'hex') {
      // 2 hex chars each
      tokens = text.replace(/\s/g, '').match(/.{1,2}/g) || []
    } else if (base === 'oct') {
      // 3 octal chars each
      tokens = text.replace(/\s/g, '').match(/.{1,3}/g) || []
    } else {
      // decimal: try to split by any whitespace or common delimiters
      tokens = text.trim().split(/[\s,;]+/).filter(Boolean)
    }
  } else {
    const sepChar = getSeparatorChar(sep)
    tokens = text.split(sepChar).map(t => t.trim()).filter(Boolean)
  }

  return tokens.map(token => {
    const detected = detectBase(token)
    const cleanToken = detected ? token.slice(2) : token
    const useBase = detected || base
    return codeToChar(cleanToken, useBase)
  }).join('')
}

export function useAscii() {
  const mode = ref<AsciiMode>('encode')
  const base = ref<BaseType>('dec')
  const separator = ref<Separator>('space')
  const inputText = ref('')
  const copied = ref(false)

  const outputText = computed(() => {
    const text = inputText.value
    if (!text) return ''
    try {
      return mode.value === 'encode'
        ? encode(text, base.value, separator.value)
        : decode(text, base.value, separator.value)
    } catch {
      return ''
    }
  })

  const inputStats = computed(() => ({
    chars: inputText.value.length,
    lines: inputText.value ? inputText.value.split('\n').length : 0,
  }))

  const outputStats = computed(() => ({
    chars: outputText.value.length,
  }))

  const swapDirection = () => {
    if (!outputText.value) return
    const output = outputText.value
    // When swapping, also flip mode
    mode.value = mode.value === 'encode' ? 'decode' : 'encode'
    inputText.value = output
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
  }

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      inputText.value = text
    } catch { toast.error('粘贴失败') }
  }

  const loadExample = () => {
    if (mode.value === 'encode') {
      inputText.value = 'Hello World!'
    } else {
      inputText.value = '72 101 108 108 111 32 87 111 114 108 100 33'
    }
  }

  return {
    mode, base, separator, inputText, outputText, copied,
    inputStats, outputStats,
    swapDirection, copyOutput, clearAll, pasteFromClipboard, loadExample,
  }
}
