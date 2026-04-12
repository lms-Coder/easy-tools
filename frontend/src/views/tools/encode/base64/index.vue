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
import { useBase64 } from './useBase64'

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
  copyOutput, pasteFromClipboard, clearAll, swap,
  importFile, handleFileSelect,
  handleDragOver, handleDragLeave, handleDrop,
  downloadFromBase64,
  openFullscreen, closeFullscreen,
  onPreviewRendered, onPreviewError,
} = useBase64()

// Fullscreen preview src: reuse the same data
const fullscreenSrc = computed(() => {
  if (hasFile.value) {
    // Encode mode
    const cat = encodePreviewType.value
    if (cat === 'image' || cat === 'pdf') return fileInfo.value?.dataUrl || null
    if (cat !== 'other') return previewArrayBuffer.value
    return null
  }
  // Decode mode
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

    <!-- 工具栏 -->
    <div class="tool-toolbar">
      <div class="tool-toolbar-left">
        <div class="tool-segment">
          <button class="tool-segment-btn" :class="{ active: mode === 'encode' }" @click="mode = 'encode'">
            <Upload :size="14" />
            <span>编码</span>
          </button>
          <button class="tool-segment-btn" :class="{ active: mode === 'decode' }" @click="mode = 'decode'">
            <FileText :size="14" />
            <span>解码</span>
          </button>
        </div>

        <div class="tool-divider"></div>

        <label class="toggle-label">
          <span class="toggle-text">URL Safe</span>
          <button class="toggle-switch" :class="{ on: urlSafe }" @click="urlSafe = !urlSafe">
            <span class="toggle-dot"></span>
          </button>
        </label>

        <div class="tool-divider"></div>

        <button class="action-btn" @click="pasteFromClipboard">
          <ClipboardPaste :size="14" />
          <span>粘贴</span>
        </button>
        <button class="action-btn" @click="swap" :disabled="!outputText">
          <ArrowRightLeft :size="14" />
          <span>交换</span>
        </button>
        <button class="action-btn" @click="clearAll" :disabled="!inputText && !outputText">
          <Trash2 :size="14" />
          <span>清空</span>
        </button>
      </div>

      <div class="tool-toolbar-right">
        <button v-if="hasFile && mode === 'decode'" class="action-btn" @click="downloadFromBase64">
          <Download :size="14" />
          <span>下载文件</span>
        </button>
        <button v-else-if="outputText && !isPreviewable" class="action-btn" @click="copyOutput">
          <Copy v-if="!copied" :size="14" />
          <Check v-else :size="14" />
          <span>{{ copied ? '已复制' : '复制结果' }}</span>
        </button>
      </div>
    </div>

    <!-- 隐藏文件输入 -->
    <input ref="fileInputRef" type="file" style="display:none" @change="handleFileSelect" />

    <!-- 主体 -->
    <main class="tool-main split">
      <!-- 左侧：输入 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Upload v-if="mode === 'encode'" :size="14" /><FileText v-else :size="14" /></span>
            <span>{{ mode === 'encode' ? '输入' : 'Base64 字符串' }}</span>
          </div>
          <div class="tool-panel-actions">
            <span class="byte-info">{{ hasFile ? formatBytes(fileInfo!.size) : formatBytes(inputByteSize) }}</span>
            <button class="glass-icon-btn small" @click="importFile" title="导入文件">
              <FileUp :size="14" />
            </button>
            <button class="glass-icon-btn small" @click="clearAll" :disabled="!inputText && !outputText" title="清空">
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body base64-input-body" style="position: relative;">
          <!-- 拖拽覆盖层 -->
          <div v-if="isDragOver" class="drag-overlay">
            <FileUp :size="24" />
            <span>释放以上传文件</span>
          </div>

          <!-- 编码模式 + 有文件 -->
          <template v-else-if="mode === 'encode' && hasFile">
            <!-- 文件信息卡片 -->
            <div class="file-card">
              <div class="file-card-icon">
                <component :is="getFileIcon(fileInfo!.type)" :size="24" />
              </div>
              <div class="file-card-info">
                <div class="file-card-name">{{ fileInfo!.name }}</div>
                <div class="file-card-meta">{{ formatBytes(fileInfo!.size) }} · 已编码</div>
              </div>
              <button class="file-card-remove" @click="clearAll" title="移除文件">
                <X :size="14" />
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
                  <button class="glass-icon-btn small" @click="openFullscreen" title="全屏预览">
                    <Maximize2 :size="12" />
                  </button>
                  <button class="glass-icon-btn small" @click="showPreview = !showPreview" :title="showPreview ? '隐藏预览' : '显示预览'">
                    <EyeOff v-if="showPreview" :size="12" />
                    <Eye v-else :size="12" />
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
            class="base64-textarea"
            :placeholder="mode === 'encode' ? '输入文本，或拖拽文件到此处...' : '输入要解码的 Base64 字符串...'"
            spellcheck="false"
          ></textarea>
        </div>
      </section>

      <!-- 右侧：输出 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><FileText v-if="mode === 'encode'" :size="14" /><Upload v-else :size="14" /></span>
            <span>{{ mode === 'encode' ? 'Base64 结果' : '解码结果' }}</span>
          </div>
          <div class="tool-panel-actions">
            <span v-if="outputText" class="byte-info">{{ formatBytes(outputByteSize) }}</span>
            <button v-if="hasFile && mode === 'decode'" class="glass-icon-btn small" @click="downloadFromBase64" title="下载文件">
              <Download :size="14" />
            </button>
            <button v-else-if="outputText" class="glass-icon-btn small" @click="copyOutput" title="复制">
              <Copy v-if="!copied" :size="14" />
              <Check v-else :size="14" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body base64-output-body">
          <!-- 解码模式 + 可预览内容 -->
          <template v-if="mode === 'decode' && isPreviewable">
            <div class="preview-section">
              <div class="preview-head">
                <span class="preview-label">
                  <Eye :size="12" />
                  <span>文件预览</span>
                </span>
                <button class="glass-icon-btn small" @click="openFullscreen" title="全屏预览">
                  <Maximize2 :size="12" />
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
          <div v-else-if="error" class="tool-error">
            <div class="tool-error-header"><span>!</span> <span>转换错误</span></div>
            <p class="tool-error-msg">{{ error }}</p>
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
            <button class="glass-icon-btn" @click="closeFullscreen" title="关闭">
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
/* ====== 输入面板 ====== */
.base64-input-body {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.base64-textarea {
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: 14px 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--text-primary);
  tab-size: 2;
}

.base64-textarea::placeholder {
  color: var(--text-muted);
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
  border-radius: var(--radius-md);
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
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.file-card-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--accent-light);
  color: var(--accent);
  flex-shrink: 0;
}

.file-card-info {
  flex: 1;
  min-width: 0;
}

.file-card-name {
  font-size: 13px;
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
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
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
  border-radius: var(--radius-md);
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
.base64-output-body {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.base64-output-text {
  margin: 0;
  padding: 14px 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-all;
}

/* ====== 字节统计 ====== */
.byte-info {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  margin-right: 4px;
}

/* ====== Toggle 开关 ====== */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.toggle-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.toggle-switch {
  position: relative;
  width: 32px;
  height: 18px;
  border-radius: 9px;
  border: none;
  background: var(--border-default);
  cursor: pointer;
  transition: background var(--transition-fast);
  padding: 0;
}

.toggle-switch.on {
  background: var(--accent);
}

.toggle-dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  transition: transform var(--transition-fast);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.toggle-switch.on .toggle-dot {
  transform: translateX(14px);
}

/* ====== 响应式 ====== */
@media (max-width: 760px) {
  .tool-main {
    grid-template-columns: 1fr !important;
  }
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
  border-radius: var(--radius-lg);
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
  border-radius: var(--radius-sm);
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
