import { ref, onMounted } from 'vue'
import * as ConfigService from '../../bindings/easy-tools/internal/services/configservice.js'

export interface ToolHistoryItem {
  id: number
  toolId: string
  data: string
  createdAt: string
}

export interface ToolHistoryOptions<T> {
  toolId: string
  maxItems?: number
  parseData?: (data: string) => T
  stringifyData?: (data: T) => string
}

export function useToolHistory<T extends Record<string, any>>(options: ToolHistoryOptions<T>) {
  const {
    toolId,
    maxItems = 50,
    parseData = (data: string) => JSON.parse(data) as T,
    stringifyData = (data: T) => JSON.stringify(data)
  } = options

  const history = ref<(T & { _id: number; _createdAt: string })[]>([])
  const isLoading = ref(false)
  const showHistory = ref(false)

  // 加载历史记录
  const loadHistory = async () => {
    isLoading.value = true
    try {
      const items = await ConfigService.GetToolHistory(toolId, maxItems)
      if (items) {
        history.value = items.map(item => ({
          ...parseData(item.data),
          _id: item.id,
          _createdAt: item.createdAt
        }))
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 保存历史记录
  const saveToHistory = async (data: T) => {
    try {
      const dataStr = stringifyData(data)
      await ConfigService.SaveToolHistory(toolId, dataStr)
      await loadHistory()
    } catch (error) {
      console.error('Failed to save history:', error)
    }
  }

  // 删除单条记录
  const deleteItem = async (id: number) => {
    try {
      await ConfigService.DeleteToolHistoryItem(id)
      history.value = history.value.filter(item => item._id !== id)
    } catch (error) {
      console.error('Failed to delete history item:', error)
    }
  }

  // 清空历史记录
  const clearHistory = async () => {
    try {
      await ConfigService.ClearToolHistory(toolId)
      history.value = []
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  // 使用历史记录项（去除内部字段）
  const useHistoryItem = (item: T & { _id: number; _createdAt: string }): T => {
    const { _id, _createdAt, ...data } = item
    return data as unknown as T
  }

  // 组件挂载时加载历史记录
  onMounted(() => {
    loadHistory()
  })

  return {
    history,
    isLoading,
    showHistory,
    loadHistory,
    saveToHistory,
    deleteItem,
    clearHistory,
    useHistoryItem
  }
}
