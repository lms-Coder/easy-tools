<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import { toast } from '@/composables/useToast'
import { openTool } from '@/utils/toolWindow'
import { getIcon } from '@/utils/icons'
import { getCategoryColor as getCategoryColorShared } from '@/utils/categories'
import Tooltip from '@/components/ui/Tooltip.vue'
import {
  ArrowLeft,
  Search,
  Star,
  Flame,
  Code,
  ChevronRight,
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
      <div class="sidebar-top">
        <button class="back-link" @click="goBack">
          <ArrowLeft :size="13" />
          <span>返回首页</span>
        </button>
        <div class="sidebar-search">
          <Search :size="12" class="search-ico" />
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
          <span class="nav-cnt">{{ totalCount }}</span>
        </button>

        <div class="nav-section" v-if="categoriesWithColors.length">
          <div class="nav-title">分类</div>
          <button
            v-for="cat in categoriesWithColors"
            :key="cat.name"
            class="nav-item"
            :class="{ active: selectedCategory === cat.name }"
            @click="selectCategory(cat.name)"
          >
            <span class="nav-dot" :style="{ background: cat.color }"></span>
            <span class="nav-label">{{ cat.name }}</span>
            <span class="nav-cnt">{{ cat.tools.length }}</span>
          </button>
        </div>

        <div class="nav-section" v-if="popularTools.length && !searchQuery">
          <div class="nav-title">
            <Flame :size="10" class="fire-ico" />
            常用
          </div>
          <div
            v-for="(tool, index) in popularTools.slice(0, 5)"
            :key="tool?.id"
            class="pop-item"
            @click="tool && goToTool(tool)"
          >
            <span class="pop-rank" :class="{ top: index < 3 }">{{ index + 1 }}</span>
            <div class="pop-icon" :style="{ background: getCategoryColor(tool?.category || '') + '15', color: getCategoryColor(tool?.category || '') }">
              <component :is="getToolIcon(tool?.icon)" :size="11" />
            </div>
            <span class="pop-name">{{ tool?.name }}</span>
          </div>
        </div>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <main class="main-area">
      <div class="main-head">
        <h2 class="main-title">{{ selectedCategory || '全部工具' }}</h2>
        <span class="main-count">{{ filteredTools.length }} 个工具</span>
      </div>

      <div class="main-scroll">
        <Transition name="list-fade" mode="out-in">
          <div v-if="filteredTools.length" :key="selectedCategory + searchQuery">
            <template v-for="cat in categoriesWithColors" :key="cat.name">
              <template v-if="filteredTools.some(t => t.category === cat.name)">
                <div class="h-group">
                  <div class="h-group-head">
                    <span class="h-dot" :style="{ background: cat.color }"></span>
                    <span class="h-name">{{ cat.name }}</span>
                    <span class="h-count">{{ filteredTools.filter(t => t.category === cat.name).length }}</span>
                  </div>
                  <div class="h-grid">
                    <Tooltip
                      v-for="tool in filteredTools.filter(t => t.category === cat.name)"
                      :key="tool.id"
                      placement="bottom"
                    >
                      <div class="h-card" @click="goToTool(tool)">
                        <div class="hc-icon" :style="{ background: cat.color + '15', color: cat.color }">
                          <component :is="getToolIcon(tool.icon)" :size="17" />
                        </div>
                        <div class="hc-info">
                          <span class="hc-name">{{ tool.name }}</span>
                          <span class="hc-desc">{{ tool.desc || tool.description || '实用工具' }}</span>
                        </div>
                        <ChevronRight :size="14" class="hc-arrow" />
                      </div>
                      <template #content>
                        <div class="tp-title">{{ tool.name }}</div>
                        <div class="tp-desc">{{ tool.desc || tool.description || '实用工具' }}</div>
                        <div class="tp-cat">
                          <span class="tp-dot" :style="{ background: cat.color }"></span>
                          {{ cat.name }}
                        </div>
                      </template>
                    </Tooltip>
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
/* ====== Page Layout ====== */
.tools-page {
  display: grid;
  grid-template-columns: 220px 1fr;
  height: 100%;
  overflow: hidden;
  background: var(--bg-primary);
}

/* ====== Sidebar ====== */
.sidebar {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  overflow: hidden;
}

.sidebar-top {
  padding: 16px 14px 12px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 150ms ease;
  font-size: 12px;
  width: fit-content;
}

.back-link:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.sidebar-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: all 150ms ease;
}

.sidebar-search:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-light);
}

.search-ico {
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

.nav-title {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px 4px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.fire-ico {
  color: var(--warning);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
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
  color: var(--accent);
  font-weight: 600;
}

.nav-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.nav-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-cnt {
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--bg-tertiary);
  color: var(--text-muted);
  min-width: 18px;
  text-align: center;
}

.nav-item.active .nav-cnt {
  background: var(--accent-light);
  color: var(--accent);
}

/* Popular items */
.pop-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 150ms ease;
}

.pop-item:hover {
  background: var(--bg-hover);
}

.pop-rank {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}

.pop-rank.top {
  color: var(--warning);
}

.pop-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  font-size: 11px;
  flex-shrink: 0;
}

.pop-name {
  font-size: 11px;
  color: var(--text-secondary);
}

/* ====== Main Area ====== */
.main-area {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 16px 24px 12px;
  flex-shrink: 0;
}

.main-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.3px;
}

.main-count {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.main-scroll {
  flex: 1;
  padding: 0 24px 20px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  position: relative;
}

.main-scroll::-webkit-scrollbar { display: none; }

.main-scroll::-webkit-scrollbar { display: none; }

/* ====== Group ====== */
.h-group {
  margin-bottom: 20px;
}

.h-group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.h-dot {
  width: 10px;
  height: 10px;
  border-radius: 4px;
  flex-shrink: 0;
}

.h-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.h-count {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

/* ====== Tool Grid ====== */
.h-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.h-grid > * {
  min-width: 0;
}

/* ====== Tool Card ====== */
.h-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  backdrop-filter: var(--glass-blur-sm);
  box-shadow: var(--shadow-glass);
  cursor: pointer;
  transition: all 200ms ease;
}

.h-card:hover {
  border-color: var(--border-default);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.h-card:active {
  transform: translateY(0) scale(0.98);
  transition-duration: 80ms;
}

.hc-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 17px;
  flex-shrink: 0;
  transition: transform 150ms ease;
}

.h-card:hover .hc-icon {
  transform: scale(1.06);
}

.hc-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hc-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hc-desc {
  font-size: 11px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hc-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
  transition: all 150ms ease;
}

.h-card:hover .hc-arrow {
  color: var(--accent);
  transform: translateX(2px);
}

/* ====== Empty State ====== */
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

/* ====== Transition ====== */
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

.list-fade-enter-active .h-card {
  animation: cardStagger 0.3s ease both;
}

@keyframes cardStagger {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.list-fade-enter-active .h-card:nth-child(1) { animation-delay: 0s; }
.list-fade-enter-active .h-card:nth-child(2) { animation-delay: 0.03s; }
.list-fade-enter-active .h-card:nth-child(3) { animation-delay: 0.06s; }
.list-fade-enter-active .h-card:nth-child(4) { animation-delay: 0.09s; }
.list-fade-enter-active .h-card:nth-child(5) { animation-delay: 0.12s; }
.list-fade-enter-active .h-card:nth-child(n+6) { animation-delay: 0.15s; }

/* ====== Responsive ====== */
@media (max-width: 800px) {
  .tools-page {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }

  .main-scroll {
    padding: 0 16px 16px;
  }
}

@media (max-width: 500px) {
  .main-head {
    padding: 12px 16px 8px;
  }

  .h-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .h-card {
    padding: 12px 14px;
  }
}
</style>
