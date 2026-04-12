import { getToolDefinition } from '@/tools/definitions'
import { useConfigStore } from '@/stores/config'
import { useWindowService } from '@/composables/useWindowService'
import { toast } from '@/composables/useToast'

export interface OpenToolOptions {
  id: string
  name?: string
}

let _openToolWindow: ((config: {
  id: string
  title: string
  url: string
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
}) => Promise<void>) | null = null

function getOpenToolWindow() {
  if (!_openToolWindow) {
    const { openToolWindow } = useWindowService()
    _openToolWindow = openToolWindow
  }
  return _openToolWindow
}

export async function openTool(options: OpenToolOptions): Promise<boolean> {
  const { id, name } = options
  const configStore = useConfigStore()

  const definition = getToolDefinition(id)

  if (!definition) {
    toast.warning(`"${name || id}" 功能开发中，敬请期待`)
    return false
  }

  if (!definition.implemented) {
    toast.warning(`"${definition.name}" 功能开发中，敬请期待`)
    return false
  }

  try {
    const openToolWindowFn = getOpenToolWindow()
    await openToolWindowFn({
      id,
      title: name || definition.name,
      url: `/#${definition.route}`,
      width: definition.window?.width,
      height: definition.window?.height,
      minWidth: definition.window?.minWidth,
      minHeight: definition.window?.minHeight,
    })

    configStore.recordToolUsage(id)
    configStore.loadUsageStats()

    return true
  } catch (e) {
    toast.error('打开工具窗口失败')
    return false
  }
}

export function isToolAvailable(toolId: string): boolean {
  return !!getToolDefinition(toolId)
}
