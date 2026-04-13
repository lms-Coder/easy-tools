/**
 * 正则表达式 Token 解析器
 * 将 pattern 字符串拆分为带类型和中文说明的 token 数组
 */

export type TokenType =
  | 'charClass'    // 字符类 \d \w \s \D \W \S . [abc] [^abc] [a-z]
  | 'quantifier'   // 量词 * + ? {n} {n,} {n,m}
  | 'anchor'       // 锚点 ^ $ \b \B
  | 'group'        // 分组 (...) (?:...) (?<name>...)
  | 'lookaround'   // 环视 (?=...) (?!...) (?<=...) (?<!...)
  | 'escape'       // 转义 \. \* \\ \/ etc
  | 'backreference' // 反向引用 \1 \2
  | 'alternation'  // 或 |
  | 'literal'      // 字面量字符
  | 'modifier'     // 模式修饰器 (?i) (?m) (?s) (?i-m)

export interface RegexToken {
  type: TokenType
  text: string
  desc: string
}

// 颜色映射 — 用于 token 高亮
export const tokenColors: Record<TokenType, { color: string; bg: string }> = {
  charClass:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  quantifier:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  anchor:        { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  group:         { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  lookaround:    { color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  escape:        { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  backreference: { color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  alternation:   { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
  literal:       { color: '#475569', bg: 'transparent' },
  modifier:      { color: '#22d3ee', bg: 'rgba(34,211,238,0.1)' },
}

// 中文描述映射
const tokenDescMap: Record<string, string> = {
  '.':   '匹配任意单个字符（除换行符）',
  '\\d': '匹配任意数字 [0-9]',
  '\\D': '匹配任意非数字 [^0-9]',
  '\\w': '匹配单词字符 [a-zA-Z0-9_]',
  '\\W': '匹配非单词字符',
  '\\s': '匹配空白字符',
  '\\S': '匹配非空白字符',
  '\\b': '匹配单词边界',
  '\\B': '匹配非单词边界',
  '\\n': '匹配换行符',
  '\\r': '匹配回车符',
  '\\t': '匹配制表符',
  '^':   '匹配字符串开头（或多行模式下的行首）',
  '$':   '匹配字符串结尾（或多行模式下的行尾）',
  '|':   '或 — 匹配左边或右边的表达式',
  '*':   '匹配前一项 0 次或多次（贪婪）',
  '+':   '匹配前一项 1 次或多次（贪婪）',
  '?':   '匹配前一项 0 次或 1 次',
}

function getQuantifierDesc(text: string): string {
  if (text === '*') return tokenDescMap['*']
  if (text === '+') return tokenDescMap['+']
  if (text === '?') return tokenDescMap['?']
  const m = text.match(/^\{(\d+)(?:,(\d*))?\}$/)
  if (m) {
    const min = m[1]
    const max = m[2]
    if (max === undefined) return `匹配前一项恰好 ${min} 次`
    if (max === '') return `匹配前一项至少 ${min} 次`
    return `匹配前一项 ${min} 到 ${max} 次`
  }
  return '量词'
}

function getEscapeDesc(text: string): string {
  const key = text
  if (tokenDescMap[key]) return tokenDescMap[key]
  // \1, \2 etc — backreference handled separately
  if (/^\\\d$/.test(text)) return `反向引用第 ${text[1]} 个捕获组`
  // escaped special char
  return `转义字符 ${text} — 匹配字面量 ${text[1]}`
}

function getGroupDesc(text: string): string {
  if (text === '(') return '捕获组开始'
  if (text === ')') return '捕获组结束'
  if (text === '(?:') return '非捕获组开始 — 仅分组不捕获'
  if (text === '(?<!') return '负向后行断言开始'
  if (text === '(?<=') return '正向后行断言开始'
  return '分组'
}

/**
 * 将正则表达式 pattern 字符串解析为 token 数组
 */
export function tokenizePattern(pattern: string): RegexToken[] {
  const tokens: RegexToken[] = []
  let i = 0

  while (i < pattern.length) {
    const ch = pattern[i]

    // 1. 转义序列
    if (ch === '\\' && i + 1 < pattern.length) {
      const next = pattern[i + 1]
      // 反向引用 \1 \2 ...
      if (/\d/.test(next)) {
        tokens.push({ type: 'backreference', text: '\\' + next, desc: getEscapeDesc('\\' + next) })
        i += 2
        continue
      }
      // 字符类简写 \d \w \s \D \W \S \b \B \n \r \t
      if ('dDwWsSbBnrt'.includes(next)) {
        const full = '\\' + next
        const type: TokenType = 'bB'.includes(next) ? 'anchor' : 'charClass'
        tokens.push({ type, text: full, desc: tokenDescMap[full] || `匹配 ${full}` })
        i += 2
        continue
      }
      // 其他转义
      tokens.push({ type: 'escape', text: '\\' + next, desc: getEscapeDesc('\\' + next) })
      i += 2
      continue
    }

    // 2. 字符类 [...]
    if (ch === '[') {
      let end = i + 1
      if (end < pattern.length && pattern[end] === '^') end++
      // 第一个 ] 不算结束（紧挨着 [ 或 [^ 后面）
      if (end < pattern.length && pattern[end] === ']') end++
      while (end < pattern.length && pattern[end] !== ']') {
        if (pattern[end] === '\\' && end + 1 < pattern.length) end++ // skip escaped char
        end++
      }
      if (end < pattern.length) end++ // include ]
      const text = pattern.slice(i, end)
      const negated = text[1] === '^'
      tokens.push({
        type: 'charClass',
        text,
        desc: negated ? `字符类 — 不匹配 ${text.slice(2, -1)}` : `字符类 — 匹配 ${text.slice(1, -1)} 中的任意一个`,
      })
      i = end
      continue
    }

    // 3. 锚点 ^ $
    if (ch === '^' || ch === '$') {
      tokens.push({ type: 'anchor', text: ch, desc: tokenDescMap[ch] })
      i++
      continue
    }

    // 4. 量词
    if (ch === '*' || ch === '+' || ch === '?') {
      // 检查后面是否有 ?（非贪婪）
      let text = ch
      if (i + 1 < pattern.length && pattern[i + 1] === '?') {
        text += '?'
        i++
      }
      const base = ch
      const baseDesc = tokenDescMap[base] || '量词'
      tokens.push({ type: 'quantifier', text, desc: text.length > 1 ? baseDesc.replace('贪婪', '非贪婪（惰性）') : baseDesc })
      i++
      continue
    }
    if (ch === '{') {
      let end = i + 1
      while (end < pattern.length && pattern[end] !== '}') end++
      if (end < pattern.length) end++ // include }
      const text = pattern.slice(i, end)
      tokens.push({ type: 'quantifier', text, desc: getQuantifierDesc(text) })
      i = end
      continue
    }

    // 5. 分组 / 环视 / 模式修饰器
    if (ch === '(') {
      // 检查特殊分组
      if (pattern.slice(i).startsWith('(?:')) {
        tokens.push({ type: 'group', text: '(?:', desc: getGroupDesc('(?:') })
        i += 3
        continue
      }
      if (pattern.slice(i).startsWith('(?<')) {
        // 命名捕获组 (?<name>...)
        let nameEnd = i + 3
        while (nameEnd < pattern.length && pattern[nameEnd] !== '>') nameEnd++
        const name = pattern.slice(i + 3, nameEnd)
        const text = pattern.slice(i, nameEnd + 1)
        tokens.push({ type: 'group', text, desc: `命名捕获组 (?<${name}>...) — 捕获为 "${name}"` })
        i = nameEnd + 1
        continue
      }
      if (pattern.slice(i).startsWith('(?=')) {
        tokens.push({ type: 'lookaround', text: '(?=', desc: '正向先行断言 — 后面必须匹配' })
        i += 3
        continue
      }
      if (pattern.slice(i).startsWith('(?!')) {
        tokens.push({ type: 'lookaround', text: '(?!', desc: '负向先行断言 — 后面不能匹配' })
        i += 3
        continue
      }
      if (pattern.slice(i).startsWith('(?<=')) {
        tokens.push({ type: 'lookaround', text: '(?<=', desc: '正向后行断言 — 前面必须匹配' })
        i += 4
        continue
      }
      if (pattern.slice(i).startsWith('(?<!')) {
        tokens.push({ type: 'lookaround', text: '(?<!', desc: '负向后行断言 — 前面不能匹配' })
        i += 4
        continue
      }
      // 模式修饰器 (?i) (?m) (?s) (?i-m)
      const modMatch = pattern.slice(i).match(/^\(\?([imsx]+(?:-[imsx]+)?)\)/)
      if (modMatch) {
        const text = modMatch[0]
        const flags = modMatch[1]
        tokens.push({ type: 'modifier', text, desc: `模式修饰器 — 内联标记: ${flags}` })
        i += text.length
        continue
      }
      // 普通捕获组
      tokens.push({ type: 'group', text: '(', desc: getGroupDesc('(') })
      i++
      continue
    }
    if (ch === ')') {
      tokens.push({ type: 'group', text: ')', desc: getGroupDesc(')') })
      i++
      continue
    }

    // 6. 或 |
    if (ch === '|') {
      tokens.push({ type: 'alternation', text: '|', desc: tokenDescMap['|'] })
      i++
      continue
    }

    // 7. 字面量
    tokens.push({ type: 'literal', text: ch, desc: `匹配字面量字符 "${ch}"` })
    i++
  }

  return tokens
}

/**
 * 生成正则表达式的自然语言解释
 */
export function explainPattern(pattern: string): string[] {
  if (!pattern) return []
  const tokens = tokenizePattern(pattern)
  const lines: string[] = []

  for (const token of tokens) {
    const prefix = getTokenPrefix(token.type)
    lines.push(`${prefix} ${token.text}  —  ${token.desc}`)
  }

  return lines
}

function getTokenPrefix(type: TokenType): string {
  switch (type) {
    case 'charClass':     return '[字符]'
    case 'quantifier':    return '[量词]'
    case 'anchor':        return '[锚点]'
    case 'group':         return '[分组]'
    case 'lookaround':    return '[断言]'
    case 'escape':        return '[转义]'
    case 'backreference': return '[引用]'
    case 'alternation':   return '[或]'
    case 'literal':       return '[字符]'
    case 'modifier':      return '[修饰]'
    default:              return '[其他]'
  }
}
