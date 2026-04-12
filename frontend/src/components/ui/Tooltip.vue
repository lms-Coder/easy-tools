<script setup lang="ts">
withDefaults(defineProps<{
  content: string
  position?: 'top' | 'bottom'
}>(), {
  position: 'bottom'
})
</script>

<template>
  <div class="tooltip-wrapper">
    <slot />
    <div :class="['tooltip-popup', `tooltip-${position}`]">
      {{ content }}
    </div>
  </div>
</template>

<style scoped>
.tooltip-wrapper {
  position: relative;
  display: inline-flex;
}

.tooltip-popup {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  background: var(--bg-tooltip);
  color: var(--text-inverse);
  font-size: var(--font-size-xs);
  border-radius: var(--radius-xs);
  box-shadow: var(--shadow-sm);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--transition-fast);
  z-index: var(--z-tooltip);
}

.tooltip-bottom {
  top: calc(100% + 6px);
}

.tooltip-top {
  bottom: calc(100% + 6px);
}

.tooltip-wrapper:hover .tooltip-popup {
  opacity: 1;
}
</style>
