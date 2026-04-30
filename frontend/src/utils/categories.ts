export const CATEGORY_COLORS: Record<string, string> = {
  '开发工具': 'var(--cat-dev)',
  '编码转换': 'var(--cat-encode)',
  '时间处理': 'var(--cat-time)',
  '文本处理': 'var(--cat-text)',
  '安全工具': 'var(--cat-security)',
  '系统工具': 'var(--cat-system)',
  '其他': 'var(--cat-other)',
} as const

// 纯色值（用于 Canvas/ECharts 等不支持 CSS 变量的场景）
export const CATEGORY_COLORS_RAW: Record<string, string> = {
  '开发工具': '#3b82f6',
  '编码转换': '#10b981',
  '时间处理': '#f59e0b',
  '文本处理': '#06b6d4',
  '安全工具': '#ef4444',
  '系统工具': '#6366f1',
  '其他': '#8b5cf6',
}

export const getCategoryColor = (name: string): string => CATEGORY_COLORS[name] || 'var(--accent)'
export const getCategoryColorRaw = (name: string): string => CATEGORY_COLORS_RAW[name] || '#3b82f6'
