<script setup lang="ts">
import {
  Copy, Check, Trash2, RefreshCw, Fingerprint,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import { useTooltip } from '@/composables/useTooltip'
import { useUuid, uuidTypes, uuidFormats } from './useUuid'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
  version, format, count, results, copied,
  generate, copyAll, copySingle, clear,
} = useUuid()

const onGenerate = () => {
  generate()
}
</script>

<template>
  <div class="tool-page">
    <!-- 标题栏 -->
    <ToolTitleBar title="UUID 生成器" icon="icon-fingerprint">
      <div class="header-content">
        <span class="version-tag">{{ uuidTypes.find(t => t.value === version)?.label }}</span>
        <span v-if="results.length" class="result-tag">{{ results.length }} 个</span>
      </div>
    </ToolTitleBar>

    <!-- 主内容 -->
    <main class="tool-main split">
      <!-- 左侧：设置 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Fingerprint :size="14" /></span>
            <span>设置</span>
          </div>
          <div class="panel-actions">
            <button class="tool-icon-btn" @click="clear" :disabled="!results.length"
              @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body">
          <!-- UUID 类型 -->
          <div class="config-section">
            <label class="config-label">UUID 类型</label>
            <div class="type-list">
              <button
                v-for="t in uuidTypes" :key="t.value"
                class="type-card" :class="{ active: version === t.value }"
                @click="version = t.value"
              >
                <span class="type-name">{{ t.label }}</span>
                <span class="type-desc">{{ t.desc }}</span>
              </button>
            </div>
          </div>

          <!-- 输出格式 -->
          <div class="config-section">
            <label class="config-label">输出格式</label>
            <div class="format-chips">
              <button
                v-for="f in uuidFormats" :key="f.value"
                class="format-chip" :class="{ active: format === f.value }"
                @click="format = f.value"
              >{{ f.label }}</button>
            </div>
          </div>

          <!-- 批量数量 -->
          <div class="config-section">
            <div class="config-row">
              <label class="config-label">数量 <code class="val-code">{{ count }}</code></label>
            </div>
            <input type="range" v-model.number="count" min="1" max="100" class="qr-range" />
          </div>

          <!-- 生成按钮 -->
          <div class="config-section grow">
            <button class="generate-btn" @click="onGenerate">
              <RefreshCw :size="14" />
              <span>生成 UUID</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 右侧：结果 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Check :size="14" /></span>
            <span>生成结果</span>
            <span v-if="results.length" class="panel-stat accent">{{ results.length }} 项</span>
          </div>
          <div class="panel-actions">
            <button class="tool-icon-btn" @click="copyAll" :disabled="!results.length"
              @mouseenter="showTooltip('复制全部', $event)" @mouseleave="hideTooltip">
              <Check v-if="copied" :size="13" style="color: var(--success)" />
              <Copy v-else :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body">
          <div v-if="results.length" class="result-list">
            <div
              v-for="(uuid, i) in results" :key="i"
              class="result-row" :style="{ animationDelay: (i * 30) + 'ms' }" @click="copySingle(uuid)"
            >
              <span class="result-idx">{{ String(i + 1).padStart(2, '0') }}</span>
              <code class="result-value">{{ uuid }}</code>
              <button class="result-copy-btn" @click.stop="copySingle(uuid)">
                <Copy :size="11" />
              </button>
            </div>
          </div>

          <div v-else class="tool-empty">
            <div class="empty-icon"><Fingerprint :size="28" /></div>
            <p class="empty-title">等待生成</p>
            <p class="empty-desc">选择 UUID 类型和格式，点击生成</p>
          </div>
        </div>
      </section>
    </main>

    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">{{ tooltip.text }}</div>
  </div>
</template>

<style scoped>
/* ====== Header ====== */
.version-tag {
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
.tool-panel-body {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-row 
.val-code {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  text-transform: none;
}

/* ====== UUID 类型 ====== */
.type-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.type-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  width: 100%;
  padding: 8px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}

.type-card:hover { border-color: var(--accent); background: var(--bg-hover); }
.type-card.active { border-color: var(--accent); background: var(--accent-light); }

.type-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.type-desc { font-size: 10px; color: var(--text-muted); }

/* ====== 格式 Chips ====== */
.format-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.format-chip {
  padding: 3px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.format-chip:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
.format-chip.active { background: var(--accent); border-color: var(--accent); color: #fff; }

/* ====== Range Slider ====== */
.qr-range {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  appearance: none;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  outline: none;
  margin-top: 4px;
}

.qr-range::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg-card);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

/* ====== 生成按钮 ====== */
.generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 36px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.generate-btn:hover { filter: brightness(1.08); }
.generate-btn:active { transform: scale(0.98); }

/* ====== 右侧结果 ====== */
.panel-stat {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  padding: 1px 6px;
  background: var(--bg-secondary);
  border-radius: 4px;
}

.panel-stat.accent { color: var(--accent); background: var(--accent-light); }

.result-list {
  display: flex;
  flex-direction: column;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: background 0.1s;
  animation: uuid-row-in 0.25s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes uuid-row-in {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

.result-row:last-child { border-bottom: none; }
.result-row:hover { background: var(--bg-hover); }

.result-idx {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  width: 20px;
  flex-shrink: 0;
}

.result-value {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-primary);
  word-break: break-all;
}

.result-copy-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0;
  transition: all 0.15s;
}

.result-row:hover .result-copy-btn { opacity: 1; }
.result-copy-btn:hover { background: var(--bg-secondary); color: var(--accent); }

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

/* ====== Scrollbar ====== */
.tool-panel-body::-webkit-scrollbar { width: 5px; }
.tool-panel-body::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.tool-panel-body::-webkit-scrollbar-track { background: transparent; }

/* ====== Responsive ====== */
@media (max-width: 760px) {
  .tool-main { grid-template-columns: 1fr !important; }
}
</style>
