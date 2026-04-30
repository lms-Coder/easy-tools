<script setup lang="ts">
import { ref, nextTick, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  content?: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  disabled?: boolean
}>(), {
  placement: 'bottom',
  delay: 200,
  disabled: false
})

const visible = ref(false)
const actualPlacement = ref(props.placement)
const tooltipRef = ref<HTMLElement>()
const triggerRef = ref<HTMLElement>()
const arrowStyle = ref<Record<string, string>>({})

let showTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null

const GAP = 8
const MARGIN = 8

function computePosition() {
  if (!triggerRef.value || !tooltipRef.value) return

  const trigger = triggerRef.value.getBoundingClientRect()
  const tooltip = tooltipRef.value.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  let placement = props.placement

  const spaceMap = {
    top: trigger.top,
    bottom: vh - trigger.bottom,
    left: trigger.left,
    right: vw - trigger.right
  }

  if (spaceMap[placement] < tooltip.height + GAP + MARGIN) {
    const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const
    if (spaceMap[opposite[placement]] >= tooltip.height + GAP + MARGIN) {
      placement = opposite[placement]
    }
  }

  actualPlacement.value = placement

  let top = 0
  let left = 0

  switch (placement) {
    case 'top':
      top = trigger.top - tooltip.height - GAP
      left = trigger.left + trigger.width / 2 - tooltip.width / 2
      break
    case 'bottom':
      top = trigger.bottom + GAP
      left = trigger.left + trigger.width / 2 - tooltip.width / 2
      break
    case 'left':
      top = trigger.top + trigger.height / 2 - tooltip.height / 2
      left = trigger.left - tooltip.width - GAP
      break
    case 'right':
      top = trigger.top + trigger.height / 2 - tooltip.height / 2
      left = trigger.right + GAP
      break
  }

  left = Math.max(MARGIN, Math.min(left, vw - tooltip.width - MARGIN))
  top = Math.max(MARGIN, Math.min(top, vh - tooltip.height - MARGIN))

  const arrowSize = 5
  const arrowStyleVal: Record<string, string> = {}

  switch (placement) {
    case 'top':
      arrowStyleVal.bottom = '100%'
      arrowStyleVal.left = `${Math.max(arrowSize + 2, Math.min(trigger.left + trigger.width / 2 - left, tooltip.width - arrowSize - 2))}px`
      arrowStyleVal.transform = 'translateX(-50%)'
      break
    case 'bottom':
      arrowStyleVal.top = '100%'
      arrowStyleVal.left = `${Math.max(arrowSize + 2, Math.min(trigger.left + trigger.width / 2 - left, tooltip.width - arrowSize - 2))}px`
      arrowStyleVal.transform = 'translateX(-50%)'
      break
    case 'left':
      arrowStyleVal.right = '100%'
      arrowStyleVal.top = `${Math.max(arrowSize + 2, Math.min(trigger.top + trigger.height / 2 - top, tooltip.height - arrowSize - 2))}px`
      arrowStyleVal.transform = 'translateY(-50%)'
      break
    case 'right':
      arrowStyleVal.left = '100%'
      arrowStyleVal.top = `${Math.max(arrowSize + 2, Math.min(trigger.top + trigger.height / 2 - top, tooltip.height - arrowSize - 2))}px`
      arrowStyleVal.transform = 'translateY(-50%)'
      break
  }

  tooltipRef.value.style.position = 'fixed'
  tooltipRef.value.style.top = `${top}px`
  tooltipRef.value.style.left = `${left}px`
  tooltipRef.value.style.zIndex = '9000'
  arrowStyle.value = arrowStyleVal
}

function onMouseEnter() {
  if (props.disabled) return
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
  showTimer = setTimeout(() => {
    visible.value = true
    nextTick(computePosition)
  }, props.delay)
}

function onMouseLeave() {
  if (showTimer) { clearTimeout(showTimer); showTimer = null }
  hideTimer = setTimeout(() => { visible.value = false }, 100)
}

onUnmounted(() => {
  if (showTimer) clearTimeout(showTimer)
  if (hideTimer) clearTimeout(hideTimer)
})
</script>

<template>
  <div
    ref="triggerRef"
    class="tooltip-trigger"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <slot />
  </div>
  <Teleport to="body">
    <Transition name="tooltip-fade">
      <div
        v-if="visible"
        ref="tooltipRef"
        :class="['tooltip-popup', `tooltip-${actualPlacement}`]"
      >
        <slot name="content">
          {{ content }}
        </slot>
        <span class="tooltip-arrow" :style="arrowStyle" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tooltip-trigger {
  display: block;
  max-width: 100%;
}
</style>

<style>
.tooltip-popup {
  position: fixed;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-xl, 14px);
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.12);
  pointer-events: none;
  z-index: 9000;
  max-width: 240px;
  line-height: 1.4;
}

.tooltip-popup .tp-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tooltip-popup .tp-desc {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 6px;
}

.tooltip-popup .tp-cat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--text-muted);
}

.tooltip-popup .tp-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tooltip-popup .tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border: 5px solid transparent;
}

.tooltip-top .tooltip-arrow {
  border-bottom: none;
  border-top-color: var(--border-default);
}

.tooltip-top .tooltip-arrow::after {
  content: '';
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--bg-popover);
}

.tooltip-bottom .tooltip-arrow {
  border-top: none;
  border-bottom-color: var(--border-default);
}

.tooltip-bottom .tooltip-arrow::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-bottom-color: var(--bg-popover);
}

.tooltip-left .tooltip-arrow {
  border-right: none;
  border-left-color: var(--border-default);
}

.tooltip-right .tooltip-arrow {
  border-left: none;
  border-right-color: var(--border-default);
}

.tooltip-fade-enter-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.tooltip-fade-leave-active {
  transition: opacity 80ms ease;
}

.tooltip-fade-enter-from {
  opacity: 0;
  transform: scale(0.96);
}

.tooltip-fade-leave-to {
  opacity: 0;
}

html.dark .tooltip-popup {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(148, 163, 184, 0.2);
}

html.dark .tooltip-popup .tp-desc {
  color: #94a3b8;
}
</style>
