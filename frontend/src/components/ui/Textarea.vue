<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  disabled?: boolean
  rows?: number
  readonly?: boolean
  mono?: boolean
}>(), {
  placeholder: '',
  disabled: false,
  rows: 4,
  readonly: false,
  mono: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <textarea
    :class="['textarea', { 'textarea-mono': mono }]"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :rows="rows"
    @input="onInput"
  />
</template>

<style scoped>
.textarea {
  width: 100%;
  padding: var(--spacing-sm);
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  outline: none;
  resize: vertical;
  line-height: var(--line-height-normal);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  box-sizing: border-box;
}

.textarea::placeholder {
  color: var(--text-muted);
}

.textarea:hover:not(:disabled) {
  border-color: var(--border-strong);
}

.textarea:focus:not(:disabled) {
  border-color: var(--border-focus);
  box-shadow: var(--shadow-focus);
}

.textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.textarea-mono {
  font-family: var(--font-family-mono);
}
</style>
