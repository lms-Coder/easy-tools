import { ref, onMounted } from 'vue'
import * as JdkService from '../../../../../bindings/easy-tools/internal/services/jdkservice.js'
import { toast } from '@/composables/useToast'

interface JDKConfig {
  name: string
  path: string
}

const jdkVersions = ref<JDKConfig[]>([])
const currentJDK = ref<JDKConfig | null>(null)
const linkPath = ref('')
const isLoading = ref(false)
const switchingIndex = ref<number | null>(null)

const editingIndex = ref<number | null>(null)
const editForm = ref({ name: '', path: '' })

const showAddForm = ref(false)
const newJdk = ref({ name: '', path: '' })

const editingLinkPath = ref(false)
const editLinkPathForm = ref('')

const loadJDKList = async () => {
  isLoading.value = true
  try {
    const [versions, current, link] = await Promise.all([
      JdkService.GetJDKVersions(),
      JdkService.GetCurrentJDK(),
      JdkService.GetLinkPath(),
    ])
    jdkVersions.value = versions || []
    currentJDK.value = current
    linkPath.value = link || ''
  } catch (e) {
    console.error('Failed to load JDK list:', e)
    toast.error('加载 JDK 列表失败')
  } finally {
    isLoading.value = false
  }
}

const switchJDK = async (index: number) => {
  isLoading.value = true
  switchingIndex.value = index
  try {
    await JdkService.SwitchJDK(index)
    toast.success('JDK 切换成功')
    await loadJDKList()
  } catch (e: any) {
    console.error('Failed to switch JDK:', e)
    const errorMsg = e?.message || String(e)
    if (errorMsg.includes('提权')) {
      toast.error('提权创建符号链接失败，请在弹出的 UAC 对话框中点击"是"')
    } else {
      toast.error(`切换失败: ${errorMsg}`)
    }
  } finally {
    isLoading.value = false
    switchingIndex.value = null
  }
}

const startEdit = (index: number) => {
  editingIndex.value = index
  editForm.value = { ...jdkVersions.value[index] }
}

const cancelEdit = () => {
  editingIndex.value = null
  editForm.value = { name: '', path: '' }
}

const saveEdit = async () => {
  if (editingIndex.value === null) return

  if (!editForm.value.name.trim() || !editForm.value.path.trim()) {
    toast.error('名称和路径不能为空')
    return
  }

  try {
    await JdkService.UpdateJDK(editingIndex.value, editForm.value.name, editForm.value.path)
    toast.success('更新成功')
    cancelEdit()
    await loadJDKList()
  } catch (e: any) {
    toast.error(`更新失败: ${e?.message || String(e)}`)
  }
}

const deleteJDK = async (index: number) => {
  if (!confirm(`确定要删除 "${jdkVersions.value[index].name}" 吗？`)) {
    return
  }

  try {
    await JdkService.RemoveJDK(index)
    toast.success('删除成功')
    await loadJDKList()
  } catch (e: any) {
    toast.error(`删除失败: ${e?.message || String(e)}`)
  }
}

const showAdd = () => {
  showAddForm.value = true
  newJdk.value = { name: '', path: '' }
}

const cancelAdd = () => {
  showAddForm.value = false
  newJdk.value = { name: '', path: '' }
}

const addJDK = async () => {
  if (!newJdk.value.name.trim() || !newJdk.value.path.trim()) {
    toast.error('名称和路径不能为空')
    return
  }

  try {
    await JdkService.AddJDK(newJdk.value.name, newJdk.value.path)
    toast.success('添加成功')
    cancelAdd()
    await loadJDKList()
  } catch (e: any) {
    toast.error(`添加失败: ${e?.message || String(e)}`)
  }
}

const isCurrentJDK = (jdk: JDKConfig) => {
  return currentJDK.value && currentJDK.value.path === jdk.path
}

const startEditLinkPath = () => {
  editingLinkPath.value = true
  editLinkPathForm.value = linkPath.value
}

const cancelEditLinkPath = () => {
  editingLinkPath.value = false
  editLinkPathForm.value = ''
}

const saveEditLinkPath = async () => {
  const newPath = editLinkPathForm.value.trim()
  if (!newPath) {
    toast.error('符号链接路径不能为空')
    return
  }

  try {
    await JdkService.SetLinkPath(newPath)
    toast.success('符号链接路径更新成功')
    cancelEditLinkPath()
    await loadJDKList()
  } catch (e: any) {
    toast.error(`更新失败: ${e?.message || String(e)}`)
  }
}

export function useJdkManager() {
  onMounted(() => {
    loadJDKList()
  })

  return {
    jdkVersions,
    currentJDK,
    linkPath,
    isLoading,
    switchingIndex,
    editingIndex,
    editForm,
    showAddForm,
    newJdk,
    editingLinkPath,
    editLinkPathForm,
    loadJDKList,
    switchJDK,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteJDK,
    showAdd,
    cancelAdd,
    addJDK,
    isCurrentJDK,
    startEditLinkPath,
    cancelEditLinkPath,
    saveEditLinkPath,
  }
}
