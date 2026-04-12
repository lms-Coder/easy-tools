export type Theme = 'light' | 'dark'

export interface ThemeConfig {
  current: Theme
  primaryColor: string
}

export interface LayoutConfig {
  sidebarCollapsed: boolean
}

export interface ToolConfig {
  id: string
  name: string
  desc?: string
  description: string
  category: string
  icon: string
  route?: string
  path?: string
  enabled: boolean
  allowMultiple?: boolean
  implemented?: boolean
}

export interface ToolCategory {
  id?: string
  name: string
  icon?: string
  color?: string
  tools: ToolConfig[]
}

export interface SystemConfig {
  minimizeToTray: boolean
  closeBehavior: 'close' | 'minimize' | 'ask'
  launchOnStartup: boolean
}

export interface UsageStats {
  [toolId: string]: {
    count: number
    lastUsed: string
  }
}

export interface UsageStatsSummary {
  todayCount: number
  weekCount: number
  monthCount: number
  ranking: { toolId: string; useCount: number; lastUsed: string }[]
  recentUsed: { toolId: string; timestamp: string }[]
  dailyStats: { date: string; count: number }[]
}

export interface Config {
  app: {
    name: string
    version: string
  }
  theme: ThemeConfig
  layout: LayoutConfig
  tools: ToolConfig[]
  categories: ToolCategory[]
  usageStats: UsageStats
  system: SystemConfig
}
