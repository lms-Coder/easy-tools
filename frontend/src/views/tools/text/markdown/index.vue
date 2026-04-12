<script setup lang="ts">
import {
  Copy, Check, Trash2, Code, ClipboardPaste,
  Download, Eye, Pencil, Bold, Italic, Strikethrough,
  Quote, List, ListOrdered, Link, Image, Save,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import { useMarkdownEditor } from './useMarkdownEditor'

const {
  tooltip, showTooltip, hideTooltip,
  markdownText, viewMode, copied, fileName, previewRef,
  previewHtml, stats,
  insertBold, insertItalic, insertStrikethrough,
  insertH2, insertH3, insertUl, insertOl,
  insertCodeBlock, insertInlineCode, insertQuote,
  insertLink, insertImage, insertTable,
  insertMathInline, insertMathBlock, insertMermaid,
  exportHtml, exportMarkdown, copyHtml,
  clearAll, loadExample, handleKeydown, saveToLocal,
} = useMarkdownEditor()
</script>

<template>
  <div class="tool-page">
    <ToolTitleBar title="Markdown 编辑器" icon="icon-markdown">
      <div class="header-content">
        <span class="mode-tag">{{ { split: '分栏', edit: '编辑', preview: '预览' }[viewMode] }}</span>
        <span v-if="stats.chars" class="stat-text">{{ stats.chars }} 字 / {{ stats.lines }} 行</span>
      </div>
    </ToolTitleBar>

    <div class="tool-toolbar">
      <div class="tool-toolbar-left">
        <button class="tb-btn" @click="insertBold" @mouseenter="showTooltip('粗体 Ctrl+B', $event)" @mouseleave="hideTooltip"><Bold :size="14" /></button>
        <button class="tb-btn" @click="insertItalic" @mouseenter="showTooltip('斜体 Ctrl+I', $event)" @mouseleave="hideTooltip"><Italic :size="14" /></button>
        <button class="tb-btn" @click="insertStrikethrough" @mouseenter="showTooltip('删除线', $event)" @mouseleave="hideTooltip"><Strikethrough :size="14" /></button>
        <span class="tb-sep"></span>
        <button class="tb-btn" @click="insertH2" @mouseenter="showTooltip('二级标题', $event)" @mouseleave="hideTooltip"><span class="tb-text">H2</span></button>
        <button class="tb-btn" @click="insertH3" @mouseenter="showTooltip('三级标题', $event)" @mouseleave="hideTooltip"><span class="tb-text">H3</span></button>
        <span class="tb-sep"></span>
        <button class="tb-btn" @click="insertUl" @mouseenter="showTooltip('无序列表', $event)" @mouseleave="hideTooltip"><List :size="14" /></button>
        <button class="tb-btn" @click="insertOl" @mouseenter="showTooltip('有序列表', $event)" @mouseleave="hideTooltip"><ListOrdered :size="14" /></button>
        <button class="tb-btn" @click="insertQuote" @mouseenter="showTooltip('引用', $event)" @mouseleave="hideTooltip"><Quote :size="14" /></button>
        <span class="tb-sep"></span>
        <button class="tb-btn" @click="insertInlineCode" @mouseenter="showTooltip('行内代码', $event)" @mouseleave="hideTooltip"><Code :size="14" /></button>
        <button class="tb-btn" @click="insertCodeBlock" @mouseenter="showTooltip('代码块', $event)" @mouseleave="hideTooltip"><Code :size="14" /><span class="tb-sup">□</span></button>
        <button class="tb-btn" @click="insertLink" @mouseenter="showTooltip('链接', $event)" @mouseleave="hideTooltip"><Link :size="14" /></button>
        <button class="tb-btn" @click="insertImage" @mouseenter="showTooltip('图片', $event)" @mouseleave="hideTooltip"><Image :size="14" /></button>
        <button class="tb-btn" @click="insertTable" @mouseenter="showTooltip('表格', $event)" @mouseleave="hideTooltip"><span class="tb-text">⊞</span></button>
        <span class="tb-sep"></span>
        <button class="tb-btn" @click="insertMathInline" @mouseenter="showTooltip('行内公式 $...$', $event)" @mouseleave="hideTooltip"><span class="tb-text">$x</span></button>
        <button class="tb-btn" @click="insertMathBlock" @mouseenter="showTooltip('块级公式 $$...$$', $event)" @mouseleave="hideTooltip"><span class="tb-text">∑</span></button>
        <button class="tb-btn" @click="insertMermaid" @mouseenter="showTooltip('Mermaid 图表', $event)" @mouseleave="hideTooltip"><span class="tb-text">◆</span></button>
      </div>

      <div class="tool-toolbar-right">
        <div class="tool-segment">
          <button class="tool-segment-btn" :class="{ active: viewMode === 'edit' }" @click="viewMode = 'edit'" @mouseenter="showTooltip('编辑', $event)" @mouseleave="hideTooltip">
            <Pencil :size="13" />
          </button>
          <button class="tool-segment-btn" :class="{ active: viewMode === 'split' }" @click="viewMode = 'split'" @mouseenter="showTooltip('分栏', $event)" @mouseleave="hideTooltip">
            <Code :size="13" />
          </button>
          <button class="tool-segment-btn" :class="{ active: viewMode === 'preview' }" @click="viewMode = 'preview'" @mouseenter="showTooltip('预览', $event)" @mouseleave="hideTooltip">
            <Eye :size="13" />
          </button>
        </div>

        <span class="tb-sep"></span>

        <button class="tb-btn" @click="loadExample" @mouseenter="showTooltip('加载示例', $event)" @mouseleave="hideTooltip"><ClipboardPaste :size="14" /></button>
        <button class="tb-btn" @click="copyHtml" :disabled="!previewHtml" @mouseenter="showTooltip('复制 HTML', $event)" @mouseleave="hideTooltip">
          <Copy v-if="!copied" :size="14" /><Check v-else :size="14" style="color: var(--accent)" />
        </button>

        <div class="export-dropdown">
          <button class="tb-btn" @mouseenter="showTooltip('导出', $event)" @mouseleave="hideTooltip"><Download :size="14" /></button>
          <div class="dropdown-menu">
            <button class="dropdown-item" @click="saveToLocal" :disabled="!markdownText">
              <span><Save :size="13" style="margin-right:6px" />保存到本地</span><span class="shortcut">local</span>
            </button>
            <button class="dropdown-item" @click="exportHtml" :disabled="!previewHtml">
              <span><Download :size="13" style="margin-right:6px" />导出 HTML</span><span class="shortcut">.html</span>
            </button>
            <button class="dropdown-item" @click="exportMarkdown" :disabled="!markdownText">
              <span><Download :size="13" style="margin-right:6px" />导出 Markdown</span><span class="shortcut">.md</span>
            </button>
          </div>
        </div>

        <button class="tb-btn tb-danger" @click="clearAll" :disabled="!markdownText" @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip"><Trash2 :size="14" /></button>
      </div>
    </div>

    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }" @mouseenter="tooltip.show = true" @mouseleave="tooltip.show = false">
      {{ tooltip.text }}
    </div>

    <main class="tool-main" :class="{ split: 'split', edit: 'single', preview: 'single' }[viewMode]">
      <section v-if="viewMode !== 'preview'" class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Pencil :size="12" /></span>
            <span>编辑</span>
          </div>
          <div class="tool-panel-actions">
            <input v-model="fileName" class="filename-input" placeholder="文件名.md" spellcheck="false" />
          </div>
        </div>
        <div class="tool-panel-body" style="padding: 0;">
          <textarea
            v-model="markdownText"
            class="md-textarea"
            placeholder="在此输入 Markdown 内容...&#10;&#10;支持 KaTeX 公式和 Mermaid 图表"
            spellcheck="false"
            @keydown="handleKeydown"
          ></textarea>
        </div>
      </section>

      <section v-if="viewMode !== 'edit'" class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Eye :size="12" /></span>
            <span>预览</span>
          </div>
        </div>
        <div class="tool-panel-body" style="padding: 0; overflow: auto;">
          <div v-if="previewHtml" ref="previewRef" class="md-preview markdown-body" v-html="previewHtml"></div>
          <div v-else class="tool-empty">
            <div class="empty-icon"><Pencil :size="24" /></div>
            <p class="empty-title">开始编写</p>
            <p class="empty-desc">在左侧输入 Markdown，右侧实时预览</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.toolbar-tooltip {
  position: fixed;
  z-index: 9999;
  padding: 5px 12px;
  font-size: 12px;
  color: var(--text-inverse);
  background: var(--bg-tooltip, rgba(0, 0, 0, 0.85));
  border-radius: var(--radius-sm);
  white-space: nowrap;
  pointer-events: none;
  transform: translateX(-50%);
  backdrop-filter: blur(4px);
  min-width: 60px;
  text-align: center;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 4px;
}

.mode-tag {
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-secondary);
}

.stat-text {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

:deep(.tool-toolbar) {
  flex-wrap: nowrap !important;
  overflow-x: auto;
  overflow-y: hidden;
  gap: 4px !important;
  padding: 4px 8px !important;
  scrollbar-width: none;
}

:deep(.tool-toolbar)::-webkit-scrollbar { display: none; }

:deep(.tool-toolbar-left),
:deep(.tool-toolbar-right) {
  flex-shrink: 0 !important;
  flex-wrap: nowrap !important;
  gap: 2px !important;
  align-items: center !important;
}

.tb-btn {
  width: 30px;
  height: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 14px;
  flex-shrink: 0;
  position: relative;
}

.tb-btn:hover:not(:disabled) { background: var(--bg-hover); color: var(--text-primary); }
.tb-btn:active:not(:disabled) { background: var(--bg-secondary); transform: scale(0.95); }
.tb-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.tb-btn.tb-danger:hover:not(:disabled) { color: var(--error); background: var(--error-light); }

.tb-sup {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 8px;
  color: var(--text-muted);
}

.tb-text {
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-mono);
  line-height: 1;
}

.tb-sep {
  width: 1px;
  height: 16px;
  background: var(--border-subtle);
  margin: 0 2px;
  flex-shrink: 0;
}

.tool-segment { flex-shrink: 0; }

.tool-segment :deep(.tool-segment-btn) {
  width: 28px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.filename-input {
  width: 120px;
  height: 24px;
  padding: 0 8px;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  outline: none;
  transition: all 0.15s;
}

.filename-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-light); }

.export-dropdown {
  position: relative;
  display: flex;
  align-items: center;
}

.export-dropdown:hover .dropdown-menu { display: block; }

.dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  min-width: 180px;
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 50;
  padding: 4px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 7px 10px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.15s;
}

.dropdown-item span { display: flex; align-items: center; }
.dropdown-item:hover:not(:disabled) { background: var(--bg-hover); }
.dropdown-item:disabled { opacity: 0.5; cursor: not-allowed; }
.dropdown-item .shortcut { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }

/* ====== Textarea ====== */
.md-textarea {
  width: 100%;
  height: 100%;
  padding: 16px 18px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--text-primary);
  tab-size: 2;
}

.md-textarea::placeholder { color: var(--text-muted); }

/* ====== Preview ====== */
.md-preview {
  padding: 20px 24px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-primary);
  word-break: break-word;
}

.md-preview :deep(h1) { font-size: 1.8em; font-weight: 700; margin: 28px 0 16px; padding-bottom: 10px; border-bottom: 1px solid var(--border-subtle); }
.md-preview :deep(h2) { font-size: 1.5em; font-weight: 600; margin: 24px 0 12px; }
.md-preview :deep(h3) { font-size: 1.25em; font-weight: 600; margin: 20px 0 10px; }
.md-preview :deep(h4) { font-size: 1.1em; font-weight: 600; margin: 16px 0 8px; }
.md-preview :deep(p) { margin: 0 0 16px; }
.md-preview :deep(strong) { font-weight: 600; }
.md-preview :deep(del) { text-decoration: line-through; color: var(--text-muted); }
.md-preview :deep(code) { background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.88em; }
.md-preview :deep(pre) { background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); overflow-x: auto; margin: 0 0 20px; }
.md-preview :deep(pre code) { background: none; padding: 0; font-size: 0.88em; line-height: 1.6; }
.md-preview :deep(blockquote) { border-left: 4px solid var(--accent); margin: 0 0 16px; padding: 8px 16px; color: var(--text-secondary); background: var(--accent-light); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
.md-preview :deep(blockquote p:last-child) { margin-bottom: 0; }
.md-preview :deep(ul), .md-preview :deep(ol) { margin: 0 0 16px; padding-left: 24px; }
.md-preview :deep(li) { margin-bottom: 4px; }
.md-preview :deep(table) { width: 100%; border-collapse: collapse; margin: 0 0 16px; }
.md-preview :deep(th), .md-preview :deep(td) { border: 1px solid var(--border-default); padding: 8px 12px; text-align: left; }
.md-preview :deep(th) { background: var(--bg-secondary); font-weight: 600; font-size: 13px; }
.md-preview :deep(a) { color: var(--accent); text-decoration: none; }
.md-preview :deep(a:hover) { text-decoration: underline; }
.md-preview :deep(img) { max-width: 100%; border-radius: var(--radius-md); }
.md-preview :deep(hr) { border: none; height: 1px; background: var(--border-default); margin: 24px 0; }
.md-preview :deep(input[type="checkbox"]) { margin-right: 6px; }

.md-preview :deep(.katex-display) { margin: 16px 0; overflow-x: auto; padding: 8px 0; }
.md-preview :deep(.katex-error) { color: var(--error); font-family: var(--font-mono); font-size: 12px; background: rgba(255,59,48,0.1); padding: 2px 6px; border-radius: 4px; }
.md-preview :deep(.math-block) { margin: 16px 0; overflow-x: auto; text-align: center; padding: 12px 0; }
.md-preview :deep(.math-block .katex-display) { margin: 0; }

.md-preview :deep(.mermaid-diagram) { margin: 16px 0; text-align: center; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px; overflow-x: auto; }
.md-preview :deep(.mermaid-diagram svg) { max-width: 100%; height: auto; }

/* ====== 响应式 ====== */
@media (max-width: 760px) {
  .tool-main.split { grid-template-columns: 1fr !important; }
  .filename-input { display: none; }
}
</style>
