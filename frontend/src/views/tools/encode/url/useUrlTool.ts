import { ref, watch, computed } from 'vue'
import { toast } from '@/composables/useToast'

export type UrlTab = 'codec' | 'parse'
export type CodecMode = 'encode' | 'decode'

export interface UrlPart {
  key: string
  value: string
  desc?: string
}

export interface QueryParam {
  key: string
  value: string
}

export interface ParsedUrl {
  valid: boolean
  parts: UrlPart[]
  queryParams: QueryParam[]
  pathSegments: string[]
}

export function useUrlTool() {
  const currentTab = ref<UrlTab>('codec')
  const mode = ref<CodecMode>('encode')
  const inputText = ref('')
  const outputText = ref('')
  const copied = ref(false)
  const parsedUrl = ref<ParsedUrl | null>(null)

  const inputStats = computed(() => ({ chars: inputText.value.length }))
  const parseStats = computed(() => {
    if (!parsedUrl.value) return { parts: 0, params: 0, segments: 0 }
    return {
      parts: parsedUrl.value.parts.length,
      params: parsedUrl.value.queryParams.length,
      segments: parsedUrl.value.pathSegments.length,
    }
  })

  const convert = () => {
    if (!inputText.value) {
      outputText.value = ''
      return
    }
    try {
      outputText.value = mode.value === 'encode'
        ? encodeURIComponent(inputText.value)
        : decodeURIComponent(inputText.value)
    } catch (e: any) {
      outputText.value = `错误: ${e.message}`
    }
  }

  const parseUrlAction = () => {
    const url = inputText.value.trim()
    if (!url) {
      parsedUrl.value = null
      return
    }
    try {
      let urlObj: URL
      try {
        urlObj = !url.match(/^https?:\/\//i) ? new URL('https://' + url) : new URL(url)
      } catch {
        parsedUrl.value = { valid: false, parts: [], queryParams: [], pathSegments: [] }
        return
      }
      const parts: UrlPart[] = [
        { key: 'protocol', value: urlObj.protocol.replace(':', ''), desc: '协议' },
        { key: 'host', value: urlObj.host, desc: '主机' },
        { key: 'hostname', value: urlObj.hostname, desc: '主机名' },
        { key: 'port', value: urlObj.port || '(默认)', desc: '端口' },
        { key: 'pathname', value: urlObj.pathname, desc: '路径' },
        { key: 'search', value: urlObj.search || '(无)', desc: '查询字符串' },
        { key: 'hash', value: urlObj.hash || '(无)', desc: 'Hash' },
        { key: 'origin', value: urlObj.origin, desc: '源' },
      ]
      const queryParams: QueryParam[] = []
      urlObj.searchParams.forEach((value, key) => { queryParams.push({ key, value }) })
      const pathSegments = urlObj.pathname.split('/').filter(Boolean)
      parsedUrl.value = { valid: true, parts, queryParams, pathSegments }
    } catch {
      parsedUrl.value = { valid: false, parts: [], queryParams: [], pathSegments: [] }
    }
  }

  const toggleMode = () => {
    mode.value = mode.value === 'encode' ? 'decode' : 'encode'
    const temp = inputText.value
    inputText.value = outputText.value
    outputText.value = temp
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

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('已复制')
    } catch { toast.error('复制失败') }
  }

  const clear = () => {
    inputText.value = ''
    outputText.value = ''
    parsedUrl.value = null
  }

  const paste = async () => {
    try {
      inputText.value = await navigator.clipboard.readText()
      toast.success('已粘贴')
    } catch { toast.error('粘贴失败') }
  }

  const loadExample = () => {
    inputText.value = 'https://example.com:8080/api/users?page=1&size=10&sort=name#section-1'
  }

  watch([inputText, currentTab, mode], () => {
    if (currentTab.value === 'codec') convert()
    else parseUrlAction()
  })

  return {
    currentTab, mode, inputText, outputText, copied, parsedUrl,
    inputStats, parseStats,
    convert, parseUrlAction, toggleMode, copyOutput, copyText, clear, paste, loadExample,
  }
}
