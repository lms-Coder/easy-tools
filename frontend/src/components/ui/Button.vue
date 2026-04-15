<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'default' | 'primary' | 'subtle' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}>(), {
  variant: 'default',
  size: 'md',
  disabled: false,
  loading: false
})
</script>

<template>
  <button
    :class="['btn', `btn-${variant}`, `btn-${size}`]"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="btn-spinner" />
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0 var(--spacing-md);
  background: var(--bg-card);
  color: var(--text-primary);
  white-space: nowrap;
  user-select: none;
}

.btn:active:not(:disabled) {
  transform: scale(0.97);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sizes */
.btn-sm {
  height: 24px;
  font-size: var(--font-size-xs);
  padding: 0 var(--spacing-sm);
}

.btn-md {
  height: 28px;
}

.btn-lg {
  height: 32px;
  font-size: var(--font-size-base);
  padding: 0 var(--spacing-lg);
}

/* Variants */
.btn-default {
  background: var(--bg-card);
  color: var(--text-primary);
  border-color: var(--border-default);
}

.btn-default:hover:not(:disabled) {
  background: var(--bg-hover);
}

.btn-primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.btn-subtle {
  background: transparent;
  color: var(--text-secondary);
  border-color: transparent;
}

.btn-subtle:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-danger {
  background: var(--error);
  color: #fff;
  border-color: var(--error);}

.btn-danger:hover:not(:disabled) {
  background: var(--error);
  opacity: 0.85;
}

/* Spinner */
.btn-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: var(--radius-full);
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
