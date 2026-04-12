<script setup lang="ts">
import {
  Copy, Check, Trash2, Code, ClipboardPaste,
  Download, Eye, Pencil, Bold, Italic, Strikethrough,
  Quote, List, ListOrdered, Link, Image, Save,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import { useTooltip } from '@/composables/useTooltip'
import { useMarkdownEditor } from './useMarkdownEditor'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
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

    <!-- 控制卡片 -->
    <div class="control-card">
      <div class="control-row">
        <!-- 格式化按钮组 -->
        <div class="control-group">
          <button class="action-btn" @click="insertBold" @mouseenter="showTooltip('粗体', $event)" @mouseleave="hideTooltip"><Bold :size="13" /></button>
          <button class="action-btn" @click="insertItalic" @mouseenter="showTooltip('斜体', $event)" @mouseleave="hideTooltip"><Italic :size="13" /></button>
          <button class="action-btn" @click="insertStrikethrough" @mouseenter="showTooltip('删除线', $event)" @mouseleave="hideTooltip"><Strikethrough :size="13" /></button>
          <div class="control-divider"></div>
          <button class="action-btn" @click="insertH2" @mouseenter="showTooltip('H2', $event)" @mouseleave="hideTooltip"><span class="btn-text">H2</span></button>
          <button class="action-btn" @click="insertH3" @mouseenter="showTooltip('H3', $event)" @mouseleave="hideTooltip"><span class="btn-text">H3</span></button>
          <div class="control-divider"></div>
          <button class="action-btn" @click="insertUl" @mouseenter="showTooltip('无序列表', $event)" @mouseleave="hideTooltip"><List :size="13" /></button>
          <button class="action-btn" @click="insertOl" @mouseenter="showTooltip('有序列表', $event)" @mouseleave="hideTooltip"><ListOrdered :size="13" /></button>
          <button class="action-btn" @click="insertQuote" @mouseenter="showTooltip('引用', $event)" @mouseleave="hideTooltip"><Quote :size="13" /></button>
          <div class="control-divider"></div>
          <button class="action-btn" @click="insertInlineCode" @mouseenter="showTooltip('行内代码', $event)" @mouseleave="hideTooltip"><Code :size="13" /></button>
          <button class="action-btn" @click="insertCodeBlock" @mouseenter="showTooltip('代码块', $event)" @mouseleave="hideTooltip"><Code :size="13" /><span class="btn-sup">□</span></button>
          <button class="action-btn" @click="insertLink" @mouseenter="showTooltip('链接', $event)" @mouseleave="hideTooltip"><Link :size="13" /></button>
          <button class="action-btn" @click="insertImage" @mouseenter="showTooltip('图片', $event)" @mouseleave="hideTooltip"><Image :size="13" /></button>
          <button class="action-btn" @click="insertTable" @mouseenter="showTooltip('表格', $event)" @mouseleave="hideTooltip"><span class="btn-text">⊞</span></button>
          <div class="control-divider"></div>
          <button class="action-btn" @click="insertMathInline" @mouseenter="showTooltip('行内公式', $event)" @mouseleave="hideTooltip"><span class="btn-text">$x</span></button>
          <button class="action-btn" @click="insertMathBlock" @mouseenter="showTooltip('块级公式', $event)" @mouseleave="hideTooltip"><span class="btn-text">∑</span></button>
          <button class="action-btn" @click="insertMermaid" @mouseenter="showTooltip('Mermaid', $event)" @mouseleave="hideTooltip"><span class="btn-text">◆</span></button>
        </div>

        <!-- 视图 + 操作 -->
        <div class="control-group">
          <div class="control-toggle">
            <button :class="['seg-btn xs', { active: viewMode === 'edit' }]" @click="viewMode = 'edit'" @mouseenter="showTooltip('编辑', $event)" @mouseleave="hideTooltip"><Pencil :size="11" /></button>
            <button :class="['seg-btn xs', { active: viewMode === 'split' }]" @click="viewMode = 'split'" @mouseenter="showTooltip('分栏', $event)" @mouseleave="hideTooltip"><Code :size="11" /></button>
            <button :class="['seg-btn xs', { active: viewMode === 'preview' }]" @click="viewMode = 'preview'" @mouseenter="showTooltip('预览', $event)" @mouseleave="hideTooltip"><Eye :size="11" /></button>
          </div>
          <div class="control-divider"></div>
          <button class="action-btn" @click="loadExample" @mouseenter="showTooltip('示例', $event)" @mouseleave="hideTooltip"><ClipboardPaste :size="13" /></button>
          <button class="action-btn" @click="copyHtml" :disabled="!previewHtml" @mouseenter="showTooltip('复制 HTML', $event)" @mouseleave="hideTooltip">
            <Check v-if="copied" :size="13" style="color: var(--success)" /><Copy v-else :size="13" />
          </button>
          <div class="export-dropdown">
            <button class="action-btn"><Download :size="13" /></button>
            <div class="dropdown-menu">
              <button class="dropdown-item" @click="saveToLocal()" :disabled="!markdownText">
                <span><Save :size="13" style="margin-right:6px" />保存到本地</span><span class="shortcut">local</span>
              </button>
              <button class="dropdown-item" @click="exportHtml()" :disabled="!previewHtml">
                <span><Download :size="13" style="margin-right:6px" />导出 HTML</span><span class="shortcut">.html</span>
              </button>
              <button class="dropdown-item" @click="exportMarkdown()" :disabled="!markdownText">
                <span><Download :size="13" style="margin-right:6px" />导出 Markdown</span><span class="shortcut">.md</span>
              </button>
            </div>
          </div>
          <div class="control-divider"></div>
          <button class="action-btn" @click="clearAll" :disabled="!markdownText" @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip"><Trash2 :size="13" /></button>
        </div>
      </div>
    </div>

    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">{{ tooltip.text }}</div>

    <main class="tool-main" :class="{ split: 'split', edit: 'single', preview: 'single' }[viewMode]">
      <section v-if="viewMode !== 'preview'" class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Pencil :size="14" /></span>
            <span>编辑</span>
          </div>
          <div class="panel-actions">
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
            <span class="panel-icon green"><Eye :size="14" /></span>
            <span>预览</span>
          </div>
        </div>
        <div class="tool-panel-body" style="padding: 0; overflow: auto;">
          <div v-if="previewHtml" ref="previewRef" class="md-preview markdown-body" v-html="previewHtml"></div>
          <div v-else class="tool-empty">
            <div class="empty-icon"><Pencil :size="28" /></div>
            <p class="empty-title">开始编写</p>
            <p class="empty-desc">在左侧输入 Markdown，右侧实时预览</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* ====== Header ====== */
.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 4px;
}

.mode-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-tertiary);
}

.stat-text {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

/* ====== 控制卡片 ====== */
.control-card {
  margin: 12px 16px 0;
  padding: 8px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg, 10px);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  justify-content: space-between;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.control-divider {
  width: 1px;
  height: 16px;
  background: var(--border-subtle);
  margin: 0 4px;
}

/* ====== Segment Buttons ====== */
.seg-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 5px 12px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.seg-btn:hover { border-color: var(--border-default); background: var(--bg-hover); color: var(--text-primary); }

.seg-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.seg-btn.xs { padding: 3px 8px; font-size: 11px; height: 24px; }

.control-toggle {
  display: flex;
  gap: 2px;
}

/* ====== Action Buttons ====== */
.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 6px;
  transition: all var(--transition-fast);
  padding: 0;
  position: relative;
}

.action-btn:hover { color: var(--text-primary); background: var(--bg-hover); }
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-text {
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-mono);
  line-height: 1;
}

.btn-sup {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 8px;
  color: var(--text-muted);
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* ====== Filename Input ====== */
.filename-input {
  width: 120px;
  height: 24px;
  padding: 0 8px;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  outline: none;
  transition: all 0.15s;
}

.filename-input:focus { border-color: var(--accent); box-shadow: var(--shadow-focus); }

/* ====== Export Dropdown ====== */
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
  min-width: 180px;
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: 8px;
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
  border-radius: 6px;
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
.md-preview :deep(pre) { background: var(--bg-secondary); padding: 16px; border-radius: 8px; overflow-x: auto; margin: 0 0 20px; }
.md-preview :deep(pre code) { background: none; padding: 0; font-size: 0.88em; line-height: 1.6; }
.md-preview :deep(blockquote) { border-left: 4px solid var(--accent); margin: 0 0 16px; padding: 8px 16px; color: var(--text-secondary); background: var(--accent-light); border-radius: 0 6px 6px 0; }
.md-preview :deep(blockquote p:last-child) { margin-bottom: 0; }
.md-preview :deep(ul), .md-preview :deep(ol) { margin: 0 0 16px; padding-left: 24px; }
.md-preview :deep(li) { margin-bottom: 4px; }
.md-preview :deep(table) { width: 100%; border-collapse: collapse; margin: 0 0 16px; }
.md-preview :deep(th), .md-preview :deep(td) { border: 1px solid var(--border-default); padding: 8px 12px; text-align: left; }
.md-preview :deep(th) { background: var(--bg-secondary); font-weight: 600; font-size: 13px; }
.md-preview :deep(a) { color: var(--accent); text-decoration: none; }
.md-preview :deep(a:hover) { text-decoration: underline; }
.md-preview :deep(img) { max-width: 100%; border-radius: 8px; }
.md-preview :deep(hr) { border: none; height: 1px; background: var(--border-default); margin: 24px 0; }
.md-preview :deep(input[type="checkbox"]) { margin-right: 6px; }

.md-preview :deep(.katex-display) { margin: 16px 0; overflow-x: auto; padding: 8px 0; }
.md-preview :deep(.katex-error) { color: var(--error); font-family: var(--font-mono); font-size: 12px; background: rgba(255,59,48,0.1); padding: 2px 6px; border-radius: 4px; }
.md-preview :deep(.math-block) { margin: 16px 0; overflow-x: auto; text-align: center; padding: 12px 0; }
.md-preview :deep(.math-block .katex-display) { margin: 0; }

.md-preview :deep(.mermaid-diagram) { margin: 16px 0; text-align: center; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; overflow-x: auto; }
.md-preview :deep(.mermaid-diagram svg) { max-width: 100%; height: auto; }

/* ====== Empty State ====== */
.tool-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  flex: 1;
}

.empty-icon {
  color: var(--text-muted);
  opacity: 0.25;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0 0 4px 0;
}

.empty-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

/* ====== Tooltip ====== */
.toolbar-tooltip {
  position: fixed;
  z-index: 9999;
  padding: 5px 10px;
  font-size: 12px;
  color: var(--text-inverse);
  background: var(--bg-tooltip, rgba(0, 0, 0, 0.85));
  border-radius: 4px;
  white-space: nowrap;
  transform: translateX(-50%);
  backdrop-filter: blur(4px);
  line-height: 1.4;
}

/* ====== Responsive ====== */
@media (max-width: 760px) {
  .tool-main.split { grid-template-columns: 1fr !important; }
  .filename-input { display: none; }
  .control-row { flex-wrap: wrap; }
}
</style>
