<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Events, Window } from '@wailsio/runtime'
import { useThemeStore } from '@/stores/theme'
import { useConfigStore } from '@/stores/config'
import { useDialog } from '@/composables/useDialog'
import AppLayout from '@/components/layout/AppLayout.vue'
import ToastProvider from '@/components/common/ToastProvider.vue'
import Dialog from '@/components/common/Dialog.vue'

const route = useRoute()
const themeStore = useThemeStore()
const configStore = useConfigStore()
const { dialogState, handleConfirm, handleCancel } = useDialog()

// 判断是否为工具窗口
const isToolWindow = computed(() => {
  return route.meta.isToolWindow === true
})

// 关闭确认对话框状态
const showCloseConfirmDialog = ref(false)
let eventUnsubscriber: (() => void) | null = null

// 处理关闭确认
const handleCloseConfirm = async (choice: 'close' | 'minimize') => {
  showCloseConfirmDialog.value = false

  try {
    // 保存用户选择为默认行为
    await configStore.setCloseBehavior(choice)

    if (choice === 'close') {
      // 关闭行为已改为 close，再次调用 Close 即可真正退出
      await Window.Close()
    }
    // minimize: 窗口已由 Go 端隐藏，无需额外操作
  } catch (e) {
    console.error('Failed to handle close confirm:', e)
  }
}

// 监听窗口关闭确认事件
const handleCloseConfirmEvent = () => {
  showCloseConfirmDialog.value = true
}

// 初始化：先加载配置，再应用主题
onMounted(async () => {
  // 1. 从 SQLite 加载所有配置
  await configStore.initConfig()

  // 2. 用加载的主题数据同步到 theme composable
  themeStore.syncFromConfig(configStore.themeConfig.current, configStore.themeConfig.primaryColor)

  // 3. 应用主题到 DOM
  themeStore.initialize()

  // 4. 监听窗口关闭确认事件
  try {
    eventUnsubscriber = Events.On('window:close-confirm', handleCloseConfirmEvent)
  } catch (e) {
    console.warn('Failed to subscribe to window close confirm event:', e)
  }
})

onUnmounted(() => {
  if (eventUnsubscriber) {
    eventUnsubscriber()
  }
})
</script>

<template>
  <ToastProvider>
    <!-- 工具窗口：直接渲染内容 -->
    <router-view v-if="isToolWindow" />
    <!-- 主窗口：使用完整布局 -->
    <AppLayout v-else />

    <!-- 全局对话框（供 useDialog 调用） -->
    <Dialog
      v-model:visible="dialogState.visible"
      :type="dialogState.type"
      :title="dialogState.title"
      :content="dialogState.message"
      :confirm-text="dialogState.confirmText"
      :cancel-text="dialogState.cancelText"
      :show-cancel="dialogState.showCancel"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />

    <!-- 关闭确认对话框 -->
    <Dialog
      v-model:visible="showCloseConfirmDialog"
      type="confirm"
      title="关闭窗口"
      content="您希望执行什么操作？"
      confirm-text="退出程序"
      cancel-text="最小化到托盘"
      :show-cancel="true"
      @confirm="handleCloseConfirm('close')"
      @cancel="handleCloseConfirm('minimize')"
    />
  </ToastProvider>
</template>

<style>
/* 全局样式已在 assets/styles/global.css 中定义 */
</style>
