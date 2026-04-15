<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Check,
  Info,
  CircleAlert,
  X,
} from 'lucide-vue-next'
import type { ToastItem } from '@/composables/useToast'
import { useToast } from '@/composables/useToast'

const { removeToast } = useToast()

const props = defineProps<{
  toast: ToastItem
  index: number
}>()

const isHovered = ref(false)

// 获取图标
const getIcon = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return Check
    case 'error':
      return X
    case 'warning':
      return CircleAlert
    default:
      return Info
  }
})

// 获取图标颜色
const getIconColor = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return 'var(--success)'
    case 'error':
      return 'var(--error)'
    case 'warning':
      return 'var(--warning)'
    default:
      return 'var(--accent)'
  }
})

// 关闭
const handleClose = () => {
  removeToast(props.toast.id)
}
</script>

<template>
  <div
    class="toast-item"
    :class="{ closing: (toast as any).closing }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- 图标 -->
    <div class="toast-icon" :style="{ color: getIconColor }">
      <component :is="getIcon" :size="16" />
    </div>

    <!-- 消息 -->
    <span class="toast-message">{{ toast.message }}</span>

    <!-- 关闭按钮区域（始终占位） -->
    <button
      class="toast-close"
      :class="{ visible: isHovered }"
      @click="handleClose"
    >
      <X :size="12" />
    </button>
  </div>
</template>

<style scoped>
.toast-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.78) 0%,
    rgba(255, 255, 255, 0.65) 100%
  );
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 12px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
  min-width: 200px;
  max-width: 400px;
  animation: toast-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* 暗色主题 */
html.dark .toast-item,
html.dark .toast-item {
  background: linear-gradient(
    135deg,
    rgba(60, 60, 65, 0.72) 0%,
    rgba(50, 50, 55, 0.58) 100%
  );
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.28),
    0 2px 8px rgba(0, 0, 0, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.toast-item.closing {
  animation: toast-out 0.25s ease forwards;
}

.toast-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.toast-message {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.4;
}

.toast-close {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.toast-close.visible {
  opacity: 1;
}

.toast-close:hover {
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-primary);
}

html.dark .toast-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 动画 */
@keyframes toast-in {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes toast-out {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-16px) scale(0.92);
  }
}
</style>
