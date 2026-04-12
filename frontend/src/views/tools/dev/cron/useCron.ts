import { computed, ref, watch } from 'vue'
import { toast } from '@/composables/useToast'

export type FieldKind = 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek'

export interface CronParseResult {
  valid: boolean
  error: string
  normalized: string
  fields: Record<FieldKind, string>
}

export interface FieldRow {
  label: string
  key: FieldKind
  value: string
  range: string
  desc: string
}

export interface CronPreset {
  name: string
  value: string
  summary: string
}

export interface CronExample {
  code: string
  desc: string
}

export interface HelpSection {
  title: string
  items: { code: string; desc: string }[]
}

export const presets: CronPreset[] = [
  { name: '每分钟', value: '* * * * *', summary: '适合轻量轮询和保活任务。' },
  { name: '每 15 分钟', value: '*/15 * * * *', summary: '适合同步、缓存刷新、健康检查。' },
  { name: '每小时整点', value: '0 * * * *', summary: '适合小时级聚合和数据汇总。' },
  { name: '每天 08:30', value: '30 8 * * *', summary: '适合日报、提醒和日常通知。' },
  { name: '工作日 09:00', value: '0 9 * * 1-5', summary: '适合上班时段自动任务。' },
  { name: '每周一 10:00', value: '0 10 * * 1', summary: '适合周报和周巡检。' },
  { name: '每月 1 号 00:00', value: '0 0 1 * *', summary: '适合归档、结算、月初任务。' },
]

export const examples: CronExample[] = [
  { code: '*/5 * * * *', desc: '每 5 分钟执行一次' },
  { code: '30 9 * * 1-5', desc: '工作日每天 09:30 执行' },
  { code: '0 0 1 * *', desc: '每月 1 号 00:00 执行' },
  { code: '0 18 * * 5', desc: '每周五 18:00 执行' },
]

export const helpContent: HelpSection[] = [
  {
    title: '字段顺序',
    items: [
      { code: '* * * * *', desc: '依次是：分 时 日 月 周。' },
      { code: '0 9 * * 1-5', desc: '表示周一到周五每天 09:00。' },
      { code: '0 0 1 * *', desc: '表示每月 1 号 00:00。' },
    ],
  },
  {
    title: '常用符号',
    items: [
      { code: '*', desc: '任意值。' },
      { code: '*/n', desc: '步长，例如 */15 表示每 15 个单位。' },
      { code: 'a,b,c', desc: '枚举多个值，例如 1,3,5。' },
      { code: 'a-b', desc: '范围，例如 1-5。' },
      { code: 'a-b/n', desc: '范围内按步长执行，例如 1-10/2。' },
    ],
  },
  {
    title: '别名支持',
    items: [
      { code: 'MON-FRI', desc: '支持英文星期缩写：SUN 到 SAT。' },
      { code: 'JAN-MAR', desc: '支持英文月份缩写：JAN 到 DEC。' },
      { code: '0 / 7', desc: '星期字段里都可以代表周日。' },
    ],
  },
  {
    title: '说明',
    items: [
      { code: '5 段', desc: '当前工具只解析标准 5 段 Cron，不含秒和年。' },
      { code: '预览', desc: '未来触发时间用于理解表达式，不替代后端真实调度实现。' },
      { code: '校验', desc: '适合做前端解释、联调辅助和表达式检查。' },
    ],
  },
]

const MONTH_ALIASES: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

const WEEKDAY_ALIASES: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
}

export function useCron() {
  const cronInput = ref('30 9 * * 1-5')
  const copiedField = ref<string | null>(null)
  const showHelpModal = ref(false)

  watch(copiedField, value => {
    if (!value) return
    setTimeout(() => {
      if (copiedField.value === value) copiedField.value = null
    }, 1200)
  })

  const parseResult = computed<CronParseResult>(() => parseCron(cronInput.value))

  const fieldRows = computed<FieldRow[]>(() => {
    if (!parseResult.value.valid) return []
    return [
      { label: '分钟', key: 'minute', value: parseResult.value.fields.minute, range: '0-59', desc: describeField('minute', parseResult.value.fields.minute) },
      { label: '小时', key: 'hour', value: parseResult.value.fields.hour, range: '0-23', desc: describeField('hour', parseResult.value.fields.hour) },
      { label: '日期', key: 'dayOfMonth', value: parseResult.value.fields.dayOfMonth, range: '1-31', desc: describeField('dayOfMonth', parseResult.value.fields.dayOfMonth) },
      { label: '月份', key: 'month', value: parseResult.value.fields.month, range: '1-12', desc: describeField('month', parseResult.value.fields.month) },
      { label: '星期', key: 'dayOfWeek', value: parseResult.value.fields.dayOfWeek, range: '0-7', desc: describeField('dayOfWeek', parseResult.value.fields.dayOfWeek) },
    ]
  })

  const explanationParagraph = computed(() => {
    if (!parseResult.value.valid) return ''
    const parts = [
      describeMinuteSummary(parseResult.value.fields.minute),
      describeHourSummary(parseResult.value.fields.hour),
      describeDayOfMonthSummary(parseResult.value.fields.dayOfMonth),
      describeMonthSummary(parseResult.value.fields.month),
      describeDayOfWeekSummary(parseResult.value.fields.dayOfWeek),
    ].filter(Boolean)
    return parts.length ? `这条表达式表示：${parts.join('，')}。` : ''
  })

  const nextRunTimes = computed<string[]>(() => {
    if (!parseResult.value.valid) return []
    return calculateNextRunTimes(parseResult.value.normalized, 8)
  })

  const activePreset = computed<CronPreset | null>(() =>
    presets.find(item => item.value === parseResult.value.normalized) || null
  )

  const applyPreset = (value: string) => { cronInput.value = value }
  const clearInput = () => { cronInput.value = '' }
  const fillDemo = () => { cronInput.value = '30 9 * * 1-5' }

  const copyValue = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      copiedField.value = field
      toast.success('已复制')
    } catch {
      toast.error('复制失败')
    }
  }

  // ====== Internal parsing ======

  function parseCron(input: string): CronParseResult {
    const normalized = input.trim().replace(/\s+/g, ' ')
    if (!normalized) return emptyResult('请输入 Cron 表达式')

    const parts = normalized.split(' ')
    if (parts.length !== 5) return emptyResult('当前只支持 5 段 Cron：分 时 日 月 周', normalized)

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts.map(s => s.toLowerCase())
    const fields = { minute, hour, dayOfMonth, month, dayOfWeek }

    const errors = [
      validateField(minute, 0, 59, null, '分钟'),
      validateField(hour, 0, 23, null, '小时'),
      validateField(dayOfMonth, 1, 31, null, '日期'),
      validateField(month, 1, 12, MONTH_ALIASES, '月份'),
      validateField(dayOfWeek, 0, 7, WEEKDAY_ALIASES, '星期'),
    ]

    const firstError = errors.find(Boolean)
    if (firstError) {
      return { valid: false, error: firstError, normalized, fields }
    }

    return { valid: true, error: '', normalized, fields }
  }

  function emptyResult(error: string, normalized = ''): CronParseResult {
    return {
      valid: false, error, normalized,
      fields: { minute: '', hour: '', dayOfMonth: '', month: '', dayOfWeek: '' },
    }
  }

  function validateField(field: string, min: number, max: number, aliases: Record<string, number> | null, label: string): string {
    const segments = field.split(',')
    for (const segment of segments) {
      const error = validateSegment(segment.trim(), min, max, aliases)
      if (error) return `${label}字段错误：${error}`
    }
    return ''
  }

  function validateSegment(segment: string, min: number, max: number, aliases: Record<string, number> | null): string {
    if (!segment) return '字段不能为空'
    if (segment === '*') return ''

    const [base, stepText] = segment.split('/')
    if (segment.includes('/')) {
      const step = Number(stepText)
      if (!Number.isInteger(step) || step <= 0) return `无效步长 ${segment}`
    }

    if (base === '*') return ''

    if (base.includes('-')) {
      const [startRaw, endRaw] = base.split('-')
      const start = normalizeValue(startRaw, aliases)
      const end = normalizeValue(endRaw, aliases)
      if (start == null || end == null) return `无效范围 ${segment}`
      if (start < min || end > max || start > end) return `范围越界 ${segment}`
      return ''
    }

    const single = normalizeValue(base, aliases)
    if (single == null) return `无效值 ${segment}`
    if (single < min || single > max) return `值越界 ${segment}`
    return ''
  }

  function normalizeValue(raw: string, aliases: Record<string, number> | null): number | null {
    const lower = raw.toLowerCase()
    if (aliases && lower in aliases) return aliases[lower]
    const num = Number(lower)
    return Number.isInteger(num) ? num : null
  }

  function describeField(kind: FieldKind, expr: string): string {
    if (expr === '*') return '任意值'
    if (expr.startsWith('*/')) return `每 ${expr.slice(2)} 个单位执行一次`
    if (expr.includes(',') && !expr.includes('/')) return `枚举多个值：${expr}`
    if (expr.includes('-') && expr.includes('/')) return `在 ${expr.split('/')[0]} 范围内按 ${expr.split('/')[1]} 递进`
    if (expr.includes('-')) return `范围选择：${expr}`
    if (expr.includes('/')) return `从 ${expr.split('/')[0]} 开始按 ${expr.split('/')[1]} 递进`
    if (kind === 'month') return monthLabel(expr)
    if (kind === 'dayOfWeek') return weekLabel(expr)
    return `固定值：${expr}`
  }

  function describeMinuteSummary(expr: string): string {
    if (expr === '*') return '每分钟都会触发'
    if (expr.startsWith('*/')) return `每 ${expr.slice(2)} 分钟触发一次`
    return `分钟为 ${expr}`
  }

  function describeHourSummary(expr: string): string {
    if (expr === '*') return '每小时都生效'
    return `小时为 ${expr}`
  }

  function describeDayOfMonthSummary(expr: string): string {
    if (expr === '*') return '每天都生效'
    return `日期为 ${expr}`
  }

  function describeMonthSummary(expr: string): string {
    if (expr === '*') return '每个月都生效'
    return `月份为 ${humanizeMonth(expr)}`
  }

  function describeDayOfWeekSummary(expr: string): string {
    if (expr === '*') return '星期不限'
    return `星期为 ${humanizeWeek(expr)}`
  }

  function humanizeMonth(expr: string): string {
    if (expr.includes('-')) {
      const [start, end] = expr.split('-')
      return `${monthLabel(start)} 到 ${monthLabel(end)}`
    }
    return monthLabel(expr)
  }

  function humanizeWeek(expr: string): string {
    if (expr.includes('-')) {
      const [start, end] = expr.split('-')
      return `${weekLabel(start)} 到 ${weekLabel(end)}`
    }
    return weekLabel(expr)
  }

  function monthLabel(value: string): string {
    const map: Record<string, string> = {
      '1': '一月', '2': '二月', '3': '三月', '4': '四月', '5': '五月', '6': '六月',
      '7': '七月', '8': '八月', '9': '九月', '10': '十月', '11': '十一月', '12': '十二月',
      jan: '一月', feb: '二月', mar: '三月', apr: '四月', may: '五月', jun: '六月',
      jul: '七月', aug: '八月', sep: '九月', oct: '十月', nov: '十一月', dec: '十二月',
    }
    return map[value.toLowerCase()] || value
  }

  function weekLabel(value: string): string {
    const map: Record<string, string> = {
      '0': '周日', '1': '周一', '2': '周二', '3': '周三', '4': '周四', '5': '周五', '6': '周六', '7': '周日',
      sun: '周日', mon: '周一', tue: '周二', wed: '周三', thu: '周四', fri: '周五', sat: '周六',
    }
    return map[value.toLowerCase()] || value
  }

  function calculateNextRunTimes(normalized: string, count: number): string[] {
    const [minute, hour, dayOfMonth, month, dayOfWeek] = normalized.split(' ')
    const matcher = buildMatcher(minute, hour, dayOfMonth, month, dayOfWeek)
    const result: string[] = []
    let cursor = new Date()
    cursor.setSeconds(0, 0)
    cursor = new Date(cursor.getTime() + 60_000)

    let guard = 0
    while (result.length < count && guard < 120000) {
      if (matcher(cursor)) result.push(formatDate(cursor))
      cursor = new Date(cursor.getTime() + 60_000)
      guard++
    }

    return result
  }

  function buildMatcher(minute: string, hour: string, dayOfMonth: string, month: string, dayOfWeek: string) {
    return (date: Date) => (
      testValue(minute, date.getMinutes(), null) &&
      testValue(hour, date.getHours(), null) &&
      testValue(dayOfMonth, date.getDate(), null) &&
      testValue(month, date.getMonth() + 1, MONTH_ALIASES) &&
      testValue(dayOfWeek, date.getDay(), WEEKDAY_ALIASES, true)
    )
  }

  function testValue(expr: string, value: number, aliases: Record<string, number> | null, isWeekday = false): boolean {
    return expr.split(',').some(segment => testSegment(segment.trim(), value, aliases, isWeekday))
  }

  function testSegment(segment: string, value: number, aliases: Record<string, number> | null, isWeekday: boolean): boolean {
    const [base, stepText] = segment.split('/')
    const step = stepText ? Number(stepText) : null

    const matched = (() => {
      if (base === '*') return true
      if (base.includes('-')) {
        const [startRaw, endRaw] = base.split('-')
        const start = normalizeValue(startRaw, aliases) ?? -1
        const end = normalizeValue(endRaw, aliases) ?? -1
        const current = isWeekday && value === 0 ? 7 : value
        return current >= start && current <= end
      }
      const target = normalizeValue(base, aliases)
      if (target == null) return false
      if (isWeekday && target === 7) return value === 0
      return target === value
    })()

    if (!matched) return false
    if (!step) return true
    if (base === '*') return value % step === 0
    if (base.includes('-')) {
      const start = normalizeValue(base.split('-')[0], aliases) ?? 0
      return (value - start) % step === 0
    }
    const start = normalizeValue(base, aliases) ?? 0
    return (value - start) % step === 0
  }

  function formatDate(date: Date): string {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const mi = String(date.getMinutes()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
  }

  return {
    cronInput,
    copiedField,
    showHelpModal,
    parseResult,
    fieldRows,
    explanationParagraph,
    nextRunTimes,
    activePreset,
    applyPreset,
    clearInput,
    fillDemo,
    copyValue,
  }
}
