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
          <span class="stat-tag">{{ xmlStats.elementCount }} 元素</span>
          <span class="stat-tag">{{ xmlStats.attrCount }} 属性</span>
          <span class="stat-tag">{{ xmlStats.depth }} 层</span>
          <span class="stat-tag">{{ xmlStats.size }}</span>
        </div>
        <button class="glass-icon-btn small" :class="{ active: showHistory }" @click="showHistory = !showHistory"
          @mouseenter="showTooltip('历史记录', $event)" @mouseleave="hideTooltip">
          <History :size="14" />
        </button>
      </div>
    </ToolTitleBar>

    <!-- Tooltip -->
    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      {{ tooltip.text }}
    </div>

    <!-- 隐藏的文件输入 -->
    <input ref="fileInputRef" type="file" accept=".xml,.xsl,.xslt,.xsd,.svg,.html,.xhtml,.wsdl,.txt,.config" style="display: none" @change="handleFileSelect" />

    <!-- 主内容 -->
    <main class="tool-main split">
      <!-- 左侧：配置 + 输入 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Code :size="14" /></span>
            <span>输入</span>
          </div>
          <div class="panel-actions">
            <span :class="['status-badge', isValid ? 'success' : 'error']" v-if="inputText">
              <Check :size="10" v-if="isValid" /><CircleX :size="10" v-else />
              {{ isValid ? '有效' : '无效' }}
            </span>
            <button class="action-btn" @click="importFile"
              @mouseenter="showTooltip('导入文件', $event)" @mouseleave="hideTooltip">
              <Upload :size="13" />
            </button>
            <button class="action-btn" @click="pasteFromClipboard"
              @mouseenter="showTooltip('粘贴', $event)" @mouseleave="hideTooltip">
              <ClipboardPaste :size="13" />
            </button>
            <button class="action-btn" @click="clearAll" :disabled="!inputText"
              @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>

        <div class="tool-panel-body">
          <!-- 操作按钮 -->
          <div class="config-section">
            <label class="config-label">操作</label>
            <div class="action-group">
              <button class="execute-btn-sm" @click="formatXml">
                <RotateCcw :size="12" />
                <span>格式化</span>
              </button>
              <button class="seg-btn small" @click="minifyXml"
                @mouseenter="showTooltip('压缩', $event)" @mouseleave="hideTooltip">
                <Compress :size="11" />
              </button>
              <button class="seg-btn small" @click="validateXml"
                @mouseenter="showTooltip('校验', $event)" @mouseleave="hideTooltip">
                <Check :size="11" />
              </button>
              <button class="seg-btn small" @click="xmlToJson"
                @mouseenter="showTooltip('XML → JSON', $event)" @mouseleave="hideTooltip">
                <ArrowLeftRight :size="11" />
              </button>
              <button class="seg-btn small" @click="jsonToXml"
                @mouseenter="showTooltip('JSON → XML', $event)" @mouseleave="hideTooltip">
                <ArrowLeftRight :size="11" style="transform: scaleX(-1)" />
              </button>
            </div>
          </div>

          <!-- 选项 -->
          <div class="config-section">
            <label class="config-label">选项</label>
            <div class="options-row">
              <div class="indent-group">
                <Select v-model="indentSize" size="sm" :options="[
                  { label: '2空格', value: 2 },
                  { label: '4空格', value: 4 },
                  { label: 'Tab', value: 1 },
                ]" />
              </div>
              <div class="toggle-group">
                <label class="toggle-label" @click="wordWrap = !wordWrap">
                  <span :class="['toggle-check', { on: wordWrap }]">
                    <Check v-if="wordWrap" :size="8" />
                  </span>
                  <span>换行</span>
                </label>
              </div>
            </div>
          </div>

          <!-- XPath -->
          <div class="config-section">
            <label class="config-label">XPath 查询</label>
            <div class="xpath-bar">
              <input v-model="xpathQuery" class="xpath-input" placeholder="//element[@attr]" spellcheck="false"
                @keydown.enter.prevent="executeXpath" />
              <button class="xpath-run-btn" @click="executeXpath" :disabled="!xpathQuery.trim()">
                <Play :size="11" />
              </button>
              <span v-if="xpathResultCount >= 0" class="xpath-count">{{ xpathResultCount }} 条</span>
            </div>
          </div>

          <!-- 视图模式 -->
          <div class="config-section">
            <div class="config-row">
              <label class="config-label">视图</label>
              <div class="view-toggle">
                <button :class="['seg-btn xs', { active: viewMode === 'code' }]" @click="viewMode = 'code'">
                  <Code :size="11" /> 代码
                </button>
                <button :class="['seg-btn xs', { active: viewMode === 'tree' }]" @click="viewMode = 'tree'">
                  <Eye :size="11" /> 树形
                </button>
              </div>
            </div>
          </div>

          <!-- 输入文本 -->
          <div class="config-section grow" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
            <textarea
              v-model="inputText"
              class="config-textarea"
              :class="{ 'jf-wrap': wordWrap }"
              placeholder="在此粘贴 XML 数据或拖拽文件导入..."
              spellcheck="false"
              @input="handleInput"
            />
            <div v-if="isDragging" class="drag-overlay">
              <Upload :size="20" />
              <span>释放以导入文件</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧：输出 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Check :size="14" /></span>
            <span>输出</span>
          </div>
          <div class="panel-actions">
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
            <div class="panel-divider"></div>
            <button class="action-btn" @click="copyOutput" :disabled="!outputText"
              @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip">
              <Check v-if="copied" :size="13" /><Copy v-else :size="13" />
            </button>
            <button class="action-btn" @click="downloadXml" :disabled="!outputText"
              @mouseenter="showTooltip('下载', $event)" @mouseleave="hideTooltip">
              <Download :size="13" />
            </button>
          </div>
        </div>

        <div class="tool-panel-body">
          <!-- 错误提示 -->
          <div v-if="error" class="output-error">
            <div class="output-error-head"><CircleX :size="14" /> <span>XML 解析错误</span></div>
            <p class="output-error-msg">{{ error }}</p>
          </div>

          <!-- 代码视图 -->
          <div v-if="viewMode === 'code' && outputText && !error" :class="['tool-code-output', { wrap: wordWrap }]">
            <div v-for="(line, index) in highlightedLines" :key="index" :data-line="index"
              :class="['tool-code-line', { 'search-current': matchedLines.has(index) && matchLineList[matchIndex] === index }, { 'search-match': matchedLines.has(index) && matchLineList[matchIndex] !== index }]">
              <span class="line-num">{{ index + 1 }}</span>
              <pre class="line-content"><code v-html="line || ' '"></code></pre>
            </div>
          </div>

          <!-- 树形视图 -->
          <div v-else-if="viewMode === 'tree' && treeViewHtml && !error" class="tree-viewer"
            v-html="treeViewHtml" @mousemove="handleTreeMousemove" @mouseleave="handleTreeMouseleave"
            @contextmenu.prevent="handleTreeContextmenu" @click="handleTreeClick" />

          <!-- 节点信息栏 -->
          <div v-if="viewMode === 'tree' && nodeInfo" class="node-info-bar">
            <span class="node-path">{{ nodeInfo.path }}</span>
            <span v-if="nodeInfo.value" class="node-value">{{ nodeInfo.value }}</span>
          </div>

          <!-- 空状态 -->
          <div v-if="!outputText && !error" class="tool-empty">
            <div class="empty-icon"><FileText :size="36" /></div>
            <p class="empty-title">准备就绪</p>
            <p class="empty-desc">在左侧输入 XML 数据开始格式化</p>
          </div>
        </div>
      </section>

      <!-- 右键菜单 -->
      <div v-if="contextMenu.visible" class="tool-context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }" @click.stop>
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
      <ToolHistoryPanel v-if="showHistory" :history="history" title="格式化历史"
        :display-fields="[{ key: 'inputPreview', label: '内容' }]"
        @use="handleHistoryUse" @delete="deleteItem" @clear="handleClearHistory" @close="showHistory = false" />
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

.stat-tag {
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

/* ====== Panel Actions ====== */
.panel-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.panel-divider {
  width: 1px;
  height: 16px;
  background: var(--border-subtle);
  margin: 0 4px;
}

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
}

.action-btn:hover { color: var(--text-primary); background: var(--bg-hover); }
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  margin-right: 4px;
}

.status-badge.success { color: var(--accent); background: var(--accent-light); }
.status-badge.error { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

/* ====== Config Sections ====== */
.tool-panel-body {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
}

.config-section {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.config-section.grow {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-bottom: none;
  position: relative;
}

.config-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-row .config-label { margin-bottom: 0; }

/* ====== Action Group ====== */
.action-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.execute-btn-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 14px;
  border: none;
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.execute-btn-sm:hover { filter: brightness(1.1); }

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

.seg-btn.small { padding: 4px 10px; font-size: 12px; }
.seg-btn.xs { padding: 3px 8px; font-size: 11px; height: 24px; }

/* ====== Options Row ====== */
.options-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.indent-group {
  display: flex;
  gap: 3px;
}

.toggle-group {
  display: flex;
  gap: 10px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary);
  cursor: pointer;
}

.toggle-check {
  width: 14px;
  height: 14px;
  border: 1px solid var(--border-default);
  border-radius: 3px;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.toggle-check.on {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

/* ====== View Toggle ====== */
.view-toggle {
  display: flex;
  gap: 2px;
}

/* ====== XPath Bar ====== */
.xpath-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 0 8px;
  height: 28px;
}

.xpath-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  outline: none;
}

.xpath-input::placeholder { color: var(--text-muted); }

.xpath-run-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.xpath-run-btn:hover { filter: brightness(1.1); }
.xpath-run-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.xpath-count {
  font-size: 10px;
  color: var(--accent);
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ====== Config Textarea ====== */
.config-textarea {
  flex: 1;
  width: 100%;
  min-height: 100px;
  padding: 8px 10px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  outline: none;
  resize: none;
  line-height: 1.6;
  transition: all var(--transition-fast);
}

.config-textarea:hover { border-color: var(--border-strong); }
.config-textarea:focus { border-color: var(--accent); box-shadow: var(--shadow-focus); }
.config-textarea::placeholder { color: var(--text-muted); }
.config-textarea.jf-wrap { white-space: pre-wrap; word-break: break-all; }

/* ====== Drag Overlay ====== */
.drag-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--accent-light);
  border: 2px dashed var(--accent);
  border-radius: 6px;
  color: var(--accent);
  font-size: 13px;
  font-weight: 500;
  z-index: 10;
}

/* ====== Output: Code View ====== */
.tool-code-output {
  overflow: auto;
  padding: 8px 0;
  font-family: 'JetBrains Mono', 'Fira Code', var(--font-mono), monospace;
  font-size: 13px;
  line-height: 1.7;
}

.tool-code-output.wrap .line-content {
  white-space: pre-wrap;
  word-break: break-all;
}

.tool-code-line {
  display: flex;
  align-items: flex-start;
  padding: 0 16px;
}

.tool-code-line.search-match { background: var(--search-match-bg); }
.tool-code-line.search-current { background: var(--search-current-bg); }

.line-num {
  width: 40px;
  padding-right: 12px;
  text-align: right;
  font-size: 11px;
  font-family: inherit;
  color: var(--text-muted);
  line-height: 1.7;
  user-select: none;
  opacity: 0.5;
  flex-shrink: 0;
}

.line-content {
  flex: 1;
  margin: 0;
  padding: 0;
  font-size: 13px;
  font-family: inherit;
  line-height: 1.7;
  white-space: pre;
  color: var(--text-primary);
}

.line-content code {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  background: transparent;
}

/* ====== Search Bar ====== */
.search-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 0 6px;
  height: 24px;
  margin-right: 4px;
}

.search-input {
  width: 80px;
  border: none;
  background: none;
  font-size: 11px;
  font-family: var(--font-mono);
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
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
}

.search-nav:hover:not(:disabled) { background: var(--bg-hover); color: var(--text-primary); }
.search-nav:disabled { opacity: 0.4; cursor: not-allowed; }

/* ====== Output Error ====== */
.output-error {
  padding: 12px 14px;
}

.output-error-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #ef4444;
  margin-bottom: 4px;
}

.output-error-msg {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  font-family: var(--font-mono);
}

/* ====== Syntax Highlighting ====== */
:deep(.hljs-tag) { color: var(--xml-tag-color); font-weight: 600; }
:deep(.hljs-name) { color: var(--xml-tag-color); }
:deep(.hljs-attr) { color: var(--xml-attr-color); }
:deep(.hljs-string) { color: var(--xml-string-color); }
:deep(.hljs-comment) { color: var(--xml-comment-color); font-style: italic; }
:deep(.hljs-meta) { color: var(--xml-pi-color); }

/* ====== Tree View ====== */
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

.tree-viewer :deep(.tv-item) { padding-left: 4px; }
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

.tree-viewer :deep(.tree-search-highlight) {
  background: var(--search-current-bg);
  border-radius: 3px;
  outline: 1px solid var(--accent);
}

/* Node info bar */
.node-info-bar {
  padding: 6px 14px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.node-path { color: var(--text-muted); }
.node-value { color: var(--text-secondary); word-break: break-all; }

/* ====== Context Menu ====== */
.tool-context-menu {
  position: fixed;
  z-index: 9999;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 4px;
  min-width: 140px;
}

.tool-context-menu button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background var(--transition-fast);
}

.tool-context-menu button:hover { background: var(--bg-hover); }

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
  color: var(--text-inverse, #fff);
  background: var(--bg-tooltip, rgba(0, 0, 0, 0.85));
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  transform: translateX(-50%);
  line-height: 1.4;
}

/* ====== Scrollbar ====== */
.tool-panel-body::-webkit-scrollbar { width: 5px; }
.tool-panel-body::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.tool-panel-body::-webkit-scrollbar-track { background: transparent; }

.tool-code-output::-webkit-scrollbar { width: 5px; height: 5px; }
.tool-code-output::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.tool-code-output::-webkit-scrollbar-track { background: transparent; }

.tree-viewer::-webkit-scrollbar { width: 5px; }
.tree-viewer::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.tree-viewer::-webkit-scrollbar-track { background: transparent; }

/* ====== Responsive ====== */
@media (max-width: 760px) {
  .tool-main { grid-template-columns: 1fr !important; }
}
</style>
