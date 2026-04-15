<script setup lang="ts">
import {
  Check, Trash2, Download, Upload, Image, Type, Grid3x3,
  Droplets, Bold, Italic,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import Select from '@/components/ui/Select.vue'
import Input from '@/components/ui/Input.vue'
import { useTooltip } from '@/composables/useTooltip'
import { useWatermark } from './useWatermark'
import {
  FONT_FAMILIES, POSITION_OPTIONS, EXPORT_FORMATS,
  ACCEPTED_IMAGE_TYPES,
} from './watermarkTypes'
import type { WatermarkMode, WatermarkPosition } from './watermarkTypes'
import { ref, watch, nextTick } from 'vue'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
  mode, sourceFileName,
  exportFormat, jpegQuality,
  textConfig, imageConfig, tileConfig, position,
  watermarkFileName,
  hasSourceImage, imageInfo,
  setPreviewCanvas, uploadSourceImage, uploadWatermarkImage,
  renderPreview, exportImage, clear,
} = useWatermark()

const sourceInputRef = ref<HTMLInputElement | null>(null)
const watermarkInputRef = ref<HTMLInputElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// Canvas 就绪后初始化
watch(canvasRef, (el) => {
  setPreviewCanvas(el)
  if (el) nextTick(renderPreview)
})

const modeOptions: { label: string; value: WatermarkMode; icon: any }[] = [
  { label: '文字水印', value: 'text', icon: Type },
  { label: '图片水印', value: 'image', icon: Image },
  { label: '满屏水印', value: 'tile', icon: Grid3x3 },
]

const fontFamilyOptions = FONT_FAMILIES.map(f => ({ label: f.label, value: f.value }))
const positionOptions = POSITION_OPTIONS.map(p => ({ label: p.label, value: p.value }))
const exportFormatOptions = EXPORT_FORMATS.map(f => ({ label: f.label, value: f.value }))

const onSourceFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) uploadSourceImage(input.files[0])
  input.value = ''
}

const onWatermarkFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) uploadWatermarkImage(input.files[0])
  input.value = ''
}

// 拖拽上传
const isDragOver = ref(false)
const onDragOver = (e: DragEvent) => { e.preventDefault(); isDragOver.value = true }
const onDragLeave = () => { isDragOver.value = false }
const onDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
  const file = e.dataTransfer?.files[0]
  if (file) uploadSourceImage(file)
}
</script>

<template>
  <div class="tool-page">
    <!-- 标题栏 -->
    <ToolTitleBar title="水印工具" icon="icon-watermark">
      <div class="header-content">
        <span v-if="hasSourceImage" class="stat-tag">{{ imageInfo?.width }}×{{ imageInfo?.height }}</span>
      </div>
    </ToolTitleBar>

    <!-- 主内容 -->
    <main class="tool-main split">
      <!-- 左：配置面板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Droplets :size="14" /></span>
            <span>水印设置</span>
          </div>
          <div class="panel-actions">
            <button class="tool-icon-btn" @click="clear" :disabled="!hasSourceImage"
              @mouseenter="showTooltip('重置', $event)" @mouseleave="hideTooltip">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body">
          <!-- 上传原图 -->
          <div class="config-section">
            <label class="config-label">原始图片</label>
            <div
              class="upload-area" :class="{ 'upload-dragover': isDragOver }"
              @click="sourceInputRef?.click()"
              @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop"
            >
              <template v-if="hasSourceImage">
                <Image :size="16" style="color: var(--success)" />
                <span class="upload-filename">{{ sourceFileName }}</span>
              </template>
              <template v-else>
                <Upload :size="16" />
                <span>点击或拖拽上传图片</span>
              </template>
            </div>
            <input ref="sourceInputRef" type="file" :accept="ACCEPTED_IMAGE_TYPES" hidden @change="onSourceFileChange" />
          </div>

          <!-- 水印模式 -->
          <div class="config-section">
            <label class="config-label">水印模式</label>
            <div class="mode-chips">
              <button
                v-for="m in modeOptions" :key="m.value"
                class="mode-chip" :class="{ active: mode === m.value }"
                @click="mode = m.value"
              >
                <component :is="m.icon" :size="12" />
                <span>{{ m.label }}</span>
              </button>
            </div>
          </div>

          <!-- ===== 文字水印配置 ===== -->
          <template v-if="mode === 'text'">
            <div class="config-section">
              <label class="config-label">水印文字</label>
              <Input v-model="textConfig.content" placeholder="输入水印文字" />
            </div>
            <div class="config-section">
              <label class="config-label">字体</label>
              <Select v-model="textConfig.fontFamily" :options="fontFamilyOptions" size="sm" />
            </div>
            <div class="config-row-section">
              <div class="config-row-item">
                <label class="config-label">大小 <code class="val-code">{{ textConfig.fontSize }}px</code></label>
                <input type="range" v-model.number="textConfig.fontSize" min="12" max="200" class="wm-range" />
              </div>
              <div class="config-row-item">
                <label class="config-label">颜色</label>
                <div class="color-group">
                  <input v-model="textConfig.color" type="color" class="color-picker" />
                  <input v-model="textConfig.color" type="text" class="color-input" spellcheck="false" />
                </div>
              </div>
            </div>
            <div class="config-row-section">
              <div class="config-row-item">
                <label class="config-label">透明度 <code class="val-code">{{ textConfig.opacity }}%</code></label>
                <input type="range" v-model.number="textConfig.opacity" min="1" max="100" class="wm-range" />
              </div>
              <div class="config-row-item">
                <label class="config-label">旋转 <code class="val-code">{{ textConfig.rotation }}°</code></label>
                <input type="range" v-model.number="textConfig.rotation" min="-180" max="180" class="wm-range" />
              </div>
            </div>
            <div class="config-section">
              <label class="config-label">样式</label>
              <div class="style-chips">
                <button class="style-chip" :class="{ active: textConfig.bold }" @click="textConfig.bold = !textConfig.bold">
                  <Bold :size="13" />
                </button>
                <button class="style-chip" :class="{ active: textConfig.italic }" @click="textConfig.italic = !textConfig.italic">
                  <Italic :size="13" />
                </button>
              </div>
            </div>
          </template>

          <!-- ===== 图片水印配置 ===== -->
          <template v-if="mode === 'image'">
            <div class="config-section">
              <label class="config-label">水印图片</label>
              <div class="upload-area upload-area-sm" @click="watermarkInputRef?.click()">
                <template v-if="watermarkFileName">
                  <Image :size="14" style="color: var(--success)" />
                  <span class="upload-filename">{{ watermarkFileName }}</span>
                </template>
                <template v-else>
                  <Upload :size="14" />
                  <span>选择水印图片</span>
                </template>
              </div>
              <input ref="watermarkInputRef" type="file" :accept="ACCEPTED_IMAGE_TYPES" hidden @change="onWatermarkFileChange" />
            </div>
            <div class="config-row-section">
              <div class="config-row-item">
                <label class="config-label">缩放 <code class="val-code">{{ imageConfig.scale }}%</code></label>
                <input type="range" v-model.number="imageConfig.scale" min="5" max="200" class="wm-range" />
              </div>
              <div class="config-row-item">
                <label class="config-label">透明度 <code class="val-code">{{ imageConfig.opacity }}%</code></label>
                <input type="range" v-model.number="imageConfig.opacity" min="1" max="100" class="wm-range" />
              </div>
            </div>
            <div class="config-section">
              <label class="config-label">旋转 <code class="val-code">{{ imageConfig.rotation }}°</code></label>
              <input type="range" v-model.number="imageConfig.rotation" min="-180" max="180" class="wm-range" />
            </div>
          </template>

          <!-- ===== 满屏水印配置 ===== -->
          <template v-if="mode === 'tile'">
            <div class="config-section">
              <label class="config-label">水印类型</label>
              <div class="tile-type-chips">
                <button class="mode-chip" :class="{ active: tileConfig.type === 'text' }" @click="tileConfig.type = 'text'">
                  <Type :size="12" /><span>文字</span>
                </button>
                <button class="mode-chip" :class="{ active: tileConfig.type === 'image' }" @click="tileConfig.type = 'image'">
                  <Image :size="12" /><span>图片</span>
                </button>
              </div>
            </div>

            <!-- 满屏文字 -->
            <template v-if="tileConfig.type === 'text'">
              <div class="config-section">
                <label class="config-label">水印文字</label>
                <Input v-model="tileConfig.text.content" placeholder="输入水印文字" />
              </div>
              <div class="config-section">
                <label class="config-label">字体</label>
                <Select v-model="tileConfig.text.fontFamily" :options="fontFamilyOptions" size="sm" />
              </div>
              <div class="config-row-section">
                <div class="config-row-item">
                  <label class="config-label">大小 <code class="val-code">{{ tileConfig.text.fontSize }}px</code></label>
                  <input type="range" v-model.number="tileConfig.text.fontSize" min="10" max="120" class="wm-range" />
                </div>
                <div class="config-row-item">
                  <label class="config-label">颜色</label>
                  <div class="color-group">
                    <input v-model="tileConfig.text.color" type="color" class="color-picker" />
                    <input v-model="tileConfig.text.color" type="text" class="color-input" spellcheck="false" />
                  </div>
                </div>
              </div>
              <div class="config-section">
                <label class="config-label">样式</label>
                <div class="style-chips">
                  <button class="style-chip" :class="{ active: tileConfig.text.bold }" @click="tileConfig.text.bold = !tileConfig.text.bold">
                    <Bold :size="13" />
                  </button>
                  <button class="style-chip" :class="{ active: tileConfig.text.italic }" @click="tileConfig.text.italic = !tileConfig.text.italic">
                    <Italic :size="13" />
                  </button>
                </div>
              </div>
            </template>

            <!-- 满屏图片 -->
            <template v-if="tileConfig.type === 'image'">
              <div class="config-section">
                <label class="config-label">水印图片</label>
                <div class="upload-area upload-area-sm" @click="watermarkInputRef?.click()">
                  <template v-if="watermarkFileName">
                    <Image :size="14" style="color: var(--success)" />
                    <span class="upload-filename">{{ watermarkFileName }}</span>
                  </template>
                  <template v-else>
                    <Upload :size="14" />
                    <span>选择水印图片</span>
                  </template>
                </div>
                <input ref="watermarkInputRef" type="file" :accept="ACCEPTED_IMAGE_TYPES" hidden @change="onWatermarkFileChange" />
              </div>
              <div class="config-section">
                <label class="config-label">缩放 <code class="val-code">{{ tileConfig.image.scale }}%</code></label>
                <input type="range" v-model.number="tileConfig.image.scale" min="5" max="200" class="wm-range" />
              </div>
            </template>

            <div class="config-row-section">
              <div class="config-row-item">
                <label class="config-label">行间距 <code class="val-code">{{ tileConfig.rowGap }}px</code></label>
                <input type="range" v-model.number="tileConfig.rowGap" min="10" max="300" class="wm-range" />
              </div>
              <div class="config-row-item">
                <label class="config-label">列间距 <code class="val-code">{{ tileConfig.colGap }}px</code></label>
                <input type="range" v-model.number="tileConfig.colGap" min="10" max="300" class="wm-range" />
              </div>
            </div>
            <div class="config-row-section">
              <div class="config-row-item">
                <label class="config-label">旋转 <code class="val-code">{{ tileConfig.rotation }}°</code></label>
                <input type="range" v-model.number="tileConfig.rotation" min="-180" max="180" class="wm-range" />
              </div>
              <div class="config-row-item">
                <label class="config-label">透明度 <code class="val-code">{{ tileConfig.opacity }}%</code></label>
                <input type="range" v-model.number="tileConfig.opacity" min="1" max="100" class="wm-range" />
              </div>
            </div>
          </template>

          <!-- 位置（仅文字/图片模式） -->
          <template v-if="mode !== 'tile'">
            <div class="config-section">
              <label class="config-label">位置</label>
              <div class="position-grid">
                <button
                  v-for="p in positionOptions" :key="p.value"
                  class="pos-cell" :class="{ active: position.preset === p.value }"
                  @click="position.preset = p.value as WatermarkPosition"
                  @mouseenter="showTooltip(p.label, $event)" @mouseleave="hideTooltip"
                />
              </div>
            </div>
          </template>

          <!-- 导出设置 -->
          <div class="config-section grow">
            <label class="config-label">导出格式</label>
            <div class="export-row">
              <div class="export-format">
                <Select v-model="exportFormat" :options="exportFormatOptions" size="sm" />
              </div>
              <template v-if="exportFormat === 'jpeg'">
                <span class="export-quality-label">质量 <code class="val-code">{{ jpegQuality }}%</code></span>
                <input type="range" v-model.number="jpegQuality" min="10" max="100" class="wm-range wm-range-sm" />
              </template>
            </div>
            <button class="export-btn" @click="exportImage" :disabled="!hasSourceImage">
              <Download :size="14" />
              <span>导出图片</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 右：预览面板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Check :size="14" /></span>
            <span>预览</span>
          </div>
        </div>
        <div class="tool-panel-body preview-body">
          <div class="preview-container">
            <canvas ref="canvasRef" class="preview-canvas" />
          </div>
          <div v-if="!hasSourceImage" class="tool-empty-overlay">
            <div class="empty-icon"><Image :size="28" /></div>
            <p class="empty-title">等待上传</p>
            <p class="empty-desc">上传原图后即可预览水印效果</p>
          </div>
        </div>
      </section>
    </main>

    <!-- Tooltip -->
    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      {{ tooltip.text }}
    </div>
  </div>
</template>

<style scoped>
/* ====== Header ====== */
.stat-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  background: var(--bg-tertiary);
}

/* ====== Panel Actions ====== */
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ====== Config Sections ====== */
.tool-panel-body {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
}
.val-code {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  text-transform: none;
}

/* 两列配置行 */
.config-row-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border-bottom: 1px solid var(--border-subtle);
}

.config-row-item {
  padding: 10px 14px;
}

.config-row-item:first-child {
  border-right: 1px solid var(--border-subtle);
}

/* ====== Upload Area ====== */
.upload-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 1.5px dashed var(--border-default);
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.upload-area:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-light);
}

.upload-area.upload-dragover {
  border-color: var(--accent);
  background: var(--accent-light);
  color: var(--accent);
}

.upload-area-sm {
  padding: 8px;
  font-size: 11px;
}

.upload-filename {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

/* ====== Mode Chips ====== */
.mode-chips {
  display: flex;
  gap: 4px;
}

.mode-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.mode-chip:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
.mode-chip.active { background: var(--accent); border-color: var(--accent); color: #fff; }

.tile-type-chips {
  display: flex;
  gap: 4px;
}

/* ====== Style Chips ====== */
.style-chips {
  display: flex;
  gap: 4px;
}

.style-chip {
  width: 32px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.style-chip:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
.style-chip.active { background: var(--accent); border-color: var(--accent); color: #fff; }

/* ====== Color Group ====== */
.color-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-picker {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.color-input {
  flex: 1;
  height: 28px;
  padding: 0 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  outline: none;
  min-width: 0;
}

.color-input:focus { border-color: var(--accent); box-shadow: var(--shadow-focus); }

/* ====== Range Slider ====== */
.wm-range {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  appearance: none;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  outline: none;
}

.wm-range::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg-card);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.wm-range-sm {
  flex: 1;
  margin-left: 6px;
}

/* ====== Position Grid ====== */
.position-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  width: 160px;
}

.pos-cell {
  aspect-ratio: 1.6;
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  background: var(--bg-primary);
  cursor: pointer;
  transition: all 0.15s;
}

.pos-cell:hover { border-color: var(--accent); background: var(--accent-light); }
.pos-cell.active { background: var(--accent); border-color: var(--accent); }

/* ====== Export ====== */
.export-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.export-format {
  width: 90px;
  flex-shrink: 0;
}

.export-quality-label {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}

.export-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 36px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.export-btn:hover { filter: brightness(1.08); }
.export-btn:active { transform: scale(0.98); }
.export-btn:disabled { opacity: 0.4; cursor: not-allowed; filter: none; }

/* ====== Preview Panel ====== */
.preview-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px !important;
  overflow: hidden !important;
}

.preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.preview-canvas {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  object-fit: contain;
}

.tool-empty-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  z-index: 1;
}

/* ====== Empty State ====== */
.tool-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  flex: 1;
}

.empty-icon {
  color: var(--text-muted);
  opacity: 0.25;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0 0 4px 0;
}

.empty-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}
/* ====== Scrollbar ====== */
.tool-panel-body::-webkit-scrollbar { width: 5px; }
.tool-panel-body::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.tool-panel-body::-webkit-scrollbar-track { background: transparent; }

/* ====== Responsive ====== */
@media (max-width: 760px) {
  .tool-main { grid-template-columns: 1fr !important; }
  .config-row-section { grid-template-columns: 1fr; }
  .config-row-item:first-child { border-right: none; border-bottom: 1px solid var(--border-subtle); }
}
</style>
