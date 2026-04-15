<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'

// Props
interface Props {
  visible: boolean
  title?: string
  width?: string | number
  showClose?: boolean
  maskClosable?: boolean
  closable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  width: '520px',
  showClose: true,
  maskClosable: true,
  closable: true,
})

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

// 关闭模态框
const close = () => {
  if (!props.closable) return
  emit('update:visible', false)
  emit('close')
}

// 点击遮罩关闭
const handleMaskClick = () => {
  if (props.maskClosable) {
    close()
  }
}

// 键盘 ESC 关闭
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.visible && props.closable) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-root">
        <!-- 遮罩层 -->
        <div class="modal-mask" @click="handleMaskClick"></div>

        <!-- 模态框内容 -->
        <div class="modal-wrap">
          <div class="modal-content" :style="{ width: typeof width === 'number' ? width + 'px' : width }">
            <!-- 头部 -->
            <div v-if="title || showClose" class="modal-header">
              <div class="modal-title">
                <slot name="title">{{ title }}</slot>
              </div>
              <button v-if="showClose && closable" class="modal-close" @click="close">
                <X :size="15" />
              </button>
            </div>

            <!-- 主体 -->
            <div class="modal-body">
              <slot></slot>
            </div>

            <!-- 底部 -->
            <div v-if="$slots.footer" class="modal-footer">
              <slot name="footer"></slot>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-root {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
}

/* 遮罩层 */
.modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.15);
  backdrop-filter: blur(16px) saturate(1.6);
  -webkit-backdrop-filter: blur(16px) saturate(1.6);
}

html.dark .modal-mask {
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
}

/* 内容包装器 */
.modal-wrap {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* 模态框内容 */
.modal-content {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.06) inset,
    0 24px 80px -12px rgba(15, 23, 42, 0.18),
    0 8px 24px -4px rgba(15, 23, 42, 0.08);
  max-width: calc(100vw - 48px);
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

html.dark .modal-content {
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    0 24px 80px -12px rgba(0, 0, 0, 0.55),
    0 8px 24px -4px rgba(0, 0, 0, 0.3);
}

/* 头部 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.modal-title {
  font-size: 14px;
  font-weight: 650;
  color: var(--text-primary);
  letter-spacing: -0.2px;
}

.modal-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* 主体 */
.modal-body {
  flex: 1;
  overflow: auto;
  padding: 24px;
}

/* 底部 */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

/* 过渡动画 */
.modal-enter-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-content {
  animation: modal-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-leave-active {
  transition: opacity 0.18s ease;
}

.modal-leave-active .modal-content {
  animation: modal-out 0.18s ease-in forwards;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes modal-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}
</style>
