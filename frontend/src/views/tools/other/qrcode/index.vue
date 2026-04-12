<script setup lang="ts">
import {
  Check,
  Copy,
  Trash2,
  Download,
  Link,
  QrCode,
  ScanLine,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import { useTooltip } from '@/composables/useTooltip'
import { useQrCode, errorLevels, presetSamples } from './useQrCode'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
  inputText, size, margin, errorCorrectionLevel,
  foregroundColor, backgroundColor, qrCodeDataUrl,
  qrFileName, charCount, isUrlLike,
  applySample, downloadQR, copyQR, clear,
} = useQrCode()
</script>

<template>
  <div class="tool-page">
    <!-- 标题栏 -->
    <ToolTitleBar title="二维码生成" icon="icon-qrcode">
      <div class="header-content">
        <span v-if="inputText" class="qr-stat">{{ charCount }} 字符</span>
        <span v-if="isUrlLike" class="qr-type-tag"><Link :size="11" /> 链接</span>
      </div>
    </ToolTitleBar>

    <!-- 工具栏 -->
    <div class="tool-toolbar">
      <div class="tool-toolbar-left">
        <div class="tool-segment">
          <button
            v-for="level in errorLevels"
            :key="level.id"
            class="tool-segment-btn"
            :class="{ active: errorCorrectionLevel === level.id }"
            @click="errorCorrectionLevel = level.id as any"
            @mouseenter="showTooltip(`容错 ${level.desc}`, $event)"
            @mouseleave="hideTooltip"
          >
            {{ level.name }}
          </button>
        </div>
        <div class="tool-divider"></div>
        <button class="glass-icon-btn" @click="downloadQR" :disabled="!qrCodeDataUrl" @mouseenter="showTooltip('下载 PNG', $event)" @mouseleave="hideTooltip"><Download :size="15" /></button>
        <button class="glass-icon-btn" @click="copyQR" :disabled="!qrCodeDataUrl" @mouseenter="showTooltip('复制图片', $event)" @mouseleave="hideTooltip"><Copy :size="15" /></button>
        <div class="tool-divider"></div>
        <button class="glass-icon-btn danger" @click="clear" :disabled="!inputText" @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip"><Trash2 :size="15" /></button>
      </div>
      <div class="tool-toolbar-right">
        <span class="tool-stat">{{ size }}px</span>
      </div>
    </div>

    <!-- 主内容 -->
    <main class="tool-main split">
      <!-- 左：输入面板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><ScanLine :size="12" /></span>
            <span>内容设置</span>
          </div>
        </div>
        <div class="tool-panel-body qr-settings-body">
          <!-- 内容输入 -->
          <div class="qr-field">
            <label class="qr-label">二维码内容</label>
            <textarea
              v-model="inputText"
              class="qr-textarea"
              placeholder="输入文本、链接、Wi-Fi 配置、电话、邮箱..."
              spellcheck="false"
              rows="4"
            ></textarea>
            <span class="qr-hint">链接请带 http(s)://，Wi-Fi 用 WIFI:T:WPA;S:名称;P:密码;; 格式</span>
          </div>

          <!-- 快速示例 -->
          <div class="qr-field">
            <label class="qr-label">快速示例</label>
            <div class="qr-presets">
              <button
                v-for="sample in presetSamples"
                :key="sample.label"
                class="qr-preset-btn"
                @click="applySample(sample.value)"
              >
                {{ sample.label }}
              </button>
            </div>
          </div>

          <!-- 尺寸和边距 -->
          <div class="qr-sliders">
            <div class="qr-slider-row">
              <label class="qr-label">尺寸 <code class="qr-slider-val">{{ size }}px</code></label>
              <input v-model.number="size" type="range" min="160" max="640" step="16" class="qr-range" />
            </div>
            <div class="qr-slider-row">
              <label class="qr-label">边距 <code class="qr-slider-val">{{ margin }}</code></label>
              <input v-model.number="margin" type="range" min="1" max="8" step="1" class="qr-range" />
            </div>
          </div>

          <!-- 颜色 -->
          <div class="qr-colors">
            <div class="qr-color-group">
              <label class="qr-label">前景色</label>
              <div class="qr-color-row">
                <input v-model="foregroundColor" type="color" class="qr-color-picker" />
                <input v-model="foregroundColor" type="text" class="qr-color-text" spellcheck="false" />
              </div>
            </div>
            <div class="qr-color-group">
              <label class="qr-label">背景色</label>
              <div class="qr-color-row">
                <input v-model="backgroundColor" type="color" class="qr-color-picker" />
                <input v-model="backgroundColor" type="text" class="qr-color-text" spellcheck="false" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 右：预览面板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><QrCode :size="12" /></span>
            <span>生成结果</span>
          </div>
          <div class="tool-panel-actions">
            <button v-if="qrCodeDataUrl" class="glass-icon-btn small" @click="downloadQR" @mouseenter="showTooltip('下载', $event)" @mouseleave="hideTooltip"><Download :size="13" /></button>
          </div>
        </div>
        <div class="tool-panel-body qr-preview-body">
          <template v-if="qrCodeDataUrl">
            <div class="qr-display-wrap">
              <div class="qr-display">
                <img :src="qrCodeDataUrl" alt="二维码" class="qr-image" />
              </div>
            </div>
            <div class="qr-info">
              <div class="qr-info-row">
                <span class="qr-info-label">类型</span>
                <span class="qr-info-value">
                  <Link v-if="isUrlLike" :size="13" />
                  <QrCode v-else :size="13" />
                  {{ isUrlLike ? '链接二维码' : '文本二维码' }}
                </span>
              </div>
              <div class="qr-info-row">
                <span class="qr-info-label">文件名</span>
                <code class="qr-info-code">{{ qrFileName }}</code>
              </div>
            </div>
          </template>
          <div v-else class="tool-empty">
            <div class="empty-icon"><QrCode :size="24" /></div>
            <p class="empty-title">等待生成</p>
            <p class="empty-desc">输入内容后自动生成二维码</p>
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
/* ====== 标题栏 ====== */
.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 4px;
}

.qr-stat {
  padding: 2px 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
}

.qr-type-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-light);
}

/* ====== 左侧设置面板 ====== */
.qr-settings-body {
  padding: 16px !important;
  overflow-y: auto !important;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.qr-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qr-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.qr-textarea {
  width: 100%;
  padding: 12px 14px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  outline: none;
  resize: vertical;
  transition: all 0.15s;
}

.qr-textarea:hover { border-color: var(--border-default); }
.qr-textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-light); }
.qr-textarea::placeholder { color: var(--text-muted); }

.qr-hint {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.5;
}

/* 快速示例 */
.qr-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.qr-preset-btn {
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
}

.qr-preset-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-light);
}

/* 滑块 */
.qr-sliders {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qr-slider-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qr-slider-val {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
}

.qr-range {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  appearance: none;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  outline: none;
}

.qr-range::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg-card);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

/* 颜色 */
.qr-colors {
  display: flex;
  gap: 14px;
}

.qr-color-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.qr-color-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qr-color-picker {
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.qr-color-text {
  flex: 1;
  height: 36px;
  padding: 0 10px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  outline: none;
  transition: all 0.15s;
  min-width: 0;
}

.qr-color-text:hover { border-color: var(--border-default); }
.qr-color-text:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-light); }

/* ====== 右侧预览面板 ====== */
.qr-preview-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px !important;
  overflow-y: auto !important;
}

.qr-display-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
}

.qr-display {
  padding: 20px;
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.qr-image {
  display: block;
  max-width: 260px;
  max-height: 260px;
  image-rendering: crisp-edges;
}

.qr-info {
  width: 100%;
  max-width: 360px;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qr-info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.qr-info-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  flex-shrink: 0;
  width: 48px;
}

.qr-info-value {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.qr-info-code {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
  word-break: break-all;
  line-height: 1.4;
}

/* ====== Tooltip ====== */
.toolbar-tooltip {
  position: fixed;
  z-index: 9999;
  padding: 5px 12px;
  font-size: 12px;
  color: var(--text-inverse, #fff);
  background: var(--bg-tooltip, rgba(0, 0, 0, 0.85));
  border-radius: var(--radius-sm, 4px);
  white-space: nowrap;
  pointer-events: none;
  transform: translateX(-50%);
  min-width: 60px;
  text-align: center;
}

/* ====== 响应式 ====== */
@media (max-width: 760px) {
  .tool-main { grid-template-columns: 1fr !important; }
  .qr-colors { flex-direction: column; }
}
</style>
