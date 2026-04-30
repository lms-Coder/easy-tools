<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import { useThemeStore } from '@/stores/theme'
import { toast } from '@/composables/useToast'
import { openTool } from '@/utils/toolWindow'
import { getCategoryColor, getCategoryColorRaw } from '@/utils/categories'
import dayjs from 'dayjs'

import 'dayjs/locale/zh-cn'
import {
  LayoutGrid,
  Clock,
  Flame,
  Calendar,
  ChevronRight,
  Inbox,
  Wrench,
  FolderOpen,
  Zap,
  TrendingUp,
} from 'lucide-vue-next'
import { getIcon } from '@/utils/icons'

import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, LineChart } from 'echarts/charts'
import {
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'

use([
  CanvasRenderer,
  PieChart,
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

const now = ref(dayjs())
let timer: ReturnType<typeof setInterval>
let lastStatsLoad = 0

const loadStatsThrottled = () => {
  const now = Date.now()
  if (now - lastStatsLoad < 10000) return
  lastStatsLoad = now
  configStore.loadUsageStats()
}

onMounted(() => {
  timer = setInterval(() => now.value = dayjs(), 1000)
  loadStatsThrottled()
  typewriterRunning = true
  runCycle()
})

watch(() => route.path, (path) => {
  if (path === '/' || path === '/home') {
    loadStatsThrottled()
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
let typewriterRunning = false

const runCycle = () => {
  if (!typewriterRunning) return
  const { subs } = getGreeting(now.value.hour())
  const nextSub = subs[Math.floor(Math.random() * subs.length)]
  currentSub.value = nextSub
  let i = 0
  let phase: 'type' | 'pause' | 'delete' = 'type'

  const tick = () => {
    if (!typewriterRunning) return
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

onUnmounted(() => {
  typewriterRunning = false
  if (typeTimer) clearTimeout(typeTimer)
})

const currentDate = computed(() => now.value.format('YYYY年M月D日'))
const currentWeekday = computed(() => now.value.format('dddd'))
const timeHour = computed(() => now.value.format('HH'))
const timeMinute = computed(() => now.value.format('mm'))
const timeSecond = computed(() => now.value.format('ss'))

const stats = computed(() => [
  {
    label: '工具总数',
    value: configStore.enabledTools.length,
    icon: Wrench,
    color: 'var(--accent)',
    bgColor: 'var(--accent-light)'
  },
  {
    label: '分类数量',
    value: configStore.toolsByCategory.length,
    icon: FolderOpen,
    color: 'var(--purple)',
    bgColor: 'var(--purple-light)'
  },
  {
    label: '今日使用',
    value: configStore.usageStatsSummary?.todayCount || 0,
    icon: Zap,
    color: 'var(--success)',
    bgColor: 'var(--success-light)'
  },
  {
    label: '本周使用',
    value: configStore.usageStatsSummary?.weekCount || 0,
    icon: TrendingUp,
    color: 'var(--orange)',
    bgColor: 'var(--orange-light)'
  },
])

const isDark = computed(() => themeStore.currentTheme === 'dark')
const textSecondary = computed(() => isDark.value ? '#94a3b8' : '#475569')
const textMuted = computed(() => isDark.value ? '#64748b' : '#94a3b8')
const accentColor = computed(() => isDark.value ? '#60a5fa' : '#3b82f6')

const tooltipStyle = computed(() => ({
  backgroundColor: isDark.value ? '#1e293b' : '#ffffff',
  borderColor: isDark.value ? '#334155' : '#e2e8f0',
  borderWidth: 1,
  textStyle: {
    color: isDark.value ? '#f1f5f9' : '#0f172a',
    fontSize: 12
  }
}))

const allCategories = computed(() => {
  return configStore.toolsByCategory.map(cat => ({
    name: cat.name,
    count: cat.tools.length,
    color: getCategoryColor(cat.name),
    rawColor: getCategoryColorRaw(cat.name),
    tools: cat.tools
  }))
})

const categoryData = computed(() => {
  return [...allCategories.value]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
})

const pieOption = computed(() => {
  const data = allCategories.value.map(cat => ({
    name: cat.name,
    value: cat.count,
    itemStyle: { color: cat.rawColor }
  }))

  return {
    tooltip: {
      ...tooltipStyle.value,
      trigger: 'item',
      formatter: (params: any) => {
        return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${params.color};margin-right:6px;"></span>${params.name}: <b>${params.value}</b>个 (${params.percent}%)`
      }
    },
    series: [{
      type: 'pie',
      radius: ['42%', '72%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 5,
        borderColor: isDark.value ? 'rgba(30,41,59,0.7)' : 'rgba(255,255,255,0.72)',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}\n{c}个',
        fontSize: 11,
        color: isDark.value ? '#94a3b8' : '#64748b',
        lineHeight: 15
      },
      labelLine: {
        show: true,
        length: 10,
        length2: 14,
        lineStyle: {
          color: isDark.value ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.35)',
          width: 1
        }
      },
      emphasis: {
        scaleSize: 3,
        itemStyle: {
          shadowBlur: 0
        },
        label: {
          fontWeight: 600
        }
      },
      data
    }]
  }
})

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
      ...tooltipStyle.value,
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: isDark.value ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.25)',
          type: 'dashed'
        }
      },
      formatter: '{b}: {c}次'
    },
    grid: { left: 4, right: 4, top: 16, bottom: 0, containLabel: true },
    xAxis: {
      type: 'category',
      data: days,
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: textMuted.value,
        fontSize: 11,
        interval: 0,
        margin: 10
      }
    },
    yAxis: {
      type: 'value',
      show: true,
      max: Math.ceil(maxValue * 1.3),
      splitNumber: 3,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: textMuted.value,
        fontSize: 10,
        margin: 8
      },
      splitLine: {
        lineStyle: {
          color: isDark.value ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.12)',
          type: 'dashed'
        }
      }
    },
    series: [{
      type: 'line',
      smooth: true,
      data,
      lineStyle: {
        width: 2.5,
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: isDark.value ? '#818cf8' : '#3b82f6' },
            { offset: 1, color: isDark.value ? '#60a5fa' : '#6366f1' }
          ]
        }
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: isDark.value ? 'rgba(99,102,241,0.15)' : 'rgba(59,130,246,0.08)' },
            { offset: 0.6, color: isDark.value ? 'rgba(96,165,250,0.05)' : 'rgba(99,102,241,0.03)' },
            { offset: 1, color: 'transparent' }
          ]
        }
      },
      symbol: 'circle',
      symbolSize: 5,
      showSymbol: true,
      itemStyle: {
        color: accentColor.value,
        borderWidth: 2,
        borderColor: isDark.value ? '#0f172a' : '#ffffff'
      },
      label: {
        show: true,
        position: 'top',
        color: textSecondary.value,
        fontSize: 10,
        fontWeight: 500,
        formatter: (params: any) => params.value > 0 ? params.value : ''
      }
    }]
  }
})

const rankData = computed(() => {
  const ranking = configStore.usageStatsSummary?.ranking || []
  if (ranking.length === 0) return []
  const maxCount = Math.max(...ranking.map(r => r.useCount), 1)
  return ranking.map((item, idx) => {
    const tool = configStore.getToolById(item.toolId)
    return {
      id: item.toolId,
      name: tool?.name || '未知',
      category: tool?.category || '',
      count: item.useCount,
      percent: Math.round((item.useCount / maxCount) * 100)
    }
  })
})

const recentTools = computed(() => {
  const recent = configStore.usageStatsSummary?.recentUsed || []
  const result: { id: string; name: string; icon: string | undefined; category: string | undefined; time: string }[] = []
  for (const item of recent) {
    if (result.length >= 4) break
    const tool = configStore.getToolById(item.toolId)
    if (!tool?.enabled) continue
    result.push({
      id: item.toolId,
      name: tool.name || item.toolId,
      icon: tool.icon,
      category: tool.category,
      time: formatTime(item.timestamp)
    })
  }
  return result
})

const formatTime = (dateStr: string) => {
  const date = dayjs(dateStr)
  const diff = now.value.diff(date, 'minute')
  if (diff < 1) return '刚刚'
  if (diff < 60) return `${diff}分钟前`
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
  return date.format('M/D')
}

const goToTools = () => router.push('/tools')

const colorMix = (category: string, percent: number) => {
  const color = getCategoryColor(category)
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}

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
    <!-- 左侧面板 -->
    <aside class="side-panel">
      <div class="side-greeting">
        <h1>{{ greetingText }}</h1>
        <p><span>{{ typedSub }}</span><span class="cursor" v-if="typedSub.length < currentSub.length">|</span></p>
      </div>

      <div class="side-time card">
        <div class="time-big">{{ timeHour }}<span class="colon">:</span>{{ timeMinute }}<span class="time-sec">:{{ timeSecond }}</span></div>
        <div class="date-row">
          <span>{{ currentDate }}</span>
          <span class="weekday">{{ currentWeekday }}</span>
        </div>
      </div>

      <div class="side-stats">
        <div v-for="stat in stats" :key="stat.label" class="mini-stat card">
          <div class="ms-icon" :style="{ background: stat.bgColor, color: stat.color }">
            <component :is="stat.icon" :size="14" />
          </div>
          <div class="ms-text">
            <span class="ms-val">{{ stat.value }}</span>
            <span class="ms-lbl">{{ stat.label }}</span>
          </div>
        </div>
      </div>

      <button class="tools-entry-btn" @click="goToTools">
        <div class="teb-icon">
          <LayoutGrid :size="20" />
        </div>
        <div class="teb-body">
          <span class="teb-title">工具箱</span>
          <span class="teb-sub">{{ configStore.enabledTools.length }} 个工具</span>
        </div>
        <ChevronRight :size="16" class="teb-arrow" />
      </button>

      <!-- 最近使用 -->
      <div class="side-recent">
        <div class="side-section-title">最近使用</div>
        <div class="side-recent-list">
          <div
            v-for="item in recentTools"
            :key="item.id"
            class="side-recent-item"
            @click="goToTool(item)"
          >
            <div class="sri-icon" :style="{ background: colorMix(item.category ?? '', 10), color: getCategoryColor(item.category ?? '') }">
              <component :is="getIcon(item.icon)" v-if="item.icon" :size="11" />
              <span v-else>{{ item.name[0] }}</span>
            </div>
            <div class="sri-info">
              <span class="sri-name">{{ item.name }}</span>
              <span class="sri-time">{{ item.time }}</span>
            </div>
          </div>
          <div v-if="recentTools.length === 0" class="empty-hint-sm">
            <Inbox :size="16" class="empty-hint-icon" />
            <span>暂无记录</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- 右侧主区域 -->
    <main class="main-area">
      <!-- 左列：排行 + 趋势 上下排列 -->
      <div class="main-col">
        <!-- 使用排行 -->
        <div class="card flex-grow">
          <div class="card-header">
            <h3 class="card-title">使用排行</h3>
          </div>
          <div class="card-body rank-body" v-if="rankData.length > 0">
            <div
              v-for="(item, idx) in rankData"
              :key="item.id"
              class="rank-item"
              @click="goToTool(item)"
            >
              <span class="rank-num" :class="{ 'rank-top': idx < 3 }">{{ idx + 1 }}</span>
              <span class="rank-name">{{ item.name }}</span>
              <div class="rank-bar-bg">
                <div class="rank-bar" :style="{ width: item.percent + '%' }"></div>
              </div>
              <span class="rank-count">{{ item.count }}</span>
            </div>
          </div>
          <div class="card-body" v-else>
            <div class="empty-state-sm">
              <Inbox :size="20" class="empty-state-icon" />
              <span class="empty-state-title">暂无排行数据</span>
              <span class="empty-state-desc">使用工具后会生成排行</span>
            </div>
          </div>
        </div>

        <!-- 近7天使用趋势 -->
        <div class="card" style="flex-shrink:0">
          <div class="card-header">
            <h3 class="card-title">近7天使用</h3>
          </div>
          <div class="card-body chart-body" style="height:180px">
            <v-chart class="chart" :option="trendOption" autoresize />
          </div>
        </div>
      </div>

      <!-- 右列：饼图 + 热门分类 -->
      <div class="main-col">
        <div class="card flex-grow">
          <div class="card-header">
            <h3 class="card-title">分类分布</h3>
          </div>
          <div class="card-body chart-body">
            <v-chart class="chart" :option="pieOption" autoresize />
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">热门分类</h3>
          </div>
          <div class="card-body cat-list">
            <div
              v-for="cat in categoryData"
              :key="cat.name"
              class="category-item"
            >
              <div class="category-row">
                <div class="category-info">
                  <div class="category-dot" :style="{ background: cat.color }"></div>
                  <span class="category-name">{{ cat.name }}</span>
                </div>
                <span class="category-count" :style="{ color: cat.color }">{{ cat.count }}个</span>
              </div>
              <div class="category-tools">
                <span
                  v-for="tool in cat.tools"
                  :key="tool.id"
                  class="tool-tag"
                  :style="{ '--tag-color': cat.color }"
                  @click="goToTool(tool)"
                >
                  {{ tool.name }}
                </span>
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
}

.cursor {
  display: inline;
  animation: blink 0.8s step-end infinite;
  color: var(--accent);
  font-weight: 300;
}

@keyframes blink {
  50% { opacity: 0; }
}

.colon {
  animation: colon-blink 1s step-end infinite;
}

@keyframes colon-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* ====== Left Panel ====== */
.side-panel {
  width: 250px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  padding: 20px 14px 14px;
  gap: 14px;
}

.side-greeting h1 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.side-greeting p {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 3px;
  min-height: 1.4em;
}

.side-time {
  text-align: center;
  padding: 14px;
}

.time-big {
  font-size: 36px;
  font-weight: 200;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  letter-spacing: -1.5px;
  line-height: 1;
}

.time-sec {
  font-size: 22px;
  color: var(--text-muted);
}

.date-row {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  justify-content: center;
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.weekday {
  color: var(--accent);
}

.side-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.mini-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  transition: all 150ms ease;
}

.mini-stat:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.ms-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-shrink: 0;
}

.ms-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.ms-val {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.ms-lbl {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 500;
}

/* 工具箱入口按钮 */
.tools-entry-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, transparent), color-mix(in srgb, var(--purple) 8%, transparent));
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
  cursor: pointer;
  transition: all 200ms ease;
  color: var(--text-primary);
  width: 100%;
  text-align: left;
}

.teb-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--accent);
  flex-shrink: 0;
}

.teb-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.teb-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--accent);
}

.teb-sub {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.teb-arrow {
  margin-left: auto;
  color: var(--text-muted);
  transition: all 200ms ease;
}

.tools-entry-btn:hover {
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, transparent), color-mix(in srgb, var(--purple) 14%, transparent));
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  box-shadow: 0 4px 16px color-mix(in srgb, var(--accent) 15%, transparent);
  transform: translateY(-1px);
}

.tools-entry-btn:hover .teb-arrow {
  color: var(--accent);
  transform: translateX(3px);
}

.tools-entry-btn:active {
  transform: translateY(0) scale(0.98);
}

/* Side recent */
.side-recent {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.side-section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 6px;
  padding: 0 4px;
}

.side-recent-list {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.side-recent-list::-webkit-scrollbar {
  display: none;
}

.side-recent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 150ms ease;
}

.side-recent-item:hover {
  background: var(--bg-hover);
}

.sri-icon {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  flex-shrink: 0;
}

.sri-info {
  flex: 1;
  min-width: 0;
}

.sri-name {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sri-time {
  font-size: 10px;
  color: var(--text-muted);
}

.empty-hint-sm {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  font-size: 11px;
  color: var(--text-muted);
}

.empty-hint-icon {
  opacity: 0.3;
}

/* ====== Main Area ====== */
.main-area {
  flex: 1;
  padding: 20px 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
}

.main-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

/* ====== Card ====== */
.card {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--bg-card);
  backdrop-filter: var(--glass-blur-sm);
  box-shadow: var(--shadow-glass);
  transition: box-shadow 150ms ease;
}

.card:hover {
  box-shadow: var(--shadow-sm);
}

.flex-grow {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.card-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.card-body {
  padding: 6px;
}

.chart-body {
  flex: 1;
  min-height: 0;
  padding: 8px;
}

.rank-body {
  flex: 1;
  padding: 4px 8px 8px;
  overflow-y: auto;
  scrollbar-width: none;
}

.rank-body::-webkit-scrollbar {
  display: none;
}

.chart {
  width: 100%;
  height: 100%;
}

/* ====== Rank List ====== */
.rank-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 150ms ease;
}

.rank-item:hover {
  background: var(--bg-hover);
}

.rank-num {
  font-size: 11px;
  color: var(--text-muted);
  width: 14px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.rank-top {
  color: var(--accent);
  font-weight: 700;
}

.rank-name {
  font-size: 12px;
  color: var(--text-primary);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-bar-bg {
  width: 70px;
  height: 5px;
  background: var(--bg-secondary);
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}

.rank-bar {
  height: 100%;
  border-radius: 3px;
  background: var(--accent);
  opacity: 0.7;
  transition: width 300ms ease;
}

.rank-count {
  font-size: 11px;
  color: var(--text-muted);
  width: 20px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* ====== Category ====== */
.cat-list {
  overflow-y: auto;
  scrollbar-width: none;
}

.cat-list::-webkit-scrollbar {
  display: none;
}

.category-item {
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  transition: background 150ms ease;
}

.category-item:hover {
  background: var(--bg-hover);
}

.category-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
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
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.category-count {
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.category-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tool-tag {
  display: inline-flex;
  padding: 2px 7px;
  font-size: 10px;
  font-weight: 500;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--tag-color, var(--accent)) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--tag-color, var(--accent)) 15%, transparent);
  border-radius: 4px;
  cursor: pointer;
  transition: all 150ms ease;
}

.tool-tag:hover {
  color: var(--tag-color, var(--accent));
  border-color: var(--tag-color, var(--accent));
  background: color-mix(in srgb, var(--tag-color, var(--accent)) 15%, transparent);
}

/* ====== Empty ====== */
.empty-state-sm {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  text-align: center;
  gap: 4px;
}

.empty-state-icon {
  color: var(--text-muted);
  opacity: 0.3;
  margin-bottom: 4px;
}

.empty-state-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.empty-state-desc {
  font-size: 11px;
  color: var(--text-muted);
}

/* ====== Responsive ====== */
@media (max-width: 900px) {
  .side-panel {
    width: 200px;
  }

  .main-area {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .home {
    flex-direction: column;
  }

  .side-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
    flex-direction: row;
    flex-wrap: wrap;
    padding: 12px;
    gap: 8px;
  }

  .side-recent {
    display: none;
  }
}
</style>
