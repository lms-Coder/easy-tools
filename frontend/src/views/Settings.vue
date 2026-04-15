<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useConfigStore } from '@/stores/config'
import { toast } from '@/composables/useToast'
import { getIcon } from '@/utils/icons'
import Dialog from '@/components/common/Dialog.vue'
import Select from '@/components/ui/Select.vue'
import Input from '@/components/ui/Input.vue'
import {
  ArrowLeft,
  Sun,
  Moon,
  Palette,
  LayoutGrid,
  Settings,
  Info,
  Check,
  Search,
} from 'lucide-vue-next'

const router = useRouter()
const themeStore = useThemeStore()
const configStore = useConfigStore()

const activeCategory = ref('appearance')
const toolSearch = ref('')

const categories = [
  { id: 'appearance', name: '外观', icon: Palette },
  { id: 'tools', name: '工具管理', icon: LayoutGrid },
  { id: 'system', name: '系统', icon: Settings },
  { id: 'about', name: '关于', icon: Info },
]

const setActiveCategory = (id: string) => activeCategory.value = id

const categoryColors: Record<string, string> = {
  '开发工具': '#3b82f6',
  '编码转换': '#10b981',
  '时间处理': '#f59e0b',
  '文本处理': '#06b6d4',
  '系统工具': '#6366f1',
  '安全工具': '#ef4444',
  '其他': '#8b5cf6'
}

const toolCategories = computed(() => {
  const keyword = toolSearch.value.trim().toLowerCase()
  return configStore.allToolsByCategory
    .map(cat => ({
      ...cat,
      color: categoryColors[cat.name] || '#3b82f6',
      tools: keyword
        ? cat.tools.filter(t =>
            t.name.toLowerCase().includes(keyword) ||
            t.id.toLowerCase().includes(keyword) ||
            (t.description || t.desc || '').toLowerCase().includes(keyword)
          )
        : cat.tools
    }))
    .filter(cat => cat.tools.length > 0)
})

const getToolIcon = (iconName: string) => getIcon(iconName)

const toggleToolEnabled = (toolId: string, enabled: boolean) => {
  configStore.setToolEnabled(toolId, enabled)
  toast.success(enabled ? '已启用' : '已禁用')
}

const toggleToolAllowMultiple = (toolId: string, allowMultiple: boolean) => {
  configStore.setToolAllowMultiple(toolId, allowMultiple)
}

const systemConfig = computed(() => configStore.systemConfig)

const toggleMinimizeToTray = async (v: boolean) => {
  try { configStore.setMinimizeToTray(v); toast.success(v ? '已开启' : '已关闭') }
  catch { toast.error('设置失败') }
}

const toggleLaunchOnStartup = async (v: boolean) => {
  try { configStore.setLaunchOnStartup(v); toast.success(v ? '已开启' : '已关闭') }
  catch { toast.error('设置失败') }
}

const setCloseBehavior = async (v: 'close' | 'minimize') => {
  try { configStore.setCloseBehavior(v) }
  catch { toast.error('设置失败') }
}

const themeOptions: { value: 'light' | 'dark'; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: '亮色', icon: Sun },
  { value: 'dark', label: '暗色', icon: Moon },
]

const presetColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#f97316', '#6366f1'
]

const fontOptions = [
  { value: '', label: '系统默认' },
  { value: "'PingFang SC', 'Microsoft YaHei', sans-serif", label: '苹方 / 微软雅黑' },
  { value: "'Source Han Sans SC', 'Noto Sans SC', sans-serif", label: '思源黑体' },
  { value: "'Source Han Serif SC', 'Noto Serif SC', serif", label: '思源宋体' },
  { value: "'LXGW WenKai', 'LXGW WenKai Screen', sans-serif", label: '霞鹜文楷' },
  { value: "'HarmonyOS Sans SC', 'HarmonyOS Sans', sans-serif", label: '鸿蒙黑体' },
  { value: "'SimSun', 'Songti SC', serif", label: '宋体' },
  { value: "'SimHei', 'Heiti SC', sans-serif", label: '黑体' },
  { value: "'KaiTi', 'STKaiti', serif", label: '楷体' },
  { value: "'FangSong', 'STFangsong', serif", label: '仿宋' },
  { value: "'Segoe UI', 'Helvetica Neue', sans-serif", label: 'Segoe UI' },
  { value: "Georgia, 'Noto Serif', serif", label: 'Georgia' },
  { value: "'Trebuchet MS', 'Gill Sans', sans-serif", label: 'Trebuchet MS' },
]

const currentFont = ref('')
const currentColor = ref('#3b82f6')
const localAppName = ref('')

const loadAppName = async () => {
  localAppName.value = configStore.appName
}

const saveAppName = async () => {
  if (!localAppName.value.trim()) return
  try { configStore.setAppName(localAppName.value.trim()) }
  catch (e) { console.error(e) }
}

const selectColor = async (color: string) => {
  if (color === currentColor.value) return
  currentColor.value = color
  try {
    configStore.setPrimaryColor(color)
    themeStore.applyPrimaryColor(color)
  }
  catch (e) { console.error(e) }
}

const selectFont = async (v: string | number) => {
  const font = String(v)
  if (font === currentFont.value) return
  currentFont.value = font
  try {
    configStore.setFontFamily(font)
    themeStore.applyFontFamily(font)
  }
  catch (e) { console.error(e) }
}

const showResetDialog = ref(false)
const showClearDialog = ref(false)

const resetAppearance = async () => {
  localAppName.value = 'Easy Tools'
  configStore.setAppName('Easy Tools')
  if (themeStore.currentTheme !== 'light') themeStore.set('light')
  currentColor.value = '#3b82f6'
  configStore.setPrimaryColor('#3b82f6')
  themeStore.applyPrimaryColor('#3b82f6')
  currentFont.value = ''
  configStore.setFontFamily('')
  themeStore.applyFontFamily('')
  toast.success('已重置')
}

const clearUsage = async () => {
  try { configStore.clearUsageData(); toast.success('已清空') }
  catch { toast.error('清空失败') }
}

const goBack = () => router.push('/')

onMounted(async () => {
  await loadAppName()
  currentColor.value = configStore.primaryColor
  currentFont.value = configStore.fontFamily
})
</script>

<template>
  <div class="settings-page">
    <!-- 左侧导航栏 -->
    <aside class="settings-sidebar">
      <div class="sidebar-header">
        <button class="back-btn" @click="goBack">
          <ArrowLeft :size="14" />
          <span>返回</span>
        </button>
      </div>
      <nav class="sidebar-nav">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="sidebar-nav-item"
          :class="{ active: activeCategory === cat.id }"
          @click="setActiveCategory(cat.id)"
        >
          {{ cat.name }}
        </button>
      </nav>
    </aside>

    <!-- 主内容区域 -->
    <main class="main-content scrollbar-hide">
      <div class="content-wrapper">
      <Transition name="tab-switch" mode="out-in">
        <!-- 外观设置 -->
        <div v-if="activeCategory === 'appearance'" key="appearance">
          <!-- 通用 -->
          <div class="group-card">
            <div class="group-title">通用</div>
            <div class="group-body">
              <div class="group-row">
                <div class="setting-info">
                  <span class="setting-label">应用名称</span>
                  <span class="setting-desc">显示在窗口标题栏</span>
                </div>
                <Input
                  v-model="localAppName"
                  placeholder="输入名称"
                  clearable
                  style="width:180px"
                  @blur="saveAppName"
                  @keydown.enter="saveAppName"
                />
              </div>
              <div class="group-row">
                <div class="setting-info">
                  <span class="setting-label">主题</span>
                  <span class="setting-desc">选择界面主题</span>
                </div>
                <div class="segment-control">
                  <div class="segment-slider" :class="{ 'slider-right': themeStore.currentTheme === 'dark' }"></div>
                  <button
                    v-for="opt in themeOptions"
                    :key="opt.value"
                    class="segment-btn"
                    :class="{ active: themeStore.currentTheme === opt.value }"
                    @click="(e) => themeStore.setWithAnimation(opt.value, e)"
                  >
                    <component :is="opt.icon" :size="14" />
                    {{ opt.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 字体 -->
          <div class="group-card">
            <div class="group-title">字体</div>
            <div class="group-body">
              <div class="group-row">
                <div class="setting-info">
                  <span class="setting-label">界面字体</span>
                  <span class="setting-desc">选择应用显示字体</span>
                </div>
                <Select :model-value="currentFont" :options="fontOptions" size="sm" @update:model-value="selectFont" style="width:160px" />
              </div>
              <div class="font-preview-row">
                <span class="font-preview-text" :style="currentFont ? { fontFamily: currentFont } : {}">
                  AaBbCc 你好世界 0123456789
                </span>
              </div>
            </div>
          </div>

          <!-- 主题色 -->
          <div class="group-card">
            <div class="group-title">主题色</div>
            <div class="group-body color-body">
              <div class="color-preview-row">
                <div
                  v-for="color in presetColors"
                  :key="color"
                  class="color-swatch"
                  :class="{ active: currentColor === color }"
                  :style="{ '--swatch': color }"
                  @click="selectColor(color)"
                >
                  <div class="swatch-circle">
                    <Check v-if="currentColor === color" class="swatch-check" :size="16" />
                  </div>
                  <span class="swatch-label">{{ color }}</span>
                </div>
              </div>
              <div class="color-custom-row">
                <span class="setting-label">自定义颜色</span>
                <div class="custom-color-wrap">
                  <input
                    type="color"
                    class="custom-color-input"
                    :value="currentColor"
                    @input="(e: Event) => selectColor((e.target as HTMLInputElement).value)"
                  />
                  <span class="custom-color-value">{{ currentColor }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 重置 -->
          <div class="group-card">
            <div class="group-title">重置</div>
            <div class="group-body">
              <div class="group-row">
                <div class="setting-info">
                  <span class="setting-label">恢复默认外观</span>
                  <span class="setting-desc">重置所有外观设置为默认值</span>
                </div>
                <button class="text-btn danger" @click="showResetDialog = true">重置</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 工具管理 -->
        <div v-else-if="activeCategory === 'tools'" key="tools">
          <div class="search-bar">
            <Search :size="14" />
            <input
              v-model="toolSearch"
              type="text"
              placeholder="搜索工具..."
            />
          </div>
          <template v-for="category in toolCategories" :key="category.name">
            <div class="group-card">
              <div class="group-title">
                <span class="cat-dot" :style="{ background: category.color }"></span>
                {{ category.name }}
                <span class="group-badge">{{ category.tools.length }}</span>
              </div>
              <div class="group-body">
                <div
                  v-for="tool in category.tools"
                  :key="tool.id"
                  class="tool-row"
                  :class="{ disabled: !tool.enabled }"
                >
                  <div class="tool-main">
                    <div class="tool-icon" :style="{ background: `${category.color}12`, color: category.color }">
                      <component :is="getToolIcon(tool.icon)" :size="14" />
                    </div>
                    <div class="tool-meta">
                      <span class="tool-name">{{ tool.name }}</span>
                      <span class="tool-desc">{{ tool.description || tool.desc }}</span>
                    </div>
                  </div>
                  <div class="tool-controls">
                    <button
                      class="chip-btn"
                      :class="{ active: tool.allowMultiple, disabled: !tool.enabled }"
                      :style="tool.allowMultiple ? { background: `${category.color}14`, borderColor: `${category.color}30`, color: category.color } : {}"
                      :disabled="!tool.enabled"
                      @click="toggleToolAllowMultiple(tool.id, !tool.allowMultiple)"
                    >
                      {{ tool.allowMultiple ? '多开' : '单开' }}
                    </button>
                    <label class="toggle">
                      <input
                        type="checkbox"
                        :checked="tool.enabled"
                        @change="(e: Event) => toggleToolEnabled(tool.id, (e.target as HTMLInputElement).checked)"
                      />
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 系统设置 -->
        <div v-else-if="activeCategory === 'system'" key="system">
          <div class="group-card">
            <div class="group-title">窗口行为</div>
            <div class="group-body">
              <div class="group-row">
                <div class="setting-info">
                  <span class="setting-label">最小化到托盘</span>
                  <span class="setting-desc">点击最小化时隐藏到系统托盘</span>
                </div>
                <label class="toggle">
                  <input
                    type="checkbox"
                    :checked="systemConfig.minimizeToTray"
                    @change="(e: Event) => toggleMinimizeToTray((e.target as HTMLInputElement).checked)"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="group-row">
                <div class="setting-info">
                  <span class="setting-label">关闭窗口时</span>
                  <span class="setting-desc">点击关闭按钮的行为</span>
                </div>
                <div class="segment-control">
                  <div class="segment-slider" :class="{ 'slider-right': systemConfig.closeBehavior === 'minimize' }"></div>
                  <button
                    class="segment-btn"
                    :class="{ active: systemConfig.closeBehavior === 'close' }"
                    @click="setCloseBehavior('close')"
                  >退出程序</button>
                  <button
                    class="segment-btn"
                    :class="{ active: systemConfig.closeBehavior === 'minimize' }"
                    @click="setCloseBehavior('minimize')"
                  >最小化到托盘</button>
                </div>
              </div>
            </div>
          </div>

          <div class="group-card">
            <div class="group-title">启动</div>
            <div class="group-body">
              <div class="group-row">
                <div class="setting-info">
                  <span class="setting-label">开机启动</span>
                  <span class="setting-desc">系统启动时自动运行</span>
                </div>
                <label class="toggle">
                  <input
                    type="checkbox"
                    :checked="systemConfig.launchOnStartup"
                    @change="(e: Event) => toggleLaunchOnStartup((e.target as HTMLInputElement).checked)"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 关于 -->
        <div v-else-if="activeCategory === 'about'" key="about">
          <!-- Logo -->
          <div class="about-hero">
            <div class="about-logo">
              <span class="logo-text">{{ configStore.appName?.[0] || 'E' }}</span>
            </div>
            <div class="about-text">
              <span class="about-name">{{ configStore.appName }}</span>
              <span class="about-subtitle">v1.0.0 · 高效实用的开发者工具箱</span>
            </div>
          </div>

          <!-- Stats -->
          <div class="about-stats">
            <div class="about-stat-item">
              <span class="about-stat-value">{{ configStore.tools.length }}</span>
              <span class="about-stat-label">工具总数</span>
            </div>
            <div class="about-stat-item">
              <span class="about-stat-value">{{ configStore.usageStatsSummary?.todayCount || 0 }}</span>
              <span class="about-stat-label">今日使用</span>
            </div>
            <div class="about-stat-item">
              <span class="about-stat-value">{{ (configStore.usageStatsSummary?.todayCount || 0) + (configStore.usageStatsSummary?.weekCount || 0) }}</span>
              <span class="about-stat-label">累计使用</span>
            </div>
          </div>

          <!-- Info -->
          <div class="group-card">
            <div class="group-title">信息</div>
            <div class="group-body">
              <div class="group-row">
                <span class="setting-label">技术栈</span>
                <span class="setting-value">Vue 3 + Wails 3 + Go</span>
              </div>
              <div class="group-row">
                <span class="setting-label">开源协议</span>
                <span class="setting-value">MIT License</span>
              </div>
            </div>
          </div>

          <!-- Data management -->
          <div class="group-card">
            <div class="group-title">数据管理</div>
            <div class="group-body">
              <div class="group-row">
                <div class="setting-info">
                  <span class="setting-label">清空使用数据</span>
                  <span class="setting-desc">清除所有使用统计记录，此操作不可恢复</span>
                </div>
                <button class="text-btn danger" @click="showClearDialog = true">清空</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
      </div>
    </main>

    <!-- 重置确认对话框 -->
    <Dialog
      v-model:visible="showResetDialog"
      type="confirm"
      title="重置外观设置"
      content="确定要恢复默认的外观设置吗？"
      confirm-text="重置"
      cancel-text="取消"
      :show-cancel="true"
      @confirm="resetAppearance"
    />

    <!-- 清空确认对话框 -->
    <Dialog
      v-model:visible="showClearDialog"
      type="warning"
      title="清空使用数据"
      content="确定要清空所有使用统计数据吗？此操作不可恢复。"
      confirm-text="清空"
      cancel-text="取消"
      :show-cancel="true"
      @confirm="clearUsage"
    />
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  height: 100%;
  overflow: hidden;
  background: var(--bg-primary);
}

/* ====== Sidebar ====== */
.settings-sidebar {
  width: 170px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 20px 10px 16px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-subtle);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
}

.sidebar-header {
  padding: 0 12px 14px 16px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 12px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 12px;
  transition: color var(--transition-fast);
}

.back-btn:hover {
  color: var(--text-secondary);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 8px;
  border-left: 2.5px solid transparent;
  margin-left: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
  border-right: none;
  border-top: none;
  border-bottom: none;
  background: transparent;
  width: calc(100% - 4px);
}

.sidebar-nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sidebar-nav-item.active {
  background: var(--accent-light);
  border-left-color: var(--accent);
  color: var(--accent);
  font-weight: 500;
}

/* ====== Main content ====== */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  justify-content: center;
}

.content-wrapper {
  width: 100%;
  max-width: 520px;
}

/* ====== Group card ====== */
.group-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  backdrop-filter: var(--glass-blur-sm);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  margin-bottom: 12px;
  overflow: hidden;
}

.group-title {
  padding: 12px 18px 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 3px;
  flex-shrink: 0;
}

.group-badge {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: auto;
}

.group-body {
  padding: 0 18px 14px;
}

.group-body.color-body {
  padding: 0 18px 18px;
}

.group-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.group-row + .group-row {
  border-top: 1px solid var(--border-subtle);
}

/* ====== Setting info ====== */
.setting-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.setting-info.horizontal {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.setting-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.setting-desc {
  font-size: 11px;
  color: var(--text-muted);
}

.setting-value {
  font-size: 12px;
  color: var(--text-muted);
}

/* ====== Segment control ====== */
.segment-control {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--bg-tertiary);
  padding: 2px;
  border-radius: var(--radius-sm);
}

.segment-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(50% - 2px);
  height: calc(100% - 4px);
  background: var(--bg-card);
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.05);
  transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.segment-slider.slider-right {
  left: 50%;
}

.segment-btn {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 5px 14px;
  background: transparent;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color var(--transition-fast);
  font-weight: 500;
  white-space: nowrap;
}

.segment-btn:hover {
  color: var(--text-primary);
}

.segment-btn.active {
  color: var(--text-primary);
}

/* ====== Font preview ====== */
.font-preview-row {
  padding: 10px 0 0;
  border-top: 1px solid var(--border-subtle);
  margin-top: 4px;
}

.font-preview-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  letter-spacing: 0.3px;
}

/* ====== Color picker ====== */
.color-preview-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}

.color-swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px;
}

.swatch-circle {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--swatch);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2.5px solid transparent;
  transition: all var(--transition-fast);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--swatch) 30%, transparent);
}

.color-swatch:hover .swatch-circle {
  transform: scale(1.1);
}

.color-swatch.active .swatch-circle {
  border-color: var(--text-primary);
  box-shadow: 0 0 0 2.5px var(--bg-card), 0 2px 12px color-mix(in srgb, var(--swatch) 40%, transparent);
}

.swatch-check {
  color: #fff;
  font-size: 16px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.swatch-label {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.color-swatch.active .swatch-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.color-custom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--border-subtle);
  padding-top: 12px;
}

.custom-color-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-color-value {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.custom-color-input {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1.5px solid var(--border-default);
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
  overflow: hidden;
  transition: border-color var(--transition-fast);
}

.custom-color-input:hover {
  border-color: var(--border-strong);
}

.custom-color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.custom-color-input::-webkit-color-swatch {
  border: none;
  border-radius: 6px;
}

/* ====== Toggle ====== */
.toggle {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--border-strong);
  border-radius: 10px;
  transition: all var(--transition-fast);
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: var(--text-inverse, #fff);
  border-radius: 50%;
  transition: all var(--transition-fast);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.toggle input:checked + .toggle-slider {
  background: var(--accent);
}

.toggle input:checked + .toggle-slider::before {
  transform: translateX(16px);
}

/* ====== Text button ====== */
.text-btn {
  padding: 4px 10px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  color: var(--accent);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.text-btn:hover {
  background: var(--accent-light);
}

.text-btn.danger {
  color: var(--error);
}

.text-btn.danger:hover {
  background: var(--error-light);
}

/* ====== Tool search ====== */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 32px;
  margin-bottom: 12px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  color: var(--text-muted);
}

.search-bar input {
  flex: 1;
  height: 100%;
  padding: 0;
  font-size: 13px;
  color: var(--text-primary);
  background: transparent;
  border: none;
  outline: none;
}

.search-bar input::placeholder {
  color: var(--text-muted);
}

/* ====== Tool item ====== */
.tool-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 6px;
  margin: 0 -6px;
  border-radius: 8px;
  transition: background var(--transition-fast);
}

.tool-row + .tool-row {
  border-top: none;
  margin-top: 1px;
}

.tool-row.disabled {
  opacity: 0.4;
}

.tool-row:not(.disabled):hover {
  background: var(--bg-hover);
}

.tool-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.tool-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  font-size: 14px;
  flex-shrink: 0;
  transition: transform 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.tool-row:not(.disabled):hover .tool-icon {
  transform: scale(1.08);
}

.tool-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.tool-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.tool-desc {
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tool-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.chip-btn {
  padding: 3px 10px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.chip-btn:hover:not(.disabled) {
  border-color: var(--border-strong);
  color: var(--text-secondary);
}

.chip-btn.active {
  background: var(--accent-light);
  border-color: var(--accent);
  color: var(--accent);
}

.chip-btn.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ====== About page ====== */
.about-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0 20px;
  text-align: center;
}

.about-logo {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25);
  margin-bottom: 12px;
}

.logo-text {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.about-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.about-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.about-subtitle {
  font-size: 13px;
  color: var(--text-muted);
}

.about-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
  max-width: 520px;
}

.about-stat-item {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  backdrop-filter: var(--glass-blur-sm);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 12px;
}

.about-stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.about-stat-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

/* ====== Animations ====== */
.tab-switch-enter-active {
  animation: fadeSlideIn 0.2s ease;
}

.tab-switch-leave-active {
  animation: fadeSlideOut 0.15s ease;
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeSlideOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-4px); }
}

/* ====== Dark mode ====== */
html.dark .chip-btn {
  background: rgba(148, 163, 184, 0.08);
  border-color: rgba(148, 163, 184, 0.12);
}

html.dark .chip-btn:hover:not(.disabled) {
  background: rgba(148, 163, 184, 0.14);
  border-color: rgba(148, 163, 184, 0.2);
}

html.dark .chip-btn.active {
  background: rgba(96, 165, 250, 0.15);
  border-color: rgba(96, 165, 250, 0.25);
}

html.dark .about-stat-item {
  background: var(--bg-card);
  border-color: rgba(148, 163, 184, 0.12);
}

html.dark .about-logo {
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
}
</style>
