import { ref, computed, watch } from 'vue'
import { toast } from '@/composables/useToast'
import * as RegexService from '../../../../../bindings/easy-tools/internal/services/regexservice.js'
import { explainPattern } from './regexTokenizer'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
import kotlin from 'highlight.js/lib/languages/kotlin'
import php from 'highlight.js/lib/languages/php'
import csharp from 'highlight.js/lib/languages/csharp'
import rust from 'highlight.js/lib/languages/rust'
import dart from 'highlight.js/lib/languages/dart'
import ruby from 'highlight.js/lib/languages/ruby'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('go', go)
hljs.registerLanguage('java', java)
hljs.registerLanguage('kotlin', kotlin)
hljs.registerLanguage('php', php)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('dart', dart)
hljs.registerLanguage('ruby', ruby)

export type ToolsMode = 'match' | 'replace' | 'code'
export type CodeLanguage = 'javascript' | 'python' | 'go' | 'java' | 'kotlin' | 'php' | 'csharp' | 'rust' | 'dart' | 'ruby'

export interface FlagOptions {
  global: boolean
  ignoreCase: boolean
  multiline: boolean
  dotAll: boolean
}

export interface Preset {
  name: string
  pattern: string
  testText?: string
}

export interface CodeLanguageOption {
  value: CodeLanguage
  label: string
}

export interface RegexHelpSection {
  title: string
  items: { code: string; desc: string }[]
}

export interface TestCase {
  id: number
  text: string
  shouldMatch: boolean
  pass: boolean | null
  actualMatches: string[]
}

export const codeLanguages: CodeLanguageOption[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'php', label: 'PHP' },
  { value: 'csharp', label: 'C#' },
  { value: 'rust', label: 'Rust' },
  { value: 'dart', label: 'Dart' },
  { value: 'ruby', label: 'Ruby' },
]

export const presets: Preset[] = [
  { name: '邮箱', pattern: '^[\\w.-]+@[\\w.-]+\\.\\w+$' },
  { name: '手机号', pattern: '^1[3-9]\\d{9}$' },
  { name: 'URL', pattern: 'https?://[^\\s]+' },
  { name: 'IP地址', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b' },
  { name: '身份证号', pattern: '^\\d{17}[\\dXx]$' },
  { name: '数字', pattern: '^-?\\d+\\.?\\d*$' },
  { name: '中文', pattern: '[\\u4e00-\\u9fa5]+' },
  { name: '日期', pattern: '\\d{4}[-/]\\d{2}[-/]\\d{2}' },
  { name: 'HTML标签', pattern: '<[^>]+>' },
  { name: '十六进制', pattern: '#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\b' },
]

export const regexHelpContent: RegexHelpSection[] = [
  {
    title: '字符类',
    items: [
      { code: '.', desc: '匹配任意单个字符（除换行符）' },
      { code: '\\d', desc: '匹配数字 [0-9]' },
      { code: '\\D', desc: '匹配非数字 [^0-9]' },
      { code: '\\w', desc: '匹配单词字符 [a-zA-Z0-9_]' },
      { code: '\\W', desc: '匹配非单词字符' },
      { code: '\\s', desc: '匹配空白字符' },
      { code: '\\S', desc: '匹配非空白字符' },
      { code: '[abc]', desc: '匹配字符集中的任意一个' },
      { code: '[^abc]', desc: '匹配不在字符集中的任意字符' },
      { code: '[a-z]', desc: '匹配指定范围内的字符' },
    ],
  },
  {
    title: '量词',
    items: [
      { code: '*', desc: '匹配 0 次或多次' },
      { code: '+', desc: '匹配 1 次或多次' },
      { code: '?', desc: '匹配 0 次或 1 次' },
      { code: '{n}', desc: '匹配恰好 n 次' },
      { code: '{n,}', desc: '匹配至少 n 次' },
      { code: '{n,m}', desc: '匹配 n 到 m 次' },
      { code: '*?', desc: '匹配 0 次或多次（非贪婪）' },
      { code: '+?', desc: '匹配 1 次或多次（非贪婪）' },
    ],
  },
  {
    title: '位置匹配',
    items: [
      { code: '^', desc: '匹配字符串开头' },
      { code: '$', desc: '匹配字符串结尾' },
      { code: '\\b', desc: '匹配单词边界' },
      { code: '\\B', desc: '匹配非单词边界' },
    ],
  },
  {
    title: '分组和引用',
    items: [
      { code: '(...)', desc: '捕获分组' },
      { code: '(?:...)', desc: '非捕获分组' },
      { code: '(?<name>...)', desc: '命名捕获组' },
      { code: '(?=...)', desc: '正向先行断言' },
      { code: '(?!...)', desc: '负向先行断言' },
      { code: '(?<=...)', desc: '正向后行断言' },
      { code: '(?<!...)', desc: '负向后行断言' },
      { code: '\\1, \\2', desc: '反向引用分组' },
      { code: '$1, $2', desc: '替换时引用分组' },
    ],
  },
  {
    title: '标志（Flags）',
    items: [
      { code: 'g', desc: '全局匹配' },
      { code: 'i', desc: '忽略大小写' },
      { code: 'm', desc: '多行模式' },
      { code: 's', desc: '点匹配换行' },
    ],
  },
]

// Debounce helper
function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// Map our CodeLanguage to highlight.js language names
const hljsLangMap: Record<CodeLanguage, string> = {
  javascript: 'javascript',
  python: 'python',
  go: 'go',
  java: 'java',
  kotlin: 'kotlin',
  php: 'php',
  csharp: 'csharp',
  rust: 'rust',
  dart: 'dart',
  ruby: 'ruby',
}

let testCaseId = 0

export function useRegex() {
  const pattern = ref('')
  const flags = ref<FlagOptions>({
    global: true,
    ignoreCase: false,
    multiline: false,
    dotAll: false,
  })
  const testText = ref('')
  const replaceText = ref('')
  const toolsMode = ref<ToolsMode>('match')

  const matches = ref<any[]>([])
  const error = ref('')
  const matchCount = ref(0)
  const loading = ref(false)
  const showHelpModal = ref(false)

  const codeLanguage = ref<CodeLanguage>('javascript')
  const generatedCode = ref('')
  const allCodes = ref<Record<string, string | undefined>>({})
  const replacedText = ref('')

  // Test suite
  const testCases = ref<TestCase[]>([])
  const showTestSuite = ref(false)

  // Explain
  const explainLines = computed(() => explainPattern(pattern.value))

  // Highlighted code
  const highlightedCode = computed(() => {
    if (!generatedCode.value) return ''
    const lang = hljsLangMap[codeLanguage.value]
    try {
      return hljs.highlight(generatedCode.value, { language: lang }).value
    } catch {
      return generatedCode.value
    }
  })

  const flagsString = computed(() => {
    let result = ''
    if (flags.value.global) result += 'g'
    if (flags.value.ignoreCase) result += 'i'
    if (flags.value.multiline) result += 'm'
    if (flags.value.dotAll) result += 's'
    return result
  })

  const highlightedText = computed(() => {
    if (!testText.value || matches.value.length === 0) {
      return [{ text: testText.value, isMatch: false }]
    }
    const result: Array<{ text: string; isMatch: boolean; index?: number }> = []
    let lastIndex = 0
    matches.value.forEach((match: any, i: number) => {
      if (match.index > lastIndex) {
        result.push({ text: testText.value.slice(lastIndex, match.index), isMatch: false })
      }
      result.push({ text: match.fullMatch, isMatch: true, index: i + 1 })
      lastIndex = Number(match.index) + (Number(match.length) || match.fullMatch.length)
    })
    if (lastIndex < testText.value.length) {
      result.push({ text: testText.value.slice(lastIndex), isMatch: false })
    }
    return result
  })

  // Replace diff — highlight replaced segments
  const replaceDiff = computed(() => {
    if (!replacedText.value || replacedText.value === testText.value || matches.value.length === 0) {
      return null
    }
    // Build segments showing which parts changed
    // Simple approach: highlight match positions in original text that were replaced
    return replacedText.value
  })

  const executeMatch = async () => {
    error.value = ''
    matches.value = []
    matchCount.value = 0
    if (!pattern.value.trim() || !testText.value) return

    loading.value = true
    try {
      const results = await RegexService.ExecuteRegex(pattern.value, testText.value, flagsString.value)
      if (results) {
        matches.value = results
        matchCount.value = results.length
      }
    } catch (e: any) {
      error.value = e.message || String(e)
    } finally {
      loading.value = false
    }
  }

  const doReplace = async () => {
    if (!pattern.value.trim() || !testText.value || !replaceText.value) {
      replacedText.value = ''
      return
    }
    try {
      const result = await RegexService.ReplaceRegex(pattern.value, testText.value, replaceText.value, flagsString.value)
      replacedText.value = result || ''
    } catch {
      replacedText.value = ''
    }
  }

  const generateCode = async () => {
    if (!pattern.value.trim()) return
    try {
      const result = await RegexService.GenerateCode(pattern.value, flagsString.value, codeLanguage.value)
      if (result) generatedCode.value = result.code
    } catch {
      generatedCode.value = ''
    }
  }

  const generateAllCodes = async () => {
    if (!pattern.value.trim()) return
    try {
      const result = await RegexService.GenerateAllCodes(pattern.value, flagsString.value)
      if (result) {
        allCodes.value = result
        const current = result[codeLanguage.value]
        if (current) generatedCode.value = current as string
      }
    } catch {
      allCodes.value = {}
    }
  }

  // Test Suite — validate test cases against current pattern
  const validateTestCases = async () => {
    if (!pattern.value.trim() || testCases.value.length === 0) return

    for (const tc of testCases.value) {
      if (!tc.text) {
        tc.pass = null
        tc.actualMatches = []
        continue
      }
      try {
        const results = await RegexService.ExecuteRegex(pattern.value, tc.text, flagsString.value)
        const matchList = results ? results.map((r: any) => r.fullMatch) : []
        tc.actualMatches = matchList
        const hasMatch = matchList.length > 0
        tc.pass = hasMatch === tc.shouldMatch
      } catch {
        tc.pass = false
        tc.actualMatches = []
      }
    }
  }

  const addTestCase = () => {
    testCases.value.push({
      id: ++testCaseId,
      text: '',
      shouldMatch: true,
      pass: null,
      actualMatches: [],
    })
    showTestSuite.value = true
  }

  const removeTestCase = (id: number) => {
    testCases.value = testCases.value.filter(tc => tc.id !== id)
  }

  const toggleTestCaseType = (tc: TestCase) => {
    tc.shouldMatch = !tc.shouldMatch
  }

  const applyPreset = (preset: Preset) => {
    pattern.value = preset.pattern
    if (preset.testText) testText.value = preset.testText
  }

  const copyResult = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('已复制')
    } catch {
      toast.error('复制失败')
    }
  }

  const copyAllMatches = async () => {
    if (matches.value.length === 0) return
    const text = matches.value.map((m: any) => m.fullMatch).join('\n')
    await copyResult(text)
  }

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      testText.value = text
      toast.success('已粘贴')
    } catch {
      toast.error('无法访问剪贴板')
    }
  }

  const clearAll = () => {
    pattern.value = ''
    testText.value = ''
    replaceText.value = ''
    matches.value = []
    matchCount.value = 0
    error.value = ''
    generatedCode.value = ''
    allCodes.value = {}
    replacedText.value = ''
    testCases.value = []
  }

  // Debounced versions
  const debouncedExecuteMatch = useDebounce(executeMatch, 200)
  const debouncedDoReplace = useDebounce(doReplace, 200)
  const debouncedValidateTestCases = useDebounce(validateTestCases, 200)

  watch([pattern, flagsString, testText], () => {
    debouncedExecuteMatch()
    debouncedValidateTestCases()
  }, { deep: true })

  watch([pattern, testText, replaceText, flagsString], () => {
    if (toolsMode.value === 'replace') debouncedDoReplace()
  }, { deep: true })

  watch(codeLanguage, () => {
    if (toolsMode.value === 'code' && pattern.value) {
      if (allCodes.value[codeLanguage.value]) {
        generatedCode.value = allCodes.value[codeLanguage.value] ?? ''
      } else {
        generateCode()
      }
    }
  })

  watch(toolsMode, (val) => {
    if (val === 'code' && pattern.value) generateAllCodes()
    else if (val === 'replace' && pattern.value && testText.value && replaceText.value) doReplace()
  })

  watch(testCases, () => {
    debouncedValidateTestCases()
  }, { deep: true })

  return {
    pattern, flags, testText, replaceText, activeTab: toolsMode,
    matches, error, matchCount, loading, showHelpModal,
    codeLanguage, generatedCode, highlightedCode, allCodes, replacedText,
    flagsString, highlightedText, replaceDiff,
    explainLines,
    testCases, showTestSuite,
    executeMatch, doReplace, generateCode, generateAllCodes,
    applyPreset, copyResult, copyAllMatches, pasteFromClipboard, clearAll,
    addTestCase, removeTestCase, toggleTestCaseType,
  }
}
