<script setup lang="ts">
import {
  Check, Copy, Trash2, Clock, HelpCircle,
  CalendarDays, RotateCw, Lightbulb, X,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import ReferenceModal from '@/components/common/ReferenceModal.vue'
import { useTooltip } from '@/composables/useTooltip'
import { useCron, presets, examples, helpContent } from './useCron'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
  cronInput, copiedField, showHelpModal,
  parseResult, fieldRows, explanationParagraph,
  nextRunTimes, activePreset,
  applyPreset, clearInput, fillDemo, copyValue,
} = useCron()
</script>

<template>
  <div class="tool-page">
    <!-- 标题栏 -->
    <ToolTitleBar title="Cron 解析器" icon="icon-cron">
      <div class="header-content">
        <span class="tool-status success" v-if="parseResult.valid">
          <Check :size="12" /> 有效
        </span>
        <span class="tool-status error" v-else-if="cronInput">
          <X :size="12" /> 无效
        </span>
        <button class="glass-icon-btn small" @click="showHelpModal = true" @mouseenter="showTooltip('使用说明', $event)" @mouseleave="hideTooltip">
          <HelpCircle :size="14" />
        </button>
      </div>
    </ToolTitleBar>

    <!-- 工具栏 -->
    <div class="tool-toolbar">
      <div class="tool-toolbar-left">
        <button class="action-btn primary" @click="fillDemo" @mouseenter="showTooltip('填入示例', $event)" @mouseleave="hideTooltip">
          <RotateCw :size="14" />
          <span>填入示例</span>
        </button>
        <button class="action-btn" @click="clearInput" :disabled="!cronInput" @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
          <Trash2 :size="14" />
          <span>清空</span>
        </button>

        <div class="tool-divider"></div>

        <button class="action-btn" :disabled="!parseResult.valid" @click="copyValue('cron', parseResult.normalized)" @mouseenter="showTooltip('复制表达式', $event)" @mouseleave="hideTooltip">
          <Copy :size="14" />
          <span>复制表达式</span>
        </button>
      </div>
    </div>

    <!-- 主内容 -->
    <main class="tool-main" style="grid-template-columns: minmax(340px, 400px) minmax(0, 1fr);">
      <!-- 左侧：输入面板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><CalendarDays :size="12" /></span>
            <span>表达式设置</span>
          </div>
        </div>

        <div class="tool-panel-body" style="overflow: auto;">
          <div class="cron-form">
            <div class="cron-field">
              <label class="cron-label">Cron 表达式</label>
              <input
                v-model="cronInput"
                class="cron-text-input"
                :class="{ error: cronInput && !parseResult.valid, valid: parseResult.valid }"
                type="text"
                placeholder="例如：30 9 * * 1-5"
                spellcheck="false"
                autocomplete="off"
              />
              <p v-if="parseResult.error" class="cron-hint error">{{ parseResult.error }}</p>
              <p v-else class="cron-hint">标准 5 段格式：分 时 日 月 周</p>
            </div>

            <div class="cron-field">
              <label class="cron-label">常用模板</label>
              <div class="cron-presets">
                <button
                  v-for="preset in presets"
                  :key="preset.value"
                  class="cron-preset-btn"
                  :class="{ active: preset.value === parseResult.normalized }"
                  @click="applyPreset(preset.value)"
                >
                  <span class="preset-name">{{ preset.name }}</span>
                  <span class="preset-desc">{{ preset.summary }}</span>
                </button>
              </div>
            </div>

            <div class="cron-field">
              <label class="cron-label">速查示例</label>
              <div class="cron-examples">
                <button
                  v-for="item in examples"
                  :key="item.code"
                  class="cron-example-btn"
                  @click="applyPreset(item.code)"
                  :title="item.desc"
                >
                  <code class="example-code">{{ item.code }}</code>
                  <span class="example-desc">{{ item.desc }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧：结果面板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Lightbulb :size="12" /></span>
            <span>解析结果</span>
          </div>
        </div>

        <div class="tool-panel-body" style="overflow: auto;">
          <div v-if="parseResult.valid" class="cron-results">
            <!-- 概述 -->
            <div class="cron-section">
              <label class="cron-section-label">概述</label>
              <div class="cron-summary-card">
                <p class="summary-text">{{ explanationParagraph }}</p>
                <span v-if="activePreset" class="cron-tag">{{ activePreset.name }}</span>
              </div>
            </div>

            <!-- 字段拆解 -->
            <div class="cron-section">
              <label class="cron-section-label">字段拆解</label>
              <div class="cron-table">
                <div class="cron-table-head">
                  <span>字段</span>
                  <span>表达式</span>
                  <span>范围</span>
                  <span>说明</span>
                  <span></span>
                </div>
                <div v-for="row in fieldRows" :key="row.key" class="cron-table-row">
                  <span class="row-name">{{ row.label }}</span>
                  <code class="row-value">{{ row.value }}</code>
                  <span class="row-range">{{ row.range }}</span>
                  <span class="row-desc">{{ row.desc }}</span>
                  <button class="cron-copy-btn" @click="copyValue(row.key, row.value)">
                    <Copy v-if="copiedField !== row.key" :size="12" />
                    <Check v-else :size="12" />
                  </button>
                </div>
              </div>
            </div>

            <!-- 未来触发 -->
            <div class="cron-section">
              <label class="cron-section-label">未来 8 次触发</label>
              <div class="cron-table">
                <div class="cron-table-head cron-next-head">
                  <span>#</span>
                  <span>触发时间</span>
                  <span></span>
                </div>
                <div v-for="(item, index) in nextRunTimes" :key="item" class="cron-table-row cron-next-row">
                  <span class="row-idx">{{ String(index + 1).padStart(2, '0') }}</span>
                  <code class="row-time">{{ item }}</code>
                  <button class="cron-copy-btn" @click="copyValue(`next-${index}`, item)">
                    <Copy v-if="copiedField !== `next-${index}`" :size="12" />
                    <Check v-else :size="12" />
                  </button>
                </div>
              </div>
            </div>

            <!-- 场景建议 -->
            <div class="cron-section">
              <label class="cron-section-label">适用场景</label>
              <div class="cron-advice">
                <div class="cron-advice-card">
                  <strong>轮询任务</strong>
                  <p>推荐 <code>*/5 * * * *</code> 或 <code>*/15 * * * *</code>，稳定直观便于排查。</p>
                </div>
                <div class="cron-advice-card">
                  <strong>办公时间任务</strong>
                  <p>用 <code>1-5</code> 星期范围表达工作日，避免时间逻辑硬编码。</p>
                </div>
                <div class="cron-advice-card">
                  <strong>月度任务</strong>
                  <p>月初月末场景建议结合后端日志验证真实调度结果。</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="tool-empty">
            <div class="empty-icon"><CalendarDays :size="24" /></div>
            <p class="empty-title">输入 Cron 表达式开始解析</p>
            <p class="empty-desc">左侧输入，右侧展示解释、字段拆解和触发时间</p>
          </div>
        </div>
      </section>
    </main>

    <!-- 帮助 -->
    <ReferenceModal v-model:visible="showHelpModal" title="Cron 使用说明" :sections="helpContent" />

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

.tool-status {
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

.tool-status.success { color: var(--success); background: var(--success-light); border-color: transparent; }
.tool-status.error { color: var(--error); background: var(--error-light); border-color: transparent; }

/* ====== Action 按钮 ====== */
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

.action-btn:hover:not(:disabled) { border-color: var(--border-default); color: var(--text-primary); background: var(--bg-hover); }
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.action-btn.primary {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
  background: var(--accent-light);
}

.action-btn.primary:hover:not(:disabled) {
  border-color: var(--accent);
  background: var(--accent-light);
}

/* ====== 表单 ====== */
.cron-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
}

.cron-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cron-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.cron-text-input {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  outline: none;
  transition: all 0.15s;
}

.cron-text-input::placeholder { color: var(--text-muted); }
.cron-text-input:hover { border-color: var(--border-default); }
.cron-text-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-light); }
.cron-text-input.error { border-color: var(--error); }
.cron-text-input.error:focus { box-shadow: 0 0 0 2px var(--error-light); }
.cron-text-input.valid { border-color: var(--success); }
.cron-text-input.valid:focus { box-shadow: 0 0 0 2px var(--success-light); }

.cron-hint {
  margin: 0;
  font-size: 11px;
  color: var(--text-muted);
}

.cron-hint.error { color: var(--error); }

/* ====== 预设按钮 ====== */
.cron-presets {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cron-preset-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}

.cron-preset-btn:hover { border-color: var(--accent); background: var(--bg-hover); }
.cron-preset-btn.active { border-color: var(--accent); background: var(--accent-light); }

.preset-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.preset-desc {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.4;
}

/* ====== 示例 ====== */
.cron-examples {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.cron-example-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}

.cron-example-btn:hover { border-color: var(--accent); background: var(--bg-hover); }

.example-code {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--accent);
}

.example-desc {
  font-size: 10px;
  color: var(--text-muted);
}

/* ====== 结果区 ====== */
.cron-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
}

.cron-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cron-section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* ====== 概述卡片 ====== */
.cron-summary-card {
  padding: 16px;
  background: linear-gradient(135deg, var(--accent-light), var(--success-light));
  border: 1px solid var(--accent);
  border-radius: var(--radius-lg);
}

.summary-text {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.7;
}

.cron-tag {
  display: inline-flex;
  margin-top: 10px;
  padding: 3px 10px;
  background: var(--accent-light);
  border: 1px solid var(--accent);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  color: var(--accent);
}

/* ====== 表格 ====== */
.cron-table {
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.cron-table-head {
  display: grid;
  grid-template-columns: 50px 70px 55px 1fr 32px;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.cron-table-head.cron-next-head {
  grid-template-columns: 40px 1fr 32px;
}

.cron-table-row {
  display: grid;
  grid-template-columns: 50px 70px 55px 1fr 32px;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 12px;
  transition: background 0.1s;
}

.cron-table-row:last-child { border-bottom: none; }
.cron-table-row:hover { background: var(--bg-hover); }

.cron-table-row.cron-next-row {
  grid-template-columns: 40px 1fr 32px;
}

.row-name {
  font-weight: 500;
  color: var(--text-secondary);
}

.row-value {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--accent);
  background: var(--accent-light);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  text-align: center;
}

.row-range {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
}

.row-desc {
  color: var(--text-secondary);
}

.row-idx {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

.row-time {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-primary);
}

/* ====== 复制按钮 ====== */
.cron-copy-btn {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.cron-copy-btn:hover { background: var(--bg-hover); color: var(--accent); }

/* ====== 建议 ====== */
.cron-advice {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cron-advice-card {
  padding: 12px 14px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.cron-advice-card strong {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--text-primary);
}

.cron-advice-card p {
  margin: 0;
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.cron-advice-card code {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
  background: var(--accent-light);
  padding: 1px 4px;
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
  .cron-table-head,
  .cron-table-row { grid-template-columns: 45px 60px 50px 1fr 28px; gap: 4px; }
  .cron-examples { grid-template-columns: 1fr; }
}
</style>
