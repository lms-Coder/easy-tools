export const CATEGORY_COLORS: Record<string, string> = {
  '开发工具': 'var(--category-dev)',
  '编码转换': 'var(--category-encode)',
  '时间处理': 'var(--category-time)',
  '文本处理': 'var(--category-text)',
  '安全工具': 'var(--category-security)',
  '系统工具': 'var(--category-system)',
  '其他': 'var(--category-other)',
} as const

export const getCategoryColor = (name: string): string => CATEGORY_COLORS[name] || 'var(--accent)'
