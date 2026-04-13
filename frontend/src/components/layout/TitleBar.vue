<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useConfigStore } from '@/stores/config'
import {
  Minus,
  Maximize,
  Minimize,
  X,
  Moon,
  Sun,
  Settings,
  Home,
} from 'lucide-vue-next'
import { Window, Events } from '@wailsio/runtime'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const configStore = useConfigStore()

// 窗口状态
const isMaximised = ref(false)

// 当前页面标题
const pageTitle = computed(() => {
  const title = route.meta?.title as string
  return title || ''
})

// 是否暗色主题
const isDark = computed(() => themeStore.currentTheme === 'dark')

// 窗口控制
const minimizeWindow = () => {
  if (configStore.systemConfig.minimizeToTray) {
    Window.Hide()
  } else {
    Window.Minimise()
  }
}
const toggleMaximise = () => Window.ToggleMaximise()
const closeWindow = () => Window.Close()

// 切换主题（带动画，从按钮位置开始）
const handleToggleTheme = (event: MouseEvent) => {
  themeStore.toggle(event)
}

// 进入设置
const goToSettings = () => {
  router.push('/settings')
}

// 返回首页
const goToHome = () => {
  router.push('/')
}

// 事件取消订阅函数
const unsubscribers: (() => void)[] = []

onMounted(async () => {
  // 获取初始状态
  try {
    isMaximised.value = await Window.IsMaximised()
  } catch {
    // 忽略错误
  }

  // 监听窗口最大化事件
  try {
    const unsub1 = Events.On('common:WindowMaximise', () => {
      isMaximised.value = true
    })
    unsubscribers.push(unsub1)
  } catch {
    // 忽略错误
  }

  // 监听窗口取消最大化事件
  try {
    const unsub2 = Events.On('common:WindowUnMaximise', () => {
      isMaximised.value = false
    })
    unsubscribers.push(unsub2)
  } catch {
    // 忽略错误
  }
})

onUnmounted(() => {
  unsubscribers.forEach(unsub => unsub())
})
</script>

<template>
  <div class="titlebar">
    <!-- 左侧：标题区域 (可拖拽) -->
    <div class="drag">
      <span class="title-text">{{ configStore.appName }}</span>
      <span class="title-sep" v-if="pageTitle && pageTitle !== '首页'">/</span>
      <span class="title-page" v-if="pageTitle && pageTitle !== '首页'">{{ pageTitle }}</span>
    </div>

    <!-- 右侧：功能按钮 + 窗口控制 -->
    <div class="ctrls">
      <!-- 页面导航 -->
      <button v-if="route.path === '/' || route.path === '/home'" class="ctrl-btn" @click="goToSettings" title="设置">
        <Settings :size="14" />
      </button>
      <button v-if="route.path === '/settings' || route.path === '/tools'" class="ctrl-btn" @click="goToHome" title="首页">
        <Home :size="14" />
      </button>

      <!-- 主题切换 -->
      <button class="ctrl-btn theme-btn" @click="handleToggleTheme" :title="isDark ? '亮色模式' : '暗色模式'">
        <Sun :size="14" v-if="isDark" />
        <Moon :size="14" v-else />
      </button>

      <!-- 窗口控制 -->
      <div class="win-group">
        <button class="ctrl-btn" @click="minimizeWindow" title="最小化">
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
    </div>
  </div>
</template>

<style scoped>
.titlebar {
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
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
}

/* ====== 左侧标题 ====== */
.drag {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 100%;
  --wails-draggable: drag;
  min-width: 0;
}

.title-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.2px;
  white-space: nowrap;
}

.title-sep {
  color: var(--text-muted);
  font-size: 11px;
  opacity: 0.4;
  flex-shrink: 0;
}

.title-page {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ====== 右侧控制区 ====== */
.ctrls {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 100%;
  flex-shrink: 0;
}

/* 窗口控制组 */
.win-group {
  display: flex;
  align-items: center;
  gap: 1px;
  margin-left: 4px;
  padding-left: 4px;
  border-left: 1px solid var(--border-subtle);
}

/* 控制按钮 */
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

/* 主题按钮 */
.theme-btn:hover {
  background: var(--accent-light);
  color: var(--accent);
}

/* 关闭按钮 */
.close-btn:hover {
  background: var(--error);
  color: #fff;
}

/* ====== 响应式 ====== */
@media (max-width: 600px) {
  .title-text {
    font-size: 12px;
  }

  .title-page {
    max-width: 80px;
  }

  .ctrl-btn {
    width: 26px;
    height: 26px;
    font-size: 13px;
  }
}
</style>
