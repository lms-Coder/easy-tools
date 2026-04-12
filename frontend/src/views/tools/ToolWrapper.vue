<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import { useDialog } from '@/composables/useDialog'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()
const { info } = useDialog()

onMounted(() => {
  const toolId = route.params.id as string
  const tool = configStore.getToolById(toolId)

  if (tool) {
    info('提示', `"${tool.name}" 功能开发中，敬请期待`)
  }

  router.replace('/tools')
})
</script>

<template>
  <div></div>
</template>
