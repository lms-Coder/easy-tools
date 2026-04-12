<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue'
import {
  X,
  Check,
  Info,
  TriangleAlert,
  HelpCircle,
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

const dialogRef = ref<HTMLElement | null>(null)
const isAnimating = ref(false)

const close = () => {
  isAnimating.value = true
  setTimeout(() => {
    emit('update:visible', false)
    isAnimating.value = false
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
  if (e.target === e.currentTarget) {
    handleCancel()
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    handleCancel()
  } else if (e.key === 'Enter' && !props.showCancel) {
    handleConfirm()
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      document.addEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = ''
    }
  }
)

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

// 是否显示关闭按钮（纯提示型不需要）
const showClose = computed(() => props.showCancel)

const iconMap = {
  success: Check,
  warning: TriangleAlert,
  error: TriangleAlert,
  info: Info,
  confirm: HelpCircle,
}

const currentIcon = computed(() => iconMap[props.type] || iconMap.confirm)
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="visible"
        class="dialog-overlay"
        :class="{ closing: isAnimating }"
        @click="handleMaskClick"
      >
        <div ref="dialogRef" class="dialog-container" :class="[`type-${type}`, { closing: isAnimating }]">
          <!-- 关闭按钮（仅确认型显示） -->
          <button v-if="showClose" class="dialog-close" @click="handleCancel">
            <X :size="14" />
          </button>

          <!-- 内容区 -->
          <div class="dialog-body">
            <!-- 图标 -->
            <div class="dialog-icon-wrap">
              <div class="dialog-icon">
                <component :is="currentIcon" :size="22" :stroke-width="2" />
              </div>
            </div>

            <!-- 标题 -->
            <h3 class="dialog-title">{{ title }}</h3>

            <!-- 描述 -->
            <p v-if="content" class="dialog-desc">{{ content }}</p>
          </div>

          <!-- 按钮区 -->
          <div class="dialog-actions">
            <button
              v-if="showCancel"
              class="dialog-btn btn-cancel"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              class="dialog-btn btn-confirm"
              :class="{ 'btn-danger': danger || type === 'error' }"
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
/* ====== 遮罩层 ====== */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

html.dark .dialog-overlay {
  background: rgba(0, 0, 0, 0.45);
}

/* ====== 容器 ====== */
.dialog-container {
  position: relative;
  width: 100%;
  max-width: 340px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border-radius: 14px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(0, 0, 0, 0.04);
  border: 0.5px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

html.dark .dialog-container {
  background: rgba(44, 44, 46, 0.78);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 4px 16px rgba(0, 0, 0, 0.2);
}

/* ====== 关闭按钮 ====== */
.dialog-close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-tertiary, #aeaeb2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.dialog-close:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

/* ====== 内容区 ====== */
.dialog-body {
  padding: 28px 24px 20px;
  text-align: center;
}

.dialog-icon-wrap {
  margin-bottom: 14px;
}

.dialog-icon {
  width: 40px;
  height: 40px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

/* 各类型图标颜色 */
.type-info .dialog-icon {
  background: var(--info-light);
  color: var(--info);
  box-shadow: 0 2px 8px var(--info-light);
}

.type-warning .dialog-icon {
  background: var(--warning-light);
  color: var(--warning);
  box-shadow: 0 2px 8px var(--warning-light);
}

.type-error .dialog-icon {
  background: var(--error-light);
  color: var(--error);
  box-shadow: 0 2px 8px var(--error-light);
}

.type-success .dialog-icon {
  background: var(--success-light);
  color: var(--success);
  box-shadow: 0 2px 8px var(--success-light);
}

.type-confirm .dialog-icon {
  background: var(--accent-light);
  color: var(--accent);
  box-shadow: 0 2px 8px var(--accent-light);
}

.dialog-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  letter-spacing: -0.2px;
}

.dialog-desc {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-line;
}

/* ====== 按钮区 ====== */
.dialog-actions {
  display: flex;
  gap: 8px;
  padding: 4px 16px 16px;
}

.dialog-btn {
  flex: 1;
  height: 32px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  letter-spacing: -0.1px;
}

.btn-cancel {
  background: var(--bg-tertiary, #ececee);
  color: var(--text-primary);
}

.btn-cancel:hover {
  background: var(--bg-hover);
}

html.dark .btn-cancel {
  background: rgba(255, 255, 255, 0.1);
}

html.dark .btn-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-confirm {
  background: var(--accent);
  color: #fff;
}

.btn-confirm:hover {
  filter: brightness(1.1);
}

.btn-confirm:active {
  filter: brightness(0.95);
}

.btn-confirm.btn-danger {
  background: var(--error);
}

.btn-confirm.btn-danger:hover {
  filter: brightness(1.1);
}

/* ====== 动画 ====== */
.dialog-enter-active {
  animation: dialog-fade-in 0.2s ease-out;
}

.dialog-leave-active {
  animation: dialog-fade-out 0.15s ease-in;
}

.dialog-enter-active .dialog-container {
  animation: dialog-scale-in 0.25s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.dialog-leave-active .dialog-container {
  animation: dialog-scale-out 0.15s ease-in;
}

@keyframes dialog-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes dialog-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes dialog-scale-in {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes dialog-scale-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.96);
  }
}
</style>
