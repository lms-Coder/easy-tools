import { ref, computed, watch } from 'vue'
import { toast } from '@/composables/useToast'
import { useToolHistory } from '@/composables/useToolHistory'
import hljs from 'highlight.js/lib/core'
import xml from 'highlight.js/lib/languages/xml'

hljs.registerLanguage('xml', xml)

// ====== State ======
const inputText = ref('')
const outputText = ref('')
const indentSize = ref(2)
const viewMode = ref<'code' | 'tree'>('code')
const wordWrap = ref(true)
const error = ref('')
const copied = ref(false)
const isValid = ref(false)
const isDragging = ref(false)
const searchText = ref('')
const matchIndex = ref(0)
const fileInputRef = ref<HTMLInputElement | null>(null)

const xmlStats = ref<{ elementCount: number; depth: number; size: string; attrCount: number } | null>(null)

// Tree search
const treeSearchText = ref('')
const treeMatchIndex = ref(0)

// XPath
const xpathQuery = ref('')
const xpathResultCount = ref(-1)

// ====== History ======
interface XmlHistoryData {
  inputText: string
  inputPreview: string
  indentSize: number
}

// ====== XML Helpers ======
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function countXmlStats(doc: Document) {
  let elementCount = 0
  let attrCount = 0
  let maxDepth = 0

  function walk(node: Element, depth: number) {
    elementCount++
    attrCount += node.attributes.length
    if (depth > maxDepth) maxDepth = depth
    for (const child of Array.from(node.children)) {
      walk(child, depth + 1)
    }
  }

  walk(doc.documentElement, 0)
  return { elementCount, attrCount, depth: maxDepth }
}

// ====== Pretty Print ======
function prettyPrintXml(node: Node, indent: string, depth: number): string {
  const prefix = indent.repeat(depth)
  const nextPrefix = indent.repeat(depth + 1)

  if (node.nodeType === Node.DOCUMENT_NODE) {
    let result = ''
    for (const child of Array.from(node.childNodes)) {
      result += prettyPrintXml(child, indent, depth)
    }
    return result
  }

  if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
    const pi = node as ProcessingInstruction
    return `${prefix}<?${pi.target} ${pi.data}?>\n`
  }

  if (node.nodeType === Node.COMMENT_NODE) {
    return `${prefix}<!--${node.textContent}-->\n`
  }

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim()
    if (!text) return ''
    return `${prefix}${escapeHtml(text)}\n`
  }

  if (node.nodeType === Node.CDATA_SECTION_NODE) {
    return `${prefix}<![CDATA[${node.textContent}]]>\n`
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element
    const tagName = el.tagName
    const attrs = Array.from(el.attributes)
      .map(a => `${a.name}="${escapeHtml(a.value)}"`)
      .join(' ')
    const attrStr = attrs ? ' ' + attrs : ''

    // Self-closing
    if (el.children.length === 0 && !el.textContent?.trim()) {
      return `${prefix}<${tagName}${attrStr} />\n`
    }

    // Inline text-only
    if (el.children.length === 0 && el.textContent?.trim()) {
      return `${prefix}<${tagName}${attrStr}>${escapeHtml(el.textContent.trim())}</${tagName}>\n`
    }

    // Children
    let result = `${prefix}<${tagName}${attrStr}>\n`
    for (const child of Array.from(el.childNodes)) {
      result += prettyPrintXml(child, indent, depth + 1)
    }
    result += `${prefix}</${tagName}>\n`
    return result
  }

  return ''
}

// ====== Core Functions ======
function parseXml(): Document | null {
  const text = inputText.value.trim()
  if (!text) return null
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'application/xml')
  const errNode = doc.querySelector('parsererror')
  if (errNode) {
    error.value = errNode.textContent || 'XML 解析失败'
    isValid.value = false
    return null
  }
  return doc
}

function formatXml() {
  const text = inputText.value.trim()
  if (!text) {
    outputText.value = ''
    error.value = ''
    isValid.value = false
    xmlStats.value = null
    return
  }

  const doc = parseXml()
  if (!doc) {
    outputText.value = ''
    return
  }

  const indent = indentSize.value === 1 ? '\t' : ' '.repeat(indentSize.value)
  const result = prettyPrintXml(doc, indent, 0).trimEnd()

  outputText.value = result
  error.value = ''
  isValid.value = true

  const stats = countXmlStats(doc)
  xmlStats.value = {
    ...stats,
    size: formatBytes(new Blob([text]).size),
  }
}

function minifyXml() {
  const text = inputText.value.trim()
  if (!text) return
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'application/xml')
    if (doc.querySelector('parsererror')) return
    const serializer = new XMLSerializer()
    let result = serializer.serializeToString(doc)
    // Remove whitespace between tags
    result = result.replace(/>\s+</g, '><')
    outputText.value = result
    error.value = ''
    isValid.value = true
  } catch {
    // ignore
  }
}

function validateXml() {
  const text = inputText.value.trim()
  if (!text) {
    toast.warning('请输入 XML 内容')
    return
  }
  const doc = parseXml()
  if (doc) {
    toast.success('XML 格式有效', 2000)
  }
}

// ====== XML ↔ JSON ======
function xmlNodeToJson(node: Element): any {
  const result: any = {}

  // Attributes
  if (node.attributes.length > 0) {
    result['@attributes'] = {}
    for (const attr of Array.from(node.attributes)) {
      result['@attributes'][attr.name] = attr.value
    }
  }

  // Children
  const childElements = Array.from(node.children)
  if (childElements.length === 0) {
    const text = node.textContent?.trim() || ''
    if (Object.keys(result).length === 0) return text
    if (text) result['#text'] = text
    return result
  }

  // Group children by tag name
  const grouped: Record<string, Element[]> = {}
  for (const child of childElements) {
    const tag = child.tagName
    if (!grouped[tag]) grouped[tag] = []
    grouped[tag].push(child)
  }

  for (const [tag, elements] of Object.entries(grouped)) {
    if (elements.length === 1) {
      result[tag] = xmlNodeToJson(elements[0])
    } else {
      result[tag] = elements.map(el => xmlNodeToJson(el))
    }
  }

  return result
}

function xmlToJson() {
  const doc = parseXml()
  if (!doc) return
  const json = xmlNodeToJson(doc.documentElement)
  const wrapper = { [doc.documentElement.tagName]: json }
  outputText.value = JSON.stringify(wrapper, null, indentSize.value === 1 ? '\t' : indentSize.value)
  viewMode.value = 'code'
  toast.success('已转换为 JSON')
}

function jsonToXml() {
  const text = inputText.value.trim()
  if (!text) return
  try {
    const obj = JSON.parse(text)
    function buildXml(key: string, value: any, indent: string, depth: number): string {
      const prefix = indent.repeat(depth)
      if (value === null || value === undefined) return `${prefix}<${key} />\n`
      if (typeof value !== 'object') return `${prefix}<${key}>${escapeHtml(String(value))}</${key}>\n`
      if (Array.isArray(value)) {
        return value.map(item => buildXml(key, item, indent, depth)).join('')
      }

      let attrs = ''
      let inner = ''
      if (value['@attributes']) {
        for (const [ak, av] of Object.entries(value['@attributes'])) {
          attrs += ` ${ak}="${escapeHtml(String(av))}"`
        }
        delete value['@attributes']
      }
      if (value['#text']) {
        inner = escapeHtml(String(value['#text']))
        delete value['#text']
      }
      const childXml = Object.entries(value)
        .map(([k, v]) => buildXml(k, v, indent, depth + 1))
        .join('')

      if (!inner && !childXml) return `${prefix}<${key}${attrs} />\n`
      if (childXml) return `${prefix}<${key}${attrs}>\n${childXml}${prefix}</${key}>\n`
      return `${prefix}<${key}${attrs}>${inner}</${key}>\n`
    }

    const indent = indentSize.value === 1 ? '\t' : ' '.repeat(indentSize.value)
    let result = ''
    for (const [key, value] of Object.entries(obj)) {
      result += buildXml(key, value, indent, 0)
    }
    outputText.value = result.trimEnd()
    error.value = ''
    isValid.value = true
    toast.success('已转换为 XML')
  } catch (e: any) {
    error.value = 'JSON 解析失败: ' + (e.message || '')
    isValid.value = false
  }
}

// ====== XPath ======
function executeXpath() {
  if (!xpathQuery.value.trim()) return
  const doc = parseXml()
  if (!doc) return

  try {
    const resolver = doc.createNSResolver(doc.documentElement)
    const result = doc.evaluate(xpathQuery.value, doc, resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
    xpathResultCount.value = result.snapshotLength
    if (result.snapshotLength === 0) {
      toast.info('未找到匹配节点')
      return
    }

    // Build highlighted output
    const serializer = new XMLSerializer()
    const matchedNodes = new Set<Node>()
    for (let i = 0; i < result.snapshotLength; i++) {
      const node = result.snapshotItem(i)
      if (node) matchedNodes.add(node)
    }

    // Re-serialize with markers for matched nodes
    const indent = indentSize.value === 1 ? '\t' : ' '.repeat(indentSize.value)
    let output = ''
    const nodeCount = result.snapshotLength
    for (let i = 0; i < nodeCount; i++) {
      const node = result.snapshotItem(i)
      if (node && node.nodeType === Node.ELEMENT_NODE) {
        output += prettyPrintXml(node, indent, 0)
      } else if (node) {
        output += (node.textContent || '') + '\n'
      }
    }
    outputText.value = output.trimEnd()
    toast.success(`找到 ${nodeCount} 个匹配节点`)
  } catch (e: any) {
    toast.error('XPath 错误: ' + (e.message || ''))
    xpathResultCount.value = -1
  }
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

function downloadXml() {
  if (!outputText.value) return
  const blob = new Blob([outputText.value], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'formatted.xml'
  a.click()
  URL.revokeObjectURL(url)
}

function clearAll() {
  inputText.value = ''
  outputText.value = ''
  error.value = ''
  isValid.value = false
  xmlStats.value = null
  xpathResultCount.value = -1
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    formatXml()
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
    formatXml()
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
    formatXml()
  }
  reader.readAsText(file)
}

// ====== Code View ======
const highlightedOutput = computed(() => {
  if (!outputText.value || error.value) return ''
  try {
    return hljs.highlight(outputText.value, { language: 'xml' }).value
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

// ====== Tree View ======
const parsedDoc = computed<Document | null>(() => {
  if (!outputText.value) return null
  const parser = new DOMParser()
  const doc = parser.parseFromString(outputText.value, 'application/xml')
  return doc.querySelector('parsererror') ? null : doc
})

function buildTreeHtml(node: Node, path: string = '/'): string {
  if (node.nodeType === Node.DOCUMENT_NODE) {
    const children = Array.from(node.childNodes)
      .filter(c => c.nodeType === Node.ELEMENT_NODE || c.nodeType === Node.PROCESSING_INSTRUCTION_NODE)
      .map(c => buildTreeHtml(c, '/'))
      .join('')
    return children
  }

  if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
    const pi = node as ProcessingInstruction
    return `<div class="tv-item" data-path="${escapeHtml(path)}pi/${pi.target}" data-type="pi" data-value="${escapeHtml(pi.data)}"><span class="tv-pi">&lt;?${pi.target} ${pi.data}?&gt;</span></div>`
  }

  if (node.nodeType === Node.COMMENT_NODE) {
    return `<div class="tv-item" data-path="${escapeHtml(path)}comment()" data-type="comment" data-value="${escapeHtml(node.textContent || '')}"><span class="tv-comment">&lt;!--${escapeHtml(node.textContent || '')}--&gt;</span></div>`
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element
    const tagName = el.tagName
    const attrs = Array.from(el.attributes)
      .map(a => `<span class="tv-attr-name"> ${a.name}=</span><span class="tv-attr-value">"${escapeHtml(a.value)}"</span>`)
      .join('')
    const childElements = Array.from(el.children)
    const hasText = el.textContent?.trim() && childElements.length === 0

    const childPath = path + tagName + '/'
    const childHtml = Array.from(el.childNodes)
      .filter(c => c.nodeType === Node.ELEMENT_NODE || c.nodeType === Node.COMMENT_NODE)
      .map(c => buildTreeHtml(c, childPath))
      .join('')

    if (childElements.length === 0 && !hasText) {
      return `<div class="tv-item" data-path="${escapeHtml(childPath)}" data-type="element" data-value=""><span class="tv-tag">&lt;${tagName}${attrs} /&gt;</span></div>`
    }

    if (hasText) {
      return `<div class="tv-item" data-path="${escapeHtml(childPath)}" data-type="element" data-value="${escapeHtml(el.textContent!.trim())}"><span class="tv-tag">&lt;${tagName}${attrs}&gt;</span><span class="tv-text">${escapeHtml(el.textContent!.trim())}</span><span class="tv-tag">&lt;/${tagName}&gt;</span></div>`
    }

    return `<details open data-path="${escapeHtml(childPath)}" data-type="element"><summary><span class="tv-toggle"></span><span class="tv-tag">&lt;${tagName}${attrs}&gt;</span><span class="tv-collapsed"> ... &lt;/${tagName}&gt;</span><span class="tv-count">${childElements.length} 子节点</span></summary><div class="tv-children">${childHtml}</div><span class="tv-tag tv-close">&lt;/${tagName}&gt;</span></details>`
  }

  return ''
}

const treeViewHtml = computed(() => {
  if (!parsedDoc.value) return ''
  return buildTreeHtml(parsedDoc.value)
})

// ====== Tree Search ======
const treeMatchCount = computed(() => {
  if (!treeSearchText.value.trim() || !parsedDoc.value) return 0
  const keyword = treeSearchText.value.toLowerCase().trim()
  const doc = parsedDoc.value
  const elements = doc.querySelectorAll('*')
  let count = 0
  elements.forEach(el => {
    if (el.tagName.toLowerCase().includes(keyword) ||
        (el.textContent?.trim().toLowerCase().includes(keyword))) {
      count++
    }
  })
  return count
})

function treeNavigateMatch(dir: 1 | -1) {
  if (treeMatchCount.value === 0) return
  let idx = treeMatchIndex.value + dir
  if (idx < 0) idx = treeMatchCount.value - 1
  if (idx >= treeMatchCount.value) idx = 0
  treeMatchIndex.value = idx

  // Find and highlight matching elements in the tree DOM
  const keyword = treeSearchText.value.toLowerCase().trim()
  const viewer = document.querySelector('.tree-viewer')
  if (!viewer) return

  // Remove previous highlights
  viewer.querySelectorAll('.tree-search-highlight').forEach(el => {
    el.classList.remove('tree-search-highlight')
  })

  const allItems = viewer.querySelectorAll('[data-type="element"]')
  const matches: Element[] = []
  allItems.forEach(el => {
    const value = el.getAttribute('data-value')?.toLowerCase() || ''
    const path = el.getAttribute('data-path')?.toLowerCase() || ''
    if (value.includes(keyword) || path.includes(keyword)) {
      matches.push(el)
    }
  })

  if (matches[idx]) {
    matches[idx].classList.add('tree-search-highlight')
    matches[idx].scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

watch(treeSearchText, () => {
  treeMatchIndex.value = 0
})

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
  nodeInfo.value = info
}

function handleTreeMouseleave() {
  nodeInfo.value = null
}

const contextMenu = ref({ visible: false, x: 0, y: 0, path: '', value: '', type: '' })

function handleTreeContextmenu(e: MouseEvent) {
  const info = findNodeInfo(e.target as HTMLElement)
  if (!info) return
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    path: info.path,
    value: info.value,
    type: info.type,
  }
}

async function copyFromMenu(type: string) {
  const menu = contextMenu.value
  let text = ''
  switch (type) {
    case 'value': text = menu.value; break
    case 'path': text = menu.path; break
    case 'node':
      if (parsedDoc.value) {
        const el = parsedDoc.value.evaluate(menu.path, parsedDoc.value, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
        if (el) text = new XMLSerializer().serializeToString(el)
      }
      break
  }
  if (text) {
    try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
  }
  contextMenu.value.visible = false
}

function handleTreeClick() {
  contextMenu.value.visible = false
}

// ====== Debounce ======
function useDebounce(fn: Function, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

const debouncedFormat = useDebounce(formatXml, 300)

function handleInput() {
  debouncedFormat()
}

// ====== Watch ======
watch(indentSize, () => {
  if (inputText.value.trim()) formatXml()
})

// ====== Export ======
export function useXmlFormatter() {
  const { history, showHistory, saveToHistory, deleteItem, clearHistory } =
    useToolHistory<XmlHistoryData>({ toolId: 'xml-formatter', maxItems: 50 })

  async function handleClearHistory() {
    await clearHistory()
    toast.success('历史记录已清空')
  }

  function handleHistoryUse(item: Record<string, any>) {
    inputText.value = item.inputText
    indentSize.value = item.indentSize
    showHistory.value = false
    formatXml()
  }

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
      })
    }
  })

  return {
    // State
    inputText, outputText, indentSize, viewMode, wordWrap,
    error, copied, isValid, isDragging, searchText, matchIndex,
    xmlStats, fileInputRef,
    xpathQuery, xpathResultCount,
    treeSearchText, treeMatchIndex,

    // Tree
    treeViewHtml, nodeInfo, contextMenu,

    // Code view
    highlightedLines, plainLines, matchedLines, matchLineList, matchCount,

    // Computed
    treeMatchCount,

    // Helpers
    formatBytes,

    // Methods
    formatXml, minifyXml, validateXml,
    xmlToJson, jsonToXml, executeXpath,
    copyOutput, downloadXml, clearAll, pasteFromClipboard,
    importFile, handleFileSelect,
    handleDragOver, handleDragLeave, handleDrop, handleInput,
    navigateMatch,

    // Tree interaction
    handleTreeMousemove, handleTreeMouseleave, handleTreeContextmenu,
    copyFromMenu, handleTreeClick,
    treeNavigateMatch,

    // History
    history, showHistory, deleteItem, handleHistoryUse, handleClearHistory,
  }
}
