import { ref, computed, watch, onMounted, nextTick as vueNextTick } from 'vue'
import { Marked, Renderer } from 'marked'
import hljs from 'highlight.js'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { toast } from '@/composables/useToast'
import * as FileService from '../../../../../bindings/easy-tools/internal/services/fileservice.js'

const markedInstance = new Marked()

markedInstance.setOptions({
  breaks: true,
  gfm: true,
})

const renderer = new Renderer()

renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  if (lang === 'mermaid') {
    return `<div class="mermaid-diagram" data-mermaid="${encodeURIComponent(text)}"></div>`
  }
  if (lang === 'math' || lang === 'latex' || lang === 'tex') {
    return `<div class="math-block">${renderKatex(text.trim(), true)}</div>`
  }
  let highlighted: string
  if (lang && hljs.getLanguage(lang)) {
    highlighted = hljs.highlight(text, { language: lang }).value
  } else {
    highlighted = hljs.highlightAuto(text).value
  }
  return `<pre><code class="hljs language-${lang || ''}">${highlighted}</code></pre>`
}

markedInstance.use({ renderer })

const renderKatex = (tex: string, displayMode: boolean): string => {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      strict: false,
    })
  } catch {
    return `<code class="katex-error">${tex}</code>`
  }
}

const processMath = (md: string): string => {
  md = md.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => renderKatex(tex.trim(), true))
  md = md.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, (_, tex) => renderKatex(tex.trim(), false))
  return md
}

const STORAGE_KEY = 'md-editor-content'
const STORAGE_NAME_KEY = 'md-editor-filename'

export function useMarkdownEditor() {
  const markdownText = ref('')
  const viewMode = ref<'split' | 'edit' | 'preview'>('split')
  const copied = ref(false)
  const fileName = ref('document.md')
  const previewRef = ref<HTMLElement | null>(null)

  const previewHtml = computed(() => {
    if (!markdownText.value) return ''
    const processed = processMath(markdownText.value)
    return markedInstance.parse(processed) as string
  })

  const stats = computed(() => {
    const text = markdownText.value
    return { chars: text.length, lines: text ? text.split('\n').length : 0 }
  })

  const renderMermaidDiagrams = async () => {
    await vueNextTick()
    if (!previewRef.value) return
    const diagrams = Array.from(previewRef.value.querySelectorAll('.mermaid-diagram'))
    if (diagrams.length === 0) return
    const mermaid = (await import('mermaid')).default
    mermaid.initialize({ startOnLoad: false, theme: 'default' })
    for (const el of diagrams) {
      const code = decodeURIComponent(el.getAttribute('data-mermaid') || '')
      if (!code) continue
      try {
        const { svg } = await mermaid.render(`mermaid-${Math.random().toString(36).slice(2, 8)}`, code)
        el.innerHTML = svg
        el.classList.add('rendered')
      } catch {
        el.innerHTML = `<pre style="color: var(--error); font-size: 12px;">Mermaid 语法错误</pre>`
      }
    }
  }

  watch(previewHtml, () => renderMermaidDiagrams(), { flush: 'post' })

  const insertFormat = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = document.querySelector('.md-textarea') as HTMLTextAreaElement
    if (!textarea) return
    const scrollTop = textarea.scrollTop
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = markdownText.value.substring(start, end)
    const replacement = selected ? before + selected + after : before + placeholder + after
    markdownText.value = markdownText.value.substring(0, start) + replacement + markdownText.value.substring(end)
    vueNextTick(() => {
      textarea.focus()
      const pos = selected ? start + before.length + selected.length + after.length : start + before.length + placeholder.length
      textarea.setSelectionRange(pos, pos)
      textarea.scrollTop = scrollTop
    })
  }

  const insertBold = () => insertFormat('**', '**', '粗体')
  const insertItalic = () => insertFormat('*', '*', '斜体')
  const insertStrikethrough = () => insertFormat('~~', '~~', '删除线')
  const insertH2 = () => insertFormat('\n## ', '\n', '标题')
  const insertH3 = () => insertFormat('\n### ', '\n', '标题')
  const insertUl = () => insertFormat('\n- ', '\n', '列表项')
  const insertOl = () => insertFormat('\n1. ', '\n', '列表项')
  const insertCodeBlock = () => insertFormat('\n```\n', '\n```\n', 'code')
  const insertInlineCode = () => insertFormat('`', '`', '代码')
  const insertQuote = () => insertFormat('\n> ', '\n', '引用')
  const insertLink = () => insertFormat('[', '](url)', '链接')
  const insertImage = () => insertFormat('![', '](url)', '描述')
  const insertTable = () => insertFormat('\n| 列1 | 列2 | 列3 |\n|------|------|------|\n| 内容 | 内容 | 内容 |\n')
  const insertMathInline = () => insertFormat('$', '$', 'E=mc^2')
  const insertMathBlock = () => insertFormat('\n$$\n', '\n$$\n', '\\sum_{i=1}^{n} x_i')
  const insertMermaid = () => insertFormat('\n```mermaid\n', '\n```\n', 'flowchart TD\n    A[开始] --> B{判断}\n    B -->|是| C[执行]\n    B -->|否| D[结束]')

  const exportHtml = async () => {
    const katexCss = document.querySelector('link[href*="katex"]')?.outerHTML || ''
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${fileName.value.replace('.md', '')}</title>
${katexCss}
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:800px;margin:0 auto;padding:40px 20px;color:#333;line-height:1.8}
h1{font-size:2em;border-bottom:1px solid #eee;padding-bottom:8px;margin-top:24px}
h2{font-size:1.6em;margin-top:20px}h3{font-size:1.3em}
code{background:#f6f8fa;padding:2px 6px;border-radius:4px;font-size:0.9em}
pre{background:#f6f8fa;padding:16px;border-radius:6px;overflow-x:auto}pre code{background:none;padding:0}
blockquote{border-left:4px solid #ddd;margin:0;padding-left:16px;color:#666}
table{border-collapse:collapse;width:100%;margin:16px 0}th,td{border:1px solid #ddd;padding:8px 12px}th{background:#f5f5f5}
a{color:#3b82f6}img{max-width:100%}.mermaid-diagram svg{max-width:100%}
</style>
</head>
<body>${previewHtml.value}</body>
</html>`
    try {
      const path = await FileService.SaveFileWithFilter(html, `${fileName.value.replace('.md', '')}.html`, 'HTML 文件', '*.html')
      if (path) toast.success('HTML 已导出')
    } catch (e: any) {
      toast.error(e.message || '导出失败')
    }
  }

  const exportMarkdown = async () => {
    try {
      const path = await FileService.SaveFileWithFilter(markdownText.value, fileName.value, 'Markdown 文件', '*.md')
      if (path) toast.success('Markdown 已导出')
    } catch (e: any) {
      toast.error(e.message || '导出失败')
    }
  }

  const copyHtml = async () => {
    if (!previewHtml.value) return
    try {
      await navigator.clipboard.writeText(previewHtml.value)
      copied.value = true; toast.success('HTML 已复制')
      setTimeout(() => copied.value = false, 2000)
    } catch { toast.error('复制失败') }
  }

  const clearAll = () => { markdownText.value = ''; fileName.value = 'document.md' }

  const loadExample = () => {
    markdownText.value = `# Markdown 编辑器示例

## 文本格式

**粗体**、*斜体*、~~删除线~~、\`行内代码\`

## 列表

- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2

## 代码块

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

## 数学公式

行内公式：$E = mc^2$

块级公式：

$$
\\sum_{i=1}^{n} x_i = x_1 + x_2 + \\cdots + x_n
$$

## Mermaid 流程图

\`\`\`mermaid
flowchart TD
    A[开始] --> B{条件判断}
    B -->|是| C[执行操作]
    B -->|否| D[结束]
    C --> D
\`\`\`

## 表格

| 属性 | 说明 | 示例 |
|------|------|------|
| 对齐 | 居中 | 右对齐 |
| 内容1 | 内容2 | 内容3 |

## 引用

> 这是一段引用文本
> 支持 Markdown **格式**

---

> 以上是 Markdown 编辑器的功能演示
`
    fileName.value = 'example.md'
  }

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b': e.preventDefault(); insertBold(); break
        case 'i': e.preventDefault(); insertItalic(); break
        case 'k': e.preventDefault(); insertLink(); break
      }
    }
  }

  const saveToLocal = async () => {
    try {
      const path = await FileService.SaveFileWithFilter(markdownText.value, fileName.value, 'Markdown 文件', '*.md')
      if (path) toast.success('已保存')
    } catch (e: any) {
      toast.error(e.message || '保存失败')
    }
  }

  onMounted(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) markdownText.value = saved
    const savedName = localStorage.getItem(STORAGE_NAME_KEY)
    if (savedName) fileName.value = savedName
  })

  watch(markdownText, (val) => {
    localStorage.setItem(STORAGE_KEY, val)
  })

  return {
    markdownText, viewMode, copied, fileName, previewRef,
    previewHtml, stats,
    insertBold, insertItalic, insertStrikethrough,
    insertH2, insertH3, insertUl, insertOl,
    insertCodeBlock, insertInlineCode, insertQuote,
    insertLink, insertImage, insertTable,
    insertMathInline, insertMathBlock, insertMermaid,
    exportHtml, exportMarkdown, copyHtml,
    clearAll, loadExample, handleKeydown, saveToLocal,
  }
}
