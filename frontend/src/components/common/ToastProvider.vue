<script setup lang="ts">
import ToastItem from './ToastItem.vue'
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <ToastItem
        v-for="(toast, index) in toasts"
        :key="toast.id"
        :toast="toast"
        :index="index"
      />
    </div>
  </Teleport>
  <slot />
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.toast-container > :deep(*) {
  pointer-events: auto;
}
</style>
