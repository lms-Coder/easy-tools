<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useConfigStore } from '@/stores/config'
import { toast } from '@/composables/useToast'
import { getIcon } from '@/utils/icons'
import Dialog from '@/components/common/Dialog.vue'
import {
  ArrowLeft,
  Sun,
  Moon,
  Palette,
  LayoutGrid,
  Settings,
  Info,
  Check,
} from 'lucide-vue-next'

const router = useRouter()
const themeStore = useThemeStore()
const configStore = useConfigStore()

const activeCategory = ref('appearance')

const categories = [
  { id: 'appearance', name: '外观', icon: Palette },
  { id: 'tools', name: '工具管理', icon: LayoutGrid },
  { id: 'system', name: '系统', icon: Settings },
  { id: 'about', name: '关于', icon: Info },
]

const setActiveCategory = (id: string) => activeCategory.value = id

const categoryColors: Record<string, string> = {
  '开发工具': '#007AFF',
  '编码转换': '#34C759',
  '时间处理': '#FF9F0A',
  '文本处理': '#5AC8FA',
  '系统工具': '#5856D6',
  '安全工具': '#FF3B30',
  '其他': '#AF52DE'
}

const toolCategories = computed(() => {
  return configStore.allToolsByCategory.map(cat => ({
    ...cat,
    color: categoryColors[cat.name] || '#007AFF'
  }))
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
  '#007AFF', '#34C759', '#FF9F0A', '#AF52DE',
  '#FF3B30', '#5AC8FA', '#FFCC00', '#5856D6'
]

const currentColor = ref('#007AFF')
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

const showResetDialog = ref(false)
const showClearDialog = ref(false)

const resetAppearance = async () => {
  localAppName.value = 'Easy Tools'
  configStore.setAppName('Easy Tools')
  if (themeStore.currentTheme !== 'light') themeStore.set('light')
  currentColor.value = '#007AFF'
  configStore.setPrimaryColor('#007AFF')
  themeStore.applyPrimaryColor('#007AFF')
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
})
</script>

<template>
  <div class="settings-page">
    <!-- 左侧边栏 - macOS 风格 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <button class="back-btn" @click="goBack">
          <ArrowLeft :size="16" />
        </button>
        <span class="sidebar-title">设置</span>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="nav-item"
          :class="{ active: activeCategory === cat.id }"
          @click="setActiveCategory(cat.id)"
        >
          <component :is="cat.icon" class="nav-icon" :size="15" />
          <span class="nav-label">{{ cat.name }}</span>
        </button>
      </nav>
    </aside>

    <!-- 主内容 - macOS 分组列表风格 -->
    <main class="main-content scrollbar-hide">
      <Transition name="tab-switch" mode="out-in">
        <!-- 外观设置 -->
        <div v-if="activeCategory === 'appearance'" class="settings-panel" key="appearance">
          <div class="content-header">
            <h2 class="content-title">外观</h2>
          </div>

          <div class="section-label">
            <span class="section-dot" style="background: #5856D6"></span>
            通用
          </div>
          <div class="grouped-list">
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">应用名称</span>
                <span class="setting-desc">显示在窗口标题栏</span>
              </div>
              <input
                v-model="localAppName"
                type="text"
                class="setting-input"
                placeholder="输入名称"
                @blur="saveAppName"
                @keydown.enter="saveAppName"
              />
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">主题</span>
                <span class="setting-desc">选择界面主题</span>
              </div>
              <div class="segment-control">
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

          <div class="section-label">
            <span class="section-dot" style="background: var(--accent)"></span>
            主题色
          </div>
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

          <div class="section-label">
            <span class="section-dot" style="background: #FF3B30"></span>
            重置
          </div>
          <div class="grouped-list">
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">恢复默认外观</span>
                <span class="setting-desc">重置所有外观设置为默认值</span>
              </div>
              <button class="text-btn danger" @click="showResetDialog = true">重置</button>
            </div>
          </div>
        </div>

        <!-- 工具管理 -->
        <div v-else-if="activeCategory === 'tools'" class="settings-panel" key="tools">
          <div class="content-header">
            <h2 class="content-title">工具管理</h2>
            <span class="content-count">{{ configStore.tools.length }} 项</span>
          </div>

          <template v-for="category in toolCategories" :key="category.name">
            <div class="section-label">
              <span class="section-dot" :style="{ background: category.color }"></span>
              {{ category.name }}
              <span class="section-badge">{{ category.tools.length }}</span>
            </div>
            <div class="grouped-list tool-group-list">
              <div
                v-for="tool in category.tools"
                :key="tool.id"
                class="setting-item tool-item"
                :class="{ disabled: !tool.enabled }"
              >
                <div class="setting-info horizontal">
                  <div class="tool-icon" :style="{ background: `${category.color}18`, color: category.color, boxShadow: `0 2px 8px ${category.color}20` }">
                    <component :is="getToolIcon(tool.icon)" :size="15" />
                  </div>
                  <div class="tool-meta">
                    <span class="setting-label">{{ tool.name }}</span>
                    <span class="tool-id-tag">{{ tool.id }}</span>
                  </div>
                </div>
                <div class="tool-controls">
                  <button
                    class="chip-btn"
                    :class="{ active: tool.allowMultiple, disabled: !tool.enabled }"
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
          </template>
        </div>

        <!-- 系统设置 -->
        <div v-else-if="activeCategory === 'system'" class="settings-panel" key="system">
          <div class="content-header">
            <h2 class="content-title">系统</h2>
          </div>

          <div class="section-label">
            <span class="section-dot" style="background: #007AFF"></span>
            窗口行为
          </div>
          <div class="grouped-list">
            <div class="setting-item">
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

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">关闭窗口时</span>
                <span class="setting-desc">点击关闭按钮的行为</span>
              </div>
              <div class="segment-control">
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

          <div class="section-label">
            <span class="section-dot" style="background: #34C759"></span>
            启动
          </div>
          <div class="grouped-list">
            <div class="setting-item">
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

        <!-- 关于 -->
        <div v-else-if="activeCategory === 'about'" class="settings-panel" key="about">
          <div class="content-header">
            <h2 class="content-title">关于</h2>
          </div>

          <div class="about-hero glass-card">
            <div class="about-hero-bg"></div>
            <div class="about-hero-content">
              <div class="about-logo">
                <span class="logo-text">{{ configStore.appName?.[0] || 'E' }}</span>
              </div>
              <div class="about-hero-meta">
                <span class="about-hero-name">{{ configStore.appName }}</span>
                <span class="about-hero-version">版本 1.0.0</span>
                <span class="about-hero-desc">高效实用的开发者工具箱</span>
              </div>
            </div>
          </div>

          <div class="about-stats">
            <div class="about-stat-card glass-card">
              <span class="about-stat-icon" style="--stat-color: #007AFF"><LayoutGrid :size="18" /></span>
              <span class="about-stat-value">{{ configStore.tools.length }}</span>
              <span class="about-stat-label">工具总数</span>
            </div>
            <div class="about-stat-card glass-card">
              <span class="about-stat-icon" style="--stat-color: #34C759"><Check :size="18" /></span>
              <span class="about-stat-value">{{ configStore.usageStatsSummary?.todayCount || 0 }}</span>
              <span class="about-stat-label">今日使用</span>
            </div>
            <div class="about-stat-card glass-card">
              <span class="about-stat-icon" style="--stat-color: #FF9F0A"><Info :size="18" /></span>
              <span class="about-stat-value">{{ (configStore.usageStatsSummary?.todayCount || 0) + (configStore.usageStatsSummary?.weekCount || 0) }}</span>
              <span class="about-stat-label">累计使用</span>
            </div>
          </div>

          <div class="about-links">
            <div class="grouped-list">
              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">技术栈</span>
                  <span class="setting-desc">Vue 3 + Wails 3 + Go</span>
                </div>
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">开源协议</span>
                  <span class="setting-desc">MIT License</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section-label">数据管理</div>
          <div class="grouped-list">
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">清空使用数据</span>
                <span class="setting-desc">清除所有使用统计记录，此操作不可恢复</span>
              </div>
              <button class="text-btn danger" @click="showClearDialog = true">清空</button>
            </div>
          </div>
        </div>
      </Transition>
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
  display: grid;
  grid-template-columns: 220px 1fr;
  height: 100%;
  overflow: hidden;
  background: var(--bg-primary);
}

/* ====== 侧边栏 ====== */
.sidebar {
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-subtle);
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 12px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.back-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-strong);
  color: var(--text-primary);
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 2px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent-light);
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 500;
}

.nav-icon {
  font-size: 15px;
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ====== 主内容 ====== */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px;
}

.settings-panel {
  max-width: 600px;
  margin: 0 auto;
}

.content-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 16px;
}

.content-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.content-count {
  font-size: 13px;
  color: var(--text-muted);
}

/* ====== 分区标签 - macOS 风格 ====== */
.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 6px;
  padding-left: 2px;
}

.section-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.section-badge {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: auto;
}

.section-label:not(:first-child) {
  margin-top: 20px;
}

/* ====== 分组列表 - macOS Grouped List ====== */
.grouped-list {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 4px;
}

/* ====== 设置项 ====== */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 16px;
  border-bottom: 1px solid var(--border-subtle);
  min-height: 44px;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item.disabled {
  opacity: 0.45;
}

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

/* ====== 输入框 ====== */
.setting-input {
  width: 180px;
  height: 28px;
  padding: 0 10px;
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  outline: none;
  transition: all var(--transition-fast);
}

.setting-input:hover {
  border-color: var(--border-strong);
}

.setting-input:focus {
  border-color: var(--accent);
  box-shadow: var(--shadow-focus);
}

/* ====== 下拉框 ====== */
.setting-select {
  width: 140px;
  height: 28px;
  padding: 0 10px;
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  outline: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.setting-select:hover {
  border-color: var(--border-strong);
}

.setting-select:focus {
  border-color: var(--accent);
}

.setting-select option {
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* ====== 分段控件 - macOS Segmented Control ====== */
.segment-control {
  display: flex;
  gap: 2px;
  background: var(--bg-tertiary);
  padding: 2px;
  border-radius: var(--radius-sm);
}

.segment-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 14px;
  background: transparent;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-weight: 500;
}

.segment-btn:hover {
  color: var(--text-primary);
}

.segment-btn.active {
  background: var(--bg-card);
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.05);
}

/* ====== 颜色选择 ====== */
.color-preview-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
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
  padding: 10px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  margin-bottom: 4px;
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

/* ====== 开关 - macOS Toggle ====== */
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
  background: #fff;
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

/* ====== 文本按钮 ====== */
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

/* ====== 工具项 ====== */
.tool-item {
  padding: 10px 16px;
  transition: background var(--transition-fast);
}

.tool-item:not(.disabled):hover {
  background: var(--bg-hover);
}

.tool-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 15px;
  flex-shrink: 0;
  transition: transform 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.tool-item:not(.disabled):hover .tool-icon {
  transform: scale(1.08);
}

.tool-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tool-id-tag {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 1px 6px;
  border-radius: 4px;
  width: fit-content;
}

.tool-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chip-btn {
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px) saturate(1.2);
  -webkit-backdrop-filter: blur(8px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.chip-btn:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.8);
  border-color: var(--border-strong);
  color: var(--text-secondary);
}

.chip-btn.active {
  background: rgba(0, 122, 255, 0.12);
  backdrop-filter: blur(8px) saturate(1.2);
  -webkit-backdrop-filter: blur(8px) saturate(1.2);
  border-color: rgba(0, 122, 255, 0.3);
  color: var(--accent);
}

.chip-btn.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ====== 应用信息 ====== */
.app-info-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 16px;
}

.app-logo {
  width: 52px;
  height: 52px;
  background: var(--accent);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

.app-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.app-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.app-version {
  font-size: 12px;
  color: var(--text-muted);
}

/* ====== 统计 ====== */
.stats-row {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 18px 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

/* ====== 动画 ====== */
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

/* ====== 响应式 ====== */
@media (max-width: 700px) {
  .settings-page {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }

  .main-content {
    padding: 16px;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .setting-input,
  .setting-select {
    width: 100%;
  }
}

html.dark .chip-btn {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
}

html.dark .chip-btn:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
}

html.dark .chip-btn.active {
  background: rgba(0, 122, 255, 0.15);
  border-color: rgba(0, 122, 255, 0.25);
}

html.dark .tool-group-list {
  background: rgba(30, 30, 40, 0.5);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  border-color: rgba(255, 255, 255, 0.06);
}

/* ====== About 页面 ====== */
.glass-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: var(--radius-lg);
}

html.dark .glass-card {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
}

.about-hero {
  position: relative;
  overflow: hidden;
  padding: 28px 24px;
  margin-bottom: 16px;
}

.about-hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--accent-light) 0%, transparent 60%);
  opacity: 0.6;
}

html.dark .about-hero-bg {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.18) 0%, transparent 60%);
  opacity: 1;
}

.about-hero-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
}

.about-logo {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.25);
}

.logo-text {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.about-hero-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.about-hero-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.about-hero-version {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
}

.about-hero-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.about-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.about-stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
}

.about-stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--stat-color) 12%, transparent);
  color: var(--stat-color);
}

.about-stat-value {
  font-size: 22px;
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

.about-links {
  margin-bottom: 4px;
}
</style>
