import { ref, computed, watch } from 'vue'
import { diffLines, diffWordsWithSpace } from 'diff'

export type DiffViewMode = 'split' | 'unified'

export interface InlinePiece {
  value: string
  type: 'same' | 'add' | 'remove'
}

export interface DiffLine {
  leftNumber: number | null
  rightNumber: number | null
  leftType: 'same' | 'add' | 'remove' | 'empty'
  rightType: 'same' | 'add' | 'remove' | 'empty'
  leftPieces: InlinePiece[]
  rightPieces: InlinePiece[]
  unifiedPieces: InlinePiece[]
  unifiedType: 'same' | 'add' | 'remove'
}

export interface DiffChangeBlock {
  startRow: number
  endRow: number
}

function sortKeysRecursive(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortKeysRecursive)
  if (obj !== null && typeof obj === 'object') {
    const sorted: Record<string, any> = {}
    Object.keys(obj).sort().forEach(key => { sorted[key] = sortKeysRecursive(obj[key]) })
    return sorted
  }
  return obj
}

function normalizeJson(text: string, ignoreKeyOrder: boolean): string {
  try {
    const parsed = JSON.parse(text)
    const obj = ignoreKeyOrder ? sortKeysRecursive(parsed) : parsed
    return JSON.stringify(obj, null, 2)
  } catch {
    return text
  }
}

export function useJsonDiff() {
  const leftJsonText = ref('')
  const rightJsonText = ref('')
  const ignoreKeyOrder = ref(true)
  const ignoreWhitespace = ref(true)
  const viewMode = ref<DiffViewMode>('split')
  const stats = ref({ added: 0, removed: 0, changed: 0, unchanged: 0 })

  // Navigation
  const activeChangeIndex = ref(-1)
  const changeBlocks = ref<DiffChangeBlock[]>([])

  const leftError = computed(() => {
    if (!leftJsonText.value.trim()) return ''
    try { JSON.parse(leftJsonText.value); return '' } catch { return 'JSON 格式无效' }
  })

  const rightError = computed(() => {
    if (!rightJsonText.value.trim()) return ''
    try { JSON.parse(rightJsonText.value); return '' } catch { return 'JSON 格式无效' }
  })

  const createPieces = (left: string, right: string): { leftPieces: InlinePiece[]; rightPieces: InlinePiece[] } => {
    const fragments = diffWordsWithSpace(left, right)
    const leftPieces: InlinePiece[] = []
    const rightPieces: InlinePiece[] = []
    fragments.forEach(fragment => {
      if (fragment.added) { rightPieces.push({ value: fragment.value, type: 'add' }); return }
      if (fragment.removed) { leftPieces.push({ value: fragment.value, type: 'remove' }); return }
      leftPieces.push({ value: fragment.value, type: 'same' })
      rightPieces.push({ value: fragment.value, type: 'same' })
    })
    return {
      leftPieces: leftPieces.length ? leftPieces : [{ value: left, type: 'same' }],
      rightPieces: rightPieces.length ? rightPieces : [{ value: right, type: 'same' }],
    }
  }

  const diffRows = computed<DiffLine[]>(() => {
    const leftSource = normalizeJson(leftJsonText.value, ignoreKeyOrder.value)
    const rightSource = normalizeJson(rightJsonText.value, ignoreKeyOrder.value)

    const leftNorm = ignoreWhitespace.value ? leftSource.split('\n').map(l => l.trim()).join('\n') : leftSource
    const rightNorm = ignoreWhitespace.value ? rightSource.split('\n').map(l => l.trim()).join('\n') : rightSource

    const lineDiffs = diffLines(leftNorm, rightNorm)
    const rows: DiffLine[] = []
    let leftNumber = 1, rightNumber = 1
    let added = 0, removed = 0, changed = 0, unchanged = 0

    const toLines = (value: string) => {
      const lines = value.split('\n')
      if (lines[lines.length - 1] === '') lines.pop()
      return lines
    }

    for (let index = 0; index < lineDiffs.length; index++) {
      const current = lineDiffs[index]
      const next = lineDiffs[index + 1]

      if (current?.removed && next?.added) {
        const removedLines = toLines(current.value)
        const addedLines = toLines(next.value)
        const pairCount = Math.max(removedLines.length, addedLines.length)
        for (let i = 0; i < pairCount; i++) {
          const leftLine = removedLines[i] ?? ''
          const rightLine = addedLines[i] ?? ''
          const pieces = createPieces(leftLine, rightLine)
          const isLeftPresent = removedLines[i] !== undefined
          const isRightPresent = addedLines[i] !== undefined

          const unifiedPieces: InlinePiece[] = []
          if (isLeftPresent && isRightPresent) {
            pieces.leftPieces.forEach(p => { if (p.type === 'remove') unifiedPieces.push(p) })
            pieces.rightPieces.forEach(p => { if (p.type === 'add') unifiedPieces.push(p) })
            if (unifiedPieces.length === 0) pieces.leftPieces.forEach(p => unifiedPieces.push(p))
          } else if (isLeftPresent) {
            unifiedPieces.push(...pieces.leftPieces)
          } else {
            unifiedPieces.push(...pieces.rightPieces)
          }

          rows.push({
            leftNumber: isLeftPresent ? leftNumber++ : null,
            rightNumber: isRightPresent ? rightNumber++ : null,
            leftType: isLeftPresent ? 'remove' : 'empty',
            rightType: isRightPresent ? 'add' : 'empty',
            leftPieces: pieces.leftPieces,
            rightPieces: pieces.rightPieces,
            unifiedPieces,
            unifiedType: 'remove',
          })
        }
        changed += pairCount; index++; continue
      }

      const lines = toLines(current.value)
      if (current.added) {
        lines.forEach(line => {
          rows.push({
            leftNumber: null, rightNumber: rightNumber++,
            leftType: 'empty', rightType: 'add',
            leftPieces: [{ value: '', type: 'same' }],
            rightPieces: [{ value: line, type: 'add' }],
            unifiedPieces: [{ value: line, type: 'add' }],
            unifiedType: 'add',
          }); added++
        }); continue
      }
      if (current.removed) {
        lines.forEach(line => {
          rows.push({
            leftNumber: leftNumber++, rightNumber: null,
            leftType: 'remove', rightType: 'empty',
            leftPieces: [{ value: line, type: 'remove' }],
            rightPieces: [{ value: '', type: 'same' }],
            unifiedPieces: [{ value: line, type: 'remove' }],
            unifiedType: 'remove',
          }); removed++
        }); continue
      }
      lines.forEach(line => {
        rows.push({
          leftNumber: leftNumber++, rightNumber: rightNumber++,
          leftType: 'same', rightType: 'same',
          leftPieces: [{ value: line, type: 'same' }],
          rightPieces: [{ value: line, type: 'same' }],
          unifiedPieces: [{ value: line, type: 'same' }],
          unifiedType: 'same',
        }); unchanged++
      })
    }
    stats.value = { added, removed, changed, unchanged }
    return rows
  })

  const hasDiff = computed(() => stats.value.added > 0 || stats.value.removed > 0 || stats.value.changed > 0)

  const summaryText = computed(() => {
    if (!leftJsonText.value && !rightJsonText.value) return '输入两份 JSON 后开始对比'
    if (!hasDiff.value) return '两份 JSON 完全一致'
    return `+${stats.value.added} -${stats.value.removed} ~${stats.value.changed}`
  })

  // Change block detection
  watch(diffRows, (rows) => {
    const blocks: DiffChangeBlock[] = []
    let inBlock = false, blockStart = 0
    for (let i = 0; i < rows.length; i++) {
      const isChange = rows[i].unifiedType !== 'same'
      if (isChange && !inBlock) { blockStart = i; inBlock = true }
      else if (!isChange && inBlock) { blocks.push({ startRow: blockStart, endRow: i - 1 }); inBlock = false }
    }
    if (inBlock) blocks.push({ startRow: blockStart, endRow: rows.length - 1 })
    changeBlocks.value = blocks
    if (activeChangeIndex.value >= blocks.length) activeChangeIndex.value = blocks.length > 0 ? 0 : -1
  }, { immediate: true })

  function navigateToChange(direction: 'prev' | 'next') {
    const blocks = changeBlocks.value
    if (blocks.length === 0) return
    if (direction === 'next') activeChangeIndex.value = (activeChangeIndex.value + 1) % blocks.length
    else activeChangeIndex.value = activeChangeIndex.value <= 0 ? blocks.length - 1 : activeChangeIndex.value - 1
    return blocks[activeChangeIndex.value]
  }

  function isRowInActiveChange(rowIndex: number): boolean {
    if (activeChangeIndex.value < 0 || activeChangeIndex.value >= changeBlocks.value.length) return false
    const block = changeBlocks.value[activeChangeIndex.value]
    return rowIndex >= block.startRow && rowIndex <= block.endRow
  }

  function clearDiff() {
    leftJsonText.value = ''
    rightJsonText.value = ''
  }

  function swapDiff() {
    const t = leftJsonText.value
    leftJsonText.value = rightJsonText.value
    rightJsonText.value = t
  }

  async function pasteToLeft() {
    try { leftJsonText.value = await navigator.clipboard.readText() } catch { /* ignore */ }
  }

  async function pasteToRight() {
    try { rightJsonText.value = await navigator.clipboard.readText() } catch { /* ignore */ }
  }

  return {
    leftJsonText, rightJsonText,
    ignoreKeyOrder, ignoreWhitespace, viewMode,
    stats, activeChangeIndex, changeBlocks,
    leftError, rightError,
    diffRows, hasDiff, summaryText,
    navigateToChange, isRowInActiveChange,
    clearDiff, swapDiff, pasteToLeft, pasteToRight,
  }
}
