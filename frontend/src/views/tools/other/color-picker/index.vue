<script setup lang="ts">
import { Copy, Check } from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import { useTooltip } from '@/composables/useTooltip'
import { useColorPicker, presetColors } from './useColorPicker'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
  hex, alpha, rgb, hsl, formats, copiedField, recentColors,
  setHex, setRGB, setHSL, applyPreset, copyValue, addRecent,
} = useColorPicker()

// Local editable inputs (synced from computed)
const hexInput = ref(hex.value)
const rInput = ref(rgb.value.r)
const gInput = ref(rgb.value.g)
const bInput = ref(rgb.value.b)
const hInput = ref(hsl.value.h)
const sInput = ref(hsl.value.s)
const lInput = ref(hsl.value.l)

import { ref, watch } from 'vue'

watch(hex, v => { hexInput.value = v })
watch(() => rgb.value.r, v => { rInput.value = v })
watch(() => rgb.value.g, v => { gInput.value = v })
watch(() => rgb.value.b, v => { bInput.value = v })
watch(() => hsl.value.h, v => { hInput.value = v })
watch(() => hsl.value.s, v => { sInput.value = v })
watch(() => hsl.value.l, v => { lInput.value = v })

const onHexInput = () => {
  const v = hexInput.value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(v)) setHex(v)
  else if (/^[0-9a-fA-F]{6}$/.test(v)) setHex('#' + v)
}

const onRgbInput = () => setRGB(Number(rInput.value), Number(gInput.value), Number(bInput.value))
const onHslInput = () => setHSL(Number(hInput.value), Number(sInput.value), Number(lInput.value))
</script>

<template>
  <div class="tool-page">
    <ToolTitleBar title="颜色选择器" icon="icon-palette">
      <div class="header-content">
        <div class="preview-dot" :style="{ background: hex }"></div>
        <span class="hex-tag">{{ hex }}</span>
      </div>
    </ToolTitleBar>

    <div class="tool-toolbar">
      <div class="tool-toolbar-left">
        <span class="toolbar-hint">选取颜色，查看各格式值，点击即可复制</span>
      </div>
      <div class="tool-toolbar-right">
        <button class="action-btn primary" @click="addRecent" @mouseenter="showTooltip('加入最近使用', $event)" @mouseleave="hideTooltip">
          + 收藏
        </button>
      </div>
    </div>

    <main class="tool-main" style="grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);">
      <!-- 左侧：预览 + 预设色板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Check :size="12" /></span>
            <span>调色板</span>
          </div>
        </div>
        <div class="tool-panel-body" style="overflow: auto;">
          <div class="color-form">
            <!-- 大色块预览 -->
            <div class="color-preview-box" :style="{ background: hex, opacity: alpha / 100 }">
              <div class="preview-checker"></div>
              <div class="preview-overlay" :style="{ background: hex, opacity: alpha / 100 }"></div>
            </div>

            <!-- 透明度 -->
            <div class="input-row">
              <label class="input-label">透明度</label>
              <div class="slider-wrap">
                <input type="range" v-model.number="alpha" min="0" max="100" class="alpha-slider" />
              </div>
              <span class="input-value">{{ alpha }}%</span>
            </div>

            <!-- HEX 输入 -->
            <div class="input-row">
              <label class="input-label">HEX</label>
              <input type="text" v-model="hexInput" class="color-input mono" @change="onHexInput" spellcheck="false" />
              <input type="color" v-model="hex" class="native-picker" @change="addRecent" />
            </div>

            <!-- RGB 输入 -->
            <div class="input-group">
              <label class="input-label">RGB</label>
              <div class="rgb-inputs">
                <div class="rgb-field">
                  <span class="rgb-prefix">R</span>
                  <input type="number" v-model.number="rInput" min="0" max="255" class="color-input small" @change="onRgbInput" />
                </div>
                <div class="rgb-field">
                  <span class="rgb-prefix">G</span>
                  <input type="number" v-model.number="gInput" min="0" max="255" class="color-input small" @change="onRgbInput" />
                </div>
                <div class="rgb-field">
                  <span class="rgb-prefix">B</span>
                  <input type="number" v-model.number="bInput" min="0" max="255" class="color-input small" @change="onRgbInput" />
                </div>
              </div>
            </div>

            <!-- HSL 输入 -->
            <div class="input-group">
              <label class="input-label">HSL</label>
              <div class="rgb-inputs">
                <div class="rgb-field">
                  <span class="rgb-prefix">H</span>
                  <input type="number" v-model.number="hInput" min="0" max="360" class="color-input small" @change="onHslInput" />
                </div>
                <div class="rgb-field">
                  <span class="rgb-prefix">S</span>
                  <input type="number" v-model.number="sInput" min="0" max="100" class="color-input small" @change="onHslInput" />
                </div>
                <div class="rgb-field">
                  <span class="rgb-prefix">L</span>
                  <input type="number" v-model.number="lInput" min="0" max="100" class="color-input small" @change="onHslInput" />
                </div>
              </div>
            </div>
          </div>

          <!-- 最近使用 -->
          <div v-if="recentColors.length" class="preset-section">
            <div class="preset-header">最近使用</div>
            <div class="color-grid">
              <button
                v-for="c in recentColors" :key="c"
                class="color-swatch small" :class="{ active: hex.toUpperCase() === c }"
                :style="{ background: c }" :title="c"
                @click="applyPreset(c)"
              ></button>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧：格式输出 + 预设色 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Check :size="12" /></span>
            <span>格式输出</span>
          </div>
        </div>
        <div class="tool-panel-body" style="overflow: auto;">
          <!-- 格式列表 -->
          <div class="format-list">
            <div v-for="fmt in formats" :key="fmt.label" class="format-row" @click="copyValue(fmt.label, fmt.value)">
              <div class="format-left">
                <span class="format-label">{{ fmt.label }}</span>
                <code class="format-value">{{ fmt.value }}</code>
              </div>
              <button class="format-copy-btn">
                <Copy v-if="copiedField !== fmt.label" :size="13" />
                <Check v-else :size="13" style="color: var(--success)" />
              </button>
            </div>
          </div>

          <!-- 预设色板 -->
          <div class="preset-section" style="margin-top: 20px;">
            <div class="preset-header">预设色板</div>
            <div class="color-grid">
              <button
                v-for="c in presetColors" :key="c"
                class="color-swatch" :class="{ active: hex.toUpperCase() === c }"
                :style="{ background: c }" :title="c"
                @click="applyPreset(c)"
              ></button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">{{ tooltip.text }}</div>
  </div>
</template>

<style scoped>
.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 4px;
}

.preview-dot {
  width: 18px;
  height: 18px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--border-subtle);
  flex-shrink: 0;
}

.hex-tag {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.toolbar-hint {
  font-size: 11px;
  color: var(--text-muted);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn.primary {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
  background: var(--accent-light);
}

.action-btn.primary:hover { border-color: var(--accent); }

/* ====== 表单 ====== */
.color-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
}

.color-preview-box {
  position: relative;
  width: 100%;
  height: 80px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

.preview-checker {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}

.preview-overlay {
  position: absolute;
  inset: 0;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  flex-shrink: 0;
  width: 36px;
}

.slider-wrap {
  flex: 1;
}

.alpha-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--bg-secondary);
  border-radius: 2px;
  outline: none;
}

.alpha-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.input-value {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  width: 36px;
  text-align: right;
}

.color-input {
  flex: 1;
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  outline: none;
  transition: all 0.15s;
  min-width: 0;
}

.color-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-light); }
.color-input.mono { font-family: var(--font-mono); }
.color-input.small { width: 60px; flex: none; }

.native-picker {
  width: 30px;
  height: 30px;
  padding: 2px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: var(--bg-secondary);
}

.rgb-inputs {
  display: flex;
  gap: 6px;
}

.rgb-field {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.rgb-prefix {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  font-family: var(--font-mono);
  width: 12px;
  text-align: center;
}

/* ====== 格式列表 ====== */
.format-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin: 0 14px;
}

.format-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.1s;
}

.format-row:hover { background: var(--bg-hover); }

.format-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.format-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-light);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  flex-shrink: 0;
  font-family: var(--font-mono);
}

.format-value {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.format-copy-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0;
  transition: all 0.15s;
}

.format-row:hover .format-copy-btn { opacity: 1; }
.format-copy-btn:hover { background: var(--bg-secondary); color: var(--accent); }

/* ====== 预设色板 ====== */
.preset-section {
  padding: 0 14px 14px;
}

.preset-header {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 8px;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
}

.color-swatch {
  aspect-ratio: 1;
  border-radius: var(--radius-xs);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.12s;
}

.color-swatch:hover { transform: scale(1.15); border-color: var(--text-muted); }
.color-swatch.active { border-color: var(--text-primary); box-shadow: 0 0 0 2px var(--accent-light); }
.color-swatch.small { width: 20px; height: 20px; }

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
  .color-grid { grid-template-columns: repeat(8, 1fr); }
}
</style>
