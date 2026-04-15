<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  disabled?: boolean
  size?: 'sm' | 'md'
}>(), {
  disabled: false,
  size: 'md'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function toggle() {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}
</script>

<template>
  <button
    :class="['switch', `switch-${size}`, { 'switch-on': modelValue, 'switch-disabled': disabled }]"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    @click="toggle"
  >
    <span class="switch-thumb" />
  </button>
</template>

<style scoped>
.switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  border: none;
  border-radius: var(--radius-full);
  background: var(--border-strong);
  cursor: pointer;
  transition: background var(--transition-fast);
  padding: 2px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.switch-on {
  background: var(--accent);
}

.switch-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sizes */
.switch-sm {
  width: 28px;
  height: 16px;
}

.switch-md {
  width: 36px;
  height: 20px;
}

/* Thumb */
.switch-thumb {
  display: block;
  background: var(--text-inverse, #fff);
  border-radius: var(--radius-full);
  transition: transform var(--transition-fast);
  box-shadow: var(--shadow-xs);
}

.switch-sm .switch-thumb {
  width: 12px;
  height: 12px;
}

.switch-md .switch-thumb {
  width: 16px;
  height: 16px;
}

.switch-sm.switch-on .switch-thumb {
  transform: translateX(12px);
}

.switch-md.switch-on .switch-thumb {
  transform: translateX(16px);
}
</style>
