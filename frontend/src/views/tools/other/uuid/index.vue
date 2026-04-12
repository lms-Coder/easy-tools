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

    <!-- 工具栏 -->
    <div class="tool-toolbar">
      <div class="tool-toolbar-left">
        <!-- 数量 -->
        <div class="count-input-wrap">
          <label class="count-label">数量</label>
          <input type="number" v-model.number="count" min="1" max="1000" class="count-input" />
        </div>

        <div class="tool-divider"></div>

        <button class="action-btn primary" @click="onGenerate" @mouseenter="showTooltip('生成', $event)" @mouseleave="hideTooltip">
          <RefreshCw :size="14" />
          <span>生成</span>
        </button>

        <button class="glass-icon-btn" @click="copyAll" :disabled="!results.length" @mouseenter="showTooltip('复制全部', $event)" @mouseleave="hideTooltip">
          <Copy v-if="!copied" :size="15" />
          <Check v-else :size="15" />
        </button>
        <button class="glass-icon-btn danger" @click="clear" :disabled="!results.length" @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
          <Trash2 :size="15" />
        </button>
      </div>
    </div>

    <!-- 主内容 -->
    <main class="tool-main" style="grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);">
      <!-- 左侧：设置 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Fingerprint :size="12" /></span>
            <span>UUID 设置</span>
          </div>
        </div>
        <div class="tool-panel-body" style="overflow: auto;">
          <div class="uuid-form">
            <!-- 版本说明 -->
            <div class="uuid-section">
              <div class="uuid-section-title">UUID 类型</div>
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
            <div class="uuid-section">
              <div class="uuid-section-title">输出格式</div>
              <div class="format-grid">
                <button
                  v-for="f in uuidFormats" :key="f.value"
                  class="format-card" :class="{ active: format === f.value }"
                  @click="format = f.value"
                >
                  {{ f.label }}
                </button>
              </div>
            </div>

            <!-- 批量数量 -->
            <div class="uuid-section">
              <div class="uuid-section-title">批量生成</div>
              <div class="batch-row">
                <input type="range" v-model.number="count" min="1" max="100" class="batch-slider" />
                <span class="batch-value">{{ count }}</span>
              </div>
            </div>

            <!-- 生成按钮 -->
            <button class="generate-btn" @click="onGenerate">
              <RefreshCw :size="16" />
              <span>生成 UUID</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 右侧：结果 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Check :size="12" /></span>
            <span>生成结果</span>
            <span v-if="results.length" class="panel-stat accent">{{ results.length }} 项</span>
          </div>
          <div class="tool-panel-actions">
            <button class="glass-icon-btn small" @click="copyAll" :disabled="!results.length" @mouseenter="showTooltip('复制全部', $event)" @mouseleave="hideTooltip">
              <Copy v-if="!copied" :size="13" />
              <Check v-else :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body" style="padding: 0; overflow: auto;">
          <div v-if="results.length" class="result-list">
            <div
              v-for="(uuid, i) in results" :key="i"
              class="result-row" @click="copySingle(uuid)"
            >
              <span class="result-idx">{{ String(i + 1).padStart(2, '0') }}</span>
              <code class="result-value">{{ uuid }}</code>
              <button class="result-copy-btn" @click.stop="copySingle(uuid)">
                <Copy :size="11" />
              </button>
            </div>
          </div>

          <div v-else class="tool-empty">
            <div class="empty-icon"><Fingerprint :size="24" /></div>
            <p class="empty-title">点击生成</p>
            <p class="empty-desc">选择 UUID 类型和格式，点击生成按钮</p>
          </div>
        </div>
      </section>
    </main>

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

.version-tag {
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

/* ====== 工具栏控件 ====== */
.format-btn { font-family: var(--font-mono); font-size: 11px; }

.count-input-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.count-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
}

.count-input {
  width: 56px;
  height: 28px;
  padding: 0 8px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  outline: none;
  text-align: center;
}

.count-input:focus { border-color: var(--accent); }

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn.primary {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
  background: var(--accent-light);
}

.action-btn.primary:hover { border-color: var(--accent); }

/* ====== 左侧表单 ====== */
.uuid-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 14px;
}

.uuid-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.uuid-section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

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
  border-radius: var(--radius-sm);
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}

.type-card:hover { border-color: var(--accent); background: var(--bg-hover); }
.type-card.active { border-color: var(--accent); background: var(--accent-light); }

.type-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.type-desc { font-size: 10px; color: var(--text-muted); }

.format-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.format-card {
  padding: 5px 10px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.format-card:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
.format-card.active { background: var(--accent); border-color: var(--accent); color: #fff; }

.batch-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.batch-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--bg-secondary);
  border-radius: 2px;
  outline: none;
}

.batch-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.batch-value {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  width: 28px;
  text-align: center;
}

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
  border-radius: var(--radius-md);
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
  border-radius: var(--radius-xs);
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
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0;
  transition: all 0.15s;
}

.result-row:hover .result-copy-btn { opacity: 1; }
.result-copy-btn:hover { background: var(--bg-secondary); color: var(--accent); }

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
