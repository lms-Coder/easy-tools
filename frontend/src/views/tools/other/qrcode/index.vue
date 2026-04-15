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
        <span v-if="inputText" class="stat-tag">{{ charCount }} 字符</span>
        <span v-if="isUrlLike" class="type-tag"><Link :size="11" /> 链接</span>
      </div>
    </ToolTitleBar>

    <!-- 主内容 -->
    <main class="tool-main split">
      <!-- 左：配置面板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><ScanLine :size="14" /></span>
            <span>内容设置</span>
          </div>
          <div class="panel-actions">
            <button class="tool-icon-btn" @click="clear" :disabled="!inputText"
              @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>

        <div class="tool-panel-body">
          <!-- 内容输入 -->
          <div class="config-section">
            <label class="config-label">二维码内容</label>
            <textarea
              v-model="inputText"
              class="config-textarea-fixed"
              placeholder="输入文本、链接、Wi-Fi 配置、电话、邮箱..."
              spellcheck="false"
              rows="3"
            />
            <span class="config-hint">链接请带 http(s)://，Wi-Fi 用 WIFI:T:WPA;S:名称;P:密码;; 格式</span>
          </div>

          <!-- 快速示例 -->
          <div class="config-section">
            <label class="config-label">快速示例</label>
            <div class="preset-chips">
              <button
                v-for="sample in presetSamples"
                :key="sample.label"
                class="preset-chip"
                @click="applySample(sample.value)"
              >{{ sample.label }}</button>
            </div>
          </div>

          <!-- 容错级别 -->
          <div class="config-section">
            <label class="config-label">容错级别</label>
            <div class="level-chips">
              <button
                v-for="level in errorLevels"
                :key="level.id"
                class="level-chip"
                :class="{ active: errorCorrectionLevel === level.id }"
                @click="errorCorrectionLevel = level.id as any"
                @mouseenter="showTooltip(level.desc, $event)"
                @mouseleave="hideTooltip"
              >{{ level.name }}</button>
            </div>
          </div>

          <!-- 尺寸和边距 -->
          <div class="config-section">
            <label class="config-label">尺寸 <code class="val-code">{{ size }}px</code></label>
            <input v-model.number="size" type="range" min="160" max="640" step="16" class="qr-range" />
            <label class="config-label" style="margin-top: 10px;">边距 <code class="val-code">{{ margin }}</code></label>
            <input v-model.number="margin" type="range" min="1" max="8" step="1" class="qr-range" />
          </div>

          <!-- 颜色 -->
          <div class="config-section grow">
            <label class="config-label">颜色</label>
            <div class="color-row-group">
              <div class="color-group">
                <span class="color-label">前景</span>
                <input v-model="foregroundColor" type="color" class="color-picker" />
                <input v-model="foregroundColor" type="text" class="color-input" spellcheck="false" />
              </div>
              <div class="color-group">
                <span class="color-label">背景</span>
                <input v-model="backgroundColor" type="color" class="color-picker" />
                <input v-model="backgroundColor" type="text" class="color-input" spellcheck="false" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 右：预览面板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Check :size="14" /></span>
            <span>生成结果</span>
          </div>
          <div class="panel-actions">
            <button class="tool-icon-btn" @click="copyQR" :disabled="!qrCodeDataUrl"
              @mouseenter="showTooltip('复制图片', $event)" @mouseleave="hideTooltip">
              <Copy :size="13" />
            </button>
            <button class="tool-icon-btn" @click="downloadQR" :disabled="!qrCodeDataUrl"
              @mouseenter="showTooltip('下载 PNG', $event)" @mouseleave="hideTooltip">
              <Download :size="13" />
            </button>
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
            <div class="empty-icon"><QrCode :size="28" /></div>
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
/* ====== Header ====== */
.stat-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  background: var(--bg-tertiary);
}

.type-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-light);
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

.config-hint {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.5;
  margin-top: 4px;
}

.val-code {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  text-transform: none;
}

/* ====== Textarea ====== */
.config-textarea-fixed {
  width: 100%;
  padding: 8px 10px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  outline: none;
  resize: vertical;
  line-height: 1.6;
  transition: all var(--transition-fast);
}

.config-textarea-fixed:hover { border-color: var(--border-strong); }
.config-textarea-fixed:focus { border-color: var(--accent); box-shadow: var(--shadow-focus); }
.config-textarea-fixed::placeholder { color: var(--text-muted); }

/* ====== Preset Chips ====== */
.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.preset-chip {
  padding: 3px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.preset-chip:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }

/* ====== Level Chips ====== */
.level-chips {
  display: flex;
  gap: 4px;
}

.level-chip {
  padding: 3px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.level-chip:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
.level-chip.active { background: var(--accent); border-color: var(--accent); color: var(--text-inverse, #fff); }

/* ====== Range Slider ====== */
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

/* ====== Color ====== */
.color-row-group {
  display: flex;
  gap: 10px;
}

.color-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-label {
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
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

/* ====== Preview Panel ====== */
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
  background: var(--text-inverse, #fff);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  animation: qr-fade-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes qr-fade-in {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
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
  gap: 6px;
}

.qr-info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
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
  .color-row-group { flex-direction: column; }
}
</style>
