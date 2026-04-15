<script setup lang="ts">
import { ref } from 'vue'
import { Trash2, History, X } from 'lucide-vue-next'

interface HistoryItem {
  _id: number
  _createdAt: string
  [key: string]: any
}

interface DisplayField {
  key: string
  label: string
  format?: (value: any) => string
}

const props = withDefaults(defineProps<{
  history: HistoryItem[]
  title?: string
  displayFields?: DisplayField[]
  showClear?: boolean
}>(), {
  showClear: true,
})

const emit = defineEmits<{
  (e: 'use', item: HistoryItem): void
  (e: 'delete', id: number): void
  (e: 'clear'): void
  (e: 'close'): void
}>()

const showClearConfirm = ref(false)

const handleUse = (item: HistoryItem) => {
  emit('use', item)
}

const handleDelete = (id: number, event: Event) => {
  event.stopPropagation()
  emit('delete', id)
}

const handleClearClick = () => {
  showClearConfirm.value = true
}

const confirmClear = () => {
  emit('clear')
  showClearConfirm.value = false
}

const cancelClear = () => {
  showClearConfirm.value = false
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getFieldValue = (item: HistoryItem, field: DisplayField) => {
  const value = item[field.key]
  if (field.format) {
    return field.format(value)
  }
  return value ?? ''
}
</script>

<template>
  <Transition name="slide">
    <div class="history-panel">
      <div class="history-header">
        <div class="history-title">
          <div class="title-icon">
            <History :size="16" />
          </div>
          <span class="title-text">{{ title || '历史记录' }}</span>
        </div>
        <div class="header-actions">
          <button
            v-if="showClear && history.length > 0"
            class="glass-icon-btn small danger"
            @click="handleClearClick"
            title="清空历史"
          >
            <Trash2 :size="14" />
          </button>
          <button class="glass-icon-btn small" @click="$emit('close')" title="关闭">
            <X :size="14" />
          </button>
        </div>
      </div>

      <!-- 清空确认对话框 -->
      <Transition name="fade">
        <div v-if="showClearConfirm" class="confirm-overlay" @click.self="cancelClear">
          <div class="confirm-dialog">
            <div class="confirm-title">确认清空</div>
            <div class="confirm-message">确定要清空所有历史记录吗？此操作不可恢复。</div>
            <div class="confirm-actions">
              <button class="confirm-btn cancel" @click="cancelClear">取消</button>
              <button class="confirm-btn danger" @click="confirmClear">清空</button>
            </div>
          </div>
        </div>
      </Transition>

      <div class="history-list">
        <div v-if="history.length === 0" class="history-empty">
          暂无历史记录
        </div>
        <div
          v-for="item in history"
          :key="item._id"
          class="history-item"
          @click="handleUse(item)"
        >
          <div class="history-content">
            <template v-if="displayFields && displayFields.length > 0">
              <div
                v-for="field in displayFields"
                :key="field.key"
                class="history-field"
                :class="`field-${field.key}`"
              >
                <span class="field-label">{{ field.label }}:</span>
                <span class="field-value">{{ getFieldValue(item, field) }}</span>
              </div>
            </template>
            <slot v-else name="item" :item="item">
              <div class="history-default">{{ item }}</div>
            </slot>
          </div>
          <div class="history-meta">
            <span class="history-time">{{ formatDate(item._createdAt) }}</span>
            <button class="delete-btn" @click="handleDelete(item._id, $event)" title="删除">
              <Trash2 :size="12" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.history-panel {
  position: absolute;
  top: 8px;
  right: 8px;
  bottom: 8px;
  width: 280px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  background: var(--bg-card);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  z-index: 10;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 38px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle);
}

.history-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  background: rgba(139, 92, 246, 0.12);
  color: #8b5cf6;
}

.title-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  gap: 4px;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  background: var(--bg-secondary);
}

.history-list::-webkit-scrollbar {
  width: 4px;
}

.history-list::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: 2px;
}

.history-empty {
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  padding: 32px 20px;
}

.history-item {
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid var(--border-subtle);
  margin-bottom: 4px;
  background: var(--bg-primary);
}

.history-item:hover {
  background: var(--bg-hover);
  border-color: var(--border-default);
}

.history-item:active {
  transform: scale(0.99);
}

.history-content {
  margin-bottom: 4px;
}

.history-field {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 2px;
}

.history-field:last-child {
  margin-bottom: 0;
}

.field-label {
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.field-value {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  word-break: break-all;
  line-height: 1.5;
}

.history-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 6px;
  border-top: 1px solid var(--border-subtle);
  margin-top: 6px;
}

.history-time {
  font-size: 11px;
  color: var(--text-muted);
}

.delete-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all 0.15s ease;
  opacity: 0;
}

.history-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: var(--error-light);
  color: var(--error);
}

/* 确认对话框 */
.confirm-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.confirm-dialog {
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--bg-card);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
  width: 220px;
  text-align: center;
}

.confirm-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.confirm-message {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.confirm-btn {
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid var(--border-default);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.confirm-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.confirm-btn.danger {
  background: var(--error);
  border-color: var(--error);
  color: #fff;
}

.confirm-btn.danger:hover {
  opacity: 0.9;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>
