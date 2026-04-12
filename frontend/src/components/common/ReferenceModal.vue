<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'

export interface ReferenceItem {
  code: string
  desc: string
}

export interface ReferenceSection {
  title: string
  items: ReferenceItem[]
}

interface Props {
  visible: boolean
  title?: string
  width?: string | number
  sections: ReferenceSection[]
}

const props = withDefaults(defineProps<Props>(), {
  title: '参考',
  width: '640px',
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()
</script>

<template>
  <Modal :visible="props.visible" :title="title" :width="width" @update:visible="emit('update:visible', $event)" @close="emit('update:visible', false)">
    <div class="ref-content">
      <div v-for="section in sections" :key="section.title" class="ref-section">
        <h3 class="ref-section-title">{{ section.title }}</h3>
        <div class="ref-grid">
          <template v-for="item in section.items" :key="item.code">
            <code class="ref-code">{{ item.code }}</code>
            <span class="ref-desc">{{ item.desc }}</span>
          </template>
        </div>
      </div>
    </div>
    <template #footer>
      <button class="ref-btn" @click="emit('update:visible', false)">知道了</button>
    </template>
  </Modal>
</template>

<style scoped>
.ref-content {
  max-height: 60vh;
  overflow: auto;
}

.ref-section {
  margin-bottom: 20px;
}

.ref-section:last-child {
  margin-bottom: 0;
}

.ref-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.ref-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 6px 16px;
}

.ref-code {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent);
  background: var(--accent-light);
  padding: 3px 8px;
  border-radius: var(--radius-xs);
}

.ref-desc {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 2px 0;
}

.ref-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 20px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
}

.ref-btn:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}
</style>
