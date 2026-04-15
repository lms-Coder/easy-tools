<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import { useThemeStore } from '@/stores/theme'
import {
  Sun,
  Moon,
  Settings,
  Search,
} from 'lucide-vue-next'
import Tooltip from '@/components/ui/Tooltip.vue'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()
const themeStore = useThemeStore()

// 当前页面标题
const pageTitle = computed(() => {
  const path = route.path
  if (path === '/' || path === '/home') return '首页'

  const tool = configStore.getToolById(path.split('/').pop() || '')
  return tool?.name || 'Easy Tools'
})

// 切换主题
const handleThemeToggle = () => {
  themeStore.toggle()
}

// 跳转设置
const goToSettings = () => {
  router.push('/settings')
}

// 搜索 - 跳转工具箱并聚焦搜索框
const goToSearch = () => {
  router.push('/tools')
}
</script>

<template>
  <header class="header">
    <!-- 左侧：标题 -->
    <div class="header-left">
      <h1 class="page-title">{{ pageTitle }}</h1>
    </div>

    <!-- 右侧：操作区 -->
    <div class="header-right">
      <!-- 搜索按钮 -->
      <Tooltip content="搜索工具" position="bottom">
        <button class="glass-icon-btn header-btn" @click="goToSearch">
          <Search :size="16" />
        </button>
      </Tooltip>

      <!-- 主题切换 -->
      <Tooltip :content="themeStore.isDark ? '切换到亮色模式' : '切换到暗色模式'" position="bottom">
        <button class="glass-icon-btn header-btn" @click="handleThemeToggle">
          <Sun :size="16" v-if="themeStore.isDark" />
          <Moon :size="16" v-else />
        </button>
      </Tooltip>

      <!-- 设置按钮 -->
      <Tooltip content="设置" position="bottom">
        <button class="glass-icon-btn header-btn" @click="goToSettings">
          <Settings :size="16" />
        </button>
      </Tooltip>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height, 40px);
  padding: 0 var(--spacing-lg, 16px);
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-subtle);
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 12px);
}

.page-title {
  font-size: var(--font-size-base, 13px);
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 4px);
}

.header-btn {
  color: var(--text-secondary);
  transition: color var(--transition-fast, 100ms ease);
}

.header-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-hover);
}
</style>
