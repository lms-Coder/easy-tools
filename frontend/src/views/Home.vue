<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import { useThemeStore } from '@/stores/theme'
import { toast } from '@/composables/useToast'
import { useDialog } from '@/composables/useDialog'
import { openTool } from '@/utils/toolWindow'
import dayjs from 'dayjs'

import 'dayjs/locale/zh-cn'
import {
  LayoutGrid,
  Clock,
  Flame,
  Calendar,
  ChevronRight,
  Code,
} from 'lucide-vue-next'
import { getIcon } from '@/utils/icons'

// 注册图表组件
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import {
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])

dayjs.locale('zh-cn')

const router = useRouter()
const route = useRoute()
const configStore = useConfigStore()
const themeStore = useThemeStore()
const { } = useDialog()

// 当前时间
const now = ref(dayjs())
let timer: ReturnType<typeof setInterval>

onMounted(() => {
  timer = setInterval(() => now.value = dayjs(), 1000)
  configStore.loadUsageStats()
})

// 每次进入首页时刷新统计数据
watch(() => route.path, (path) => {
  if (path === '/' || path === '/home') {
    configStore.loadUsageStats()
  }
})

onUnmounted(() => clearInterval(timer))

// 动态问候语
const GREETING_MAP: { start: number; text: string; subs: string[] }[] = [
  { start: 0,  text: '夜深了', subs: ['好的状态从充足的睡眠开始', '效率再高也别忘了身体', '夜深人静，正是专注的好时光'] },
  { start: 6,  text: '早上好', subs: ['清晨的阳光带来无限可能', '用一杯咖啡开启高效的一天', '今天也要元气满满', '祝你今天一切顺利'] },
  { start: 9,  text: '上午好', subs: ['大脑最清醒的时段，冲吧', '专注当下，事半功倍', '趁状态正佳，搞定重要的事', '保持专注，今天也能收获满满'] },
  { start: 12, text: '中午好', subs: ['辛苦了半天，记得吃饭休息', '适当休息，下午更有精神', '小憩片刻，为下午充电', '放松一下，下午继续战斗'] },
  { start: 14, text: '下午好', subs: ['保持节奏，稳步推进', '站起来活动活动再继续', '距离下班又近了一步', '坚持就是胜利，今天也快结束了'] },
  { start: 18, text: '晚上好', subs: ['忙碌了一天，辛苦了', '好好享受属于自己的时间', '学点新东西也是不错的选择', '放松心情，享受宁静的夜晚'] },
  { start: 22, text: '夜深了', subs: ['该休息了，明天继续加油', '熬夜伤身，早睡早起身体好', '夜深人静，适合沉淀和思考'] },
]

const getGreeting = (hour: number) => {
  for (let i = GREETING_MAP.length - 1; i >= 0; i--) {
    if (hour >= GREETING_MAP[i].start) return GREETING_MAP[i]
  }
  return GREETING_MAP[0]
}

const greetingText = computed(() => getGreeting(now.value.hour()).text)

const initialGreeting = getGreeting(dayjs().hour())
const currentSub = ref(initialGreeting.subs[Math.floor(Math.random() * initialGreeting.subs.length)])
const typedSub = ref('')
let typeTimer: ReturnType<typeof setTimeout> | null = null

const runCycle = () => {
  const { subs } = getGreeting(now.value.hour())
  const nextSub = subs[Math.floor(Math.random() * subs.length)]
  currentSub.value = nextSub
  let i = 0
  let phase: 'type' | 'pause' | 'delete' = 'type'

  const tick = () => {
    if (phase === 'type') {
      if (i < nextSub.length) {
        typedSub.value = nextSub.slice(0, i + 1)
        i++
        typeTimer = setTimeout(tick, 60)
      } else {
        phase = 'pause'
        typeTimer = setTimeout(tick, 10000)
      }
    } else if (phase === 'pause') {
      phase = 'delete'
      typeTimer = setTimeout(tick, 30)
    } else {
      if (i > 0) {
        i--
        typedSub.value = nextSub.slice(0, i)
        typeTimer = setTimeout(tick, 30)
      } else {
        runCycle()
      }
    }
  }

  typeTimer = setTimeout(tick, 300)
}

runCycle()

onUnmounted(() => {
  if (typeTimer) clearTimeout(typeTimer)
})

const currentTime = computed(() => now.value.format('HH:mm:ss'))
const currentDate = computed(() => now.value.format('YYYY年M月D日'))
const currentWeekday = computed(() => now.value.format('dddd'))

// 统计数据
const stats = computed(() => [
  {
    label: '工具总数',
    value: configStore.enabledTools.length,
    icon: LayoutGrid,
    color: 'var(--accent)',
    bgColor: 'var(--accent-light)'
  },
  {
    label: '分类数量',
    value: configStore.toolsByCategory.length,
    icon: Calendar,
    color: 'var(--info)',
    bgColor: 'var(--accent-light)'
  },
  {
    label: '今日使用',
    value: configStore.usageStatsSummary?.todayCount || 0,
    icon: Clock,
    color: 'var(--success)',
    bgColor: 'var(--success-light)'
  },
  {
    label: '本周使用',
    value: configStore.usageStatsSummary?.weekCount || 0,
    icon: Flame,
    color: 'var(--warning)',
    bgColor: 'var(--warning-light)'
  },
])

// 主题相关
const isDark = computed(() => themeStore.currentTheme === 'dark')
const textSecondary = computed(() => isDark.value ? '#98989d' : '#6e6e73')
const textMuted = computed(() => isDark.value ? '#636366' : '#86868b')
const borderSubtle = computed(() => isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')
const accentColor = computed(() => isDark.value ? '#0a84ff' : '#007aff')

// 工具分类数据
const CATEGORY_COLORS: Record<string, string> = {
  '开发工具': '#007AFF',
  '编码转换': '#34C759',
  '时间处理': '#FF9F0A',
  '文本处理': '#5AC8FA',
  '安全工具': '#FF3B30',
  '系统工具': '#5856D6',
  '其他': '#AF52DE',
}

const allCategories = computed(() => {
  return configStore.toolsByCategory.map(cat => ({
    name: cat.name,
    count: cat.tools.length,
    color: CATEGORY_COLORS[cat.name] || '#007AFF',
    tools: cat.tools.slice(0, 4)
  }))
})

// 热门分类 - 按工具数量取前4
const categoryData = computed(() => {
  return [...allCategories.value]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
})

// 饼图 - 工具分类分布
const pieOption = computed(() => {
  const data = allCategories.value.map(cat => ({
    name: cat.name,
    value: cat.count,
    itemStyle: { color: cat.color }
  }))

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark.value ? '#2c2c2e' : '#ffffff',
      borderColor: isDark.value ? '#48484a' : '#e5e5ea',
      borderWidth: 1,
      textStyle: {
        color: isDark.value ? '#f5f5f7' : '#1d1d1f',
        fontSize: 12
      },
      formatter: (params: any) => {
        return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${params.color};margin-right:6px;"></span>${params.name}: <b>${params.value}</b>个 (${params.percent}%)`
      }
    },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: isDark.value ? '#2c2c2e' : '#ffffff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}\n{c}个',
        fontSize: 11,
        color: isDark.value ? '#a1a1a6' : '#6e6e73',
        lineHeight: 16
      },
      labelLine: {
        show: true,
        length: 8,
        length2: 12,
        lineStyle: {
          color: isDark.value ? '#48484a' : '#d1d1d6'
        }
      },
      data
    }]
  }
})

// 使用趋势图 - 近7天真实数据
const trendOption = computed(() => {
  const days: string[] = []
  const data: number[] = []
  const dailyStats = configStore.usageStatsSummary?.dailyStats || []

  // 构建日期→数量映射
  const statsMap = new Map<string, number>()
  for (const item of dailyStats) {
    statsMap.set(dayjs(item.date).format('YYYY-MM-DD'), item.count || 0)
  }

  // 生成近7天完整日期（包含今天）
  for (let i = 6; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day')
    const dateStr = date.format('YYYY-MM-DD')
    days.push(date.format('MM-DD'))
    data.push(statsMap.get(dateStr) || 0)
  }

  const maxValue = Math.max(...data, 1)

  return {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}次'
    },
    grid: { left: 8, right: 8, top: 16, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: days,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: textMuted.value,
        fontSize: 10,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      show: false,
      max: Math.ceil(maxValue * 1.2) // 留出顶部空间
    },
    series: [{
      type: 'line',
      smooth: true,
      data,
      lineStyle: {
        color: accentColor.value,
        width: 2.5
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: isDark.value ? 'rgba(10, 132, 255, 0.25)' : 'rgba(0, 122, 255, 0.18)' },
            { offset: 1, color: 'transparent' }
          ]
        }
      },
      symbol: 'circle',
      symbolSize: 4,
      itemStyle: {
        color: accentColor.value,
        borderWidth: 1.5,
        borderColor: isDark.value ? '#2c2c2e' : '#ffffff'
      }
    }]
  }
})

// 使用排行图 - TOP5
const rankOption = computed(() => {
  const ranking = configStore.usageStatsSummary?.ranking?.slice(0, 5) || []
  const data = ranking.map(item => ({
    name: configStore.getToolById(item.toolId)?.name || '未知',
    value: item.useCount
  }))

  if (data.length === 0) {
    // 没有数据时显示默认
    return {
      grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
      xAxis: { type: 'value', show: false, max: 10 },
      yAxis: {
        type: 'category',
        data: ['暂无', '暂无', '暂无', '暂无', '暂无'],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: textMuted.value, fontSize: 11 }
      },
      series: [{
        type: 'bar',
        data: [0, 0, 0, 0, 0],
        barWidth: 8,
        itemStyle: { color: borderSubtle.value, borderRadius: [0, 4, 4, 0] }
      }]
    }
  }

  return {
    grid: { left: 8, right: 36, top: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      show: false,
      max: Math.ceil(Math.max(...data.map(d => d.value)) * 1.2) || 10
    },
    yAxis: {
      type: 'category',
      data: data.map(d => d.name).reverse(),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textSecondary.value, fontSize: 11 }
    },
    series: [{
      type: 'bar',
      data: data.map(d => d.value).reverse(),
      barWidth: 8,
      itemStyle: {
        color: accentColor.value,
        borderRadius: [0, 4, 4, 0]
      },
      label: {
        show: true,
        position: 'right',
        color: textMuted.value,
        fontSize: 10,
        formatter: '{c}'
      }
    }]
  }
})

// 最近使用工具 - 最多4个（排除已禁用的）
const recentTools = computed(() => {
  const recent = configStore.usageStatsSummary?.recentUsed || []
  return recent
    .filter(item => {
      const tool = configStore.getToolById(item.toolId)
      return tool?.enabled
    })
    .slice(0, 4)
    .map(item => {
      const tool = configStore.getToolById(item.toolId)
      return {
        id: item.toolId,
        name: tool?.name || item.toolId,
        icon: tool?.icon,
        category: tool?.category,
        time: formatTime(item.timestamp)
      }
    })
})

const formatTime = (dateStr: string) => {
  const date = dayjs(dateStr)
  const diff = now.value.diff(date, 'minute')
  if (diff < 1) return '刚刚'
  if (diff < 60) return `${diff}分钟前`
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
  return date.format('M/D')
}

// 方法
const goToTools = () => router.push('/tools')

const goToTool = async (tool: any) => {
  if (!tool || !tool.id) {
    toast.error('工具信息不完整')
    return
  }
  await openTool({ id: String(tool.id), name: tool.name })
}
</script>

<template>
  <div class="home">
    <!-- 顶部欢迎区 - macOS 风格简洁标题栏 -->
    <header class="hero-section">
      <div class="hero-content">
        <div class="greeting-block">
          <h1 class="greeting-title">{{ greetingText }}</h1>
          <p class="greeting-sub"><span>{{ typedSub }}</span><span class="cursor" v-if="typedSub.length < currentSub.length">|</span></p>
        </div>

        <div class="time-block">
          <div class="time-display">{{ currentTime }}</div>
          <div class="date-display">
            <span class="date">{{ currentDate }}</span>
            <span class="weekday">{{ currentWeekday }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 主体内容 - 无滚动一屏布局 -->
    <main class="main-content">
      <!-- 顶部行：统计 + 快捷入口 -->
      <section class="top-row">
        <div class="stats-row">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="stat-card"
          >
            <div class="stat-icon" :style="{ background: stat.bgColor, color: stat.color }">
              <component :is="stat.icon" :size="16" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stat.value }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
          </div>
        </div>
        <button class="tools-tile" @click="goToTools">
          <div class="tile-icon">
            <LayoutGrid :size="17" />
          </div>
          <div class="tile-body">
            <span class="tile-title">工具箱</span>
            <span class="tile-sub">{{ configStore.enabledTools.length }} 个工具</span>
          </div>
          <ChevronRight :size="12" class="tile-arrow" />
        </button>
      </section>

      <!-- 双栏内容 - 撑满剩余空间 -->
      <div class="content-grid">
        <!-- 左栏 -->
        <div class="content-col">
          <!-- 最近使用 -->
          <div class="content-group">
            <div class="group-header">
              <h3 class="group-title">最近使用</h3>
            </div>
            <div class="group-content list-content">
              <div
                v-for="item in recentTools"
                :key="item.id"
                class="recent-item"
                @click="goToTool(item)"
              >
                <div class="recent-icon">
                  <component :is="getIcon(item.icon)" v-if="item.icon" :size="13" />
                  <span v-else class="icon-fallback">{{ item.name[0] }}</span>
                </div>
                <div class="recent-info">
                  <span class="recent-name">{{ item.name }}</span>
                  <span class="recent-category">{{ item.category }}</span>
                </div>
                <span class="recent-time">{{ item.time }}</span>
              </div>
              <div v-if="recentTools.length === 0" class="empty-hint">
                暂无使用记录
              </div>
            </div>
          </div>

          <!-- 使用趋势 -->
          <div class="content-group flex-1">
            <div class="group-header">
              <h3 class="group-title">近7天使用</h3>
            </div>
            <div class="group-content chart-content">
              <v-chart class="chart" :option="trendOption" autoresize />
            </div>
          </div>

          <!-- 使用排行 -->
          <div class="content-group flex-1" v-if="rankOption">
            <div class="group-header">
              <h3 class="group-title">使用排行</h3>
            </div>
            <div class="group-content chart-content">
              <v-chart class="chart" :option="rankOption" autoresize />
            </div>
          </div>
        </div>

        <!-- 右栏 -->
        <div class="content-col">
          <!-- 分类饼图 -->
          <div class="content-group flex-1">
            <div class="group-header">
              <h3 class="group-title">分类分布</h3>
            </div>
            <div class="group-content chart-content">
              <v-chart class="chart" :option="pieOption" autoresize />
            </div>
          </div>

          <!-- 热门分类 -->
          <div class="content-group">
            <div class="group-header">
              <h3 class="group-title">热门分类</h3>
              <button class="view-all-btn" @click="goToTools">
                全部 <ChevronRight :size="11" />
              </button>
            </div>
            <div class="group-content list-content">
              <div
                v-for="cat in categoryData"
                :key="cat.name"
                class="category-item"
                :style="{ '--cat-color': cat.color }"
              >
                <div class="category-row">
                  <div class="category-info">
                    <div class="category-dot" :style="{ background: cat.color }"></div>
                    <span class="category-name">{{ cat.name }}</span>
                  </div>
                  <span class="category-count">{{ cat.count }}个</span>
                </div>
                <div class="category-tools">
                  <span
                    v-for="tool in cat.tools"
                    :key="tool.id"
                    class="tool-tag"
                    @click="goToTool(tool)"
                  >
                    {{ tool.name }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.home {
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ====== Header ====== */
.hero-section {
  padding: 12px 24px 10px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle);
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.greeting-block {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.greeting-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.3px;
}

.greeting-sub {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  min-height: 1.4em;
}

.greeting-sub .cursor {
  display: inline;
  animation: blink 0.8s step-end infinite;
  color: var(--accent);
  font-weight: 300;
}

@keyframes blink {
  50% { opacity: 0; }
}

.time-block {
  text-align: right;
}

.time-display {
  font-size: 26px;
  font-weight: 300;
  color: var(--text-primary);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
}

.date-display {
  display: flex;
  gap: 6px;
  margin-top: 3px;
  justify-content: flex-end;
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.weekday {
  color: var(--accent);
}

/* ====== Main - 无滚动一屏 ====== */
.main-content {
  flex: 1;
  padding: 14px 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  min-height: 0;
}

/* ====== Top Row: Stats + 工具箱按钮 ====== */
.top-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.stats-row {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.stat-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  font-size: 16px;
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

/* 工具箱磁贴 - macOS 控制中心风格 */
.tools-tile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--accent);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
  min-width: 140px;
}

.tools-tile:hover {
  background: var(--accent-hover);
  filter: brightness(1.05);
}

.tools-tile:active {
  transform: scale(0.98);
}

.tile-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  font-size: 17px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  flex-shrink: 0;
}

.tile-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  text-align: left;
}

.tile-title {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  line-height: 1;
}

.tile-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 500;
}

.tile-arrow {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-left: auto;
  transition: all var(--transition-fast);
}

.tools-tile:hover .tile-arrow {
  color: #fff;
  transform: translateX(2px);
}

/* ====== Content Grid - 双栏撑满 ====== */
.content-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  min-height: 0;
}

.content-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

/* ====== Content Group ====== */
.content-group {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-card);
  flex-shrink: 0;
}

.content-group.flex-1 {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.group-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.view-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: var(--accent);
  background: transparent;
  border: none;
  padding: 3px 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.view-all-btn:hover {
  background: var(--accent-light);
}

.view-all-btn :deep(svg) {
  font-size: 11px;
}

.group-content {
  padding: 6px;
}

.group-content.list-content {
  overflow: hidden;
}

.group-content.chart-content {
  flex: 1;
  min-height: 0;
  padding: 8px;
}

.chart {
  width: 100%;
  height: 100%;
}

/* ====== Recent List ====== */
.recent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.recent-item:hover {
  background: var(--bg-hover);
}

.recent-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-light);
  color: var(--accent);
  border-radius: var(--radius-xs);
  font-size: 13px;
  flex-shrink: 0;
}

.icon-fallback {
  font-size: 12px;
  font-weight: 600;
}

.recent-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.recent-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-category {
  font-size: 10px;
  color: var(--text-muted);
}

.recent-time {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 500;
}

.empty-hint {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}

/* ====== Category List ====== */
.category-item {
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.category-item:hover {
  background: var(--bg-hover);
}

.category-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.category-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.category-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.category-count {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.category-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tool-tag {
  display: inline-flex;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tool-tag:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-light);
}

/* ====== Responsive ====== */
@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .hero-section {
    padding: 10px 16px 8px;
  }

  .main-content {
    padding: 10px 16px 12px;
    gap: 10px;
  }

  .greeting-title {
    font-size: 17px;
  }

  .time-display {
    font-size: 22px;
  }
}
</style>
