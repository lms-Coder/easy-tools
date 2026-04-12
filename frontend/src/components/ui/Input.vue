<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  disabled?: boolean
  error?: boolean
  type?: string
}>(), {
  placeholder: '',
  disabled: false,
  error: false,
  type: 'text'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <input
    :type="type"
    :class="['input', { 'input-error': error }]"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="onInput"
  />
</template>

<style scoped>
.input {
  width: 100%;
  height: 28px;
  padding: 0 var(--spacing-sm);
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  box-sizing: border-box;
}

.input::placeholder {
  color: var(--text-muted);
}

.input:hover:not(:disabled) {
  border-color: var(--border-strong);
}

.input:focus:not(:disabled) {
  border-color: var(--border-focus);
  box-shadow: var(--shadow-focus);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-error {
  border-color: var(--color-error);
}

.input-error:focus:not(:disabled) {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.2);
}
</style>
