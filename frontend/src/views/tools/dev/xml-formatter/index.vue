<script setup lang="ts">
import {
  Copy, Download, Upload, ClipboardPaste, Search, History,
  ChevronLeft, ChevronRight, Trash2, RotateCcw, Code, Check,
  CircleX, Eye, ArrowLeftRight, Play, FileText,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import Select from '@/components/ui/Select.vue'
import Compress from '@/components/icons/Compress.vue'
import ToolHistoryPanel from '@/components/common/ToolHistoryPanel.vue'
import { useXmlFormatter } from './useXmlFormatter'
import { useTooltip } from '@/composables/useTooltip'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
  inputText, outputText, indentSize, viewMode, wordWrap,
  error, copied, isValid, isDragging, searchText, matchIndex,
  xmlStats, fileInputRef,
  xpathQuery, xpathResultCount,
  treeSearchText, treeMatchIndex,
  treeViewHtml, nodeInfo, contextMenu,
  highlightedLines, matchedLines, matchLineList, matchCount,
  treeMatchCount,
  formatXml, minifyXml, validateXml,
  xmlToJson, jsonToXml, executeXpath,
  copyOutput, downloadXml, clearAll, pasteFromClipboard,
  importFile, handleFileSelect,
  handleDragOver, handleDragLeave, handleDrop, handleInput,
  navigateMatch,
  handleTreeMousemove, handleTreeMouseleave, handleTreeContextmenu,
  copyFromMenu, handleTreeClick,
  treeNavigateMatch,
  history, showHistory, deleteItem, handleHistoryUse, handleClearHistory,
} = useXmlFormatter()
</script>

<template>
  <div class="tool-page" @click="contextMenu.visible = false">
    <!-- 标题栏 -->
    <ToolTitleBar title="XML 格式化" icon="icon-xml">
      <div class="header-content">
        <div class="header-stats" v-if="xmlStats && isValid">
          <span class="stat-text">{{ xmlStats.elementCount }} 元素</span>
          <span class="stat-text">{{ xmlStats.attrCount }} 属性</span>
          <span class="stat-text">{{ xmlStats.depth }} 层</span>
          <span class="stat-text">{{ xmlStats.size }}</span>
        </div>
        <button class="glass-icon-btn" :class="{ active: showHistory }" @click="showHistory = !showHistory"
          @mouseenter="showTooltip('历史记录', $event)" @mouseleave="hideTooltip">
          <History :size="14" />
        </button>
      </div>
    </ToolTitleBar>

    <!-- 工具栏 -->
    <div class="tool-toolbar">
      <div class="tool-toolbar-left">
        <div class="toolbar-group">
          <button class="glass-icon-btn format-btn" @click="formatXml"
            @mouseenter="showTooltip('格式化 Ctrl+Enter', $event)" @mouseleave="hideTooltip">
            <RotateCcw :size="12" /><span>格式化</span>
          </button>
          <button class="glass-icon-btn" @click="minifyXml"
            @mouseenter="showTooltip('压缩', $event)" @mouseleave="hideTooltip">
            <Compress :size="12" />
          </button>
          <button class="glass-icon-btn" @click="validateXml"
            @mouseenter="showTooltip('校验', $event)" @mouseleave="hideTooltip">
            <Check :size="12" />
          </button>
        </div>
        <div class="tool-divider"></div>
        <div class="toolbar-group">
          <button class="glass-icon-btn" @click="xmlToJson"
            @mouseenter="showTooltip('XML → JSON', $event)" @mouseleave="hideTooltip">
            <ArrowLeftRight :size="12" />
          </button>
          <button class="glass-icon-btn" @click="jsonToXml"
            @mouseenter="showTooltip('JSON → XML', $event)" @mouseleave="hideTooltip">
            <ArrowLeftRight :size="12" style="transform: scaleX(-1)" />
          </button>
        </div>
        <div class="tool-divider"></div>
        <!-- XPath -->
        <div class="xpath-bar">
          <span class="xpath-label">XPath</span>
          <input v-model="xpathQuery" class="xpath-input" placeholder="//element[@attr]" spellcheck="false"
            @keydown.enter.prevent="executeXpath" />
          <button class="glass-icon-btn small" @click="executeXpath" :disabled="!xpathQuery.trim()">
            <Play :size="11" />
          </button>
          <span v-if="xpathResultCount >= 0" class="xpath-count">{{ xpathResultCount }} 条</span>
        </div>
        <div class="tool-divider"></div>
        <div class="toolbar-group">
          <button class="glass-icon-btn" @click="importFile"
            @mouseenter="showTooltip('导入文件', $event)" @mouseleave="hideTooltip">
            <Upload :size="12" />
          </button>
          <button class="glass-icon-btn" @click="pasteFromClipboard"
            @mouseenter="showTooltip('粘贴', $event)" @mouseleave="hideTooltip">
            <ClipboardPaste :size="12" />
          </button>
          <button class="glass-icon-btn" @click="copyOutput" :disabled="!outputText"
            @mouseenter="showTooltip('复制结果', $event)" @mouseleave="hideTooltip">
            <Check :size="12" v-if="copied" /><Copy :size="12" v-else />
          </button>
          <button class="glass-icon-btn" @click="downloadXml" :disabled="!outputText"
            @mouseenter="showTooltip('下载', $event)" @mouseleave="hideTooltip">
            <Download :size="12" />
          </button>
          <button class="glass-icon-btn danger" @click="clearAll" :disabled="!inputText"
            @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
            <Trash2 :size="12" />
          </button>
        </div>
      </div>
      <div class="tool-toolbar-right">
        <div class="toolbar-group options-group">
          <label class="opt-label">
            <Select v-model="indentSize" size="sm" :options="[
              { label: '2空格', value: 2 },
              { label: '4空格', value: 4 },
              { label: 'Tab', value: 1 },
            ]" />
          </label>
          <label class="opt-label">
            <input type="checkbox" v-model="wordWrap" />
            <span>换行</span>
          </label>
        </div>
        <div class="tool-divider"></div>
        <div class="tool-segment">
          <button class="tool-segment-btn" :class="{ active: viewMode === 'code' }" @click="viewMode = 'code'"
            @mouseenter="showTooltip('代码视图', $event)" @mouseleave="hideTooltip">
            <Code :size="11" />
          </button>
          <button class="tool-segment-btn" :class="{ active: viewMode === 'tree' }" @click="viewMode = 'tree'"
            @mouseenter="showTooltip('树形视图', $event)" @mouseleave="hideTooltip">
            <Eye :size="11" />
          </button>
        </div>
      </div>
    </div>

    <!-- Tooltip -->
    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      {{ tooltip.text }}
    </div>

    <!-- 隐藏的文件输入 -->
    <input ref="fileInputRef" type="file" accept=".xml,.xsl,.xslt,.xsd,.svg,.html,.xhtml,.wsdl,.txt,.config" style="display: none" @change="handleFileSelect" />

    <!-- 主内容 -->
    <main class="tool-main split">
      <!-- 输入区 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Code :size="12" /></span>
            <span>输入</span>
          </div>
          <div class="tool-panel-actions">
            <span :class="['tool-status', isValid ? 'success' : 'error']" v-if="inputText">
              <Check :size="12" v-if="isValid" /><CircleX :size="12" v-else />
              {{ isValid ? '有效 XML' : '无效' }}
            </span>
          </div>
        </div>
        <div class="tool-panel-body" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
          <textarea
            v-model="inputText"
            class="tool-code-input"
            :class="{ 'jf-wrap': wordWrap }"
            placeholder="在此粘贴 XML 数据或拖拽文件导入..."
            spellcheck="false"
            @input="handleInput"
          ></textarea>
          <div v-if="isDragging" class="drag-overlay">
            <Upload :size="24" />
            <span>释放以导入文件</span>
          </div>
        </div>
      </section>

      <!-- 输出区 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Check :size="12" /></span>
            <span>输出</span>
          </div>
          <div class="tool-panel-actions">
            <!-- Code search -->
            <div v-if="outputText && viewMode === 'code'" class="search-bar">
              <Search :size="12" style="color: var(--text-muted); flex-shrink: 0;" />
              <input v-model="searchText" class="search-input" placeholder="搜索..." spellcheck="false" />
              <template v-if="searchText">
                <span class="search-count">{{ matchCount > 0 ? matchIndex + 1 : 0 }}/{{ matchCount }}</span>
                <button class="search-nav" @click="navigateMatch(-1)" :disabled="matchCount === 0">
                  <ChevronLeft :size="12" />
                </button>
                <button class="search-nav" @click="navigateMatch(1)" :disabled="matchCount === 0">
                  <ChevronRight :size="12" />
                </button>
              </template>
            </div>
            <!-- Tree search -->
            <div v-if="viewMode === 'tree' && treeViewHtml" class="search-bar">
              <Search :size="12" style="color: var(--text-muted); flex-shrink: 0;" />
              <input v-model="treeSearchText" class="search-input" placeholder="搜索节点..." spellcheck="false" />
              <template v-if="treeSearchText && treeMatchCount > 0">
                <span class="search-count">{{ treeMatchIndex + 1 }}/{{ treeMatchCount }}</span>
                <button class="search-nav" @click="treeNavigateMatch(-1)">
                  <ChevronLeft :size="12" />
                </button>
                <button class="search-nav" @click="treeNavigateMatch(1)">
                  <ChevronRight :size="12" />
                </button>
              </template>
            </div>
            <span v-if="copied" class="tool-status success"><Check :size="12" /> 已复制</span>
          </div>
        </div>
        <div class="tool-panel-body">
          <!-- 错误提示 -->
          <div v-if="error" class="tool-error">
            <div class="tool-error-header">
              <CircleX :size="14" /><span>XML 解析错误</span>
            </div>
            <p class="tool-error-msg">{{ error }}</p>
          </div>

          <!-- 代码视图 -->
          <div
            v-if="viewMode === 'code' && outputText && !error"
            :class="['tool-code-output', { wrap: wordWrap }]"
          >
            <div
              v-for="(line, index) in highlightedLines"
              :key="index"
              :data-line="index"
              :class="[
                'tool-code-line',
                { 'search-current': matchedLines.has(index) && matchLineList[matchIndex] === index },
                { 'search-match': matchedLines.has(index) && matchLineList[matchIndex] !== index }
              ]"
            >
              <span class="line-num">{{ index + 1 }}</span>
              <pre class="line-content"><code v-html="line || ' '"></code></pre>
            </div>
          </div>

          <!-- 树形视图 -->
          <div
            v-else-if="viewMode === 'tree' && treeViewHtml && !error"
            class="tree-viewer"
            v-html="treeViewHtml"
            @mousemove="handleTreeMousemove"
            @mouseleave="handleTreeMouseleave"
            @contextmenu.prevent="handleTreeContextmenu"
            @click="handleTreeClick"
          ></div>

          <!-- 树形视图节点信息栏 -->
          <div v-if="viewMode === 'tree' && nodeInfo" class="tool-node-info">
            <span class="node-path">{{ nodeInfo.path }}</span>
            <span v-if="nodeInfo.value" class="node-value">{{ nodeInfo.value }}</span>
          </div>

          <!-- 空状态 -->
          <div v-if="!outputText && !error" class="tool-empty">
            <div class="empty-icon"><FileText :size="22" /></div>
            <p class="empty-title">准备就绪</p>
            <p class="empty-desc">在左侧输入 XML 数据开始格式化</p>
          </div>
        </div>
      </section>

      <!-- 右键菜单 -->
      <div
        v-if="contextMenu.visible"
        class="tool-context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        @click.stop
      >
        <button @click="copyFromMenu('value')">
          <Copy :size="12" /> 复制值
        </button>
        <button @click="copyFromMenu('path')">
          <Copy :size="12" /> 复制路径
        </button>
        <button @click="copyFromMenu('node')">
          <Copy :size="12" /> 复制节点
        </button>
      </div>

      <!-- 历史记录面板 -->
      <ToolHistoryPanel
        v-if="showHistory"
        :history="history"
        title="格式化历史"
        :display-fields="[{ key: 'inputPreview', label: '内容' }]"
        @use="handleHistoryUse"
        @delete="deleteItem"
        @clear="handleClearHistory"
        @close="showHistory = false"
      />
    </main>
  </div>
</template>

<style scoped>
/* XML 语法高亮色 */
.tool-page {
  --xml-tag-color: #0550ae;
  --xml-attr-color: #b35900;
  --xml-string-color: #0a6640;
  --xml-comment-color: #6a737d;
  --xml-pi-color: #8250df;
  --search-match-bg: rgba(255, 213, 0, 0.15);
  --search-current-bg: rgba(255, 160, 0, 0.35);
}

html.dark .tool-page {
  --xml-tag-color: #79c0ff;
  --xml-attr-color: #f0883e;
  --xml-string-color: #7ee787;
  --xml-comment-color: #8b949e;
  --xml-pi-color: #d2a8ff;
  --search-match-bg: rgba(255, 213, 0, 0.1);
  --search-current-bg: rgba(255, 160, 0, 0.25);
}

/* ====== Header ====== */
.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 4px;
}

.header-stats {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-text {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  line-height: 1;
  color: var(--accent);
  background: var(--accent-light);
  font-family: var(--font-mono);
}

/* Tooltip */
.toolbar-tooltip {
  position: fixed;
  z-index: 9999;
  padding: 5px 12px;
  font-size: 12px;
  color: var(--text-inverse, #fff);
  background: var(--bg-tooltip, rgba(0, 0, 0, 0.85));
  border-radius: var(--radius-sm, 4px);
  white-space: nowrap;
  pointer-events: none;
  transform: translateX(-50%);
  min-width: 60px;
  text-align: center;
}

/* ====== Toolbar overrides ====== */
:deep(.tool-toolbar) {
  flex-wrap: nowrap !important;
  overflow-x: auto;
  overflow-y: hidden;
  gap: 4px !important;
  padding: 6px 10px !important;
  scrollbar-width: none;
}

:deep(.tool-toolbar)::-webkit-scrollbar { display: none; }

:deep(.tool-toolbar-left),
:deep(.tool-toolbar-right) {
  flex-shrink: 0 !important;
  flex-wrap: nowrap !important;
  gap: 3px !important;
  align-items: center !important;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 1px;
  flex-shrink: 0;
}

.toolbar-group :deep(.glass-icon-btn) {
  min-width: 26px;
  height: 24px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.toolbar-group.options-group {
  gap: 8px;
}

.tool-segment :deep(.tool-segment-btn) {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.format-btn {
  background: var(--accent) !important;
  color: white !important;
  border-color: var(--accent) !important;
  padding: 0 12px !important;
  gap: 6px !important;
  width: auto !important;
  min-width: auto !important;
}

.format-btn:hover { opacity: 0.9; }

/* ====== XPath bar ====== */
.xpath-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: 0 6px;
  height: 24px;
  flex-shrink: 0;
}

.xpath-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--accent);
  white-space: nowrap;
  flex-shrink: 0;
}

.xpath-input {
  width: 100px;
  border: none;
  background: none;
  font-size: 11px;
  color: var(--text-primary);
  outline: none;
  font-family: var(--font-mono);
}

.xpath-input::placeholder { color: var(--text-muted); }

.xpath-count {
  font-size: 10px;
  color: var(--accent);
  font-weight: 500;
  white-space: nowrap;
}

/* ====== Options ====== */
.opt-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  height: 26px;
  padding: 0 4px;
}

.opt-label input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  margin: 0;
  border: 1px solid var(--border-default);
  border-radius: 3px;
  background: var(--bg-input);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  flex-shrink: 0;
}

.opt-label input[type="checkbox"]:hover {
  border-color: var(--border-strong);
}

.opt-label input[type="checkbox"]:checked {
  background: var(--accent);
  border-color: var(--accent);
}

.opt-label input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 3.5px;
  top: 0.5px;
  width: 4px;
  height: 8px;
  border: solid #fff;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}

/* ====== Search bar ====== */
.search-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: 0 6px;
  height: 24px;
}

.search-input {
  width: 80px;
  border: none;
  background: none;
  font-size: 11px;
  color: var(--text-primary);
  outline: none;
}

.search-input::placeholder { color: var(--text-muted); }

.search-count {
  font-size: 10px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  white-space: nowrap;
}

.search-nav {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
}

.search-nav:hover:not(:disabled) { background: var(--bg-hover); color: var(--text-primary); }
.search-nav:disabled { opacity: 0.4; cursor: not-allowed; }

/* Search highlight */
.tool-code-line.search-match { background: var(--search-match-bg); }
.tool-code-line.search-current { background: var(--search-current-bg); }

/* ====== Syntax highlighting ====== */
:deep(.hljs-tag) {
  color: var(--xml-tag-color);
  font-weight: 600;
}

:deep(.hljs-name) {
  color: var(--xml-tag-color);
}

:deep(.hljs-attr) {
  color: var(--xml-attr-color);
}

:deep(.hljs-string) {
  color: var(--xml-string-color);
}

:deep(.hljs-comment) {
  color: var(--xml-comment-color);
  font-style: italic;
}

:deep(.hljs-meta) {
  color: var(--xml-pi-color);
}

/* ====== Tree view ====== */
.tree-viewer {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 14px 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.8;
}

.tree-viewer :deep(summary) {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  list-style: none;
  padding: 1px 4px;
  border-radius: 3px;
}

.tree-viewer :deep(summary::-webkit-details-marker) { display: none; }
.tree-viewer :deep(summary::marker) { content: ''; }
.tree-viewer :deep(summary:hover) { background: var(--bg-hover); }

.tree-viewer :deep(.tv-toggle) {
  font-size: 10px;
  color: var(--text-muted);
  width: 14px;
  text-align: center;
  display: inline-block;
}

.tree-viewer :deep(details[open] > summary .tv-toggle)::before { content: '▾'; }
.tree-viewer :deep(details:not([open]) > summary .tv-toggle)::before { content: '▸'; }

.tree-viewer :deep(.tv-children) {
  padding-left: 20px;
  border-left: 1px solid var(--border-subtle);
  margin-left: 7px;
}

.tree-viewer :deep(.tv-item) {
  padding-left: 4px;
}

.tree-viewer :deep(.tv-tag) { color: var(--xml-tag-color); font-weight: 500; }
.tree-viewer :deep(.tv-attr-name) { color: var(--xml-attr-color); }
.tree-viewer :deep(.tv-attr-value) { color: var(--xml-string-color); }
.tree-viewer :deep(.tv-text) { color: var(--text-primary); }
.tree-viewer :deep(.tv-pi) { color: var(--xml-pi-color); }
.tree-viewer :deep(.tv-comment) { color: var(--xml-comment-color); font-style: italic; }
.tree-viewer :deep(.tv-bracket) { color: var(--text-muted); }
.tree-viewer :deep(.tv-count) { font-size: 10px; color: var(--text-muted); margin-left: 4px; }
.tree-viewer :deep(.tv-collapsed) { font-size: 11px; color: var(--text-muted); }
.tree-viewer :deep(.tv-close) { display: block; }

.tree-viewer :deep(details[open] > summary .tv-collapsed) { display: none; }
.tree-viewer :deep(details:not([open]) > summary .tv-count) { display: none; }

/* Tree search highlight */
.tree-viewer :deep(.tree-search-highlight) {
  background: var(--search-current-bg);
  border-radius: 3px;
  outline: 1px solid var(--accent);
}
</style>
