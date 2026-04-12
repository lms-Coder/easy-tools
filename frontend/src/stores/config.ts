import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Config, ThemeConfig, LayoutConfig, ToolConfig, ToolCategory, SystemConfig, UsageStatsSummary } from '@/types/config'
import { TOOL_DEFINITIONS } from '@/tools/definitions'
import * as ConfigService from '../../bindings/easy-tools/internal/services/configservice.js'

// 分类 ID → 中文名映射
const CATEGORY_NAMES: Record<string, string> = {
  dev: '开发工具', encode: '编码转换', time: '时间处理',
  text: '文本处理', security: '安全工具', system: '系统工具', other: '其他',
}

const DEFAULT_APP_NAME = 'Easy Tools'
const DEFAULT_VERSION = '0.1.0'

export const useConfigStore = defineStore('config', () => {
  const config = ref<Config>({
    app: { name: DEFAULT_APP_NAME, version: DEFAULT_VERSION },
    theme: { current: 'light', primaryColor: '#007AFF' },
    layout: { sidebarCollapsed: false },
    tools: [],
    categories: [],
    usageStats: {},
    system: { minimizeToTray: true, closeBehavior: 'minimize', launchOnStartup: false },
  })

  const initialized = ref(false)
  const usageStatsSummary = ref<UsageStatsSummary | null>(null)

  // Computed accessors
  const appName = computed(() => config.value.app.name)
  const appVersion = computed(() => config.value.app.version)
  const themeConfig = computed<ThemeConfig>(() => config.value.theme)
  const layoutConfig = computed<LayoutConfig>(() => config.value.layout)
  const tools = computed<ToolConfig[]>(() => config.value.tools)
  const enabledTools = computed<ToolConfig[]>(() => config.value.tools.filter(tool => tool.enabled))
  const categories = computed<ToolCategory[]>(() => config.value.categories)
  const systemConfig = computed<SystemConfig>(() => config.value.system)
  const sidebarCollapsed = computed(() => config.value.layout.sidebarCollapsed)
  const primaryColor = computed(() => config.value.theme.primaryColor)

  const toolsByCategory = computed((): ToolCategory[] => {
    const categoryMap = new Map<string, ToolConfig[]>()
    enabledTools.value.forEach(tool => {
      const category = tool.category || '其他'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, [])
      }
      categoryMap.get(category)!.push(tool)
    })
    return Array.from(categoryMap.entries()).map(([name, items]) => ({ name, tools: items }))
  })

  const allToolsByCategory = computed((): ToolCategory[] => {
    const categoryMap = new Map<string, ToolConfig[]>()
    tools.value.forEach(tool => {
      const category = tool.category || '其他'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, [])
      }
      categoryMap.get(category)!.push(tool)
    })
    return Array.from(categoryMap.entries()).map(([name, items]) => ({ name, tools: items }))
  })

  // 初始化：同步工具定义到数据库，再从数据库加载完整配置
  async function initConfig() {
    try {
      // 1. 同步前端工具定义到数据库（补上 sortOrder）
      const toolsToSync = TOOL_DEFINITIONS.map((t, i) => ({ ...t, sortOrder: i }))
      await ConfigService.SyncTools(toolsToSync)

      // 2. 并行加载所有配置
      const [appNameStr, primaryColorStr, themeStr, sidebarCollapsedBool, sysConfig, toolsList, categoriesList, usageSummary] = await Promise.all([
        ConfigService.GetAppName(),
        ConfigService.GetPrimaryColor(),
        ConfigService.GetTheme(),
        ConfigService.GetSidebarCollapsed(),
        ConfigService.GetSystemConfig(),
        ConfigService.GetTools(),
        ConfigService.GetCategories(),
        ConfigService.GetUsageStatsSummary(),
      ])

      // 应用名称
      if (appNameStr) config.value.app.name = appNameStr

      // 主题
      if (themeStr) config.value.theme.current = themeStr as 'light' | 'dark'
      if (primaryColorStr) config.value.theme.primaryColor = primaryColorStr

      // 布局
      config.value.layout.sidebarCollapsed = sidebarCollapsedBool

      // 系统配置
      if (sysConfig) {
        config.value.system = {
          minimizeToTray: sysConfig.MinimizeToTray,
          closeBehavior: (sysConfig.CloseBehavior || 'minimize') as 'close' | 'minimize' | 'ask',
          launchOnStartup: sysConfig.LaunchOnStartup,
        }
      }

      // 工具列表（从数据库加载）
      if (toolsList && toolsList.length > 0) {
        config.value.tools = toolsList.map((t: any) => ({
          id: t.ID,
          name: t.Name,
          description: t.Description,
          category: CATEGORY_NAMES[t.Category] || t.Category || '其他',
          icon: t.Icon,
          route: t.Route,
          enabled: t.Enabled,
          allowMultiple: t.AllowMultiple,
          implemented: t.Implemented,
        }))
      }

      // 分类列表（从数据库加载，用于侧边栏等显示）
      if (categoriesList && categoriesList.length > 0) {
        config.value.categories = categoriesList.map((c: any) => ({
          id: c.ID,
          name: c.Name,
          icon: c.Icon,
          tools: [],
        }))
      }

      // 使用统计
      if (usageSummary) {
        usageStatsSummary.value = {
          todayCount: usageSummary.todayCount,
          weekCount: usageSummary.weekCount,
          monthCount: usageSummary.monthCount,
          ranking: (usageSummary.ranking || []).map((r: any) => ({
            toolId: r.toolId,
            useCount: r.useCount,
            lastUsed: r.lastUsed,
          })),
          recentUsed: (usageSummary.recentUsed || []).map((r: any) => ({
            toolId: r.toolId,
            timestamp: r.timestamp,
          })),
          dailyStats: (usageSummary.dailyStats || []).map((d: any) => ({
            date: d.date,
            count: d.count,
          })),
        }
      }
    } catch (e) {
      console.error('Failed to load config from backend:', e)
    }

    initialized.value = true
  }

  function getToolById(id: string): ToolConfig | undefined {
    return tools.value.find(tool => tool.id === id)
  }

  // Theme
  async function setTheme(current: 'light' | 'dark'): Promise<void> {
    config.value.theme.current = current
    try { await ConfigService.SetTheme(current) } catch (e) { console.error(e) }
  }

  async function setPrimaryColor(color: string): Promise<void> {
    config.value.theme.primaryColor = color
    try { await ConfigService.SetPrimaryColor(color) } catch (e) { console.error(e) }
  }

  // Layout
  function toggleSidebar(): void {
    const newVal = !config.value.layout.sidebarCollapsed
    setSidebarCollapsed(newVal)
  }

  async function setSidebarCollapsed(collapsed: boolean): Promise<void> {
    config.value.layout.sidebarCollapsed = collapsed
    try { await ConfigService.SetSidebarCollapsed(collapsed) } catch (e) { console.error(e) }
  }

  // Tools
  async function setToolEnabled(toolId: string, enabled: boolean): Promise<void> {
    const tool = config.value.tools.find((t) => t.id === toolId)
    if (tool) {
      tool.enabled = enabled
      try { await ConfigService.SetToolEnabled(toolId, enabled) } catch (e) { console.error(e) }
    }
  }

  async function setToolAllowMultiple(toolId: string, allowMultiple: boolean): Promise<void> {
    const tool = config.value.tools.find((t) => t.id === toolId)
    if (tool) {
      tool.allowMultiple = allowMultiple
      try { await ConfigService.SetToolAllowMultiple(toolId, allowMultiple) } catch (e) { console.error(e) }
    }
  }

  function setTools(toolsList: ToolConfig[]): void {
    config.value.tools = toolsList
  }

  function setCategories(cats: ToolCategory[]): void {
    config.value.categories = cats
  }

  // Usage
  async function recordToolUsage(toolId: string): Promise<void> {
    try { await ConfigService.RecordToolUsage(toolId) } catch (e) { console.error(e) }
    // 刷新统计
    loadUsageStats()
  }

  async function loadUsageStats(): Promise<void> {
    try {
      const summary = await ConfigService.GetUsageStatsSummary()
      if (summary) {
        usageStatsSummary.value = {
          todayCount: summary.todayCount,
          weekCount: summary.weekCount,
          monthCount: summary.monthCount,
          ranking: (summary.ranking || []).map((r: any) => ({
            toolId: r.toolId,
            useCount: r.useCount,
            lastUsed: r.lastUsed,
          })),
          recentUsed: (summary.recentUsed || []).map((r: any) => ({
            toolId: r.toolId,
            timestamp: r.timestamp,
          })),
          dailyStats: (summary.dailyStats || []).map((d: any) => ({
            date: d.date,
            count: d.count,
          })),
        }
      }
    } catch (e) { console.error(e) }
  }

  async function clearUsageData(): Promise<void> {
    try { await ConfigService.ClearUsageData() } catch (e) { console.error(e) }
    usageStatsSummary.value = null
  }

  // System
  async function setSystemConfig(partial: Partial<SystemConfig>): Promise<void> {
    config.value.system = { ...config.value.system, ...partial }
    if (partial.minimizeToTray !== undefined) try { await ConfigService.SetMinimizeToTray(partial.minimizeToTray) } catch (e) { console.error(e) }
    if (partial.closeBehavior !== undefined) try { await ConfigService.SetCloseBehavior(partial.closeBehavior) } catch (e) { console.error(e) }
    if (partial.launchOnStartup !== undefined) try { await ConfigService.SetLaunchOnStartup(partial.launchOnStartup) } catch (e) { console.error(e) }
  }

  async function setMinimizeToTray(value: boolean): Promise<void> {
    config.value.system.minimizeToTray = value
    try { await ConfigService.SetMinimizeToTray(value) } catch (e) { console.error(e) }
  }

  async function setCloseBehavior(behavior: 'close' | 'minimize' | 'ask'): Promise<void> {
    config.value.system.closeBehavior = behavior
    try { await ConfigService.SetCloseBehavior(behavior) } catch (e) { console.error(e) }
  }

  async function setLaunchOnStartup(value: boolean): Promise<void> {
    config.value.system.launchOnStartup = value
    try { await ConfigService.SetLaunchOnStartup(value) } catch (e) { console.error(e) }
  }

  async function setAppName(name: string): Promise<void> {
    config.value.app.name = name
    try { await ConfigService.SetAppName(name) } catch (e) { console.error(e) }
  }

  return {
    config,
    initialized,
    appName,
    appVersion,
    themeConfig,
    layoutConfig,
    tools,
    enabledTools,
    categories,
    usageStatsSummary,
    systemConfig,
    sidebarCollapsed,
    primaryColor,
    toolsByCategory,
    allToolsByCategory,
    initConfig,
    getToolById,
    setTheme,
    setPrimaryColor,
    toggleSidebar,
    setSidebarCollapsed,
    setToolEnabled,
    setToolAllowMultiple,
    setTools,
    setCategories,
    recordToolUsage,
    loadUsageStats,
    clearUsageData,
    setSystemConfig,
    setMinimizeToTray,
    setCloseBehavior,
    setLaunchOnStartup,
    setAppName,
  }
})
