import { ref, computed } from 'vue'
import * as PortService from '../../../../../bindings/easy-tools/internal/services/portservice.js'
import { toast } from '@/composables/useToast'

interface PortInfo {
  port: number
  protocol: string
  pid: number
  process: string
  state: string
}

export function usePortManager() {
  const portInput = ref('')
  const isSearching = ref(false)
  const searchedPort = ref<number | null>(null)

  const portInfos = ref<PortInfo[]>([])
  const hasSearched = ref(false)

  const canSearch = computed(() => {
    const port = parseInt(portInput.value.trim())
    return !isNaN(port) && port >= 1 && port <= 65535
  })

  const lookupPort = async () => {
    const port = parseInt(portInput.value.trim())
    if (!port || port < 1 || port > 65535) {
      toast.error('请输入有效的端口号 (1-65535)')
      return
    }

    isSearching.value = true
    hasSearched.value = true
    searchedPort.value = port

    try {
      const result = await PortService.LookupPort(port)
      portInfos.value = result || []
      if (portInfos.value.length === 0) {
        toast.info(`端口 ${port} 未被占用`)
      }
    } catch {
      toast.error('查询端口失败')
      portInfos.value = []
    } finally {
      isSearching.value = false
    }
  }

  // 终止确认
  const showConfirmModal = ref(false)
  const confirmAction = ref<{ type: 'pid' | 'port'; target: number | null }>({ type: 'pid', target: null })
  const confirmMessage = ref('')

  const confirmKillProcess = (pid: number) => {
    confirmAction.value = { type: 'pid', target: pid }
    confirmMessage.value = `确定要终止进程 PID ${pid} 吗？这可能导致该进程的数据丢失。`
    showConfirmModal.value = true
  }

  const confirmKillByPort = () => {
    const port = parseInt(portInput.value.trim())
    if (!port) return
    confirmAction.value = { type: 'port', target: port }
    confirmMessage.value = `确定要终止占用端口 ${port} 的所有进程吗？这可能导致相关应用异常。`
    showConfirmModal.value = true
  }

  const executeKill = async () => {
    showConfirmModal.value = false
    try {
      if (confirmAction.value.type === 'pid' && confirmAction.value.target) {
        await PortService.KillProcess(confirmAction.value.target)
        toast.success(`进程 ${confirmAction.value.target} 已终止`)
      } else if (confirmAction.value.type === 'port' && confirmAction.value.target) {
        await PortService.KillProcessByPort(confirmAction.value.target)
        toast.success(`占用端口 ${confirmAction.value.target} 的进程已终止`)
      }
      await lookupPort()
    } catch {
      toast.error('终止进程失败')
    }
  }

  const clearResults = () => {
    portInput.value = ''
    portInfos.value = []
    hasSearched.value = false
    searchedPort.value = null
  }

  const quickPorts = [80, 443, 3000, 3306, 5000, 5432, 6379, 8080, 8888, 9000]

  const quickLookup = (port: number) => {
    portInput.value = String(port)
    lookupPort()
  }

  return {
    portInput, isSearching, searchedPort,
    portInfos, hasSearched, canSearch,
    lookupPort,
    showConfirmModal, confirmMessage,
    confirmKillProcess, confirmKillByPort, executeKill,
    clearResults, quickPorts, quickLookup,
  }
}
