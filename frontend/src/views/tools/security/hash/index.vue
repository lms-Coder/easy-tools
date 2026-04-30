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

    <!-- 主内容 -->
    <main class="tool-main split">
      <!-- 左：配置 + 输入 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><HashIcon :size="14" /></span>
            <span>输入</span>
          </div>
          <div class="panel-actions">
            <button class="tool-icon-btn" @click="calculateAllHashes"
              @mouseenter="showTooltip('重新计算', $event)" @mouseleave="hideTooltip">
              <RotateCw :size="13" />
            </button>
            <button class="tool-icon-btn" @click="paste"
              @mouseenter="showTooltip('粘贴', $event)" @mouseleave="hideTooltip">
              <ClipboardPaste :size="13" />
            </button>
            <button class="tool-icon-btn" @click="clear" :disabled="!inputText"
              @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>

        <div class="tool-panel-body">
          <!-- 算法选择 -->
          <div class="config-section">
            <label class="config-label">选择算法</label>
            <div class="algo-chips">
              <button
                v-for="hash in hashTypes"
                :key="hash.id"
                class="algo-chip"
                :class="{ active: selectedHashes.includes(hash.id) }"
                @click="toggleHashType(hash.id)"
              >{{ hash.name }}</button>
            </div>
          </div>

          <!-- 选项 -->
          <div class="config-section">
            <div class="config-row">
              <label class="config-label">选项</label>
              <label class="toggle-label" @click="uppercase = !uppercase">
                <span :class="['toggle-check', { on: uppercase }]">
                  <Check v-if="uppercase" :size="8" />
                </span>
                <span>大写</span>
              </label>
            </div>
          </div>

          <!-- 输入文本 -->
          <div class="config-section grow">
            <label class="config-label">输入文本</label>
            <textarea
              v-model="inputText"
              class="config-textarea"
              placeholder="输入需要计算哈希的文本..."
              spellcheck="false"
            />
            <div v-if="inputText" class="text-stat">{{ inputText.length }} 字符</div>
          </div>
        </div>
      </section>

      <!-- 右：结果面板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Check :size="14" /></span>
            <span>哈希结果</span>
          </div>
        </div>
        <div class="tool-panel-body">
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
                  class="hash-copy-btn"
                  :class="{ copied: copiedHash === hashId }"
                  @click="copyHash(hashId)"
                  @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip"
                >
                  <Copy v-if="copiedHash !== hashId" :size="12" />
                  <Check v-else :size="12" />
                </button>
              </div>
              <code class="hash-value">{{ getDisplayHash(hashResults[hashId]) }}</code>
            </div>
          </div>

          <div v-else class="tool-empty">
            <div class="empty-icon"><HashIcon :size="28" /></div>
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
/* ====== Header ====== */
.algo-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-light);
}

.result-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--success);
  background: var(--success-light);
}

/* ====== Panel Actions ====== */
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ====== Config Sections ====== */
.algo-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.algo-chip {
  padding: 3px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  white-space: nowrap;
}

.algo-chip:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
.algo-chip.active { background: var(--accent); border-color: var(--accent); color: var(--text-inverse); }

/* ====== Toggle ====== */
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
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
  flex-shrink: 0;
}

.toggle-check.on {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}

.text-stat {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  margin-top: 4px;
}

/* ====== 结果卡片 ====== */
.hash-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
}

.hash-card {
  padding: 10px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  transition: border-color 0.15s;
  animation: hash-card-in 0.25s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes hash-card-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
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

.hash-copy-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.hash-copy-btn:hover { background: var(--bg-hover); color: var(--accent); }
.hash-copy-btn.copied { color: var(--success); background: var(--success-light); }

.hash-value {
  display: block;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-primary);
  word-break: break-all;
  line-height: 1.6;
  user-select: all;
}

</style>
