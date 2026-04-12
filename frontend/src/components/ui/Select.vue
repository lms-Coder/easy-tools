<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
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

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

const dropdownStyle = computed(() => {
  if (!open.value || !triggerRef.value) return {}
  const rect = triggerRef.value.getBoundingClientRect()
  const below = window.innerHeight - rect.bottom > 120
  return {
    top: below ? `${rect.bottom + 4}px` : undefined,
    bottom: below ? undefined : `${window.innerHeight - rect.top + 4}px`,
    left: `${rect.left}px`,
    minWidth: `${rect.width}px`,
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
  if (open.value && triggerRef.value && !triggerRef.value.contains(e.target as Node)) {
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
  <div ref="triggerRef" :class="['ui-select', `ui-select-${size}`, { 'ui-select-open': open, 'ui-select-disabled': disabled }]">
    <button class="ui-select-trigger" @click="toggle" :disabled="disabled">
      <span class="ui-select-value">{{ selected }}</span>
      <ChevronDown class="ui-select-arrow" :size="size === 'sm' ? 12 : 14" />
    </button>
    <Transition name="ui-select-fade">
      <div ref="dropdownRef" v-if="open" class="ui-select-dropdown" :style="dropdownStyle">
        <div
          v-for="opt in options"
          :key="opt.value"
          :class="['ui-select-option', { 'ui-select-option-active': opt.value === modelValue }]"
          @click="select(opt)"
        >
          {{ opt.label }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.ui-select {
  position: relative;
  display: inline-flex;
  flex-direction: column;
}

.ui-select-disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* Trigger */
.ui-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  padding: 0;
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

/* Dropdown */
.ui-select-dropdown {
  position: fixed;
  z-index: 10000;
  z-index: 1000;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02);
  padding: 4px;
  overflow: hidden;
}

.ui-select-option {
  padding: 5px 10px;
  font-size: 12px;
  color: var(--text-primary);
  border-radius: var(--radius-xs);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background var(--transition-fast);
}

.ui-select-option:hover {
  background: var(--accent-light);
  color: var(--accent);
}

.ui-select-option-active {
  font-weight: 600;
  color: var(--accent);
}

.ui-select-option-active::after {
  content: '✓';
  float: right;
  margin-left: 12px;
  font-size: 11px;
}

/* Transition */
.ui-select-fade-enter-active,
.ui-select-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.ui-select-fade-enter-from,
.ui-select-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
