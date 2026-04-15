<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue'
import {
  X,
  Check,
  Info,
  TriangleAlert,
  HelpCircle,
  CircleCheck,
  CircleX,
  CircleAlert,
} from 'lucide-vue-next'

export interface DialogProps {
  visible: boolean
  type?: 'confirm' | 'info' | 'warning' | 'success' | 'error'
  title: string
  content?: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  danger?: boolean
}

const props = withDefaults(defineProps<DialogProps>(), {
  type: 'confirm',
  confirmText: '确定',
  cancelText: '取消',
  showCancel: true,
  danger: false,
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const isClosing = ref(false)
const hasContent = computed(() => !!props.content)

const close = () => {
  isClosing.value = true
  setTimeout(() => {
    emit('update:visible', false)
    isClosing.value = false
  }, 200)
}

const handleConfirm = () => {
  emit('confirm')
  close()
}

const handleCancel = () => {
  emit('cancel')
  close()
}

const handleMaskClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) handleCancel()
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') handleCancel()
  else if (e.key === 'Enter' && !props.showCancel) handleConfirm()
}

watch(() => props.visible, (val) => {
  if (val) {
    document.addEventListener('keydown', handleKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

const showCloseBtn = computed(() => props.showCancel)

const iconMap: Record<string, any> = {
  success: CircleCheck,
  warning: CircleAlert,
  error: CircleX,
  info: Info,
  confirm: HelpCircle,
}

const currentIcon = computed(() => iconMap[props.type] || iconMap.confirm)
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="visible && !isClosing"
        class="dialog-overlay"
        @click="handleMaskClick"
      >
        <div class="dialog-container" :class="`type-${type}`">
          <!-- Close button -->
          <button v-if="showCloseBtn" class="dialog-close" @click="handleCancel">
            <X :size="14" />
          </button>

          <!-- Body -->
          <div class="dialog-body">
            <div class="dialog-icon-wrap">
              <div class="dialog-icon-ring"></div>
              <component :is="currentIcon" :size="22" :stroke-width="1.8" class="dialog-icon" />
            </div>
            <h3 class="dialog-title">{{ title }}</h3>
            <p v-if="hasContent" class="dialog-desc">{{ content }}</p>
          </div>

          <!-- Actions -->
          <div class="dialog-actions">
            <button v-if="showCancel" class="dialog-btn cancel" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button
              class="dialog-btn confirm"
              :class="{ danger: danger || type === 'error' }"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Closing state overlay -->
    <Transition name="dialog">
      <div
        v-if="visible && isClosing"
        class="dialog-overlay closing"
        @click="handleMaskClick"
      >
        <div class="dialog-container closing" :class="`type-${type}`">
          <button v-if="showCloseBtn" class="dialog-close" @click="handleCancel">
            <X :size="14" />
          </button>
          <div class="dialog-body">
            <div class="dialog-icon-wrap">
              <div class="dialog-icon-ring"></div>
              <component :is="currentIcon" :size="22" :stroke-width="1.8" class="dialog-icon" />
            </div>
            <h3 class="dialog-title">{{ title }}</h3>
            <p v-if="hasContent" class="dialog-desc">{{ content }}</p>
          </div>
          <div class="dialog-actions">
            <button v-if="showCancel" class="dialog-btn cancel" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button
              class="dialog-btn confirm"
              :class="{ danger: danger || type === 'error' }"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ====== Overlay ====== */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.15);
  backdrop-filter: blur(16px) saturate(1.6);
  -webkit-backdrop-filter: blur(16px) saturate(1.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 24px;
}

html.dark .dialog-overlay {
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
}

/* ====== Container ====== */
.dialog-container {
  position: relative;
  width: 100%;
  max-width: 380px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.06) inset,
    0 24px 80px -12px rgba(15, 23, 42, 0.18),
    0 8px 24px -4px rgba(15, 23, 42, 0.08);
  overflow: hidden;
  transform-origin: center;
}

html.dark .dialog-container {
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    0 24px 80px -12px rgba(0, 0, 0, 0.55),
    0 8px 24px -4px rgba(0, 0, 0, 0.3);
}

/* ====== Close Button ====== */
.dialog-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  z-index: 1;
}

.dialog-close:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

/* ====== Body ====== */
.dialog-body {
  padding: 32px 28px 24px;
  text-align: center;
}

/* ====== Icon with ambient ring ====== */
.dialog-icon-wrap {
  position: relative;
  width: 52px;
  height: 52px;
  margin: 0 auto 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-icon-ring {
  position: absolute;
  inset: -4px;
  border-radius: 18px;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.type-info .dialog-icon-ring {
  background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
}
.type-warning .dialog-icon-ring {
  background: radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, transparent 70%);
}
.type-error .dialog-icon-ring {
  background: radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%);
}
.type-success .dialog-icon-ring {
  background: radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%);
}
.type-confirm .dialog-icon-ring {
  background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
}

.dialog-icon {
  position: relative;
  z-index: 1;
}

/* Type-specific icon backgrounds */
.type-info .dialog-icon-wrap,
.type-confirm .dialog-icon-wrap {
  background: color-mix(in srgb, var(--info) 12%, transparent);
  color: var(--info);
  border-radius: 14px;
}

.type-warning .dialog-icon-wrap {
  background: color-mix(in srgb, var(--warning) 14%, transparent);
  color: var(--warning);
  border-radius: 14px;
}

.type-error .dialog-icon-wrap {
  background: color-mix(in srgb, var(--error) 10%, transparent);
  color: var(--error);
  border-radius: 14px;
}

.type-success .dialog-icon-wrap {
  background: color-mix(in srgb, var(--success) 14%, transparent);
  color: var(--success);
  border-radius: 14px;
}

.dialog-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 650;
  color: var(--text-primary);
  line-height: 1.4;
  letter-spacing: -0.2px;
}

.dialog-desc {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.65;
  white-space: pre-line;
}

/* ====== Actions ====== */
.dialog-actions {
  display: flex;
  gap: 10px;
  padding: 6px 24px 24px;
}

.dialog-btn {
  flex: 1;
  height: 38px;
  border: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 550;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: -0.1px;
  position: relative;
  overflow: hidden;
}

.dialog-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%);
  pointer-events: none;
}

html.dark .dialog-btn::after {
  background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%);
}

.dialog-btn.cancel {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
}

.dialog-btn.cancel:hover {
  background: var(--bg-hover);
  border-color: var(--border-default);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.dialog-btn.cancel:active {
  transform: translateY(0) scale(0.98);
}

.dialog-btn.confirm {
  background: var(--accent);
  color: #fff;
  box-shadow:
    0 1px 3px color-mix(in srgb, var(--accent) 25%, transparent),
    0 0 0 1px color-mix(in srgb, var(--accent) 20%, transparent) inset;
}

.dialog-btn.confirm:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow:
    0 4px 14px color-mix(in srgb, var(--accent) 30%, transparent),
    0 0 0 1px color-mix(in srgb, var(--accent) 20%, transparent) inset;
}

.dialog-btn.confirm:active {
  filter: brightness(0.96);
  transform: translateY(0) scale(0.98);
}

.dialog-btn.confirm.danger {
  background: var(--error);
  box-shadow:
    0 1px 3px color-mix(in srgb, var(--error) 25%, transparent),
    0 0 0 1px color-mix(in srgb, var(--error) 15%, transparent) inset;
}

.dialog-btn.confirm.danger:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow:
    0 4px 14px color-mix(in srgb, var(--error) 30%, transparent),
    0 0 0 1px color-mix(in srgb, var(--error) 15%, transparent) inset;
}

/* ====== Animations ====== */
.dialog-enter-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-active .dialog-container {
  animation: dialog-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.dialog-leave-active {
  transition: opacity 0.18s ease;
}

.dialog-leave-active .dialog-container {
  animation: dialog-out 0.18s ease-in forwards;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

@keyframes dialog-in {
  from {
    opacity: 0;
    transform: scale(0.88) translateY(12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes dialog-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.94);
  }
}
</style>
