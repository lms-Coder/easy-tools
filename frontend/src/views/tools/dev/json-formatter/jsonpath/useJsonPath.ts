import { ref, computed } from 'vue'

// ====== JSONPath 轻量解析器 ======

type PathSegment = { type: 'root' } | { type: 'key'; value: string } | { type: 'index'; value: number } | { type: 'recursive'; value: string } | { type: 'wildcard' } | { type: 'slice'; start?: number; end?: number }

function parseJsonPath(expr: string): PathSegment[] {
  const segments: PathSegment[] = []
  let s = expr.trim()
  if (!s.startsWith('$')) return segments
  segments.push({ type: 'root' })
  s = s.slice(1)

  while (s.length > 0) {
    // ..key 递归下降
    if (s.startsWith('..')) {
      s = s.slice(2)
      if (s.startsWith('[')) continue // ..[ 开头按后续处理
      const match = s.match(/^(\w+)/)
      if (match) {
        segments.push({ type: 'recursive', value: match[1] })
        s = s.slice(match[1].length)
      } else if (s.startsWith('*')) {
        segments.push({ type: 'recursive', value: '' })
        s = s.slice(1)
      }
      continue
    }

    // [n] / [n:m] / [*]
    if (s.startsWith('[')) {
      const closeIdx = s.indexOf(']')
      if (closeIdx < 0) break
      const inner = s.slice(1, closeIdx)
      if (inner === '*') {
        segments.push({ type: 'wildcard' })
      } else if (inner.includes(':')) {
        const parts = inner.split(':')
        segments.push({ type: 'slice', start: parts[0] ? Number(parts[0]) : undefined, end: parts[1] ? Number(parts[1]) : undefined })
      } else if (/^\d+$/.test(inner)) {
        segments.push({ type: 'index', value: Number(inner) })
      } else {
        // ['key']
        const key = inner.replace(/^['"]|['"]$/g, '')
        segments.push({ type: 'key', value: key })
      }
      s = s.slice(closeIdx + 1)
      continue
    }

    // .key / .*
    if (s.startsWith('.')) {
      s = s.slice(1)
      if (s.startsWith('*')) {
        segments.push({ type: 'wildcard' })
        s = s.slice(1)
        continue
      }
      const match = s.match(/^(\w+)/)
      if (match) {
        segments.push({ type: 'key', value: match[1] })
        s = s.slice(match[1].length)
      }
      continue
    }

    break
  }

  return segments
}

interface MatchResult {
  path: string
  value: any
  lineIndex?: number  // 在格式化输出中对应的行号（近似）
}

function evaluatePath(data: any, segments: PathSegment[], currentPath: string, results: MatchResult[], maxResults: number) {
  if (results.length >= maxResults) return
  if (segments.length === 0) {
    results.push({ path: currentPath, value: data })
    return
  }

  const [head, ...tail] = segments

  switch (head.type) {
    case 'root':
      evaluatePath(data, tail, currentPath, results, maxResults)
      break

    case 'key': {
      if (data !== null && typeof data === 'object' && !Array.isArray(data) && head.value in data) {
        evaluatePath(data[head.value], tail, `${currentPath}.${head.value}`, results, maxResults)
      }
      break
    }

    case 'index': {
      if (Array.isArray(data) && head.value < data.length) {
        evaluatePath(data[head.value], tail, `${currentPath}[${head.value}]`, results, maxResults)
      }
      break
    }

    case 'wildcard': {
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length && results.length < maxResults; i++) {
          evaluatePath(data[i], tail, `${currentPath}[${i}]`, results, maxResults)
        }
      } else if (data !== null && typeof data === 'object') {
        for (const key of Object.keys(data)) {
          if (results.length >= maxResults) break
          evaluatePath(data[key], tail, `${currentPath}.${key}`, results, maxResults)
        }
      }
      break
    }

    case 'recursive': {
      // 先收集自身
      if (head.value === '' || head.value === '*') {
        // ..* 递归通配：收集所有节点
        evaluatePath(data, tail, currentPath, results, maxResults)
      } else if (typeof data === 'object' && data !== null && head.value in (Array.isArray(data) ? Object.fromEntries(Object.keys(data).map(k => [k, true])) : data)) {
        // 当前层级有该 key
        const val = data[head.value]
        evaluatePath(val, tail, `${currentPath}.${head.value}`, results, maxResults)
      }
      // 递归子节点
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length && results.length < maxResults; i++) {
          evaluatePath(data[i], [{ type: 'recursive', value: head.value }, ...tail] as PathSegment[], `${currentPath}[${i}]`, results, maxResults)
        }
      } else if (data !== null && typeof data === 'object') {
        for (const key of Object.keys(data)) {
          if (results.length >= maxResults) break
          evaluatePath(data[key], [{ type: 'recursive', value: head.value }, ...tail] as PathSegment[], `${currentPath}.${key}`, results, maxResults)
        }
      }
      break
    }

    case 'slice': {
      if (Array.isArray(data)) {
        const start = head.start ?? 0
        const end = head.end ?? data.length
        for (let i = start; i < end && i < data.length && results.length < maxResults; i++) {
          if (i < 0) continue
          evaluatePath(data[i], tail, `${currentPath}[${i}]`, results, maxResults)
        }
      }
      break
    }
  }
}

// ====== Composable ======

const MAX_RESULTS = 1000

export function useJsonPath() {
  const jsonPathQuery = ref('')
  const jsonPathResults = ref<MatchResult[]>([])
  const jsonPathError = ref('')
  const jsonPathActiveIndex = ref(0)

  const jsonPathMatchCount = computed(() => jsonPathResults.value.length)
  const jsonPathPaths = computed(() => jsonPathResults.value.map(r => r.path))

  function executeJsonPathQuery(data: any) {
    if (!jsonPathQuery.value.trim() || !data) {
      jsonPathResults.value = []
      jsonPathError.value = ''
      return
    }

    try {
      const segments = parseJsonPath(jsonPathQuery.value)
      if (segments.length <= 1) {
        jsonPathError.value = '无效的 JSONPath 表达式'
        jsonPathResults.value = []
        return
      }

      const results: MatchResult[] = []
      evaluatePath(data, segments, '$', results, MAX_RESULTS)
      jsonPathResults.value = results
      jsonPathError.value = ''
      jsonPathActiveIndex.value = 0
    } catch (e: any) {
      jsonPathError.value = e.message || '查询失败'
      jsonPathResults.value = []
    }
  }

  function clearJsonPath() {
    jsonPathQuery.value = ''
    jsonPathResults.value = []
    jsonPathError.value = ''
  }

  function navigateJsonPath(dir: 1 | -1) {
    if (jsonPathMatchCount.value === 0) return
    const next = jsonPathActiveIndex.value + dir
    jsonPathActiveIndex.value = (next + jsonPathMatchCount.value) % jsonPathMatchCount.value
  }

  /** 在格式化文本中查找路径对应的行号（近似） */
  function findLineForPath(formattedText: string, path: string): number {
    // 去掉 $ 前缀，取最后一级 key
    const parts = path.replace(/^\$/, '').split(/\.|\[|\]/).filter(Boolean)
    const lastKey = parts[parts.length - 1] || ''
    const lines = formattedText.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`"${lastKey}"`)) return i
    }
    return 0
  }

  return {
    jsonPathQuery,
    jsonPathResults,
    jsonPathError,
    jsonPathMatchCount,
    jsonPathPaths,
    jsonPathActiveIndex,
    executeJsonPathQuery,
    clearJsonPath,
    navigateJsonPath,
    findLineForPath,
  }
}
