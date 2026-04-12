import { ref } from 'vue'
import { useConfigStore } from '@/stores/config'

interface ToolWindowConfig {
  ID: string
  Title: string
  Width: number
  Height: number
  MinWidth: number
  MinHeight: number
  URL: string
}

let openToolWindowFn: ((config: ToolWindowConfig) => any) | null = null
let closeToolWindowFn: ((id: string) => Promise<void>) | null = null
let getOpenToolWindowsFn: (() => Promise<string[]>) | null = null

const openWindows = ref<string[]>([])

async function loadWindowServiceBinding() {
  try {
    const module = await import('../../bindings/easy-tools/internal/services/windowservice.js')
    openToolWindowFn = module.OpenToolWindow
    closeToolWindowFn = module.CloseToolWindow
    getOpenToolWindowsFn = module.GetOpenToolWindows
  } catch {
    console.info('WindowService binding not available')
  }
}

loadWindowServiceBinding()

export function useWindowService() {
  const configStore = useConfigStore()

  const openToolWindow = async (config: {
    id: string
    title: string
    url: string
    width?: number
    height?: number
    minWidth?: number
    minHeight?: number
  }) => {
    if (openToolWindowFn) {
      try {
        const tool = configStore.getToolById(config.id)
        const allowMultiple = tool?.allowMultiple !== false

        const windowId = allowMultiple
          ? `${config.id}-${Date.now()}`
          : config.id

        const backendConfig: ToolWindowConfig = {
          ID: windowId,
          Title: config.title,
          URL: config.url,
          Width: config.width ?? 0,
          Height: config.height ?? 0,
          MinWidth: config.minWidth ?? 0,
          MinHeight: config.minHeight ?? 0,
        }
        await openToolWindowFn(backendConfig)

        if (!openWindows.value.includes(windowId)) {
          openWindows.value.push(windowId)
        }
      } catch (e) {
        console.error('Failed to open tool window:', e)
        throw e
      }
    } else {
      console.warn('WindowService not available')
    }
  }

  const closeToolWindow = async (id: string) => {
    if (closeToolWindowFn) {
      try {
        await closeToolWindowFn(id)
        openWindows.value = openWindows.value.filter(w => w !== id)
      } catch (e) {
        console.error('Failed to close tool window:', e)
        throw e
      }
    }
  }

  const getOpenToolWindows = async () => {
    if (getOpenToolWindowsFn) {
      try {
        const windows = await getOpenToolWindowsFn()
        openWindows.value = windows
        return windows
      } catch (e) {
        console.error('Failed to get open tool windows:', e)
        return []
      }
    }
    return []
  }

  return {
    openWindows,
    openToolWindow,
    closeToolWindow,
    getOpenToolWindows,
  }
}
