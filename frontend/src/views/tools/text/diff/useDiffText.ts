import { computed, ref, watch, useTemplateRef } from 'vue'
import { diffLines, diffWordsWithSpace } from 'diff'
import { toast } from '@/composables/useToast'
import * as DiffService from '../../../../../bindings/easy-tools/internal/services/diffservice.js'

export type ViewMode = 'split' | 'unified'

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
  /** unified view: merged line content */
  unifiedPieces: InlinePiece[]
  unifiedType: 'same' | 'add' | 'remove'
}

export interface EditorRow {
  number: number
  type: 'same' | 'add' | 'remove'
  pieces: InlinePiece[]
}

export interface DiffChangeBlock {
  startRow: number
  endRow: number
}

export function useDiffText() {
  // ====== State ======
  const leftText = ref('')
  const rightText = ref('')
  const leftFileName = ref('原始文本')
  const rightFileName = ref('目标文本')
  const ignoreWhitespace = ref(false)
  const inlineHighlight = ref(true)
  const viewMode = ref<ViewMode>('split')
  const stats = ref({ added: 0, removed: 0, changed: 0, unchanged: 0 })

  // Diff navigation
  const activeChangeIndex = ref(-1)
  const changeBlocks = ref<DiffChangeBlock[]>([])

  // ====== Template refs ======
  const leftTextareaRef = useTemplateRef<HTMLTextAreaElement>('leftTextarea')
  const rightTextareaRef = useTemplateRef<HTMLTextAreaElement>('rightTextarea')
  const leftHighlightRef = useTemplateRef<HTMLDivElement>('leftHighlight')
  const rightHighlightRef = useTemplateRef<HTMLDivElement>('rightHighlight')
  const leftGutterRef = useTemplateRef<HTMLDivElement>('leftGutter')
  const rightGutterRef = useTemplateRef<HTMLDivElement>('rightGutter')
  const unifiedHighlightRef = useTemplateRef<HTMLDivElement>('unifiedHighlight')
  const unifiedGutterRef = useTemplateRef<HTMLDivElement>('unifiedGutter')

  // ====== Internal ======
  const normalizedText = (value: string) => {
    if (!ignoreWhitespace.value) return value
    return value.split('\n').map(line => line.trim().replace(/\s+/g, ' ')).join('\n')
  }

  const createPieces = (left: string, right: string): { leftPieces: InlinePiece[]; rightPieces: InlinePiece[] } => {
    if (!inlineHighlight.value) {
      return {
        leftPieces: [{ value: left, type: 'same' as const }],
        rightPieces: [{ value: right, type: 'same' as const }],
      }
    }
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

  // ====== Computed ======
  const diffRows = computed<DiffLine[]>(() => {
    const leftSource = leftText.value.replace(/\r\n/g, '\n')
    const rightSource = rightText.value.replace(/\r\n/g, '\n')
    const lineDiffs = diffLines(normalizedText(leftSource), normalizedText(rightSource))
    const rows: DiffLine[] = []
    let leftNumber = 1, rightNumber = 1
    let added = 0, removed = 0, changed = 0, unchanged = 0
    const toLines = (value: string) => {
      const lines = value.split('\n')
      if (lines[lines.length - 1] === '') lines.pop()
      return lines
    }
    for (let index = 0; index < lineDiffs.length; index += 1) {
      const current = lineDiffs[index]
      const next = lineDiffs[index + 1]
      if (current?.removed && next?.added) {
        const removedLines = toLines(current.value)
        const addedLines = toLines(next.value)
        const pairCount = Math.max(removedLines.length, addedLines.length)
        for (let i = 0; i < pairCount; i += 1) {
          const leftLine = removedLines[i] ?? ''
          const rightLine = addedLines[i] ?? ''
          const pieces = createPieces(leftLine, rightLine)
          const isLeftPresent = removedLines[i] !== undefined
          const isRightPresent = addedLines[i] !== undefined
          // unified: show changed lines with word diff
          const unifiedPieces: InlinePiece[] = []
          if (isLeftPresent && isRightPresent) {
            // merge: show remove then add inline
            pieces.leftPieces.forEach(p => { if (p.type === 'remove') unifiedPieces.push(p) })
            pieces.rightPieces.forEach(p => { if (p.type === 'add') unifiedPieces.push(p) })
            if (unifiedPieces.length === 0) {
              pieces.leftPieces.forEach(p => unifiedPieces.push(p))
            }
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
        changed += pairCount; index += 1; continue
      }
      const lines = toLines(current.value)
      if (current.added) {
        lines.forEach(line => {
          rows.push({
            leftNumber: null, rightNumber: rightNumber++,
            leftType: 'empty', rightType: 'add',
            leftPieces: [{ value: '', type: 'same' as const }],
            rightPieces: [{ value: line, type: 'add' as const }],
            unifiedPieces: [{ value: line, type: 'add' as const }],
            unifiedType: 'add',
          })
          added += 1
        }); continue
      }
      if (current.removed) {
        lines.forEach(line => {
          rows.push({
            leftNumber: leftNumber++, rightNumber: null,
            leftType: 'remove', rightType: 'empty',
            leftPieces: [{ value: line, type: 'remove' as const }],
            rightPieces: [{ value: '', type: 'same' as const }],
            unifiedPieces: [{ value: line, type: 'remove' as const }],
            unifiedType: 'remove',
          })
          removed += 1
        }); continue
      }
      lines.forEach(line => {
        rows.push({
          leftNumber: leftNumber++, rightNumber: rightNumber++,
          leftType: 'same', rightType: 'same',
          leftPieces: [{ value: line, type: 'same' as const }],
          rightPieces: [{ value: line, type: 'same' as const }],
          unifiedPieces: [{ value: line, type: 'same' as const }],
          unifiedType: 'same',
        })
        unchanged += 1
      })
    }
    stats.value = { added, removed, changed, unchanged }
    return rows
  })

  const hasDiff = computed(() => stats.value.added > 0 || stats.value.removed > 0 || stats.value.changed > 0)

  const leftEditorRows = computed<EditorRow[]>(() =>
    diffRows.value.filter(row => row.leftNumber !== null).map(row => ({ number: row.leftNumber as number, type: row.leftType === 'empty' ? 'same' : row.leftType, pieces: row.leftPieces }))
  )

  const rightEditorRows = computed<EditorRow[]>(() =>
    diffRows.value.filter(row => row.rightNumber !== null).map(row => ({ number: row.rightNumber as number, type: row.rightType === 'empty' ? 'same' : row.rightType, pieces: row.rightPieces }))
  )

  const summaryText = computed(() => {
    if (!leftText.value && !rightText.value) return '输入两段文本后开始对比'
    if (!hasDiff.value) return '两侧文本完全一致'
    return `+${stats.value.added} -${stats.value.removed} ~${stats.value.changed}`
  })

  // ====== Change block detection for navigation ======
  watch(diffRows, (rows) => {
    const blocks: DiffChangeBlock[] = []
    let inBlock = false
    let blockStart = 0
    for (let i = 0; i < rows.length; i++) {
      const isChange = rows[i].unifiedType !== 'same'
      if (isChange && !inBlock) {
        blockStart = i
        inBlock = true
      } else if (!isChange && inBlock) {
        blocks.push({ startRow: blockStart, endRow: i - 1 })
        inBlock = false
      }
    }
    if (inBlock) {
      blocks.push({ startRow: blockStart, endRow: rows.length - 1 })
    }
    changeBlocks.value = blocks
    if (activeChangeIndex.value >= blocks.length) {
      activeChangeIndex.value = blocks.length > 0 ? 0 : -1
    }
  }, { immediate: true })

  watch([leftText, rightText], () => {
    if (!leftText.value && !rightText.value) stats.value = { added: 0, removed: 0, changed: 0, unchanged: 0 }
  })

  // ====== Scroll sync ======
  const syncEditorScroll = (textarea: HTMLTextAreaElement | null, highlight: HTMLDivElement | null, gutter: HTMLDivElement | null) => {
    if (!textarea || !highlight || !gutter) return
    highlight.scrollTop = textarea.scrollTop
    highlight.scrollLeft = textarea.scrollLeft
    gutter.scrollTop = textarea.scrollTop
  }

  const handleLeftScroll = () => syncEditorScroll(leftTextareaRef.value, leftHighlightRef.value, leftGutterRef.value)
  const handleRightScroll = () => syncEditorScroll(rightTextareaRef.value, rightHighlightRef.value, rightGutterRef.value)

  const handleUnifiedScroll = () => {
    if (!unifiedHighlightRef.value || !unifiedGutterRef.value) return
    unifiedGutterRef.value.scrollTop = unifiedHighlightRef.value.scrollTop
  }

  // ====== Diff navigation ======
  const navigateToChange = (direction: 'prev' | 'next') => {
    const blocks = changeBlocks.value
    if (blocks.length === 0) return

    if (direction === 'next') {
      activeChangeIndex.value = (activeChangeIndex.value + 1) % blocks.length
    } else {
      activeChangeIndex.value = activeChangeIndex.value <= 0 ? blocks.length - 1 : activeChangeIndex.value - 1
    }

    const block = blocks[activeChangeIndex.value]
    const targetRow = block.startRow
    const rowHeight = 22 // --ed-lh

    if (viewMode.value === 'unified') {
      if (unifiedHighlightRef.value) {
        unifiedHighlightRef.value.scrollTop = targetRow * rowHeight - 100
      }
    } else {
      // For split view, scroll both sides
      const leftRow = diffRows.value.slice(0, targetRow + 1).filter(r => r.leftNumber !== null).length - 1
      if (leftTextareaRef.value) leftTextareaRef.value.scrollTop = leftRow * rowHeight - 100
      const rightRow = diffRows.value.slice(0, targetRow + 1).filter(r => r.rightNumber !== null).length - 1
      if (rightTextareaRef.value) rightTextareaRef.value.scrollTop = rightRow * rowHeight - 100
    }
  }

  const isRowInActiveChange = (rowIndex: number): boolean => {
    if (activeChangeIndex.value < 0 || activeChangeIndex.value >= changeBlocks.value.length) return false
    const block = changeBlocks.value[activeChangeIndex.value]
    return rowIndex >= block.startRow && rowIndex <= block.endRow
  }

  // ====== File operations ======
  const importLeftFile = async () => {
    try {
      const path = await DiffService.SelectFile()
      if (!path) return
      const content = await DiffService.ReadFile(path)
      leftText.value = content
      const name = path.split(/[\\/]/).pop() || '文件'
      leftFileName.value = name
      toast.success(`已导入: ${name}`)
    } catch (e: any) {
      toast.error(e.message || '导入失败')
    }
  }

  const importRightFile = async () => {
    try {
      const path = await DiffService.SelectFile()
      if (!path) return
      const content = await DiffService.ReadFile(path)
      rightText.value = content
      const name = path.split(/[\\/]/).pop() || '文件'
      rightFileName.value = name
      toast.success(`已导入: ${name}`)
    } catch (e: any) {
      toast.error(e.message || '导入失败')
    }
  }

  const compareFiles = async () => {
    try {
      const path1 = await DiffService.SelectFile()
      if (!path1) return
      const path2 = await DiffService.SelectFile()
      if (!path2) return
      const result = await DiffService.DiffFiles(path1, path2)
      if (result) {
        leftText.value = result.content1
        rightText.value = result.content2
        leftFileName.value = result.path1.split(/[\\/]/).pop() || '文件1'
        rightFileName.value = result.path2.split(/[\\/]/).pop() || '文件2'
        toast.success('文件已加载')
      }
    } catch (e: any) {
      toast.error(e.message || '对比失败')
    }
  }

  // ====== Export ======
  const exportAsHTML = () => {
    const rows = diffRows.value
    let html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>文本对比结果</title>
<style>
body{font-family:monospace;font-size:13px;margin:0;padding:20px;background:#fafafa;color:#333}
.line{display:flex;min-height:22px;line-height:22px}
.line-num{width:50px;text-align:right;padding-right:12px;color:#999;user-select:none;flex-shrink:0}
.line-content{flex:1;padding-right:16px;white-space:pre}
.cell-add{background:#e6ffec}
.cell-remove{background:#ffebe9}
.piece-add{background:#abf2bc;border-radius:3px;color:#1a7f37}
.piece-remove{background:#ff8182;border-radius:3px;color:#82071e}
.cell-same{}
h2{font-size:16px;font-weight:600;margin:0 0 12px}
.header{display:flex;gap:24px;margin-bottom:16px;font-size:13px;color:#666}
</style></head><body>
<h2>文本对比结果</h2>
<div class="header"><span>--- ${leftFileName.value}</span><span>+++ ${rightFileName.value}</span></div>
`
    rows.forEach(row => {
      if (viewMode.value === 'unified') {
        const cls = `cell-${row.unifiedType}`
        const numL = row.leftNumber ?? ''
        const numR = row.rightNumber ?? ''
        html += `<div class="line ${cls}"><span class="line-num">${numL}</span><span class="line-num">${numR}</span><span class="line-content">`
        row.unifiedPieces.forEach(p => {
          const pcls = p.type === 'same' ? '' : ` piece-${p.type}`
          html += `<span class="${pcls}">${escapeHtml(p.value || ' ')}</span>`
        })
        html += `</span></div>\n`
      } else {
        // split mode: show unified-like output
        if (row.unifiedType === 'same') {
          html += `<div class="line cell-same"><span class="line-num">${row.leftNumber}</span><span class="line-num">${row.rightNumber}</span><span class="line-content">${escapeHtml(row.leftPieces[0]?.value || '')}</span></div>\n`
        } else if (row.unifiedType === 'remove' || row.leftNumber !== null) {
          html += `<div class="line cell-remove"><span class="line-num">${row.leftNumber ?? ''}</span><span class="line-num"></span><span class="line-content">`
          row.leftPieces.forEach(p => {
            const pcls = p.type === 'same' ? '' : ` piece-${p.type}`
            html += `<span class="${pcls}">${escapeHtml(p.value || ' ')}</span>`
          })
          html += `</span></div>\n`
        }
        if (row.rightType === 'add' && row.rightNumber !== null && row.leftNumber === null) {
          html += `<div class="line cell-add"><span class="line-num"></span><span class="line-num">${row.rightNumber}</span><span class="line-content">`
          row.rightPieces.forEach(p => {
            const pcls = p.type === 'same' ? '' : ` piece-${p.type}`
            html += `<span class="${pcls}">${escapeHtml(p.value || ' ')}</span>`
          })
          html += `</span></div>\n`
        }
      }
    })
    html += `</body></html>`

    DiffService.ExportDiffAsHTML(html, 'diff-result.html')
    toast.success('HTML 已导出')
  }

  const exportAsPatch = async () => {
    const parts = diffRows.value.map(row => ({
      type: row.unifiedType,
      value: (row.leftPieces[0]?.value || row.rightPieces[0]?.value || ''),
    }))
    const patch = await DiffService.ExportDiffAsPatch(JSON.stringify(parts), leftFileName.value, rightFileName.value)
    if (patch) {
      DiffService.SaveFile(patch, 'diff.patch')
      toast.success('Patch 已导出')
    } else {
      toast.error('导出失败')
    }
  }

  // ====== Actions ======
  const useExample = () => {
    leftText.value = `Easy Tools\n让桌面工具更顺手\n支持更多常用能力`
    rightText.value = `Easy Tools\n让桌面工具更现代\n支持更多高频能力`
    leftFileName.value = '原始文本'
    rightFileName.value = '目标文本'
  }

  const clearAll = () => {
    leftText.value = ''
    rightText.value = ''
    leftFileName.value = '原始文本'
    rightFileName.value = '目标文本'
  }

  const swapTexts = () => {
    const t = leftText.value
    leftText.value = rightText.value
    rightText.value = t
    const n = leftFileName.value
    leftFileName.value = rightFileName.value
    rightFileName.value = n
  }

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label}已复制`)
    } catch {
      toast.error('复制失败')
    }
  }

  return {
    // State
    leftText, rightText, leftFileName, rightFileName,
    ignoreWhitespace, inlineHighlight, viewMode, stats,
    activeChangeIndex, changeBlocks,
    // Template refs
    leftTextareaRef, rightTextareaRef, leftHighlightRef, rightHighlightRef,
    leftGutterRef, rightGutterRef, unifiedHighlightRef, unifiedGutterRef,
    // Computed
    hasDiff, leftEditorRows, rightEditorRows, diffRows, summaryText,
    // Actions
    handleLeftScroll, handleRightScroll, handleUnifiedScroll,
    navigateToChange, isRowInActiveChange,
    importLeftFile, importRightFile, compareFiles,
    exportAsHTML, exportAsPatch,
    useExample, clearAll, swapTexts, copyText,
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
