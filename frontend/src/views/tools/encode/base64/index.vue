<script setup lang="ts">
import {
  Copy,
  Check,
  Trash2,
  ClipboardPaste,
  ArrowRightLeft,
  FileText,
  Upload,
  Download,
  FileUp,
  Image,
  File,
  FileType,
  Eye,
  EyeOff,
  Maximize2,
  X,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import FilePreview from '@/components/common/FilePreview.vue'
import { useTooltip } from '@/composables/useTooltip'
import { useBase64 } from './useBase64'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image
  if (type.includes('pdf')) return FileType
  if (type.includes('word') || type.includes('document')) return FileText
  if (type.includes('sheet') || type.includes('excel')) return FileType
  if (type.includes('presentation') || type.includes('powerpoint')) return FileText
  return File
}

const {
  mode, inputText, outputText, urlSafe, error, copied,
  fileInfo, isDragOver, fileInputRef, hasFile,
  inputByteSize, outputByteSize,
  previewUrl, previewArrayBuffer, previewFileType,
  showPreview, showFullscreen,
  encodePreviewType, decodePreviewType, isPreviewable,
  decodedBinary, decodedMime,
  copyOutput, pasteFromClipboard, clearAll, swap,
  importFile, handleFileSelect,
  handleDragOver, handleDragLeave, handleDrop,
  downloadFromBase64, downloadDecodedBinary,
  openFullscreen, closeFullscreen,
  onPreviewRendered, onPreviewError,
} = useBase64()

// Fullscreen preview src: reuse the same data
const fullscreenSrc = computed(() => {
  if (hasFile.value) {
    const cat = encodePreviewType.value
    if (cat === 'image' || cat === 'pdf') return fileInfo.value?.dataUrl || null
    if (cat !== 'other') return previewArrayBuffer.value
    return null
  }
  if (previewUrl.value && previewUrl.value !== 'office') return previewUrl.value
  return previewArrayBuffer.value
})

const fullscreenType = computed(() => {
  if (hasFile.value) return encodePreviewType.value
  return decodePreviewType.value
})

const hasFullscreenArrayBuffer = computed(() => fullscreenSrc.value instanceof ArrayBuffer)

import { computed } from 'vue'
</script>

<template>
  <div
    class="tool-page"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- 标题栏 -->
    <ToolTitleBar title="Base64 编解码" icon="icon-swap" />

    <!-- Tooltip -->
    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">{{ tooltip.text }}</div>

    <!-- 隐藏文件输入 -->
    <input ref="fileInputRef" type="file" style="display:none" @change="handleFileSelect" />

    <!-- 主体 -->
    <main class="tool-main split">
      <!-- 左侧：配置 + 输入 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Upload v-if="mode === 'encode'" :size="14" /><FileText v-else :size="14" /></span>
            <span>{{ mode === 'encode' ? '输入' : 'Base64 字符串' }}</span>
          </div>
          <div class="panel-actions">
            <span class="byte-info">{{ hasFile ? formatBytes(fileInfo!.size) : formatBytes(inputByteSize) }}</span>
            <button class="tool-icon-btn" @click="importFile"
              @mouseenter="showTooltip('导入文件', $event)" @mouseleave="hideTooltip">
              <FileUp :size="13" />
            </button>
            <button class="tool-icon-btn" @click="pasteFromClipboard"
              @mouseenter="showTooltip('粘贴', $event)" @mouseleave="hideTooltip">
              <ClipboardPaste :size="13" />
            </button>
            <button class="tool-icon-btn" @click="clearAll" :disabled="!inputText && !outputText"
              @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>

        <div class="tool-panel-body">
          <!-- 模式切换 -->
          <div class="config-section">
            <label class="config-label">模式</label>
            <div class="mode-toggle">
              <button :class="['seg-btn xs', { active: mode === 'encode' }]" @click="mode = 'encode'">
                <Upload :size="11" /> 编码
              </button>
              <button :class="['seg-btn xs', { active: mode === 'decode' }]" @click="mode = 'decode'">
                <FileText :size="11" /> 解码
              </button>
            </div>
          </div>

          <!-- 选项 -->
          <div class="config-section">
            <div class="config-row">
              <label class="config-label">选项</label>
              <div class="options-group">
                <label class="toggle-label" @click="urlSafe = !urlSafe">
                  <span :class="['toggle-check', { on: urlSafe }]">
                    <Check v-if="urlSafe" :size="8" />
                  </span>
                  <span>URL Safe</span>
                </label>
                <button class="tool-icon-btn small" @click="swap" :disabled="!outputText"
                  @mouseenter="showTooltip('交换', $event)" @mouseleave="hideTooltip">
                  <ArrowRightLeft :size="12" />
                </button>
              </div>
            </div>
          </div>

          <!-- 输入区域 -->
          <div class="config-section grow" style="position: relative;">
            <!-- 拖拽覆盖层 -->
            <div v-if="isDragOver" class="drag-overlay">
              <FileUp :size="20" />
              <span>释放以上传文件</span>
            </div>

            <!-- 编码模式 + 有文件 -->
            <template v-else-if="mode === 'encode' && hasFile">
              <!-- 文件信息卡片 -->
              <div class="file-card">
                <div class="file-card-icon">
                  <component :is="getFileIcon(fileInfo!.type)" :size="20" />
                </div>
                <div class="file-card-info">
                  <div class="file-card-name">{{ fileInfo!.name }}</div>
                  <div class="file-card-meta">{{ formatBytes(fileInfo!.size) }} · 已编码</div>
                </div>
                <button class="file-card-remove" @click="clearAll">
                  <X :size="12" />
                </button>
              </div>

              <!-- 预览区域 -->
              <div v-if="isPreviewable" class="preview-section">
                <div class="preview-head">
                  <span class="preview-label">
                    <Eye :size="12" />
                    <span>预览</span>
                  </span>
                  <div class="preview-actions">
                    <button class="tool-icon-btn mini" @click="openFullscreen"
                      @mouseenter="showTooltip('全屏', $event)" @mouseleave="hideTooltip">
                      <Maximize2 :size="11" />
                    </button>
                    <button class="tool-icon-btn mini" @click="showPreview = !showPreview">
                      <EyeOff v-if="showPreview" :size="11" />
                      <Eye v-else :size="11" />
                    </button>
                  </div>
                </div>
                <div v-if="showPreview" class="preview-body">
                  <img v-if="encodePreviewType === 'image'" :src="fileInfo!.dataUrl" class="preview-img" @click="openFullscreen" />
                  <embed v-else-if="encodePreviewType === 'pdf'" :src="fileInfo!.dataUrl" class="preview-embed" />
                  <FilePreview
                    v-else-if="previewArrayBuffer"
                    :src="previewArrayBuffer"
                    :file-type="encodePreviewType"
                    :file-name="fileInfo!.name"
                    @rendered="onPreviewRendered"
                    @error="onPreviewError"
                  />
                </div>
              </div>
            </template>

            <!-- 文本输入 -->
            <textarea
              v-else-if="!isDragOver"
              v-model="inputText"
              class="config-textarea"
              :placeholder="mode === 'encode' ? '输入文本，或拖拽文件到此处...' : '输入要解码的 Base64 字符串...'"
              spellcheck="false"
            />
          </div>
        </div>
      </section>

      <!-- 右侧：输出 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><FileText v-if="mode === 'encode'" :size="14" /><Upload v-else :size="14" /></span>
            <span>{{ mode === 'encode' ? 'Base64 结果' : '解码结果' }}</span>
          </div>
          <div class="panel-actions">
            <span v-if="outputText" class="byte-info">{{ formatBytes(outputByteSize) }}</span>
            <div class="panel-divider"></div>
            <button v-if="hasFile && mode === 'decode'" class="tool-icon-btn" @click="downloadFromBase64"
              @mouseenter="showTooltip('下载文件', $event)" @mouseleave="hideTooltip">
              <Download :size="13" />
            </button>
            <button v-else-if="decodedBinary" class="tool-icon-btn" @click="downloadDecodedBinary"
              @mouseenter="showTooltip('下载文件', $event)" @mouseleave="hideTooltip">
              <Download :size="13" />
            </button>
            <button v-else-if="outputText" class="tool-icon-btn" @click="copyOutput"
              @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip">
              <Check v-if="copied" :size="13" /><Copy v-else :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body">
          <!-- 解码模式 + 可预览内容 -->
          <template v-if="mode === 'decode' && isPreviewable">
            <div class="preview-section">
              <div class="preview-head">
                <span class="preview-label">
                  <Eye :size="12" />
                  <span>文件预览</span>
                </span>
                <button class="tool-icon-btn mini" @click="openFullscreen"
                  @mouseenter="showTooltip('全屏预览', $event)" @mouseleave="hideTooltip">
                  <Maximize2 :size="11" />
                </button>
              </div>
              <div class="preview-body">
                <img v-if="previewUrl.startsWith('data:image')" :src="previewUrl" class="preview-img" @click="openFullscreen" />
                <embed v-else-if="previewUrl.includes('pdf')" :src="previewUrl" class="preview-embed" />
                <FilePreview
                  v-else-if="previewUrl === 'office' && previewArrayBuffer"
                  :src="previewArrayBuffer"
                  :file-type="previewFileType"
                  @rendered="onPreviewRendered"
                  @error="onPreviewError"
                />
              </div>
            </div>
          </template>

          <!-- 错误 -->
          <div v-else-if="error" class="output-error">
            <div class="output-error-head"><span>!</span> <span>转换错误</span></div>
            <p class="output-error-msg">{{ error }}</p>
          </div>

          <!-- 结果 -->
          <pre v-else-if="outputText" class="base64-output-text">{{ outputText }}</pre>

          <!-- 空状态 -->
          <div v-else class="tool-empty">
            <div class="empty-icon"><ArrowRightLeft :size="32" /></div>
            <p class="empty-title">等待输入</p>
            <p class="empty-desc">{{ mode === 'encode' ? '输入文本或拖拽文件进行编码' : '输入 Base64 字符串进行解码' }}</p>
          </div>
        </div>
      </section>
    </main>

    <!-- 全屏预览 -->
    <Teleport to="body">
      <div v-if="showFullscreen" class="fs-overlay" @click="closeFullscreen">
        <div class="fs-content" @click.stop>
          <div class="fs-header">
            <span class="fs-title">文件预览</span>
            <button class="glass-icon-btn" @click="closeFullscreen">
              <X :size="14" />
            </button>
          </div>
          <div class="fs-body">
            <img v-if="fullscreenType === 'image' && typeof fullscreenSrc === 'string'" :src="fullscreenSrc" class="fs-image" />
            <embed v-else-if="fullscreenType === 'pdf' && typeof fullscreenSrc === 'string'" :src="fullscreenSrc" class="fs-embed" />
            <FilePreview
              v-else-if="hasFullscreenArrayBuffer"
              :src="fullscreenSrc"
              :file-type="fullscreenType"
              @rendered="onPreviewRendered"
              @error="onPreviewError"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ====== Panel Actions ====== */
.panel-divider {
  width: 1px;
  height: 16px;
  background: var(--border-subtle);
  margin: 0 4px;
}

.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.action-btn.mini { width: 22px; height: 22px; }
.action-btn.small { width: 24px; height: 24px; }

/* ====== Segment Buttons ====== */
.mode-toggle {
  display: flex;
  gap: 2px;
}

/* ====== Config Sections ====== */
.options-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary);
  cursor: pointer;
}

.toggle-check {
  width: 14px;
  height: 14px;
  border: 1px solid var(--border-default);
  border-radius: 3px;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
  flex-shrink: 0;
}

.toggle-check.on {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}

/* ====== 拖拽覆盖层 ====== */
.drag-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--accent-light);
  border: 2px dashed var(--accent);
  border-radius: 6px;
  z-index: 10;
  pointer-events: none;
  font-size: 13px;
  color: var(--accent);
  font-weight: 500;
}

/* ====== 文件卡片 ====== */
.file-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  flex-shrink: 0;
}

.file-card-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--accent-light);
  color: var(--accent);
  flex-shrink: 0;
}

.file-card-info {
  flex: 1;
  min-width: 0;
}

.file-card-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-card-meta {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.file-card-remove {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
  flex-shrink: 0;
}

.file-card-remove:hover {
  background: var(--error-light);
  color: var(--error);
}

/* ====== 预览区域 ====== */
.preview-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  padding: 8px 12px 12px;
}

.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.preview-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.preview-body {
  flex: 1;
  min-height: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  cursor: zoom-in;
}

.preview-embed {
  width: 100%;
  height: 100%;
  border: none;
}

/* ====== 输出面板 ====== */
.base64-output-text {
  margin: 0;
  padding: 14px 16px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-all;
}

/* ====== 字节统计 ====== */
.byte-info {
  font-size: 10px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  padding: 1px 6px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  margin-right: 2px;
}

</style>

<!-- 全屏预览样式（非 scoped，因为 Teleport 到 body） -->
<style>
.fs-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.fs-content {
  width: 90vw;
  height: 90vh;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

.fs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.fs-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.fs-header .glass-icon-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  transition: all 0.15s;
}

.fs-header .glass-icon-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-default);
  color: var(--text-primary);
}

.fs-body {
  flex: 1;
  min-height: 0;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.fs-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.fs-embed {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
