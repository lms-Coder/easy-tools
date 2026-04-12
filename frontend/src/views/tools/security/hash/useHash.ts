import { ref, computed, watch } from 'vue'
import { toast } from '@/composables/useToast'
import * as HashService from '../../../../../bindings/easy-tools/internal/services/hashservice.js'

export interface HashType {
  id: string
  name: string
}

export const hashTypes: HashType[] = [
  { id: 'md5', name: 'MD5' },
  { id: 'sha1', name: 'SHA-1' },
  { id: 'sha224', name: 'SHA-224' },
  { id: 'sha256', name: 'SHA-256' },
  { id: 'sha384', name: 'SHA-384' },
  { id: 'sha512', name: 'SHA-512' },
]

export function useHash() {
  const selectedHashes = ref<string[]>(['md5', 'sha256'])
  const inputText = ref('')
  const hashResults = ref<Record<string, string>>({})
  const copiedHash = ref<string | null>(null)
  const uppercase = ref(false)

  const resultCount = computed(() => Object.keys(hashResults.value).length)

  const calculateAllHashes = async () => {
    if (!inputText.value) {
      hashResults.value = {}
      return
    }
    try {
      const results = await HashService.CalculateAll(inputText.value)
      if (results) {
        const filtered: Record<string, string> = {}
        for (const hashType of selectedHashes.value) {
          const hashValue = results[hashType]
          if (typeof hashValue === 'string') {
            filtered[hashType] = hashValue
          }
        }
        hashResults.value = filtered
      }
    } catch (e) {
      console.error('Hash calculation failed:', e)
      toast.error('哈希计算失败')
    }
  }

  const toggleHashType = (hashId: string) => {
    const idx = selectedHashes.value.indexOf(hashId)
    if (idx > -1) {
      if (selectedHashes.value.length > 1) selectedHashes.value.splice(idx, 1)
    } else {
      selectedHashes.value.push(hashId)
    }
  }

  const copyHash = async (hashId: string) => {
    const hash = hashResults.value[hashId]
    if (!hash) return
    try {
      await navigator.clipboard.writeText(getDisplayHash(hash))
      copiedHash.value = hashId
      toast.success('已复制')
      setTimeout(() => { if (copiedHash.value === hashId) copiedHash.value = null }, 2000)
    } catch { toast.error('复制失败') }
  }

  const clear = () => {
    inputText.value = ''
    hashResults.value = {}
  }

  const paste = async () => {
    try {
      inputText.value = await navigator.clipboard.readText()
      toast.success('已粘贴')
    } catch {
      toast.error('粘贴失败')
    }
  }

  const getDisplayHash = (hash: string): string => uppercase.value ? hash.toUpperCase() : hash.toLowerCase()

  watch([inputText, selectedHashes], () => {
    if (inputText.value) calculateAllHashes()
  }, { deep: true })

  return {
    selectedHashes,
    inputText,
    hashResults,
    copiedHash,
    uppercase,
    resultCount,
    calculateAllHashes,
    toggleHashType,
    copyHash,
    clear,
    paste,
    getDisplayHash,
  }
}
