<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Minus, Maximize, Minimize, X } from 'lucide-vue-next'
import { Window, Events } from '@wailsio/runtime'
import { getIcon } from '@/utils/icons'

const props = defineProps<{
  title: string
  icon?: string
}>()

const titleIcon = computed(() => {
  if (props.icon) return getIcon(props.icon)
  return null
})

const isMaximised = ref(false)

const minimize = () => Window.Minimise()
const toggleMaximise = () => Window.ToggleMaximise()
const closeWindow = () => Window.Close()

const unsubscribers: (() => void)[] = []

onMounted(async () => {
  try {
    isMaximised.value = await Window.IsMaximised()
  } catch {
    // ignore
  }

  try {
    const unsub1 = Events.On('common:WindowMaximise', () => {
      isMaximised.value = true
    })
    unsubscribers.push(unsub1)
  } catch {
    // ignore
  }

  try {
    const unsub2 = Events.On('common:WindowUnMaximise', () => {
      isMaximised.value = false
    })
    unsubscribers.push(unsub2)
  } catch {
    // ignore
  }
})

onUnmounted(() => unsubscribers.forEach(unsub => unsub()))
</script>

<template>
  <header class="tool-titlebar">
    <div class="title-area">
      <div class="title-icon">
        <component :is="titleIcon" v-if="titleIcon" />
        <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </div>
      <h1 class="tool-title">{{ title }}</h1>
      <div class="toolbar-slot">
        <slot />
      </div>
    </div>
    <div class="window-controls">
      <button class="ctrl-btn" @click="minimize" title="最小化">
        <Minus :size="14" />
      </button>
      <button class="ctrl-btn" @click="toggleMaximise" :title="isMaximised ? '还原' : '最大化'">
        <Minimize :size="14" v-if="isMaximised" />
        <Maximize :size="14" v-else />
      </button>
      <button class="ctrl-btn close-btn" @click="closeWindow" title="关闭">
        <X :size="14" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.tool-titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 38px;
  padding: 0 6px 0 0;
  user-select: none;
  flex-shrink: 0;
  position: relative;
  z-index: 100;
  background: var(--bg-header);
  border-bottom: 1px solid var(--border-subtle);
}

.title-area {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 100%;
  min-width: 0;
  --wails-draggable: drag;
}

.title-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-light);
  color: var(--accent);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  font-size: 14px;
}

.title-icon svg {
  width: 13px;
  height: 13px;
}

.tool-title {
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
  white-space: nowrap;
  letter-spacing: -0.2px;
}

.toolbar-slot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  --wails-draggable: no-drag;
}

.window-controls {
  display: flex;
  align-items: center;
  gap: 1px;
  height: 100%;
  flex-shrink: 0;
  --wails-draggable: no-drag;
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.ctrl-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.close-btn:hover {
  background: var(--error);
  color: #fff;
}

@media (max-width: 600px) {
  .tool-title {
    font-size: 12px;
  }

  .ctrl-btn {
    width: 26px;
    height: 26px;
    font-size: 13px;
  }
}
</style>
