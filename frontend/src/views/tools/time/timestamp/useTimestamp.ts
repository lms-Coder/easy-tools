import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/zh-cn'
import { toast } from '@/composables/useToast'
import { useToolHistory } from '@/composables/useToolHistory'

dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('zh-cn')

export interface TimezoneOption {
  value: string
  label: string
}

export const timezones: TimezoneOption[] = [
  { value: 'Asia/Shanghai', label: '北京 (UTC+8)' },
  { value: 'Asia/Tokyo', label: '东京 (UTC+9)' },
  { value: 'Asia/Singapore', label: '新加坡 (UTC+8)' },
  { value: 'Europe/London', label: '伦敦 (UTC+0)' },
  { value: 'Europe/Paris', label: '巴黎 (UTC+1)' },
  { value: 'America/New_York', label: '纽约 (UTC-5)' },
  { value: 'America/Los_Angeles', label: '洛杉矶 (UTC-8)' },
  { value: 'UTC', label: 'UTC' },
]

export function useTimestamp() {
  // ====== Timezone ======
  const selectedTimezone = ref('Asia/Shanghai')

  // ====== Live Clock ======
  const now = ref(dayjs())
  let clockTimer: ReturnType<typeof setInterval>

  const nowFormatted = computed(() => now.value.tz(selectedTimezone.value).format('YYYY年MM月DD日 HH:mm:ss'))
  const nowSeconds = computed(() => String(Math.floor(now.value.valueOf() / 1000)))
  const nowMilliseconds = computed(() => String(now.value.valueOf()))

  // ====== Timestamp → Date ======
  const inputTimestamp = ref('')
  const tsError = ref('')

  const tsInputDayjs = computed(() => {
    const raw = inputTimestamp.value.trim()
    if (!raw) { tsError.value = ''; return null }
    const num = Number(raw)
    if (isNaN(num) || raw === '') { tsError.value = '请输入有效数字'; return null }
    const ms = num > 9999999999 ? num : num * 1000
    const d = dayjs(ms)
    if (!d.isValid()) { tsError.value = '无效的时间戳'; return null }
    tsError.value = ''
    return d
  })

  const detectedUnit = computed(() => {
    const raw = inputTimestamp.value.trim()
    if (!raw) return ''
    const num = Number(raw)
    if (isNaN(num)) return ''
    return num > 9999999999 ? '毫秒' : '秒'
  })

  const tsLocal = computed(() => tsInputDayjs.value?.tz(selectedTimezone.value).format('YYYY-MM-DD HH:mm:ss') || '')
  const tsISO = computed(() => tsInputDayjs.value?.toISOString() || '')
  const tsUTC = computed(() => tsInputDayjs.value?.utc().format('YYYY-MM-DD HH:mm:ss [UTC]') || '')
  const tsRelative = computed(() => tsInputDayjs.value?.fromNow() || '')
  const tsDayOfWeek = computed(() => tsInputDayjs.value?.tz(selectedTimezone.value).format('dddd') || '')
  const tsTimestampSeconds = computed(() => {
    if (!tsInputDayjs.value) return ''
    return String(Math.floor(tsInputDayjs.value.valueOf() / 1000))
  })
  const tsTimestampMs = computed(() => tsInputDayjs.value ? String(tsInputDayjs.value.valueOf()) : '')

  // ====== Date → Timestamp ======
  const inputDate = ref('')
  const inputTime = ref('')

  const dateInputDayjs = computed(() => {
    const d = inputDate.value
    const t = inputTime.value || '00:00:00'
    if (!d) return null
    const parsed = dayjs.tz(`${d} ${t}`, 'YYYY-MM-DD HH:mm:ss', selectedTimezone.value)
    if (!parsed.isValid()) return null
    return parsed
  })

  const dateTsSeconds = computed(() => dateInputDayjs.value ? String(Math.floor(dateInputDayjs.value.valueOf() / 1000)) : '')
  const dateTsMs = computed(() => dateInputDayjs.value ? String(dateInputDayjs.value.valueOf()) : '')
  const dateISO = computed(() => dateInputDayjs.value?.toISOString() || '')

  // ====== Copy ======
  const copiedField = ref<string | null>(null)

  async function copyText(text: string, field: string) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      copiedField.value = field
      toast.success('已复制', 1500)
      setTimeout(() => { copiedField.value = null }, 2000)
    } catch { toast.error('复制失败') }
  }

  // ====== Actions ======
  function setCurrentAsInput() {
    inputTimestamp.value = String(Math.floor(now.value.valueOf() / 1000))
  }

  function setNowAsDate() {
    const d = now.value.tz(selectedTimezone.value)
    inputDate.value = d.format('YYYY-MM-DD')
    inputTime.value = d.format('HH:mm:ss')
  }

  function clearTimestamp() {
    inputTimestamp.value = ''
    tsError.value = ''
  }

  function clearDate() {
    inputDate.value = ''
    inputTime.value = ''
  }

  // ====== History ======
  interface TsHistoryData {
    mode: 'timestamp' | 'date'
    input: string           // timestamp string or "YYYY-MM-DD HH:mm:ss"
    preview: string         // display text for history list
    timezone: string
  }

  const { history, showHistory, saveToHistory, deleteItem, clearHistory } =
    useToolHistory<TsHistoryData>({ toolId: 'timestamp', maxItems: 50 })

  function handleClearHistory() {
    clearHistory()
    toast.success('历史记录已清空')
  }

  function handleHistoryUse(item: Record<string, any>) {
    if (item.mode === 'timestamp') {
      inputTimestamp.value = item.input
    } else {
      const parts = item.input.split(' ')
      inputDate.value = parts[0] || ''
      inputTime.value = parts[1] || '00:00:00'
    }
    if (item.timezone) selectedTimezone.value = item.timezone
    showHistory.value = false
  }

  // Auto-save on successful timestamp→date conversion
  watch(tsInputDayjs, (d) => {
    if (!d || tsError.value || !inputTimestamp.value.trim()) return
    const input = inputTimestamp.value.trim()
    const isDuplicate = history.value.some(item => item.input === input && item.mode === 'timestamp')
    if (!isDuplicate) {
      saveToHistory({
        mode: 'timestamp',
        input,
        preview: `${input} → ${d.tz(selectedTimezone.value).format('YYYY-MM-DD HH:mm:ss')}`,
        timezone: selectedTimezone.value,
      })
    }
  })

  // Auto-save on successful date→timestamp conversion
  watch(dateInputDayjs, (d) => {
    if (!d || !inputDate.value) return
    const input = `${inputDate.value} ${inputTime.value || '00:00:00'}`
    const isDuplicate = history.value.some(item => item.input === input && item.mode === 'date')
    if (!isDuplicate) {
      saveToHistory({
        mode: 'date',
        input,
        preview: `${input} → ${Math.floor(d.valueOf() / 1000)}`,
        timezone: selectedTimezone.value,
      })
    }
  })

  // ====== Lifecycle ======
  onMounted(() => {
    clockTimer = setInterval(() => { now.value = dayjs() }, 1000)
  })
  onUnmounted(() => {
    clearInterval(clockTimer)
  })

  return {
    // Timezone
    selectedTimezone,
    // Live clock
    now, nowFormatted, nowSeconds, nowMilliseconds,
    // Timestamp → Date
    inputTimestamp, tsError, detectedUnit,
    tsInputDayjs, tsLocal, tsISO, tsUTC, tsRelative, tsDayOfWeek,
    tsTimestampSeconds, tsTimestampMs,
    // Date → Timestamp
    inputDate, inputTime, dateInputDayjs,
    dateTsSeconds, dateTsMs, dateISO,
    // Copy
    copiedField, copyText,
    // Actions
    setCurrentAsInput, setNowAsDate, clearTimestamp, clearDate,
    // History
    history, showHistory, deleteItem, handleHistoryUse, handleClearHistory,
  }
}
