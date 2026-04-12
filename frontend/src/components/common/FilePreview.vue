<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { renderAsync } from 'docx-preview'

const props = withDefaults(defineProps<{
  src: string | ArrayBuffer | null
  fileType: string // MIME type or 'docx' | 'xlsx' | 'pptx' | 'pdf' | 'image'
  fileName?: string
}>(), {
  fileName: '',
})

const emit = defineEmits<{
  (e: 'rendered'): void
  (e: 'error'): void
}>()

const containerRef = ref<HTMLDivElement>()
const isLoading = ref(true)
const hasError = ref(false)

function normalizeType(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('docx') || t.includes('word')) return 'docx'
  if (t.includes('sheet') || t.includes('excel') || t.includes('xlsx') || t.includes('xls')) return 'xlsx'
  if (t.includes('presentation') || t.includes('pptx') || t.includes('powerpoint')) return 'pptx'
  if (t.includes('pdf')) return 'pdf'
  if (t.startsWith('image/')) return 'image'
  return t
}

const previewType = ref(normalizeType(props.fileType))

watch(() => props.fileType, (v) => {
  previewType.value = normalizeType(v)
})

// Image: src is a data URL string
const isImage = () => previewType.value === 'image' && typeof props.src === 'string'
// PDF: src is a data URL string
const isPdf = () => previewType.value === 'pdf' && typeof props.src === 'string'
// Office: src is an ArrayBuffer
const isDocx = () => previewType.value === 'docx' && props.src instanceof ArrayBuffer
const isXlsx = () => previewType.value === 'xlsx' && props.src instanceof ArrayBuffer
const isPptx = () => previewType.value === 'pptx' && props.src instanceof ArrayBuffer

// ====== Docx Preview ======
async function renderDocx() {
  if (!containerRef.value || !(props.src instanceof ArrayBuffer)) return
  try {
    containerRef.value.innerHTML = ''
    await renderAsync(props.src, containerRef.value, undefined, {
      className: 'docx-preview-wrapper',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
    })
    isLoading.value = false
    emit('rendered')
  } catch {
    hasError.value = true
    isLoading.value = false
    emit('error')
  }
}

// ====== Excel Preview ======
async function renderExcel() {
  if (!containerRef.value || !(props.src instanceof ArrayBuffer)) return
  try {
    const ExcelJS = await import('exceljs')
    const Spreadsheet = (await import('x-data-spreadsheet')).default

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(props.src)

    const sheets: Record<string, unknown[][]> = {}
    workbook.eachSheet((ws) => {
      const rows: unknown[][] = []
      ws.eachRow((row) => {
        rows.push(row.values as unknown[])
      })
      sheets[ws.name] = rows
    })

    containerRef.value.innerHTML = ''
    const el = document.createElement('div')
    el.style.width = '100%'
    el.style.height = '100%'
    containerRef.value.appendChild(el)

    new Spreadsheet(el, {
      mode: 'read',
      showToolbar: false,
      showContextmenu: false,
      view: { height: () => el.clientHeight, width: () => el.clientWidth },
    }).loadData(sheets)

    isLoading.value = false
    emit('rendered')
  } catch {
    hasError.value = true
    isLoading.value = false
    emit('error')
  }
}

// ====== PPTX Preview ======
async function renderPptx() {
  if (!containerRef.value || !(props.src instanceof ArrayBuffer)) return
  try {
    const { init } = await import('pptx-preview')
    containerRef.value.innerHTML = ''
    const el = document.createElement('div')
    el.style.width = '100%'
    el.style.height = '100%'
    containerRef.value.appendChild(el)
    const previewer = init(el, {})
    await previewer.preview(props.src)
    isLoading.value = false
    emit('rendered')
  } catch {
    hasError.value = true
    isLoading.value = false
    emit('error')
  }
}

// ====== Render on src change ======
watch(() => props.src, async (newSrc) => {
  if (!newSrc) {
    isLoading.value = false
    return
  }
  if (isImage() || isPdf()) {
    isLoading.value = false
    return
  }
  isLoading.value = true
  hasError.value = false
  await nextTick()
  if (isDocx()) renderDocx()
  else if (isXlsx()) renderExcel()
  else if (isPptx()) renderPptx()
  else {
    isLoading.value = false
    hasError.value = true
  }
}, { immediate: true })
</script>

<template>
  <div class="file-preview-root">
    <!-- Loading -->
    <div v-if="isLoading && !isImage() && !isPdf()" class="preview-loading">
      <div class="preview-spinner"></div>
    </div>

    <!-- Error -->
    <div v-if="hasError" class="preview-error">
      <span>预览加载失败</span>
    </div>

    <!-- Image -->
    <img v-if="isImage()" :src="src as string" class="preview-image" />

    <!-- PDF -->
    <embed v-else-if="isPdf()" :src="src as string" class="preview-embed" />

    <!-- Office: docx / xlsx / pptx -->
    <div v-else-if="isDocx() || isXlsx() || isPptx()" ref="containerRef" class="preview-office"></div>

    <!-- Unsupported -->
    <div v-else-if="!isLoading" class="preview-unsupported">
      <span>{{ fileName || '此文件' }} 暂不支持预览</span>
    </div>
  </div>
</template>

<style scoped>
.file-preview-root {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-embed {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-office {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.preview-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  z-index: 1;
}

.preview-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-default);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.preview-error,
.preview-unsupported {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--text-muted);
  padding: 24px;
}
</style>
