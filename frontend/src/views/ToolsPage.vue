<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import { toast } from '@/composables/useToast'
import { openTool } from '@/utils/toolWindow'
import { getIcon } from '@/utils/icons'
import { getCategoryColor as getCategoryColorShared } from '@/utils/categories'
import {
  ArrowLeft,
  Search,
  Star,
  Flame,
  Code,
} from 'lucide-vue-next'
import IconParkAllApplication from '@/components/icons/IconParkAllApplication.vue'

const router = useRouter()
const route = useRoute()
const configStore = useConfigStore()


const searchQuery = ref('')

const selectedCategory = computed(() => {
  const category = route.query.category as string
  return category ? decodeURIComponent(category) : ''
})

const totalCount = computed(() => configStore.enabledTools.length)
const categories = computed(() => configStore.toolsByCategory)

const categoriesWithColors = computed(() => {
  return categories.value.map((cat, index) => ({
    ...cat,
    color: getCategoryColorShared(cat.name)
  }))
})

const filteredTools = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  const activeCategory = selectedCategory.value

  let tools = configStore.enabledTools

  if (activeCategory) {
    tools = tools.filter(t => t.category === activeCategory)
  }

  if (!query) return tools

  return tools.filter(tool =>
    tool.name.toLowerCase().includes(query) ||
    tool.id.toLowerCase().includes(query) ||
    (tool.desc || tool.description || '').toLowerCase().includes(query)
  )
})

const popularTools = computed(() => {
  const ranking = configStore.usageStatsSummary?.ranking?.slice(0, 5) || []
  return ranking.map(item => {
    const tool = configStore.getToolById(item.toolId)
    return tool
  }).filter((t): t is NonNullable<typeof t> => t != null)
})

function getToolIcon(iconName?: string) {
  return getIcon(iconName)
}

function getCategoryColor(category: string): string {
  return getCategoryColorShared(category)
}

function selectCategory(categoryName = '') {
  if (!categoryName) {
    router.push('/tools')
    return
  }
  router.push({
    path: '/tools',
    query: { category: encodeURIComponent(categoryName) }
  })
}

async function goToTool(tool: any) {
  if (!tool?.id) {
    toast.error('工具信息不完整')
    return
  }
  await openTool({ id: String(tool.id), name: tool.name })
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="tools-page">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <button class="back-btn" @click="goBack">
          <ArrowLeft :size="14" />
          <span>返回首页</span>
        </button>
        <div class="sidebar-search">
          <Search :size="13" class="search-icon" />
          <input v-model="searchQuery" type="text" placeholder="搜索工具..." />
        </div>
      </div>

      <nav class="sidebar-nav">
        <button
          class="nav-item"
          :class="{ active: !selectedCategory }"
          @click="selectCategory()"
        >
          <IconParkAllApplication class="nav-icon" style="width: 14px; height: 14px;" />
          <span class="nav-label">全部</span>
          <span class="nav-count">{{ totalCount }}</span>
        </button>

        <div class="nav-section" v-if="categoriesWithColors.length">
          <div class="nav-section-title">分类</div>
          <button
            v-for="cat in categoriesWithColors"
            :key="cat.name"
            class="nav-item"
            :class="{ active: selectedCategory === cat.name }"
            @click="selectCategory(cat.name)"
          >
            <span class="nav-dot" :style="{ background: cat.color }"></span>
            <span class="nav-label">{{ cat.name }}</span>
            <span class="nav-count">{{ cat.tools.length }}</span>
          </button>
        </div>

        <div class="nav-section" v-if="popularTools.length && !searchQuery">
          <div class="nav-section-title">
            <Flame :size="11" class="fire-icon" />
            常用
          </div>
          <div
            v-for="(tool, index) in popularTools.slice(0, 5)"
            :key="tool?.id"
            class="popular-item"
            @click="tool && goToTool(tool)"
          >
            <span class="popular-rank" :class="{ top: index < 3 }">{{ index + 1 }}</span>
            <div class="popular-icon">
              <component :is="getToolIcon(tool?.icon)" :size="11" />
            </div>
            <span class="popular-name">{{ tool?.name }}</span>
          </div>
        </div>
      </nav>
    </aside>

    <!-- 主内容区 - macOS Finder 风格 -->
    <main class="main-content">
      <!-- 工具栏 -->
      <div class="toolbar">
        <h2 class="toolbar-title">{{ selectedCategory || '全部工具' }}</h2>
        <span class="toolbar-count">{{ filteredTools.length }} 个工具</span>
      </div>

      <!-- 内容区 - 网格卡片 -->
      <div class="content-area scrollbar-hide">
        <Transition name="list-fade" mode="out-in">
          <div v-if="filteredTools.length" class="tool-groups" :key="selectedCategory + searchQuery">
            <template v-for="cat in categoriesWithColors" :key="cat.name">
              <template v-if="filteredTools.some(t => t.category === cat.name)">
                <div class="group-section">
                  <div class="group-header">
                    <span class="group-dot" :style="{ background: cat.color }"></span>
                    <span class="group-name">{{ cat.name }}</span>
                    <span class="group-count">{{ filteredTools.filter(t => t.category === cat.name).length }}</span>
                  </div>
                  <div class="tool-grid">
                    <div
                      v-for="tool in filteredTools.filter(t => t.category === cat.name)"
                      :key="tool.id"
                      class="tool-card"
                      @click="goToTool(tool)"
                    >
                      <div class="tool-icon-box" :style="{ background: `${cat.color}15`, color: cat.color }">
                        <component :is="getToolIcon(tool.icon)" :size="17" />
                      </div>
                      <div class="tool-card-info">
                        <span class="tool-name">{{ tool.name }}</span>
                        <span class="tool-desc">{{ tool.desc || tool.description || '实用工具' }}</span>
                      </div>
                      <div class="tool-tip">
                        <div class="tip-title">{{ tool.name }}</div>
                        <div class="tip-desc">{{ tool.desc || tool.description || '实用工具' }}</div>
                        <div class="tip-cat">
                          <span class="tip-dot" :style="{ background: cat.color }"></span>
                          {{ cat.name }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </template>
          </div>

          <div v-else class="empty-state" key="empty">
            <div class="empty-icon-box">
              <Search :size="22" />
            </div>
            <h3 class="empty-title">未找到工具</h3>
            <p class="empty-desc">没有匹配「{{ searchQuery }}」的工具</p>
            <button class="empty-btn" @click="searchQuery = ''; selectCategory()">
              清除筛选
            </button>
          </div>
        </Transition>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ====== 页面布局 ====== */
.tools-page {
  display: grid;
  grid-template-columns: 200px 1fr;
  height: 100%;
  overflow: hidden;
  background: var(--bg-primary);
}

/* ====== 侧边栏 ====== */
.sidebar {
  display: flex;
  flex-direction: column;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border-right: 1px solid var(--glass-border-weak);
  overflow: hidden;
  min-width: 0;
}

.sidebar-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 14px 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 150ms ease;
  font-size: 12px;
  width: fit-content;
}

.back-btn:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.sidebar-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  transition: all 150ms ease;
}

.sidebar-search:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-light);
}

.search-icon {
  font-size: 13px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.sidebar-search input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--text-primary);
  outline: none;
}

.sidebar-search input::placeholder {
  color: var(--text-muted);
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px;
  scrollbar-width: none;
}

.sidebar-nav::-webkit-scrollbar { display: none; }

.nav-section {
  margin-bottom: 14px;
}

.nav-section:first-child {
  margin-bottom: 8px;
}

.nav-section-title {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 8px 4px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.fire-icon {
  font-size: 11px;
  color: var(--warning);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  margin-bottom: 1px;
  margin-left: 4px;
  background: transparent;
  border: 1px solid transparent;
  border-left: 2.5px solid transparent;
  border-radius: 0 6px 6px 0;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 150ms ease;
  text-align: left;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent-light);
  border-left-color: var(--accent);
  color: var(--accent);
  font-weight: 500;
}

.nav-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.nav-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-count {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-secondary);
  padding: 1px 6px;
  border-radius: 4px;
  min-width: 18px;
  text-align: center;
}

.nav-item.active .nav-count {
  background: var(--accent-light);
  color: var(--accent);
}

.popular-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 150ms ease;
  margin-left: 4px;
}

.popular-item:hover {
  background: var(--bg-hover);
}

.popular-rank {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}

.popular-rank.top {
  color: var(--warning);
}

.popular-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  font-size: 11px;
  flex-shrink: 0;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.popular-name {
  font-size: 11px;
  color: var(--text-secondary);
}

/* ====== 主内容 ====== */
.main-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px 10px;
  flex-shrink: 0;
}

.toolbar-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.3px;
}

.toolbar-count {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

/* 内容滚动区 */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 4px 20px 20px;
  scrollbar-width: none;
}

.content-area::-webkit-scrollbar { display: none; }

.tool-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ====== 分组区域 ====== */
.group-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 2px;
}

.group-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.group-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.group-count {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted);
}

/* ====== 工具网格 ====== */
.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px;
}

/* ====== 工具卡片 ====== */
.tool-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border-weak);
  border-radius: 12px;
  cursor: pointer;
  transition: all 150ms ease;
  backdrop-filter: var(--glass-blur-sm);
  overflow: visible;
  z-index: 1;
}

.tool-card:hover {
  z-index: 10;
  border-color: var(--border-default);
  transform: translateY(-1px);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
}

.tool-card:active {
  transform: translateY(0) scale(0.98);
  transition-duration: 0.08s;
}

.tool-card .tool-icon-box {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 17px;
  flex-shrink: 0;
  transition: transform 150ms ease;
}

.tool-card:hover .tool-icon-box {
  transform: scale(1.06);
}

.tool-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tool-card .tool-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.tool-card .tool-desc {
  font-size: 10px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
  margin-top: 2px;
}

.tool-card .tool-tip {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) scale(0.92);
  min-width: 160px;
  max-width: 220px;
  padding: 10px 12px;
  background: var(--bg-popover);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  border: 1px solid var(--border-default);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: all 150ms ease 300ms;
  z-index: 20;
}

.tool-card .tool-tip::after {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-bottom-color: var(--border-default);
}

.tool-card .tool-tip::before {
  content: '';
  position: absolute;
  bottom: calc(100% - 1px);
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-bottom-color: var(--bg-popover);
  z-index: 1;
}

.tool-card:hover .tool-tip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) scale(1);
}

.tip-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tip-desc {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 6px;
}

.tip-cat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--text-muted);
}

.tip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ====== 空状态 ====== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon-box {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  margin-bottom: 16px;
  font-size: 22px;
  color: var(--text-muted);
}

.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.empty-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0 0 16px;
}

.empty-btn {
  padding: 7px 16px;
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  color: var(--accent);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.empty-btn:hover {
  background: var(--accent-light);
  border-color: var(--accent);
}

/* ====== 动画 ====== */
.list-fade-enter-active {
  animation: fadeIn 0.2s ease;
}

.list-fade-leave-active {
  animation: fadeOut 0.12s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* 交错入场动画 */
.list-fade-enter-active .tool-card {
  animation: cardStagger 0.3s ease both;
}

@keyframes cardStagger {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.list-fade-enter-active .tool-card:nth-child(1) { animation-delay: 0s; }
.list-fade-enter-active .tool-card:nth-child(2) { animation-delay: 0.03s; }
.list-fade-enter-active .tool-card:nth-child(3) { animation-delay: 0.06s; }
.list-fade-enter-active .tool-card:nth-child(4) { animation-delay: 0.09s; }
.list-fade-enter-active .tool-card:nth-child(5) { animation-delay: 0.12s; }
.list-fade-enter-active .tool-card:nth-child(6) { animation-delay: 0.15s; }
.list-fade-enter-active .tool-card:nth-child(7) { animation-delay: 0.18s; }
.list-fade-enter-active .tool-card:nth-child(8) { animation-delay: 0.21s; }
.list-fade-enter-active .tool-card:nth-child(9) { animation-delay: 0.24s; }
.list-fade-enter-active .tool-card:nth-child(10) { animation-delay: 0.27s; }
.list-fade-enter-active .tool-card:nth-child(n+11) { animation-delay: 0.3s; }

/* ====== 响应式 ====== */
@media (max-width: 800px) {
  .tools-page {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }

  .content-area {
    padding: 12px 16px 16px;
  }
}

@media (max-width: 500px) {
  .toolbar {
    padding: 12px 16px 8px;
  }

  .content-area {
    padding: 10px 12px 14px;
  }

  .tool-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
  }

  .tool-card {
    padding: 14px 6px 10px;
    border-radius: 12px;
  }

  .tool-card .tool-icon-box {
    width: 34px;
    height: 34px;
    font-size: 16px;
    border-radius: 10px;
  }

  .tool-card .tool-name {
    font-size: 11px;
  }
}

html.dark .tool-card .tool-desc {
  color: var(--text-muted);
}

html.dark .tip-title {
  color: var(--text-primary);
}

html.dark .tip-desc {
  color: #94a3b8;
}
</style>
