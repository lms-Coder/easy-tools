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
  height: 38px;
  padding: 0 28px;
  font-size: 13px;
  font-weight: 550;
  color: #fff;
  background: var(--accent);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow:
    0 1px 3px color-mix(in srgb, var(--accent) 25%, transparent),
    0 0 0 1px color-mix(in srgb, var(--accent) 20%, transparent) inset;
}

.ref-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%);
  pointer-events: none;
}

html.dark .ref-btn::after {
  background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%);
}

.ref-btn:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow:
    0 4px 14px color-mix(in srgb, var(--accent) 30%, transparent),
    0 0 0 1px color-mix(in srgb, var(--accent) 20%, transparent) inset;
}

.ref-btn:active {
  filter: brightness(0.96);
  transform: translateY(0) scale(0.98);
}
</style>
