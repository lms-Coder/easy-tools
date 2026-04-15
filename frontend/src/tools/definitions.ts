export interface ToolWindowConfig {
  width: number
  height: number
  minWidth?: number
  minHeight?: number
}

export interface ToolDefinition {
  id: string
  name: string
  description: string
  category: string
  icon: string
  route: string
  sortOrder?: number
  implemented: boolean
  window?: ToolWindowConfig
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // 开发工具
  {
    id: 'json-formatter',
    name: 'JSON 工具箱',
    description: '格式化、互转、对比、Schema 验证',
    category: 'dev',
    icon: 'icon-json',
    route: '/tool/json-formatter',
    implemented: true,
    window: { width: 1100, height: 800, minWidth: 800, minHeight: 560 },
  },
  {
    id: 'json-schema',
    name: 'JSON Schema',
    description: 'JSON Schema 生成、验证与代码生成',
    category: 'dev',
    icon: 'icon-schema',
    route: '/tool/json-schema',
    implemented: true,
    window: { width: 1280, height: 820, minWidth: 900, minHeight: 600 },
  },
  {
    id: 'regex',
    name: '正则表达式',
    description: '正则表达式测试、匹配与调试',
    category: 'dev',
    icon: 'icon-regex',
    route: '/tool/regex',
    implemented: true,
    window: { width: 1200, height: 800, minWidth: 900, minHeight: 600 },
  },
  {
    id: 'cron',
    name: 'Cron 表达式',
    description: 'Cron 表达式生成、解析与验证',
    category: 'dev',
    icon: 'icon-cron',
    route: '/tool/cron',
    implemented: true,
    window: { width: 1000, height: 700, minWidth: 750, minHeight: 500 },
  },
  {
    id: 'xml-formatter',
    name: 'XML 格式化',
    description: 'XML 格式化、压缩、校验与转换',
    category: 'dev',
    icon: 'icon-xml',
    route: '/tool/xml-formatter',
    implemented: true,
    window: { width: 1024, height: 768, minWidth: 700, minHeight: 500 },
  },
  {
    id: 'linux-commands',
    name: 'Linux 命令速查',
    description: 'Linux 命令分类速查，支持搜索和收藏',
    category: 'dev',
    icon: 'icon-linux',
    route: '/tool/linux-commands',
    implemented: true,
    window: { width: 1200, height: 800, minWidth: 900, minHeight: 600 },
  },
  // 安全工具
  {
    id: 'jwt',
    name: 'JWT 解析',
    description: 'JWT Token 解析、生成与验证',
    category: 'security',
    icon: 'icon-jwt',
    route: '/tool/jwt',
    implemented: true,
    window: { width: 1024, height: 768, minWidth: 700, minHeight: 500 },
  },
  {
    id: 'hash',
    name: '哈希计算',
    description: 'MD5、SHA1、SHA256 等哈希计算',
    category: 'security',
    icon: 'icon-hash',
    route: '/tool/hash',
    implemented: true,
    window: { width: 1024, height: 768, minWidth: 700, minHeight: 500 },
  },
  {
    id: 'crypto',
    name: '加密解密',
    description: 'AES/DES/3DES/RSA/ChaCha20 加密解密、哈希计算、Base64 编解码',
    category: 'security',
    icon: 'icon-crypto',
    route: '/tool/crypto',
    implemented: true,
    window: { width: 1024, height: 768, minWidth: 700, minHeight: 500 },
  },
  // 编码转换
  {
    id: 'base64',
    name: 'Base64 编解码',
    description: 'Base64 文本和文件编解码',
    category: 'encode',
    icon: 'icon-swap',
    route: '/tool/base64',
    implemented: true,
    window: { width: 1100, height: 768, minWidth: 800, minHeight: 600 },
  },
  {
    id: 'url',
    name: 'URL 编解码',
    description: 'URL 编码和解码转换',
    category: 'encode',
    icon: 'icon-link',
    route: '/tool/url',
    implemented: true,
    window: { width: 1024, height: 768, minWidth: 700, minHeight: 500 },
  },
  {
    id: 'unicode',
    name: 'Unicode 转换',
    description: 'Unicode 编码解码与字符查询',
    category: 'encode',
    icon: 'icon-unicode',
    route: '/tool/unicode',
    implemented: true,
    window: { width: 1024, height: 768, minWidth: 700, minHeight: 500 },
  },
  {
    id: 'ascii',
    name: 'ASCII 转换',
    description: '字符与 ASCII 码双向转换',
    category: 'encode',
    icon: 'icon-ascii',
    route: '/tool/ascii',
    implemented: true,
    window: { width: 1024, height: 768, minWidth: 700, minHeight: 500 },
  },
  // 时间处理
  {
    id: 'timestamp',
    name: '时间戳转换',
    description: '时间戳与日期时间互转',
    category: 'time',
    icon: 'icon-clock-circle',
    route: '/tool/timestamp',
    implemented: true,
    window: { width: 1024, height: 720, minWidth: 700, minHeight: 520 },
  },
  {
    id: 'calendar',
    name: '日历',
    description: '日历查看与日期选择，支持农历和节假日',
    category: 'time',
    icon: 'icon-calendar',
    route: '/tool/calendar',
    implemented: true,
    window: { width: 960, height: 680, minWidth: 720, minHeight: 500 },
  },
  // 文本处理
  {
    id: 'diff',
    name: '文本对比',
    description: '文本差异对比与合并',
    category: 'text',
    icon: 'icon-diff',
    route: '/tool/diff',
    implemented: true,
    window: { width: 1280, height: 820, minWidth: 900, minHeight: 600 },
  },
  {
    id: 'markdown',
    name: 'Markdown 编辑',
    description: 'Markdown 实时预览编辑器',
    category: 'text',
    icon: 'icon-markdown',
    route: '/tool/markdown',
    implemented: true,
    window: { width: 1200, height: 800, minWidth: 900, minHeight: 600 },
  },
  // 系统工具
  {
    id: 'port',
    name: '端口管理器',
    description: '查看端口占用并结束进程',
    category: 'system',
    icon: 'icon-port',
    route: '/tool/port',
    implemented: true,
    window: { width: 1024, height: 768, minWidth: 700, minHeight: 500 },
  },
  {
    id: 'jdk',
    name: 'JDK 版本管理',
    description: '管理和切换本地 JDK 版本',
    category: 'system',
    icon: 'icon-jdk',
    route: '/tool/jdk',
    implemented: true,
    window: { width: 1024, height: 768, minWidth: 700, minHeight: 500 },
  },
  {
    id: 'env-vars',
    name: '环境变量',
    description: '查看系统和用户环境变量',
    category: 'system',
    icon: 'icon-env',
    route: '/tool/env-vars',
    implemented: true,
    window: { width: 1024, height: 768, minWidth: 700, minHeight: 500 },
  },
  // 其他
  {
    id: 'qrcode',
    name: '二维码',
    description: '二维码生成与识别',
    category: 'other',
    icon: 'icon-qrcode',
    route: '/tool/qrcode',
    implemented: true,
    window: { width: 1024, height: 768, minWidth: 700, minHeight: 500 },
  },
  {
    id: 'color-picker',
    name: '颜色选择器',
    description: '颜色选取、转换与调色板',
    category: 'other',
    icon: 'icon-palette',
    route: '/tool/color-picker',
    implemented: true,
    window: { width: 900, height: 640, minWidth: 640, minHeight: 460 },
  },
  {
    id: 'uuid',
    name: 'UUID 生成器',
    description: 'UUID 生成、格式转换与批量生成',
    category: 'other',
    icon: 'icon-fingerprint',
    route: '/tool/uuid',
    implemented: true,
    window: { width: 960, height: 680, minWidth: 700, minHeight: 500 },
  },
  {
    id: 'watermark',
    name: '水印工具',
    description: '为图片添加文字、图片或满屏水印',
    category: 'other',
    icon: 'icon-watermark',
    route: '/tool/watermark',
    implemented: true,
    window: { width: 1000, height: 700, minWidth: 800, minHeight: 500 },
  },
]

export function getToolDefinition(id: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS.find(t => t.id === id)
}
