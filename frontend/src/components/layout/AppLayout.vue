<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import TitleBar from './TitleBar.vue'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

const route = useRoute()
const configStore = useConfigStore()

// 是否显示侧边栏（首页、设置页不显示）
const showSidebar = computed(() => {
  const path = route.path
  return path !== '/' && path !== '/home' && path !== '/settings' && path !== '/tools'
})

// 是否显示头部（首页、设置页、工具列表页不显示）
const showHeader = computed(() => {
  const path = route.path
  return path !== '/' && path !== '/home' && path !== '/settings' && path !== '/tools'
})

const transitionName = computed(() => {
  const path = route.path

  if (path === '/tools') return 'page-tools'
  if (path === '/settings') return 'page-settings'

  return 'page-home'
})
</script>

<template>
  <div class="layout">
    <TitleBar />

    <div class="body">
      <Sidebar v-if="showSidebar" />

      <div
        class="main"
        :class="{
          'no-side': !showSidebar,
          'side-collapsed': showSidebar && configStore.sidebarCollapsed,
          'side-expanded': showSidebar && !configStore.sidebarCollapsed
        }"
      >
        <Header v-if="showHeader" />

        <main class="content">
          <router-view v-slot="{ Component, route }">
            <transition :name="transitionName" mode="out-in" :duration="180">
              <component :is="Component" :key="route.path" />
            </transition>
          </router-view>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg-primary);
}

.body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  transition: margin-left var(--transition-normal);
}

.main.no-side { margin-left: 0; }
.main.side-collapsed { margin-left: var(--sidebar-width-collapsed); }
.main.side-expanded { margin-left: var(--sidebar-width-expanded); }

.content {
  flex: 1;
  overflow: auto;
  background: var(--bg-primary);
  position: relative;
}

/* 全屏页面（无侧边栏无头部）由页面内部自行控制滚动 */
.main.no-side .content {
  overflow: hidden;
}

.page-home-enter-active,
.page-home-leave-active,
.page-tools-enter-active,
.page-tools-leave-active,
.page-settings-enter-active,
.page-settings-leave-active {
  transition:
    opacity 140ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 160ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
}

.page-home-enter-from {
  opacity: 0;
  transform: translate3d(-10px, 0, 0);
}

.page-home-leave-to {
  opacity: 0;
  transform: translate3d(6px, 0, 0);
}

.page-tools-enter-from {
  opacity: 0;
  transform: translate3d(10px, 0, 0);
}

.page-tools-leave-to {
  opacity: 0;
  transform: translate3d(-6px, 0, 0);
}

.page-settings-enter-from {
  opacity: 0;
  transform: translate3d(0, 8px, 0);
}

.page-settings-leave-to {
  opacity: 0;
  transform: translate3d(0, -5px, 0);
}

@media (prefers-reduced-motion: reduce) {
  .page-home-enter-active,
  .page-home-leave-active,
  .page-tools-enter-active,
  .page-tools-leave-active,
  .page-settings-enter-active,
  .page-settings-leave-active {
    transition: opacity 140ms ease;
  }

  .page-home-enter-from,
  .page-home-leave-to,
  .page-tools-enter-from,
  .page-tools-leave-to,
  .page-settings-enter-from,
  .page-settings-leave-to {
    transform: none;
  }
}
</style>
