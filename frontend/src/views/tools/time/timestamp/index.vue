<script setup lang="ts">
import {
  Copy,
  Check,
  Trash2,
  Clock,
  ArrowRight,
  Calendar,
  Zap,
  Timer,
  History,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import ToolHistoryPanel from '@/components/common/ToolHistoryPanel.vue'
import Select from '@/components/ui/Select.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import TimePicker from '@/components/ui/TimePicker.vue'
import { useTimestamp, timezones } from './useTimestamp'

const timezoneOptions = timezones.map(tz => ({ label: tz.label, value: tz.value }))

const {
  selectedTimezone,
  nowFormatted, nowSeconds, nowMilliseconds,
  inputTimestamp, tsError, detectedUnit,
  tsInputDayjs, tsLocal, tsISO, tsUTC, tsRelative, tsDayOfWeek,
  tsTimestampSeconds, tsTimestampMs,
  dateDayjs, dateInputDayjs,
  dateTsSeconds, dateTsMs, dateISO,
  copiedField, copyText,
  setCurrentAsInput, setNowAsDate, clearTimestamp, clearDate,
  history, showHistory, deleteItem, handleHistoryUse, handleClearHistory,
} = useTimestamp()
</script>

<template>
  <div class="tool-page">
    <!-- 标题栏 -->
    <ToolTitleBar title="时间戳转换" icon="icon-clock-circle">
      <Select v-model="selectedTimezone" :options="timezoneOptions" size="sm" style="min-width: 130px" />
      <button class="glass-icon-btn" :class="{ active: showHistory }" @click="showHistory = !showHistory" title="历史记录">
        <History :size="14" />
      </button>
    </ToolTitleBar>

    <!-- 主体：左右分栏 -->
    <main class="tool-main split">
      <!-- 历史记录面板 -->
      <ToolHistoryPanel
        v-if="showHistory"
        :history="history"
        title="转换历史"
        :display-fields="[{ key: 'preview', label: '转换' }]"
        @use="handleHistoryUse"
        @delete="deleteItem"
        @clear="handleClearHistory"
        @close="showHistory = false"
      />

      <!-- 左侧：当前时间 + 输入 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Clock :size="14" /></span>
            <span>当前时间</span>
          </div>
          <div class="tool-panel-actions">
            <span class="ts-live-dot"></span>
            <span class="ts-live-label">实时</span>
          </div>
        </div>
        <div class="tool-panel-body ts-left">
          <!-- 当前时间 -->
          <div class="ts-live-block">
            <div class="ts-live-datetime">{{ nowFormatted }}</div>
            <div class="ts-live-row">
              <div class="ts-live-value">
                <span class="ts-live-tag">秒</span>
                <code class="ts-live-code">{{ nowSeconds }}</code>
                <button class="glass-icon-btn small" @click="copyText(nowSeconds, 'live-s')" title="复制">
                  <Copy v-if="copiedField !== 'live-s'" :size="12" />
                  <Check v-else :size="12" />
                </button>
              </div>
              <div class="ts-live-value">
                <span class="ts-live-tag">毫秒</span>
                <code class="ts-live-code">{{ nowMilliseconds }}</code>
                <button class="glass-icon-btn small" @click="copyText(nowMilliseconds, 'live-ms')" title="复制">
                  <Copy v-if="copiedField !== 'live-ms'" :size="12" />
                  <Check v-else :size="12" />
                </button>
              </div>
            </div>
          </div>

          <div class="ts-section-divider"></div>

          <!-- 时间戳 → 日期 输入 -->
          <div class="ts-section">
            <div class="ts-section-head">
              <span class="ts-section-icon blue"><Timer :size="13" /></span>
              <span class="ts-section-title">时间戳转日期</span>
            </div>
            <div class="ts-input-row">
              <input
                v-model="inputTimestamp"
                class="ts-input"
                type="text"
                placeholder="输入时间戳（秒或毫秒）"
                spellcheck="false"
              />
              <span v-if="detectedUnit" class="ts-unit-badge">{{ detectedUnit }}</span>
              <button class="glass-icon-btn small" @click="clearTimestamp" :disabled="!inputTimestamp" title="清空">
                <Trash2 :size="12" />
              </button>
            </div>
            <div class="ts-input-hint">
              <button class="ts-link-btn" @click="setCurrentAsInput">
                <ArrowRight :size="11" /> 使用当前时间戳
              </button>
            </div>
            <div v-if="tsError" class="ts-error">{{ tsError }}</div>
          </div>

          <div class="ts-section-divider"></div>

          <!-- 日期 → 时间戳 输入 -->
          <div class="ts-section">
            <div class="ts-section-head">
              <span class="ts-section-icon orange"><Calendar :size="13" /></span>
              <span class="ts-section-title">日期转时间戳</span>
            </div>
            <div class="ts-input-row">
              <DatePicker v-model="dateDayjs" placeholder="选择日期" />
              <TimePicker v-model="dateDayjs" placeholder="选择时间" />
            </div>
            <div class="ts-input-hint">
              <button class="ts-link-btn" @click="setNowAsDate">
                <ArrowRight :size="11" /> 使用当前日期时间
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧：转换结果 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Zap :size="14" /></span>
            <span>转换结果</span>
          </div>
        </div>
        <div class="tool-panel-body ts-right">
          <!-- 时间戳 → 日期 结果 -->
          <template v-if="tsInputDayjs && !tsError">
            <div class="ts-result-group">
              <div class="ts-result-group-head">时间戳 → 日期</div>
              <div class="ts-results">
                <div class="ts-result-row">
                  <span class="ts-result-label">本地时间</span>
                  <code class="ts-result-value">{{ tsLocal }}</code>
                  <button class="glass-icon-btn small" @click="copyText(tsLocal, 'ts-local')" title="复制">
                    <Copy v-if="copiedField !== 'ts-local'" :size="11" />
                    <Check v-else :size="11" />
                  </button>
                </div>
                <div class="ts-result-row">
                  <span class="ts-result-label">ISO 8601</span>
                  <code class="ts-result-value">{{ tsISO }}</code>
                  <button class="glass-icon-btn small" @click="copyText(tsISO, 'ts-iso')" title="复制">
                    <Copy v-if="copiedField !== 'ts-iso'" :size="11" />
                    <Check v-else :size="11" />
                  </button>
                </div>
                <div class="ts-result-row">
                  <span class="ts-result-label">UTC</span>
                  <code class="ts-result-value">{{ tsUTC }}</code>
                  <button class="glass-icon-btn small" @click="copyText(tsUTC, 'ts-utc')" title="复制">
                    <Copy v-if="copiedField !== 'ts-utc'" :size="11" />
                    <Check v-else :size="11" />
                  </button>
                </div>
                <div class="ts-result-row">
                  <span class="ts-result-label">相对时间</span>
                  <code class="ts-result-value ts-relative">{{ tsRelative }}</code>
                </div>
                <div class="ts-result-row">
                  <span class="ts-result-label">星期</span>
                  <code class="ts-result-value">{{ tsDayOfWeek }}</code>
                </div>
              </div>
            </div>
          </template>

          <!-- 日期 → 时间戳 结果 -->
          <template v-if="dateInputDayjs">
            <div class="ts-result-group">
              <div class="ts-result-group-head">日期 → 时间戳</div>
              <div class="ts-results">
                <div class="ts-result-row">
                  <span class="ts-result-label">秒</span>
                  <code class="ts-result-value">{{ dateTsSeconds }}</code>
                  <button class="glass-icon-btn small" @click="copyText(dateTsSeconds, 'date-s')" title="复制">
                    <Copy v-if="copiedField !== 'date-s'" :size="11" />
                    <Check v-else :size="11" />
                  </button>
                </div>
                <div class="ts-result-row">
                  <span class="ts-result-label">毫秒</span>
                  <code class="ts-result-value">{{ dateTsMs }}</code>
                  <button class="glass-icon-btn small" @click="copyText(dateTsMs, 'date-ms')" title="复制">
                    <Copy v-if="copiedField !== 'date-ms'" :size="11" />
                    <Check v-else :size="11" />
                  </button>
                </div>
                <div class="ts-result-row">
                  <span class="ts-result-label">ISO 8601</span>
                  <code class="ts-result-value">{{ dateISO }}</code>
                  <button class="glass-icon-btn small" @click="copyText(dateISO, 'date-iso')" title="复制">
                    <Copy v-if="copiedField !== 'date-iso'" :size="11" />
                    <Check v-else :size="11" />
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- 空状态 -->
          <div v-if="!tsInputDayjs && !dateInputDayjs" class="ts-empty-state">
            <Timer :size="32" />
            <p class="ts-empty-title">等待输入</p>
            <p class="ts-empty-desc">输入时间戳或选择日期进行转换</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* ====== Left Panel ====== */
.ts-left {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.ts-live-block {
  padding: 14px 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ts-live-datetime {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.2px;
}

.ts-live-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ts-live-value {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  padding: 6px 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.ts-live-tag {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.ts-live-code {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--text-primary);
  background: none;
}

.ts-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
  animation: ts-pulse 2s ease-in-out infinite;
}

.ts-live-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--success);
  letter-spacing: 0.3px;
}

@keyframes ts-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.ts-section-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 0 14px;
}

.ts-section {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ts-section-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ts-section-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
}

.ts-section-icon.blue {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent);
}

.ts-section-icon.orange {
  background: rgba(255, 149, 10, 0.1);
  color: var(--warning);
}

.ts-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.ts-input-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ts-input {
  flex: 1;
  height: 32px;
  padding: 0 10px;
  font-family: var(--font-mono);
  font-size: 13px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  transition: border-color var(--transition-fast);
}

.ts-input:focus {
  border-color: var(--accent);
}

.ts-input-row :deep(.ui-datepicker) {
  flex: 1;
}

.ts-input-row :deep(.ui-timepicker) {
  flex: 0 0 110px;
}

.ts-unit-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent);
  flex-shrink: 0;
}

.ts-input-hint {
  display: flex;
  align-items: center;
}

.ts-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0;
  border: none;
  background: none;
  font-size: 11px;
  color: var(--accent);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.ts-link-btn:hover {
  opacity: 0.7;
}

.ts-error {
  font-size: 12px;
  color: var(--error);
  padding: 2px 0;
}

/* ====== Right Panel ====== */
.ts-right {
  display: flex;
  flex-direction: column;
  padding: 14px;
  gap: 14px;
  overflow-y: auto;
}

.ts-result-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ts-result-group-head {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.ts-results {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.ts-result-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: var(--bg-primary);
}

.ts-result-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
  width: 64px;
}

.ts-result-value {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--text-primary);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ts-relative {
  color: var(--accent);
  font-weight: 500;
}

.ts-empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--text-muted);
}

.ts-empty-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
}

.ts-empty-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

/* ====== Responsive ====== */
@media (max-width: 640px) {
  .ts-live-row {
    flex-direction: column;
  }
  .ts-input-row {
    flex-wrap: wrap;
  }
  .ts-input-time {
    flex: 1;
  }
}
</style>
