<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'

const props = withDefaults(defineProps<{
  visible?: boolean
  placement?: 'top' | 'bottom'
  offset?: number
  width?: string
}>(), {
  visible: undefined,
  placement: 'bottom',
  offset: 8,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const isOpen = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const contentStyle = ref<Record<string, string>>({})

const isControlled = () => props.visible !== undefined

const getOpen = () => isControlled() ? props.visible! : isOpen.value

const setOpen = (val: boolean) => {
  if (isControlled()) {
    emit('update:visible', val)
  } else {
    isOpen.value = val
  }
}

const toggle = () => setOpen(!getOpen())
const open = () => setOpen(true)
const close = () => setOpen(false)

const updatePosition = () => {
  if (!wrapperRef.value || !contentRef.value) return

  const trigger = wrapperRef.value.querySelector('.popover-trigger') as HTMLElement
  if (!trigger) return

  const triggerRect = trigger.getBoundingClientRect()
  const contentEl = contentRef.value
  const padding = 8

  // Reset to measure natural size
  contentEl.style.visibility = 'hidden'
  contentEl.style.position = 'fixed'
  contentEl.style.left = '0px'
  contentEl.style.top = '0px'
  contentEl.style.transform = 'none'
  const contentRect = contentEl.getBoundingClientRect()

  const vw = window.innerWidth
  const vh = window.innerHeight

  // Determine actual placement (flip if not enough space)
  let placement = props.placement
  if (placement === 'bottom' && triggerRect.bottom + props.offset + contentRect.height > vh - padding) {
    placement = 'top'
  } else if (placement === 'top' && triggerRect.top - props.offset - contentRect.height < padding) {
    placement = 'bottom'
  }

  // Calculate top
  let top: number
  if (placement === 'bottom') {
    top = triggerRect.bottom + props.offset
  } else {
    top = triggerRect.top - props.offset - contentRect.height
  }

  // Calculate left — try centering, clamp within viewport
  let left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2
  left = Math.max(padding, Math.min(left, vw - contentRect.width - padding))

  // Arrow position — always points at trigger center
  const triggerCenterX = triggerRect.left + triggerRect.width / 2
  const arrowX = triggerCenterX - left

  contentStyle.value = {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    visibility: '',
    '--arrow-x': `${arrowX}px`,
  } as any

  contentEl.dataset.placement = placement
}

const onClickOutside = (e: MouseEvent) => {
  if (!wrapperRef.value) return
  if (wrapperRef.value.contains(e.target as Node)) return
  if (contentRef.value && contentRef.value.contains(e.target as Node)) return
  setOpen(false)
}

watch(() => getOpen(), (val) => {
  if (val) {
    nextTick(() => updatePosition())
  }
})

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
  window.addEventListener('resize', updatePosition)
  window.addEventListener('scroll', updatePosition, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updatePosition, true)
})

defineExpose({ toggle, open, close })
</script>

<template>
  <div ref="wrapperRef" class="popover-wrapper">
    <div class="popover-trigger" @click="toggle">
      <slot name="trigger" />
    </div>
    <Teleport to="body">
      <Transition name="popover-fade">
        <div
          v-if="getOpen()"
          ref="contentRef"
          :class="['popover-content', `popover-${contentRef?.dataset.placement || placement}`]"
          :style="contentStyle"
          @click.stop
        >
          <slot :close="close" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style>
/* Not scoped — Teleport to body breaks scoped styles */
.popover-content {
  z-index: 9999;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 12px;
  white-space: normal;
}

/* 箭头 */
.popover-content::before {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  transform: rotate(45deg);
}

.popover-bottom::before {
  top: -6px;
  left: var(--arrow-x, 50%);
  margin-left: -5px;
  border-bottom: none;
  border-right: none;
}

.popover-top::before {
  bottom: -6px;
  left: var(--arrow-x, 50%);
  margin-left: -5px;
  border-top: none;
  border-left: none;
}

/* 过渡动画 */
.popover-fade-enter-active,
.popover-fade-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
}

.popover-fade-enter-from.popover-bottom,
.popover-fade-leave-to.popover-bottom {
  transform: translateY(-4px);
}

.popover-fade-enter-from.popover-top,
.popover-fade-leave-to.popover-top {
  transform: translateY(4px);
}
</style>

<style scoped>
.popover-wrapper {
  position: relative;
  display: inline-flex;
}

.popover-trigger {
  display: inline-flex;
}
</style>
