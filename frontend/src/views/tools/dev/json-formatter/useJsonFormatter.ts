import { ref, computed, watch } from 'vue'
import { toast } from '@/composables/useToast'
import { useToolHistory } from '@/composables/useToolHistory'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import { useJsonPath } from './jsonpath/useJsonPath'
import { useConvert } from './convert/useConvert'
import { useJsonDiff } from './diff/useJsonDiff'
import { useSchemaValidate } from './schema/useSchemaValidate'

hljs.registerLanguage('json', json)

// ====== Mode ======
export type ToolMode = 'formatter' | 'convert' | 'diff' | 'schema'

// ====== State ======
const inputText = ref('')
const outputText = ref('')
const indentSize = ref(2)
const sortKeys = ref(false)
const viewMode = ref<'code' | 'tree'>('code')
const wordWrap = ref(true)
const error = ref('')
const copied = ref(false)
const isValid = ref(false)
const isDragging = ref(false)
const searchText = ref('')
const matchIndex = ref(0)
const fileInputRef = ref<HTMLInputElement | null>(null)

const jsonStats = ref<{ keyCount: number; depth: number; size: string } | null>(null)

// ====== History ======
interface JsonHistoryData {
  inputText: string
  inputPreview: string
  indentSize: number
  sortKeys: boolean
}

// ====== Parse & Format ======
function countKeys(obj: any): number {
  if (obj === null || obj === undefined) return 0
  if (Array.isArray(obj)) return obj.reduce((sum: number, item: any) => sum + countKeys(item), 0)
  if (typeof obj === 'object') {
    const keys = Object.keys(obj)
    return keys.reduce((sum: number, key: string) => sum + 1 + countKeys(obj[key]), 0)
  }
  return 0
}

function getDepth(obj: any, depth = 0): number {
  if (obj === null || obj === undefined || typeof obj !== 'object') return depth
  const children = Array.isArray(obj) ? obj : Object.values(obj)
  if (children.length === 0) return depth
  return Math.max(...children.map(c => getDepth(c, depth + 1)))
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function sortObjectKeys(_key: string, value: any): any {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const sorted: Record<string, any> = {}
    Object.keys(value).sort().forEach(k => { sorted[k] = value[k] })
    return sorted
  }
  return value
}

function parseJson() {
  const text = inputText.value.trim()
  if (!text) {
    outputText.value = ''
    error.value = ''
    isValid.value = false
    jsonStats.value = null
    return
  }

  try {
    const parsed = JSON.parse(text)
    const obj = sortKeys.value ? JSON.parse(JSON.stringify(parsed, sortObjectKeys)) : parsed

    jsonStats.value = {
      keyCount: countKeys(obj),
      depth: getDepth(obj),
      size: formatBytes(new Blob([text]).size),
    }

    outputText.value = JSON.stringify(obj, null, indentSize.value)
    error.value = ''
    isValid.value = true
  } catch (e: any) {
    error.value = e.message || 'JSON 解析失败'
    isValid.value = false
  }
}

function minifyJson() {
  try {
    const parsed = JSON.parse(inputText.value)
    outputText.value = JSON.stringify(parsed)
  } catch {
    // ignore
  }
}

// ====== Escape / Unescape ======
const isEscaped = computed(() => {
  const text = inputText.value.trim()
  if (!text) return false
  try {
    const parsed = JSON.parse(text)
    return typeof parsed === 'string'
  } catch {
    return false
  }
})

function unescapeJson() {
  const text = inputText.value.trim()
  try {
    const parsed = JSON.parse(text)
    inputText.value = typeof parsed === 'string' ? parsed : text
  } catch {
    // regex fallback
    inputText.value = text.replace(/^"|"$/g, '').replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n').replace(/\\t/g, '\t')
  }
  parseJson()
}

function escapeJson() {
  const text = inputText.value.trim()
  inputText.value = JSON.stringify(text)
  parseJson()
}

// ====== Actions ======
async function copyOutput() {
  if (!outputText.value) return
  try {
    await navigator.clipboard.writeText(outputText.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
    toast.success('已复制到剪贴板', 1500)
  } catch {
    // ignore
  }
}

function downloadJson() {
  if (!outputText.value) return
  const blob = new Blob([outputText.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'formatted.json'
  a.click()
  URL.revokeObjectURL(url)
}

function clearAll() {
  inputText.value = ''
  outputText.value = ''
  error.value = ''
  isValid.value = false
  jsonStats.value = null
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    parseJson()
  } catch {
    // ignore
  }
}

function importFile() {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    inputText.value = reader.result as string
    parseJson()
  }
  reader.readAsText(file)
}

// ====== Drag & Drop ======
function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}
function handleDragLeave() {
  isDragging.value = false
}
function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    inputText.value = reader.result as string
    parseJson()
  }
  reader.readAsText(file)
}

// ====== Byte size helpers for template ======
const inputByteSize = computed(() => new TextEncoder().encode(inputText.value).length)
const outputByteSize = computed(() => new TextEncoder().encode(outputText.value).length)

// ====== Code View ======
const highlightedOutput = computed(() => {
  if (!outputText.value || error.value) return ''
  try {
    return hljs.highlight(outputText.value, { language: 'json' }).value
  } catch {
    return outputText.value
  }
})

const highlightedLines = computed(() => highlightedOutput.value.split('\n'))

const plainLines = computed(() => outputText.value.split('\n'))

const matchedLines = computed(() => {
  if (!searchText.value) return new Set<number>()
  const keyword = searchText.value.toLowerCase()
  return new Set(
    plainLines.value.reduce((acc: number[], line, i) => {
      if (line.toLowerCase().includes(keyword)) acc.push(i)
      return acc
    }, [])
  )
})

const matchLineList = computed(() => Array.from(matchedLines.value).sort((a, b) => a - b))
const matchCount = computed(() => matchedLines.value.size)

function navigateMatch(dir: 1 | -1) {
  if (matchCount.value === 0) return
  const lines = matchLineList.value
  let idx = matchIndex.value
  if (idx < 0) idx = dir > 0 ? -1 : lines.length
  idx = (idx + dir + lines.length) % lines.length
  matchIndex.value = idx
  const el = document.querySelector(`[data-line="${lines[idx]}"]`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function scrollToLine(lineIndex: number) {
  const el = document.querySelector(`[data-line="${lineIndex}"]`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// ====== Tree View ======
const treeData = computed(() => {
  if (!outputText.value) return null
  try { return JSON.parse(outputText.value) } catch { return null }
})

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// buildTreeHtml replaced by buildTreeHtmlEnhanced below

// ====== Tree Interaction ======
const nodeInfo = ref<{ path: string; type: string; value: string } | null>(null)

function findNodeInfo(el: HTMLElement): { path: string; type: string; value: string } | null {
  let cur: HTMLElement | null = el
  while (cur) {
    const path = cur.getAttribute?.('data-path')
    if (path) {
      return {
        path,
        type: cur.getAttribute('data-type') || '',
        value: cur.getAttribute('data-value') || '',
      }
    }
    cur = cur.parentElement
  }
  return null
}

function handleTreeMousemove(e: MouseEvent) {
  const info = findNodeInfo(e.target as HTMLElement)
  if (info) {
    nodeInfo.value = info
  } else {
    nodeInfo.value = null
  }
}

function handleTreeMouseleave() {
  nodeInfo.value = null
}

function getValueByPath(path: string): any {
  if (!treeData.value) return null
  const parts = path.replace(/^\$/, '').split(/\.|\[|\]/).filter(Boolean)
  let current: any = treeData.value
  for (const part of parts) {
    if (current == null) return null
    current = current[part]
  }
  return current
}

function getLastKey(path: string): string {
  const parts = path.replace(/^\$/, '').split(/\.|\[|\]/).filter(Boolean)
  return parts[parts.length - 1] || '$'
}

// Context menu
const contextMenu = ref({ visible: false, x: 0, y: 0, path: '', key: '', value: '', type: '' })
function handleTreeContextmenu(e: MouseEvent) {
  const info = findNodeInfo(e.target as HTMLElement)
  if (!info) return
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    path: info.path,
    key: getLastKey(info.path),
    value: info.value,
    type: info.type,
  }
}

async function copyFromMenu(type: string) {
  const menu = contextMenu.value
  let text = ''
  switch (type) {
    case 'key': text = menu.key; break
    case 'value': text = menu.value; break
    case 'path': text = menu.path.replace(/^\$./, ''); break
    case 'node':
      text = JSON.stringify(getValueByPath(menu.path), null, 2); break
  }
  if (text) {
    try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
  }
  contextMenu.value.visible = false
}

function handleTreeClick(e: MouseEvent) {
  contextMenu.value.visible = false
  const target = (e.target as HTMLElement)
  if (target.classList.contains('tv-filter')) {
    const path = target.getAttribute('data-filter-path')
    if (path) openFilterPanel(path)
  }
}

// ====== Tree Enhancements ======
const treeExpandLevel = ref(0) // 0 = all, 1/2/3 = levels
const treeSearchText = ref('')
const treeSearchRegex = ref(false)

function expandAllTree() {
  document.querySelectorAll('.tree-viewer details').forEach(el => { (el as HTMLDetailsElement).open = true })
  treeExpandLevel.value = 0
}

function collapseAllTree() {
  document.querySelectorAll('.tree-viewer details').forEach(el => { (el as HTMLDetailsElement).open = false })
  treeExpandLevel.value = -1
}

function expandToLevel(level: number) {
  treeExpandLevel.value = level
  const detailsList = document.querySelectorAll('.tree-viewer details')
  detailsList.forEach(el => {
    // 计算深度：数父级中有多少个 details
    let depth = 0
    let parent = el.parentElement
    while (parent) {
      if (parent.tagName === 'DETAILS') depth++
      parent = parent.parentElement
    }
    ;(el as HTMLDetailsElement).open = depth < level
  })
}

const treeSearchMatches = computed(() => {
  if (!treeSearchText.value || !treeData.value) return new Set<string>()
  const keyword = treeSearchText.value
  const matches = new Set<string>()
  function search(data: any, path: string) {
    if (data === null) {
      if ('null'.includes(keyword)) matches.add(path)
      return
    }
    if (typeof data === 'string') {
      if (data.includes(keyword)) matches.add(path)
      return
    }
    if (typeof data === 'number' || typeof data === 'boolean') {
      if (String(data).includes(keyword)) matches.add(path)
      return
    }
    if (Array.isArray(data)) {
      data.forEach((item, i) => search(item, `${path}[${i}]`))
      return
    }
    if (typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        if (key.includes(keyword)) matches.add(`${path}.${key}`)
        search(value, `${path}.${key}`)
      }
    }
  }
  if (treeSearchRegex.value) {
    try {
      const regex = new RegExp(keyword, 'i')
      function searchRegex(data: any, path: string) {
        if (data === null) { if (regex.test('null')) matches.add(path); return }
        if (typeof data === 'string') { if (regex.test(data)) matches.add(path); return }
        if (typeof data === 'number' || typeof data === 'boolean') { if (regex.test(String(data))) matches.add(path); return }
        if (Array.isArray(data)) { data.forEach((item, i) => searchRegex(item, `${path}[${i}]`)); return }
        if (typeof data === 'object') {
          for (const [key, value] of Object.entries(data)) {
            if (regex.test(key)) matches.add(`${path}.${key}`)
            searchRegex(value, `${path}.${key}`)
          }
        }
      }
      searchRegex(treeData.value, '$')
    } catch { /* invalid regex */ }
  } else {
    search(treeData.value, '$')
  }
  return matches
})

const treeSearchMatchCount = computed(() => treeSearchMatches.value.size)

// 增强版 buildTreeHtml：支持搜索高亮
function buildTreeHtmlEnhanced(data: any, path: string = '$'): string {
  const searchHits = treeSearchMatches.value
  const isMatch = (p: string) => searchHits.size > 0 && searchHits.has(p)
  const matchClass = (p: string) => isMatch(p) ? ' tv-search-match' : ''

  if (data === null) return `<span class="tv-null${matchClass(path)}" data-path="${escapeHtml(path)}" data-type="null">null</span>`
  if (typeof data === 'boolean') return `<span class="tv-bool${matchClass(path)}" data-path="${escapeHtml(path)}" data-type="boolean" data-value="${data}">${data}</span>`
  if (typeof data === 'number') return `<span class="tv-num${matchClass(path)}" data-path="${escapeHtml(path)}" data-type="number" data-value="${data}">${data}</span>`
  if (typeof data === 'string') return `<span class="tv-string${matchClass(path)}" data-path="${escapeHtml(path)}" data-type="string" data-value="${escapeHtml(data)}">"${highlightSearch(escapeHtml(data), path)}"</span>`

  if (Array.isArray(data)) {
    if (data.length === 0) return `<span class="tv-bracket${matchClass(path)}" data-path="${escapeHtml(path)}" data-type="array">[]</span>`
    const items = data.map((item, i) =>
      `<div class="tv-item">${buildTreeHtmlEnhanced(item, `${path}[${i}]`)}</div>`
    ).join('')
    const filterBtn = data.length > 0 && data[0] && typeof data[0] === 'object'
      ? `<span class="tv-filter" data-filter-path="${escapeHtml(path)}" title="筛选">⊞</span>` : ''
    return `<details open data-path="${escapeHtml(path)}" data-type="array"><summary><span class="tv-toggle"></span><span class="tv-bracket">[</span><span class="tv-collapsed"> ... ]</span><span class="tv-count">${data.length} 项</span>${filterBtn}</summary><div class="tv-children">${items}</div><span class="tv-bracket tv-close">]</span></details>`
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data)
    if (keys.length === 0) return `<span class="tv-bracket${matchClass(path)}" data-path="${escapeHtml(path)}" data-type="object">{}</span>`
    const items = keys.map(key =>
      `<div class="tv-item"><span class="tv-key${matchClass(`${path}.${key}`)}" data-path="${escapeHtml(`${path}.${key}`)}" data-type="key" data-value="${escapeHtml(key)}">"${highlightSearch(escapeHtml(key), `${path}.${key}`)}"</span><span class="tv-colon">: </span>${buildTreeHtmlEnhanced(data[key], `${path}.${key}`)}</div>`
    ).join('')
    return `<details open data-path="${escapeHtml(path)}" data-type="object"><summary><span class="tv-toggle"></span><span class="tv-bracket">{</span><span class="tv-collapsed"> ... }</span><span class="tv-count">${keys.length} 个键</span></summary><div class="tv-children">${items}</div><span class="tv-bracket tv-close">}</span></details>`
  }

  return String(data)
}

function highlightSearch(htmlText: string, _path: string): string {
  if (!treeSearchText.value || treeSearchMatches.value.size === 0) return htmlText
  if (treeSearchRegex.value) {
    try {
      const regex = new RegExp(`(${treeSearchText.value})`, 'gi')
      return htmlText.replace(regex, '<mark class="tv-highlight">$1</mark>')
    } catch { return htmlText }
  }
  // Simple string highlight (case insensitive)
  const keyword = treeSearchText.value
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return htmlText.replace(regex, '<mark class="tv-highlight">$1</mark>')
}

const treeViewHtml = computed(() => {
  if (!treeData.value) return ''
  return buildTreeHtmlEnhanced(treeData.value)
})

// 节点编辑
function setTreeNodeValue(path: string, newValue: any) {
  if (!treeData.value) return
  const parts = path.replace(/^\$/, '').split(/\.|\[|\]/).filter(Boolean)
  let current: any = treeData.value
  for (let i = 0; i < parts.length - 1; i++) {
    if (current == null) return
    current = current[parts[i]]
  }
  const lastKey = parts[parts.length - 1]
  if (current != null && lastKey !== undefined) {
    current[lastKey] = newValue
    // 同步回 inputText 并重新格式化
    inputText.value = JSON.stringify(treeData.value)
    parseJson()
  }
}

function deleteTreeNode(path: string) {
  if (!treeData.value) return
  const parts = path.replace(/^\$/, '').split(/\.|\[|\]/).filter(Boolean)
  if (parts.length === 0) return
  let current: any = treeData.value
  for (let i = 0; i < parts.length - 1; i++) {
    if (current == null) return
    current = current[parts[i]]
  }
  const lastKey = parts[parts.length - 1]
  if (Array.isArray(current)) {
    const idx = parseInt(lastKey)
    if (!isNaN(idx) && idx >= 0 && idx < current.length) {
      current.splice(idx, 1)
    }
  } else if (typeof current === 'object' && current !== null) {
    delete current[lastKey]
  }
  inputText.value = JSON.stringify(treeData.value)
  parseJson()
}

function copyTreeNode(path: string) {
  const value = getValueByPath(path)
  const text = JSON.stringify(value, null, 2)
  navigator.clipboard.writeText(text).catch(() => {})
}

function copyTreePath(path: string) {
  navigator.clipboard.writeText(path.replace(/^\$./, '')).catch(() => {})
}

// 节点编辑状态
const treeEditNode = ref<{ visible: boolean; x: number; y: number; path: string; type: string; rawValue: string }>({
  visible: false, x: 0, y: 0, path: '', type: '', rawValue: '',
})

function handleTreeDblclick(e: MouseEvent) {
  const info = findNodeInfo(e.target as HTMLElement)
  if (!info) return
  // 不允许编辑根节点和数组/对象的 summary
  if (info.path === '$' || info.type === 'array' || info.type === 'object' || info.type === 'key') return
  const value = getValueByPath(info.path)
  treeEditNode.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    path: info.path,
    type: info.type,
    rawValue: value === null || value === undefined ? '' : String(value),
  }
}

function confirmTreeEdit() {
  const { path, type, rawValue } = treeEditNode.value
  let newValue: any = rawValue
  if (type === 'number') {
    newValue = Number(rawValue)
    if (isNaN(newValue)) { toast.error('请输入有效数字'); return }
  } else if (type === 'boolean') {
    newValue = rawValue === 'true'
  } else if (type === 'null') {
    newValue = null
  }
  // string 类型直接使用原始值
  setTreeNodeValue(path, newValue)
  treeEditNode.value.visible = false
}

function cancelTreeEdit() {
  treeEditNode.value.visible = false
}

// ====== Array Filter ======
const filterPanel = ref({
  show: false, path: '', field: '', mode: 'contains' as 'contains' | 'equals' | 'regex',
  keyword: '', resultCount: 0, totalCount: 0,
})

function openFilterPanel(path: string) {
  const arr = getValueByPath(path)
  if (!Array.isArray(arr) || arr.length === 0) return
  const firstItem = arr.find(item => typeof item === 'object' && item !== null)
  filterPanel.value = {
    show: true, path, field: firstItem ? Object.keys(firstItem)[0] : '',
    mode: 'contains', keyword: '', resultCount: arr.length, totalCount: arr.length,
  }
}

function applyArrayFilter() {
  const { path, field, mode, keyword } = filterPanel.value
  const arr = getValueByPath(path)
  if (!Array.isArray(arr)) return

  const filtered = arr.filter(item => {
    if (typeof item !== 'object' || item === null) return false
    const val = String(item[field] ?? '')
    switch (mode) {
      case 'contains': return val.toLowerCase().includes(keyword.toLowerCase())
      case 'equals': return val === keyword
      case 'regex': { try { return new RegExp(keyword).test(val) } catch { return false } }
      default: return true
    }
  })

  filterPanel.value.resultCount = filtered.length

  // 直接操作 DOM 更新 tree children
  const detailsEl = document.querySelector(`[data-path="${CSS.escape(path)}"]`)
  if (detailsEl) {
    const childrenEl = detailsEl.querySelector('.tv-children')
    if (childrenEl) {
      childrenEl.innerHTML = filtered.map((item, i) =>
        `<div class="tv-item">${buildTreeHtmlEnhanced(item, `${path}[${i}]`)}</div>`
      ).join('')
    }
  }
}

function resetFilter() {
  const { path } = filterPanel.value
  const arr = getValueByPath(path)
  if (!Array.isArray(arr)) return
  const detailsEl = document.querySelector(`[data-path="${CSS.escape(path)}"]`)
  if (detailsEl) {
    const childrenEl = detailsEl.querySelector('.tv-children')
    if (childrenEl) {
      childrenEl.innerHTML = arr.map((item, i) =>
        `<div class="tv-item">${buildTreeHtmlEnhanced(item, `${path}[${i}]`)}</div>`
      ).join('')
    }
  }
  filterPanel.value.show = false
}

// ====== Debounce ======
function useDebounce(fn: Function, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

const debouncedParse = useDebounce(parseJson, 300)

function handleInput() {
  debouncedParse()
}

// ====== Watch ======
watch([indentSize, sortKeys], () => {
  if (inputText.value.trim()) parseJson()
})

// ====== Export ======
export function useJsonFormatter() {
  // ====== Mode ======
  const activeMode = ref<ToolMode>('formatter')

  // ====== Sub-modules ======
  const jsonPathModule = useJsonPath()
  const convertModule = useConvert()
  const diffModule = useJsonDiff()
  const schemaModule = useSchemaValidate()

  const { history, showHistory, saveToHistory, deleteItem, clearHistory } =
    useToolHistory<JsonHistoryData>({ toolId: 'json-formatter', maxItems: 50 })

  async function handleClearHistory() {
    await clearHistory()
    toast.success('历史记录已清空')
  }

  function handleHistoryUse(item: Record<string, any>) {
    inputText.value = item.inputText
    indentSize.value = item.indentSize
    sortKeys.value = item.sortKeys
    showHistory.value = false
    parseJson()
  }

  // 解析成功时自动保存历史（去重）
  watch(isValid, (valid) => {
    if (!valid || !inputText.value.trim()) return
    const text = inputText.value.trim()
    const isDuplicate = history.value.some(item => item.inputText === text)
    if (!isDuplicate) {
      const preview = text.length > 100 ? text.substring(0, 100) + '...' : text
      saveToHistory({
        inputText: text,
        inputPreview: preview,
        indentSize: indentSize.value,
        sortKeys: sortKeys.value,
      })
    }
  })

  return {
    // Mode
    activeMode,

    // State
    inputText, outputText, indentSize, sortKeys, viewMode, wordWrap,
    error, copied, isValid, isDragging, searchText, matchIndex,
    jsonStats, fileInputRef,

    // Tree
    treeViewHtml, treeData, nodeInfo, contextMenu,

    // Filter
    filterPanel,

    // Code view
    highlightedLines, plainLines, matchedLines, matchLineList, matchCount,

    // Computed
    isEscaped, highlightedOutput, inputByteSize, outputByteSize,

    // Helpers
    formatBytes,

    // Methods
    parseJson, minifyJson, unescapeJson, escapeJson,
    copyOutput, downloadJson, clearAll, pasteFromClipboard,
    importFile, handleFileSelect,
    handleDragOver, handleDragLeave, handleDrop, handleInput,
    navigateMatch, scrollToLine,

    // Tree interaction
    handleTreeMousemove, handleTreeMouseleave, handleTreeContextmenu,
    copyFromMenu, handleTreeClick,

    // Filter
    openFilterPanel, applyArrayFilter, resetFilter,

    // Tree enhancements
    treeExpandLevel, treeSearchText, treeSearchRegex, treeSearchMatchCount,
    expandAllTree, collapseAllTree, expandToLevel,
    setTreeNodeValue, deleteTreeNode, copyTreeNode, copyTreePath,
    treeEditNode, handleTreeDblclick, confirmTreeEdit, cancelTreeEdit,

    // JSONPath
    jsonPathModule,

    // Convert
    convertModule,

    // Diff
    diffModule,

    // Schema
    schemaModule,

    // History
    history, showHistory, deleteItem, handleHistoryUse, handleClearHistory,
  }
}
