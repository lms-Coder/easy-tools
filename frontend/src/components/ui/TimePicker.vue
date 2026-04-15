<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import dayjs, { type Dayjs } from 'dayjs'

const props = withDefaults(defineProps<{
  modelValue: Dayjs | null
  placeholder?: string
  disabled?: boolean
  showSeconds?: boolean
}>(), {
  placeholder: '选择时间',
  disabled: false,
  showSeconds: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: Dayjs | null]
}>()

const open = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const hourRef = ref<HTMLElement | null>(null)
const minuteRef = ref<HTMLElement | null>(null)
const secondRef = ref<HTMLElement | null>(null)

const viewHour = ref(0)
const viewMinute = ref(0)
const viewSecond = ref(0)

const hours = Array.from({ length: 24 }, (_, i) => i)
const minutes = Array.from({ length: 60 }, (_, i) => i)
const seconds = Array.from({ length: 60 }, (_, i) => i)

const displayText = computed(() => {
  if (!props.modelValue) return ''
  return props.modelValue.format(props.showSeconds ? 'HH:mm:ss' : 'HH:mm')
})

const panelStyle = computed(() => {
  if (!open.value || !wrapperRef.value) return {}
  const rect = wrapperRef.value.getBoundingClientRect()
  const below = window.innerHeight - rect.bottom > 260
  return {
    position: 'fixed' as const,
    zIndex: 10000,
    top: below ? `${rect.bottom + 4}px` : undefined,
    bottom: below ? undefined : `${window.innerHeight - rect.top + 4}px`,
    left: `${rect.left}px`,
  }
})

function toggle() {
  if (props.disabled) return
  open.value = !open.value
}

watch(open, (val) => {
  if (val) {
    if (props.modelValue) {
      viewHour.value = props.modelValue.hour()
      viewMinute.value = props.modelValue.minute()
      viewSecond.value = props.modelValue.second()
    }
    nextTick(() => {
      scrollToSelected(hourRef.value)
      scrollToSelected(minuteRef.value)
      scrollToSelected(secondRef.value)
    })
  }
})

function scrollToSelected(listEl: HTMLElement | null) {
  if (!listEl) return
  const selected = listEl.querySelector('.ui-timepicker-item-active')
  if (selected) selected.scrollIntoView({ block: 'center', behavior: 'instant' })
}

function selectHour(h: number) {
  viewHour.value = h
  emitTime()
}

function selectMinute(m: number) {
  viewMinute.value = m
  emitTime()
}

function selectSecond(s: number) {
  viewSecond.value = s
  emitTime()
}

function emitTime() {
  const base = props.modelValue || dayjs()
  emit('update:modelValue', base.hour(viewHour.value).minute(viewMinute.value).second(viewSecond.value))
}

function onMousedownOutside(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node
  if (!wrapperRef.value?.contains(target) && !panelRef.value?.contains(target)) {
    open.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) open.value = false
}

onMounted(() => {
  document.addEventListener('mousedown', onMousedownOutside)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onMousedownOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    ref="wrapperRef"
    :class="['ui-timepicker', { 'ui-timepicker-open': open, 'ui-timepicker-disabled': disabled }]"
  >
    <button class="ui-timepicker-trigger" @click="toggle" :disabled="disabled">
      <span :class="['ui-timepicker-value', { 'ui-timepicker-placeholder': !displayText }]">
        {{ displayText || placeholder }}
      </span>
      <ChevronRight class="ui-timepicker-arrow" :size="14" />
    </button>
  </div>
  <Teleport to="body">
    <Transition name="timepicker-panel">
      <div v-if="open" ref="panelRef" class="ui-timepicker-panel" :style="panelStyle">
        <div ref="hourRef" class="ui-timepicker-column">
          <div
            v-for="h in hours" :key="'h'+h"
            :class="['ui-timepicker-item', { 'ui-timepicker-item-active': viewHour === h }]"
            @click="selectHour(h)"
          >{{ String(h).padStart(2, '0') }}</div>
        </div>
        <div class="ui-timepicker-divider"></div>
        <div ref="minuteRef" class="ui-timepicker-column">
          <div
            v-for="m in minutes" :key="'m'+m"
            :class="['ui-timepicker-item', { 'ui-timepicker-item-active': viewMinute === m }]"
            @click="selectMinute(m)"
          >{{ String(m).padStart(2, '0') }}</div>
        </div>
        <template v-if="showSeconds">
          <div class="ui-timepicker-divider"></div>
          <div ref="secondRef" class="ui-timepicker-column">
            <div
              v-for="s in seconds" :key="'s'+s"
              :class="['ui-timepicker-item', { 'ui-timepicker-item-active': viewSecond === s }]"
              @click="selectSecond(s)"
            >{{ String(s).padStart(2, '0') }}</div>
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.timepicker-panel-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.timepicker-panel-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.timepicker-panel-enter-from,
.timepicker-panel-leave-to {
  opacity: 0;
  transform: scaleY(0.92);
}

.ui-timepicker-panel {
  transform-origin: top center;
  display: flex;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: var(--radius-lg);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  overflow: hidden;
  user-select: none;
}

:root.dark .ui-timepicker-panel {
  background: rgba(30, 30, 40, 0.78);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.36),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.ui-timepicker-column {
  width: 52px;
  height: 200px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.ui-timepicker-column::-webkit-scrollbar {
  display: none;
}

.ui-timepicker-divider {
  width: 1px;
  background: var(--border-subtle);
  align-self: stretch;
}

.ui-timepicker-item {
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-family: var(--font-mono);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ui-timepicker-item:hover {
  background: var(--bg-hover);
}

.ui-timepicker-item-active {
  color: var(--accent);
  font-weight: 700;
  background: var(--accent-light);
}
</style>

<style scoped>
.ui-timepicker {
  display: block;
}

.ui-timepicker-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.ui-timepicker-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
}

.ui-timepicker-trigger:hover {
  border-color: var(--border-strong);
  background: var(--bg-hover);
}

.ui-timepicker-open .ui-timepicker-trigger,
.ui-timepicker-trigger:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-light);
}

.ui-timepicker-value {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ui-timepicker-placeholder {
  color: var(--text-muted);
}

.ui-timepicker-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.ui-timepicker-open .ui-timepicker-arrow {
  transform: rotate(90deg);
}
</style>
