<script setup lang="ts">
import {
  Check, Copy, Trash2, RotateCw,
  Hash as HashIcon, ClipboardPaste,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import { useTooltip } from '@/composables/useTooltip'
import { useHash, hashTypes } from './useHash'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
  selectedHashes,
  inputText,
  hashResults,
  copiedHash,
  uppercase,
  resultCount,
  calculateAllHashes,
  toggleHashType,
  copyHash,
  clear,
  paste,
  getDisplayHash,
} = useHash()
</script>

<template>
  <div class="tool-page">
    <!-- 标题栏 -->
    <ToolTitleBar title="Hash 生成" icon="icon-hash">
      <div class="header-content">
        <span class="algo-tag">{{ selectedHashes.length }} 种算法</span>
        <span v-if="resultCount" class="result-tag">{{ resultCount }} 个结果</span>
      </div>
    </ToolTitleBar>

    <!-- 工具栏 -->
    <div class="tool-toolbar">
      <div class="tool-toolbar-left">
        <div class="tool-segment">
          <button
            v-for="hash in hashTypes"
            :key="hash.id"
            class="tool-segment-btn"
            :class="{ active: selectedHashes.includes(hash.id) }"
            @click="toggleHashType(hash.id)"
            @mouseenter="showTooltip(hash.name, $event)" @mouseleave="hideTooltip"
          >
            {{ hash.name }}
          </button>
        </div>

        <div class="tool-divider"></div>

        <button class="glass-icon-btn" @click="paste" @mouseenter="showTooltip('粘贴', $event)" @mouseleave="hideTooltip">
          <ClipboardPaste :size="15" />
        </button>
        <button class="glass-icon-btn danger" @click="clear" :disabled="!inputText" @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
          <Trash2 :size="15" />
        </button>

        <div class="tool-divider"></div>

        <span class="toolbar-hint">点击算法名切换显示，输入文本自动计算哈希值</span>
      </div>

      <div class="tool-toolbar-right">
        <label class="hash-toggle" :class="{ active: uppercase }" @click="uppercase = !uppercase" @mouseenter="showTooltip('大写', $event)" @mouseleave="hideTooltip">
          <span class="toggle-label">Aa</span>
        </label>
        <label class="hash-toggle" @click="calculateAllHashes" @mouseenter="showTooltip('重新计算', $event)" @mouseleave="hideTooltip">
          <RotateCw :size="13" />
        </label>
        <span v-if="inputText" class="tool-stat">{{ inputText.length }} 字符</span>
      </div>
    </div>

    <!-- 主内容 -->
    <main class="tool-main split">
      <!-- 左：输入面板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><HashIcon :size="12" /></span>
            <span>输入</span>
          </div>
          <div class="tool-panel-actions">
            <button class="glass-icon-btn small" @click="paste" @mouseenter="showTooltip('粘贴', $event)" @mouseleave="hideTooltip">
              <ClipboardPaste :size="13" />
            </button>
            <button class="glass-icon-btn small" @click="inputText = ''" :disabled="!inputText" @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body" style="padding:0">
          <textarea
            v-model="inputText"
            class="hash-textarea"
            placeholder="输入需要计算哈希的文本..."
            spellcheck="false"
          ></textarea>
        </div>
      </section>

      <!-- 右：结果面板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Check :size="12" /></span>
            <span>哈希结果</span>
          </div>
        </div>
        <div class="tool-panel-body" style="overflow: auto">
          <div v-if="resultCount" class="hash-results">
            <div
              v-for="hashId in selectedHashes"
              :key="hashId"
              v-show="hashResults[hashId]"
              class="hash-card"
            >
              <div class="hash-card-head">
                <span class="hash-name">{{ hashTypes.find(h => h.id === hashId)?.name }}</span>
                <button
                  class="glass-icon-btn small"
                  :class="{ 'copied-btn': copiedHash === hashId }"
                  @click="copyHash(hashId)"
                  @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip"
                >
                  <Copy v-if="copiedHash !== hashId" :size="13" />
                  <Check v-else :size="13" />
                </button>
              </div>
              <code class="hash-value">{{ getDisplayHash(hashResults[hashId]) }}</code>
            </div>
          </div>

          <div v-else class="tool-empty">
            <div class="empty-icon"><HashIcon :size="24" /></div>
            <p class="empty-title">等待输入</p>
            <p class="empty-desc">输入文本后自动计算哈希值</p>
          </div>
        </div>
      </section>
    </main>

    <!-- Tooltip -->
    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">{{ tooltip.text }}</div>
  </div>
</template>

<style scoped>
.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 4px;
}

.algo-tag {
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-light);
}

.result-tag {
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-weight: 500;
  color: var(--success);
  background: var(--success-light);
}

/* ====== 大小写/刷新切换 ====== */
.hash-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid var(--border-subtle);
  transition: all 0.15s;
}

.hash-toggle:hover { background: var(--bg-hover); color: var(--text-primary); }
.hash-toggle.active { color: var(--accent); border-color: var(--accent); background: var(--accent-light); }

.toggle-label {
  font-family: var(--font-mono);
  font-size: 11px;
}

.toolbar-hint {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}

/* ====== 统计 ====== */
.tool-stat {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  padding: 2px 8px;
  background: var(--bg-secondary);
  border-radius: var(--radius-xs);
}

/* ====== 输入区 ====== */
.hash-textarea {
  width: 100%;
  height: 100%;
  padding: 14px 16px;
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

.hash-textarea::placeholder { color: var(--text-muted); }

/* ====== 结果卡片 ====== */
.hash-results {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
}

.hash-card {
  padding: 12px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: border-color 0.15s;
}

.hash-card:hover { border-color: var(--border-default); }

.hash-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.hash-name {
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.hash-value {
  display: block;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
  word-break: break-all;
  line-height: 1.6;
  user-select: all;
}

.copied-btn {
  color: var(--success) !important;
  border-color: var(--success) !important;
  background: var(--success-light) !important;
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
}
</style>
