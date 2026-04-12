<script setup lang="ts">
import {
  Check,
  Copy,
  Trash2,
  FileText,
  RefreshCw,
  ArrowLeftRight,
  Upload,
  ChevronUp,
  ChevronDown,
  Download,
  FileCode,
  FileInput,
  Columns2,
  AlignJustify,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import { useTooltip } from '@/composables/useTooltip'
import { useDiffText } from './useDiffText'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
  leftText, rightText, leftFileName, rightFileName,
  ignoreWhitespace, inlineHighlight, viewMode, stats,
  activeChangeIndex, changeBlocks,
  hasDiff, leftEditorRows, rightEditorRows, diffRows, summaryText,
  handleLeftScroll, handleRightScroll, handleUnifiedScroll,
  navigateToChange, isRowInActiveChange,
  importLeftFile, importRightFile, compareFiles,
  exportAsHTML, exportAsPatch,
  useExample, clearAll, swapTexts, copyText,
} = useDiffText()
</script>

<template>
  <div class="tool-page">
    <!-- 标题栏 -->
    <ToolTitleBar title="文本对比" icon="icon-diff">
      <div class="header-content">
        <span class="diff-summary" :class="{ changed: hasDiff, same: !hasDiff && (leftText || rightText) }">
          <Check v-if="!hasDiff && (leftText || rightText)" :size="12" />
          <RefreshCw v-else-if="hasDiff" :size="12" />
          {{ summaryText }}
        </span>
      </div>
    </ToolTitleBar>

    <!-- 工具栏 -->
    <div class="tool-toolbar">
      <div class="tool-toolbar-left">
        <!-- 视图切换 -->
        <div class="tool-segment">
          <button
            class="tool-segment-btn"
            :class="{ active: viewMode === 'split' }"
            @click="viewMode = 'split'"
            @mouseenter="showTooltip('并排视图', $event)"
            @mouseleave="hideTooltip"
          >
            <Columns2 :size="14" />
            <span>并排</span>
          </button>
          <button
            class="tool-segment-btn"
            :class="{ active: viewMode === 'unified' }"
            @click="viewMode = 'unified'"
            @mouseenter="showTooltip('统一视图', $event)"
            @mouseleave="hideTooltip"
          >
            <AlignJustify :size="14" />
            <span>统一</span>
          </button>
        </div>

        <div class="tool-divider"></div>

        <!-- 文件操作 -->
        <button class="glass-icon-btn" @click="compareFiles" @mouseenter="showTooltip('对比文件', $event)" @mouseleave="hideTooltip"><FileInput :size="15" /></button>
        <button class="glass-icon-btn" @click="importLeftFile" @mouseenter="showTooltip('导入左侧文件', $event)" @mouseleave="hideTooltip"><Upload :size="15" /></button>
        <button class="glass-icon-btn" @click="importRightFile" @mouseenter="showTooltip('导入右侧文件', $event)" @mouseleave="hideTooltip"><Upload :size="15" /></button>

        <div class="tool-divider"></div>

        <!-- 导出 -->
        <button class="glass-icon-btn" @click="exportAsHTML" :disabled="!hasDiff" @mouseenter="showTooltip('导出 HTML', $event)" @mouseleave="hideTooltip"><Download :size="15" /></button>
        <button class="glass-icon-btn" @click="exportAsPatch" :disabled="!hasDiff" @mouseenter="showTooltip('导出 Patch', $event)" @mouseleave="hideTooltip"><FileCode :size="15" /></button>

        <div class="tool-divider"></div>

        <!-- Diff 导航 -->
        <template v-if="changeBlocks.length > 0">
          <button class="glass-icon-btn" @click="navigateToChange('prev')" @mouseenter="showTooltip('上一个差异', $event)" @mouseleave="hideTooltip"><ChevronUp :size="15" /></button>
          <button class="glass-icon-btn" @click="navigateToChange('next')" @mouseenter="showTooltip('下一个差异', $event)" @mouseleave="hideTooltip"><ChevronDown :size="15" /></button>
          <span class="nav-indicator" v-if="changeBlocks.length > 0">{{ activeChangeIndex + 1 }}/{{ changeBlocks.length }}</span>
        </template>

        <div class="tool-divider" v-if="changeBlocks.length > 0"></div>

        <!-- 选项 -->
        <button class="glass-icon-btn" @click="useExample" @mouseenter="showTooltip('示例文本', $event)" @mouseleave="hideTooltip"><FileText :size="15" /></button>
        <button class="glass-icon-btn" @click="swapTexts" @mouseenter="showTooltip('左右互换', $event)" @mouseleave="hideTooltip"><ArrowLeftRight :size="15" /></button>
        <div class="tool-divider"></div>
        <label class="diff-option">
          <input v-model="ignoreWhitespace" type="checkbox" />
          <span>忽略空白</span>
        </label>
        <label class="diff-option">
          <input v-model="inlineHighlight" type="checkbox" />
          <span>行内高亮</span>
        </label>
        <div class="tool-divider"></div>
        <button class="glass-icon-btn danger" @click="clearAll" :disabled="!leftText && !rightText" @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip"><Trash2 :size="15" /></button>
      </div>
      <div class="tool-toolbar-right">
        <span v-if="hasDiff" class="diff-stats">
          <span class="diff-stat add">+{{ stats.added }}</span>
          <span class="diff-stat del">-{{ stats.removed }}</span>
          <span class="diff-stat mod">~{{ stats.changed }}</span>
        </span>
      </div>
    </div>

    <!-- 主内容 -->
    <!-- ====== Split View ====== -->
    <main v-if="viewMode === 'split'" class="tool-main split">
      <!-- 左侧面板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue">L</span>
            <span>{{ leftFileName }}</span>
          </div>
          <div class="tool-panel-actions">
            <span v-if="leftText" class="diff-meta">{{ leftText.length }} 字符</span>
            <button class="glass-icon-btn small" @click="importLeftFile" @mouseenter="showTooltip('导入文件', $event)" @mouseleave="hideTooltip"><Upload :size="13" /></button>
            <button class="glass-icon-btn small" @click="copyText(leftText, '左侧文本')" :disabled="!leftText" @mouseenter="showTooltip('复制左侧文本', $event)" @mouseleave="hideTooltip"><Copy :size="13" /></button>
          </div>
        </div>
        <div class="tool-panel-body diff-editor-body">
          <div class="diff-editor-shell">
            <div ref="leftGutter" class="diff-gutter">
              <div v-for="row in leftEditorRows" :key="`l-${row.number}`" class="diff-gutter-line">{{ row.number }}</div>
            </div>
            <div class="diff-stage">
              <div ref="leftHighlight" class="diff-highlight" aria-hidden="true">
                <div class="diff-highlight-content">
                  <div v-for="row in leftEditorRows" :key="`lh-${row.number}`" class="diff-line" :class="[`cell-${row.type}`]">
                    <pre class="diff-line-text"><template v-for="(piece, pi) in row.pieces" :key="pi"><span :class="[`piece-${piece.type}`]">{{ piece.value || ' ' }}</span></template></pre>
                  </div>
                </div>
              </div>
              <textarea ref="leftTextarea" v-model="leftText" class="diff-input overlay" placeholder="输入原始文本，或点击工具栏导入文件..." spellcheck="false" @scroll="handleLeftScroll"></textarea>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧面板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green">R</span>
            <span>{{ rightFileName }}</span>
          </div>
          <div class="tool-panel-actions">
            <span v-if="rightText" class="diff-meta">{{ rightText.length }} 字符</span>
            <button class="glass-icon-btn small" @click="importRightFile" @mouseenter="showTooltip('导入文件', $event)" @mouseleave="hideTooltip"><Upload :size="13" /></button>
            <button class="glass-icon-btn small" @click="copyText(rightText, '右侧文本')" :disabled="!rightText" @mouseenter="showTooltip('复制右侧文本', $event)" @mouseleave="hideTooltip"><Copy :size="13" /></button>
          </div>
        </div>
        <div class="tool-panel-body diff-editor-body">
          <div class="diff-editor-shell">
            <div ref="rightGutter" class="diff-gutter">
              <div v-for="row in rightEditorRows" :key="`r-${row.number}`" class="diff-gutter-line">{{ row.number }}</div>
            </div>
            <div class="diff-stage">
              <div ref="rightHighlight" class="diff-highlight" aria-hidden="true">
                <div class="diff-highlight-content">
                  <div v-for="row in rightEditorRows" :key="`rh-${row.number}`" class="diff-line" :class="[`cell-${row.type}`]">
                    <pre class="diff-line-text"><template v-for="(piece, pi) in row.pieces" :key="pi"><span :class="[`piece-${piece.type}`]">{{ piece.value || ' ' }}</span></template></pre>
                  </div>
                </div>
              </div>
              <textarea ref="rightTextarea" v-model="rightText" class="diff-input overlay" placeholder="输入修改后的文本，或点击工具栏导入文件..." spellcheck="false" @scroll="handleRightScroll"></textarea>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- ====== Unified View ====== -->
    <main v-else class="tool-main single">
      <section class="tool-panel unified-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue" style="margin-right: -2px;">L</span>
            <span class="panel-icon green" style="margin-left: 0;">R</span>
            <span>{{ leftFileName }} ↔ {{ rightFileName }}</span>
          </div>
          <div class="tool-panel-actions">
            <button class="glass-icon-btn small" @click="copyText(leftText + '\n---\n' + rightText, '全部文本')" :disabled="!leftText && !rightText" @mouseenter="showTooltip('复制全部', $event)" @mouseleave="hideTooltip"><Copy :size="13" /></button>
          </div>
        </div>
        <div class="tool-panel-body diff-editor-body">
          <div class="diff-editor-shell unified-shell">
            <div ref="unifiedGutter" class="diff-gutter unified-gutter">
              <template v-for="(row, idx) in diffRows" :key="`ug-${idx}`">
                <div class="diff-gutter-line unified-gutter-line" :class="{ 'active-change': isRowInActiveChange(idx) }">
                  <span class="gutter-old">{{ row.leftNumber ?? '' }}</span>
                  <span class="gutter-new">{{ row.rightNumber ?? '' }}</span>
                </div>
              </template>
            </div>
            <div class="unified-stage" @scroll="handleUnifiedScroll" ref="unifiedHighlight">
              <template v-for="(row, idx) in diffRows" :key="`uh-${idx}`">
                <div class="diff-line" :class="[`cell-${row.unifiedType}`, { 'active-change': isRowInActiveChange(idx) }]">
                  <pre class="diff-line-text"><template v-for="(piece, pi) in row.unifiedPieces" :key="pi"><span :class="[`piece-${piece.type}`]">{{ piece.value || ' ' }}</span></template></pre>
                </div>
              </template>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Tooltip -->
    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      {{ tooltip.text }}
    </div>
  </div>
</template>

<style scoped>
/* ====== 标题栏 ====== */
.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 4px;
}

.diff-summary {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
}

.diff-summary.same {
  color: var(--success);
  background: var(--success-light);
  border-color: transparent;
}

.diff-summary.changed {
  color: var(--accent);
  background: var(--accent-light);
  border-color: transparent;
}

/* ====== 工具栏选项 ====== */
.diff-option {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: all 0.15s;
}

.diff-option:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.diff-option input[type="checkbox"] {
  width: 14px;
  height: 14px;
  accent-color: var(--accent);
  cursor: pointer;
}

/* 统计 */
.diff-stats {
  display: flex;
  align-items: center;
  gap: 6px;
}

.diff-stat {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
}

.diff-stat.add { color: var(--success); background: var(--success-light); }
.diff-stat.del { color: var(--error); background: var(--error-light); }
.diff-stat.mod { color: var(--accent); background: var(--accent-light); }

.diff-meta {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.nav-indicator {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  padding: 2px 6px;
  background: var(--bg-secondary);
  border-radius: var(--radius-xs);
  white-space: nowrap;
}

/* ====== 编辑器 ====== */
.diff-editor-body {
  padding: 0 !important;
  overflow: hidden !important;
  /* 关键：让子元素能用 height:100% 撑满 */
  display: flex;
  flex-direction: column;
}

.diff-editor-shell {
  --ed-fs: 13px;
  --ed-lh: 22px;
  --ed-py: 14px;
  --ed-px: 16px;
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
}

.unified-shell {
  grid-template-columns: 80px minmax(0, 1fr);
}

/* 行号栏 */
.diff-gutter {
  overflow: hidden;
  padding: var(--ed-py) 6px;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-subtle);
}

.diff-gutter-line {
  height: var(--ed-lh);
  text-align: right;
  font-size: 11px;
  line-height: var(--ed-lh);
  font-family: var(--font-mono);
  color: var(--text-muted);
  user-select: none;
  opacity: 0.6;
  transition: background 0.15s;
}

.diff-gutter-line.active-change {
  background: var(--accent-light);
  opacity: 1;
}

.unified-gutter-line {
  display: flex;
  gap: 2px;
  justify-content: flex-end;
}

.gutter-old, .gutter-new {
  min-width: 28px;
  text-align: right;
}

/* ====== Split 编辑器：textarea + highlight overlay ====== */
.diff-stage {
  position: relative;
  overflow: hidden;
}

.diff-highlight,
.diff-input.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.diff-highlight {
  overflow: hidden;
  pointer-events: none;
}

.diff-highlight-content {
  padding: var(--ed-py) 0;
}

.diff-input.overlay {
  z-index: 2;
  width: 100%;
  height: 100%;
  padding: var(--ed-py) var(--ed-px);
  font-family: var(--font-mono);
  font-size: var(--ed-fs);
  line-height: var(--ed-lh);
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: transparent;
  caret-color: var(--text-primary);
  white-space: pre;
  overflow: auto;
  tab-size: 2;
}

.diff-input.overlay::placeholder { color: var(--text-muted); }
.diff-input.overlay:focus { box-shadow: inset 0 0 0 1px var(--accent); }

/* ====== Unified 编辑器：直接滚动 ====== */
.unified-stage {
  overflow: auto;
  padding: var(--ed-py) 0;
}

/* ====== Diff 行样式 ====== */
.diff-line {
  min-height: var(--ed-lh);
  transition: background 0.15s;
}

.diff-line.active-change {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
  border-radius: 2px;
}

.diff-line-text {
  margin: 0;
  padding: 0 var(--ed-px);
  white-space: pre;
  overflow: hidden;
  font-size: var(--ed-fs);
  line-height: var(--ed-lh);
  color: var(--text-primary);
  font-family: var(--font-mono);
}

/* 差异高亮 */
.cell-add { background: var(--success-light); }
.cell-remove { background: var(--error-light); }

.piece-add {
  background: var(--success-light);
  color: var(--success);
  border-radius: 3px;
}

.piece-remove {
  background: var(--error-light);
  color: var(--error);
  border-radius: 3px;
}

/* ====== Tooltip ====== */
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

/* ====== 响应式 ====== */
@media (max-width: 760px) {
  .tool-main { grid-template-columns: 1fr !important; }
  .tool-toolbar-left { flex-wrap: wrap; }
}
</style>
