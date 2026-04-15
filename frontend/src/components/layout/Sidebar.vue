<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import {
  LayoutGrid,
  Code,
  ArrowLeftRight,
  Lock,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  Home,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const configStore = useConfigStore()

// 侧边栏折叠状态
const collapsed = computed({
  get: () => configStore.sidebarCollapsed,
  set: (val) => configStore.setSidebarCollapsed(val),
})

// 侧边栏宽度
const sidebarWidth = computed(() =>
  collapsed.value ? '52px' : '200px'
)

// 工具分类
const categories = computed(() => configStore.toolsByCategory)

// 分类图标映射
const categoryIconMap: Record<string, any> = {
  '开发工具': Code,
  '编码转换': ArrowLeftRight,
  '时间处理': Clock,
  '文本处理': Clock,
  '安全工具': Lock,
  '系统工具': LayoutGrid,
  '其他': LayoutGrid,
}

// 分类颜色映射
const categoryColorMap: Record<string, string> = {
  '开发工具': '#3b82f6',
  '编码转换': '#10b981',
  '时间处理': '#f59e0b',
  '文本处理': '#06b6d4',
  '安全工具': '#ef4444',
  '系统工具': '#6366f1',
  '其他': '#8b5cf6',
}

const getCategoryIcon = (name: string) => categoryIconMap[name] || LayoutGrid
const getCategoryColor = (name: string) => categoryColorMap[name] || '#3b82f6'

// 当前选中的分类
const activeCategory = computed(() => {
  const cat = route.query.category as string
  return cat ? decodeURIComponent(cat) : ''
})

// 导航到分类
const goToCategory = (name: string) => {
  if (activeCategory.value === name) {
    router.push('/tools')
  } else {
    router.push('/tools?category=' + encodeURIComponent(name))
  }
}

// 切换折叠
const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }" :style="{ width: sidebarWidth }">
    <!-- 导航列表 -->
    <nav class="nav">
      <!-- 首页 -->
      <div
        class="nav-item"
        :class="{ active: route.path === '/' }"
        @click="router.push('/')"
        title="首页"
      >
        <Home class="nav-icon" :size="16" />
        <span class="nav-text" v-show="!collapsed">首页</span>
      </div>

      <!-- 全部工具 -->
      <div
        class="nav-item"
        :class="{ active: route.path === '/tools' && !activeCategory }"
        @click="router.push('/tools')"
        title="全部工具"
      >
        <LayoutGrid class="nav-icon" :size="16" />
        <span class="nav-text" v-show="!collapsed">全部工具</span>
      </div>

      <!-- 分类区域 -->
      <template v-if="categories.length > 0">
        <div class="nav-divider"></div>
        <div class="nav-label" v-show="!collapsed">分类</div>
        <div
          v-for="cat in categories"
          :key="cat.name"
          class="nav-item"
          :class="{ active: activeCategory === cat.name }"
          @click="goToCategory(cat.name)"
          :title="cat.name"
        >
          <span class="cat-dot" :style="{ background: getCategoryColor(cat.name) }"></span>
          <span class="nav-text" v-show="!collapsed">{{ cat.name }}</span>
        </div>
      </template>
    </nav>

    <!-- 底部折叠 -->
    <div class="foot">
      <div class="nav-item" @click="toggleSidebar" :title="collapsed ? '展开' : '收起'">
        <PanelLeftOpen v-if="collapsed" class="nav-icon" :size="16" />
        <PanelLeftClose v-else class="nav-icon" :size="16" />
        <span class="nav-text" v-show="!collapsed">收起</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: var(--titlebar-height);
  left: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--titlebar-height));
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-subtle);
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
}

/* ====== 导航 ====== */
.nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 8px 8px;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 10px;
  margin: 1px 4px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 13px;
  color: var(--text-secondary);
}

.nav-item::before {
  content: '';
  position: absolute;
  left: -4px;
  top: 50%;
  width: 3px;
  height: 0;
  border-radius: 2px;
  background: var(--accent);
  transform: translateY(-50%);
  transition: height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent-light);
  color: var(--accent);
}

.nav-item.active::before {
  height: 16px;
}

.nav-item.active .nav-icon {
  color: var(--accent);
}

.nav-item.active .nav-text {
  font-weight: 500;
}

.nav-icon {
  flex-shrink: 0;
  font-size: 16px;
  color: var(--text-secondary);
}

.nav-text {
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.collapsed .nav-text {
  opacity: 0;
  pointer-events: none;
}

.nav-label {
  padding: 4px 14px 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.collapsed .nav-label {
  opacity: 0;
  pointer-events: none;
}

/* ====== 分类圆点 - macOS 风格 ====== */
.cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.nav-item:hover .cat-dot {
  transform: scale(1.2);
}

.nav-item.active .cat-dot {
  box-shadow: 0 0 0 3px currentColor;
}

/* ====== 分隔线 ====== */
.nav-divider {
  height: 1px;
  margin: 8px 12px;
  background: var(--border-subtle);
}

/* ====== 底部 ====== */
.foot {
  padding: 4px 8px 8px;
  border-top: 1px solid var(--border-subtle);
}

/* ====== 折叠状态 ====== */
.sidebar.collapsed .nav {
  padding: 8px 4px;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0;
}

.sidebar.collapsed .nav-item::before {
  left: 0;
}

.sidebar.collapsed .nav-divider {
  margin: 8px 8px;
}
</style>
