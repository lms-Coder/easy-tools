<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, Teleport } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  modelValue: string | number
  options: Array<{ label: string; value: string | number }>
  disabled?: boolean
  placeholder?: string
  size?: 'sm' | 'md'
}>(), {
  disabled: false,
  placeholder: '',
  size: 'md',
})

defineOptions({ inheritAttrs: false })

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const open = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

const dropdownStyle = computed(() => {
  if (!open.value || !wrapperRef.value) return {}
  const rect = wrapperRef.value.getBoundingClientRect()
  const below = window.innerHeight - rect.bottom > 120
  return {
    position: 'fixed' as const,
    zIndex: 10000,
    top: below ? `${rect.bottom + 4}px` : undefined,
    bottom: below ? undefined : `${window.innerHeight - rect.top + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  }
})

const selected = computed(() => {
  const opt = props.options.find(o => o.value === props.modelValue)
  return opt ? opt.label : props.placeholder || ''
})

function toggle() {
  if (props.disabled) return
  open.value = !open.value
}

function select(opt: { label: string; value: string | number }) {
  emit('update:modelValue', opt.value)
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node
  const insideTrigger = wrapperRef.value?.contains(target)
  const insideDropdown = dropdownRef.value?.contains(target)
  if (!insideTrigger && !insideDropdown) {
    open.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    ref="wrapperRef"
    :class="['ui-select', `ui-select-${size}`, { 'ui-select-open': open, 'ui-select-disabled': disabled }]"
    v-bind="$attrs"
  >
    <button class="ui-select-trigger" @click="toggle" :disabled="disabled">
      <span class="ui-select-value">{{ selected }}</span>
      <ChevronDown class="ui-select-arrow" :size="size === 'sm' ? 12 : 14" />
    </button>
  </div>
  <Teleport to="body">
    <Transition name="select-dropdown">
      <div v-if="open" ref="dropdownRef" class="ui-select-dropdown" :style="dropdownStyle">
        <div
          v-for="opt in options"
          :key="opt.value"
          :class="['ui-select-option', { 'ui-select-option-active': opt.value === modelValue }]"
          @click="select(opt)"
        >
          <span class="ui-select-option-label">{{ opt.label }}</span>
          <span v-if="opt.value === modelValue" class="ui-select-option-check">&#10003;</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
/* Dropdown — Teleport 到 body，不能用 scoped */
.select-dropdown-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.select-dropdown-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}

.select-dropdown-enter-from,
.select-dropdown-leave-to {
  opacity: 0;
  transform: scaleY(0.92);
}

.ui-select-dropdown {
  transform-origin: top center;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02);
  backdrop-filter: blur(12px) saturate(1.3);
  -webkit-backdrop-filter: blur(12px) saturate(1.3);
  padding: 4px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.ui-select-dropdown::-webkit-scrollbar {
  display: none;
}

.ui-select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text-primary);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.ui-select-option:hover {
  background: var(--accent-light);
  color: var(--accent);
}

.ui-select-option-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-select-option-check {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
}
</style>

<style scoped>
.ui-select {
  display: block;
}

.ui-select-disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* Trigger */
.ui-select-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-primary);
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
}

.ui-select-trigger:hover {
  border-color: var(--border-strong);
  background: var(--bg-hover);
}

.ui-select-open .ui-select-trigger,
.ui-select-trigger:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-light);
}

.ui-select-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.ui-select-open .ui-select-arrow {
  transform: rotate(180deg);
}

/* Sizes */
.ui-select-sm .ui-select-trigger {
  height: 24px;
  padding: 0 6px 0 8px;
  font-size: 11px;
}

.ui-select-md .ui-select-trigger {
  height: 28px;
  padding: 0 8px 0 10px;
  font-size: 12px;
}

.ui-select-value {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
</style>
