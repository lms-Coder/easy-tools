import { ref, computed, onMounted } from 'vue'
import { toast } from '@/composables/useToast'

export type EnvScope = 'all' | 'system' | 'user'

export interface EnvVar {
  name: string
  value: string
  scope: string // "system" | "user" | "other"
}

// Import will be resolved after wails generate bindings
import * as EnvService from '../../../../../bindings/easy-tools/internal/services/envservice.js'

const allVars = ref<EnvVar[]>([])
const loading = ref(false)
const currentScope = ref<EnvScope>('all')
const searchQuery = ref('')
const expandedVar = ref<string | null>(null)
const copiedId = ref<string | null>(null)

const scopeOptions: { value: EnvScope; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'system', label: '系统' },
  { value: 'user', label: '用户' },
]

const filteredVars = computed(() => {
  let list = allVars.value

  if (currentScope.value !== 'all') {
    list = list.filter(v => v.scope === currentScope.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.value.toLowerCase().includes(q)
    )
  }

  return list
})

const systemCount = computed(() => allVars.value.filter(v => v.scope === 'system').length)
const userCount = computed(() => allVars.value.filter(v => v.scope === 'user').length)
const totalCount = computed(() => allVars.value.length)

function splitPathValue(value: string): string[] {
  // Split PATH-like values by ; (Windows) or : (Unix)
  if (value.includes(';')) return value.split(';').filter(Boolean)
  if (value.includes(':') && !value.includes('\\')) return value.split(':').filter(Boolean)
  return []
}

function isPathLike(name: string): boolean {
  const upper = name.toUpperCase()
  return upper === 'PATH' || upper === 'PATHEXT' || upper === 'PSMODULEPATH' ||
    upper === 'PYTHONPATH' || upper === 'CLASSPATH' || upper === 'INCLUDE' ||
    upper === 'LIB' || upper.endsWith('_PATH') || upper.endsWith('PATH')
}

async function loadAll() {
  loading.value = true
  try {
    const vars = await EnvService.GetAllEnvVars()
    allVars.value = vars || []
  } catch (e: any) {
    toast.error(`加载失败: ${e?.message || e}`)
  } finally {
    loading.value = false
  }
}

async function refresh() {
  await loadAll()
  toast.success('已刷新')
}

function toggleExpand(name: string) {
  expandedVar.value = expandedVar.value === name ? null : name
}

async function copyValue(name: string, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    copiedId.value = `val-${name}`
    setTimeout(() => { if (copiedId.value === `val-${name}`) copiedId.value = null }, 2000)
    toast.success('已复制值', 1500)
  } catch {
    toast.error('复制失败')
  }
}

async function copyName(name: string) {
  try {
    await navigator.clipboard.writeText(name)
    copiedId.value = `name-${name}`
    setTimeout(() => { if (copiedId.value === `name-${name}`) copiedId.value = null }, 2000)
    toast.success('已复制名称', 1500)
  } catch {
    toast.error('复制失败')
  }
}

export function useEnvVars() {
  onMounted(() => {
    if (allVars.value.length === 0) loadAll()
  })

  return {
    allVars, loading, currentScope, searchQuery,
    expandedVar, copiedId,
    scopeOptions,
    filteredVars,
    systemCount, userCount, totalCount,
    isPathLike, splitPathValue,
    loadAll, refresh,
    toggleExpand,
    copyValue, copyName,
  }
}
