import { ref, computed } from 'vue'
import { toast } from '@/composables/useToast'

export type UuidVersion = 'v4' | 'v1' | 'v7' | 'nil'
export type UuidFormat = 'standard' | 'uppercase' | 'no-dash' | 'braces' | 'urn'

export interface UuidTypeOption {
  value: UuidVersion
  label: string
  desc: string
}

export interface UuidFormatOption {
  value: UuidFormat
  label: string
}

export const uuidTypes: UuidTypeOption[] = [
  { value: 'v4', label: 'UUID v4', desc: '随机生成，应用最广泛' },
  { value: 'v1', label: 'UUID v1', desc: '基于时间戳，时间有序' },
  { value: 'v7', label: 'UUID v7', desc: '现代时间戳，云原生推荐' },
  { value: 'nil', label: 'Nil UUID', desc: '全零占位符' },
]

export const uuidFormats: UuidFormatOption[] = [
  { value: 'standard', label: '标准' },
  { value: 'uppercase', label: '大写' },
  { value: 'no-dash', label: '无连字符' },
  { value: 'braces', label: '大括号' },
  { value: 'urn', label: 'URN' },
]

// Generate UUID v4 (crypto random)
function generateV4(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

// Generate UUID v1 (time-based, simulated)
function generateV1(): string {
  const now = Date.now()
  const timestamp = now * 10000 + 0x01B21DD213814000 // 100ns ticks since 1582-10-15
  const timeHigh = Math.floor(timestamp / 0x1000000000000) & 0x0FFF
  const timeMid = Math.floor(timestamp / 0x100000000) & 0xFFFF
  const timeLow = timestamp & 0xFFFFFFFF

  const clockSeq = new Uint16Array(1)
  crypto.getRandomValues(clockSeq)
  const clock = clockSeq[0] & 0x3FFF

  const node = new Uint8Array(6)
  crypto.getRandomValues(node)
  node[0] |= 0x01 // multicast bit

  const timeStr = (timeLow >>> 0).toString(16).padStart(8, '0')
  const midStr = (timeMid >>> 0).toString(16).padStart(4, '0')
  const highStr = ((timeHigh | 0x1000) >>> 0).toString(16).padStart(4, '0')
  const clockStr = ((clock | 0x8000) >>> 0).toString(16).padStart(4, '0')
  const nodeStr = Array.from(node, b => b.toString(16).padStart(2, '0')).join('')

  return `${timeStr}-${midStr}-${highStr}-${clockStr}-${nodeStr}`
}

// Generate UUID v7 (Unix timestamp + random)
function generateV7(): string {
  const timestamp = Date.now()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  // 48-bit timestamp (ms)
  bytes[0] = (timestamp / 2 ** 40) & 0xFF
  bytes[1] = (timestamp / 2 ** 32) & 0xFF
  bytes[2] = (timestamp / 2 ** 24) & 0xFF
  bytes[3] = (timestamp / 2 ** 16) & 0xFF
  bytes[4] = (timestamp / 2 ** 8) & 0xFF
  bytes[5] = timestamp & 0xFF

  // version 7
  bytes[6] = (bytes[6] & 0x0F) | 0x70
  // variant
  bytes[8] = (bytes[8] & 0x3F) | 0x80

  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function generateUuid(version: UuidVersion): string {
  switch (version) {
    case 'v4': return generateV4()
    case 'v1': return generateV1()
    case 'v7': return generateV7()
    case 'nil': return '00000000-0000-0000-0000-000000000000'
  }
}

function formatUuid(uuid: string, format: UuidFormat): string {
  switch (format) {
    case 'standard': return uuid
    case 'uppercase': return uuid.toUpperCase()
    case 'no-dash': return uuid.replace(/-/g, '')
    case 'braces': return `{${uuid}}`
    case 'urn': return `urn:uuid:${uuid}`
  }
}

export function useUuid() {
  const version = ref<UuidVersion>('v4')
  const format = ref<UuidFormat>('standard')
  const count = ref(1)
  const results = ref<string[]>([])
  const copied = ref(false)

  const generate = () => {
    const n = Math.max(1, Math.min(1000, count.value))
    const raw: string[] = []
    for (let i = 0; i < n; i++) {
      raw.push(formatUuid(generateUuid(version.value), format.value))
    }
    results.value = raw
  }

  const copyAll = async () => {
    if (!results.value.length) return
    try {
      await navigator.clipboard.writeText(results.value.join('\n'))
      copied.value = true
      toast.success('已复制')
      setTimeout(() => copied.value = false, 2000)
    } catch { toast.error('复制失败') }
  }

  const copySingle = async (uuid: string) => {
    try {
      await navigator.clipboard.writeText(uuid)
      toast.success('已复制')
    } catch { toast.error('复制失败') }
  }

  const clear = () => {
    results.value = []
  }

  return {
    version, format, count, results, copied,
    generate, copyAll, copySingle, clear,
  }
}
