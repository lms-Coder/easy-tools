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

    <main class="tool-main" style="grid-template-columns: minmax(340px, 420px) minmax(0, 1fr);">
      <!-- 左侧：调色板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Check :size="14" /></span>
            <span>调色板</span>
          </div>
          <div class="panel-actions">
            <button class="fav-btn" @click="addRecent"
              @mouseenter="showTooltip('加入收藏', $event)" @mouseleave="hideTooltip">
              + 收藏
            </button>
          </div>
        </div>

        <div class="tool-panel-body">
          <!-- 大色块预览 -->
          <div class="config-section">
            <div class="color-preview-box" :style="{ background: hex, opacity: alpha / 100 }">
              <div class="preview-checker"></div>
              <div class="preview-overlay" :style="{ background: hex, opacity: alpha / 100 }"></div>
            </div>
          </div>

          <!-- 透明度 -->
          <div class="config-section">
            <div class="config-row">
              <label class="config-label">透明度</label>
              <span class="alpha-val">{{ alpha }}%</span>
            </div>
            <input type="range" v-model.number="alpha" min="0" max="100" class="alpha-slider" />
          </div>

          <!-- HEX 输入 -->
          <div class="config-section">
            <label class="config-label">HEX</label>
            <div class="hex-row">
              <input type="text" v-model="hexInput" class="tool-input mono" @change="onHexInput" spellcheck="false" />
              <input type="color" v-model="hex" class="native-picker" @change="addRecent" />
            </div>
          </div>

          <!-- RGB 输入 -->
          <div class="config-section">
            <label class="config-label">RGB</label>
            <div class="rgb-inputs">
              <div class="rgb-field">
                <span class="rgb-prefix">R</span>
                <input type="number" v-model.number="rInput" min="0" max="255" class="tool-input small" @change="onRgbInput" />
              </div>
              <div class="rgb-field">
                <span class="rgb-prefix">G</span>
                <input type="number" v-model.number="gInput" min="0" max="255" class="tool-input small" @change="onRgbInput" />
              </div>
              <div class="rgb-field">
                <span class="rgb-prefix">B</span>
                <input type="number" v-model.number="bInput" min="0" max="255" class="tool-input small" @change="onRgbInput" />
              </div>
            </div>
          </div>

          <!-- HSL 输入 -->
          <div class="config-section">
            <label class="config-label">HSL</label>
            <div class="rgb-inputs">
              <div class="rgb-field">
                <span class="rgb-prefix">H</span>
                <input type="number" v-model.number="hInput" min="0" max="360" class="tool-input small" @change="onHslInput" />
              </div>
              <div class="rgb-field">
                <span class="rgb-prefix">S</span>
                <input type="number" v-model.number="sInput" min="0" max="100" class="tool-input small" @change="onHslInput" />
              </div>
              <div class="rgb-field">
                <span class="rgb-prefix">L</span>
                <input type="number" v-model.number="lInput" min="0" max="100" class="tool-input small" @change="onHslInput" />
              </div>
            </div>
          </div>

          <!-- 最近使用 -->
          <div v-if="recentColors.length" class="config-section grow">
            <label class="config-label">最近使用</label>
            <div class="color-grid">
              <button
                v-for="c in recentColors" :key="c"
                class="color-swatch small" :class="{ active: hex.toUpperCase() === c }"
                :style="{ background: c }" :title="c"
                @click="applyPreset(c)"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧：格式输出 + 预设色 -->
      <section class="tool-panel right-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Check :size="14" /></span>
            <span>格式输出</span>
          </div>
        </div>
        <div class="tool-panel-body">
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
          <div class="preset-section">
            <div class="preset-header">预设色板</div>
            <div class="color-grid">
              <button
                v-for="c in presetColors" :key="c"
                class="color-swatch" :class="{ active: hex.toUpperCase() === c }"
                :style="{ background: c }" :title="c"
                @click="applyPreset(c)"
              />
            </div>
          </div>
        </div>
      </section>
    </main>

    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">{{ tooltip.text }}</div>
  </div>
</template>

<style scoped>
/* ====== Header ====== */
.preview-dot {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 2px solid var(--border-subtle);
  flex-shrink: 0;
}

.hex-tag {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

/* ====== Panel Actions ====== */
.fav-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 24px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--accent);
  background: var(--accent-light);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.fav-btn:hover { border-color: var(--accent); }

/* ====== Config Sections ====== */
.tool-panel-body {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto !important;
  min-height: 0;
}

.tool-main > .tool-panel {
  min-height: 0;
}

.right-panel .tool-panel-body {
  flex: 1;
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-row 
/* ====== Color Preview ====== */
.color-preview-box {
  position: relative;
  width: 100%;
  height: 64px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

.preview-checker {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(45deg, var(--border-strong) 25%, transparent 25%),
    linear-gradient(-45deg, var(--border-strong) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--border-strong) 75%),
    linear-gradient(-45deg, transparent 75%, var(--border-strong) 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}

.preview-overlay {
  position: absolute;
  inset: 0;
}

/* ====== Alpha Slider ====== */
.alpha-val {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

.alpha-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 2px;
  outline: none;
  margin-top: 6px;
}

.alpha-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: 2px solid var(--text-inverse, #fff);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* ====== Inputs ====== */
.hex-row {
  display: flex;
  gap: 6px;
}

.tool-input {
  flex: 1;
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  outline: none;
  transition: all var(--transition-fast);
  min-width: 0;
}

.tool-input:focus { border-color: var(--accent); box-shadow: var(--shadow-focus); }
.tool-input.mono { font-family: var(--font-mono); }
.tool-input.small { flex: 1; min-width: 0; }

.native-picker {
  width: 28px;
  height: 28px;
  padding: 2px;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  cursor: pointer;
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.rgb-inputs {
  display: flex;
  gap: 4px;
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
  flex-shrink: 0;
}

/* ====== Format List ====== */
.format-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
  margin: 14px;
  flex-shrink: 0;
}

.format-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
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
  border-radius: 4px;
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
  flex-shrink: 0;
  opacity: 0;
  transition: all 0.15s;
}

.format-row:hover .format-copy-btn { opacity: 1; }
.format-copy-btn:hover { background: var(--bg-hover); color: var(--accent); }

/* ====== Preset Section ====== */
.preset-section {
  padding: 0 14px 14px;
  flex-shrink: 0;
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
  border-radius: 4px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.12s;
}

.color-swatch:hover { transform: scale(1.15); border-color: var(--text-muted); }
.color-swatch.active { border-color: var(--text-primary); box-shadow: 0 0 0 2px var(--accent-light); }
.color-swatch.small { width: 20px; height: 20px; }

/* ====== Scrollbar ====== */
.tool-panel-body::-webkit-scrollbar { width: 5px; }
.tool-panel-body::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.tool-panel-body::-webkit-scrollbar-track { background: transparent; }

/* ====== Responsive ====== */
@media (max-width: 760px) {
  .tool-main { grid-template-columns: 1fr !important; }
  .color-grid { grid-template-columns: repeat(8, 1fr); }
}
</style>
