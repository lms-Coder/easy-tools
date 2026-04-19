<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { Copy, Check, Pipette } from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import { useColorPicker, presetColors } from './useColorPicker'

const {
  hex, alpha, rgb, hsl, formats, copiedField, recentColors,
  setHex, setRGB, setHSL, applyPreset, copyValue, addRecent,
} = useColorPicker()

// Local editable inputs
const hexInput = ref(hex.value)
const rInput = ref(rgb.value.r)
const gInput = ref(rgb.value.g)
const bInput = ref(rgb.value.b)
const hInput = ref(hsl.value.h)
const sInput = ref(hsl.value.s)
const lInput = ref(hsl.value.l)

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

// SV (Saturation-Value) picker canvas
const svCanvas = ref<HTMLCanvasElement | null>(null)
const svDragging = ref(false)
const svCursor = computed(() => {
  const h = hsl.value.h
  const maxChroma = (s, l) => {
    const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100
    return c
  }
  // Convert HSL to approximate SV position
  const hsv = hslToHsv(hsl.value.h, hsl.value.s, hsl.value.l)
  return { x: hsv.s, y: 100 - hsv.v }
})

function hslToHsv(h: number, s: number, l: number) {
  s /= 100; l /= 100
  const v = l + s * Math.min(l, 1 - l)
  const sv = v === 0 ? 0 : 2 * (1 - l / v)
  return { h, s: Math.round(sv * 100), v: Math.round(v * 100) }
}

function hsvToHsl(h: number, s: number, v: number) {
  s /= 100; v /= 100
  const l = v * (1 - s / 2)
  const sl = (l === 0 || l === 1) ? 0 : (v - l) / Math.min(l, 1 - l)
  return { h, s: Math.round(sl * 100), l: Math.round(l * 100) }
}

function drawSV() {
  const canvas = svCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height

  // Hue background
  const hue = hsl.value.h
  const hueColor = `hsl(${hue}, 100%, 50%)`
  ctx.fillStyle = hueColor
  ctx.fillRect(0, 0, w, h)

  // White gradient (left to right)
  const whiteGrad = ctx.createLinearGradient(0, 0, w, 0)
  whiteGrad.addColorStop(0, 'rgba(255,255,255,1)')
  whiteGrad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = whiteGrad
  ctx.fillRect(0, 0, w, h)

  // Black gradient (top to bottom)
  const blackGrad = ctx.createLinearGradient(0, 0, 0, h)
  blackGrad.addColorStop(0, 'rgba(0,0,0,0)')
  blackGrad.addColorStop(1, 'rgba(0,0,0,1)')
  ctx.fillStyle = blackGrad
  ctx.fillRect(0, 0, w, h)
}

function pickSV(e: MouseEvent | TouchEvent) {
  const canvas = svCanvas.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))

  const s = Math.round(x * 100)
  const v = Math.round((1 - y) * 100)
  const hslVal = hsvToHsl(hsl.value.h, s, v)
  setHSL(hslVal.h, hslVal.s, hslVal.l)
}

function onSvDown(e: MouseEvent | TouchEvent) {
  svDragging.value = true
  pickSV(e)
}

function onSvMove(e: MouseEvent | TouchEvent) {
  if (!svDragging.value) return
  e.preventDefault()
  pickSV(e)
}

function onSvUp() {
  svDragging.value = false
}

// Hue bar
const hueDragging = ref(false)
const hueCursor = computed(() => hsl.value.h / 360 * 100)

function pickHue(e: MouseEvent | TouchEvent) {
  const bar = (e.currentTarget as HTMLElement)
  const rect = bar.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  const h = Math.round(x * 360)
  setHSL(h, hsl.value.s, hsl.value.l)
}

function onHueDown(e: MouseEvent | TouchEvent) {
  hueDragging.value = true
  pickHue(e)
}

function onHueMove(e: MouseEvent | TouchEvent) {
  if (!hueDragging.value) return
  e.preventDefault()
  pickHue(e)
}

function onHueUp() {
  hueDragging.value = false
}

watch(hsl, () => {
  requestAnimationFrame(drawSV)
}, { deep: true })

onMounted(() => {
  drawSV()
})

// EyeDropper API
const hasEyeDropper = 'EyeDropper' in window
const picking = ref(false)
async function pickFromScreen() {
  if (!('EyeDropper' in window)) return
  try {
    picking.value = true
    // @ts-ignore
    const eyeDropper = new window.EyeDropper()
    const result = await eyeDropper.open()
    setHex(result.sRGBHex)
    addRecent()
  } catch { /* cancelled */ }
  finally { picking.value = false }
}
</script>

<template>
  <div class="tool-page">
    <ToolTitleBar title="颜色选择器" icon="icon-palette">
      <div class="header-content">
        <div class="preview-dot" :style="{ background: hex }"></div>
        <span class="hex-tag">{{ hex }}</span>
      </div>
    </ToolTitleBar>

    <main class="tool-main color-layout">
      <!-- 左侧：调色板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Pipette :size="14" /></span>
            <span>调色板</span>
          </div>
          <div class="panel-actions">
            <button v-if="hasEyeDropper" class="pick-btn" :class="{ picking }" @click="pickFromScreen">
              <Pipette :size="12" />
              <span>{{ picking ? '取色中...' : '屏幕取色' }}</span>
            </button>
            <button class="fav-btn" @click="addRecent">+ 收藏</button>
          </div>
        </div>

        <div class="tool-panel-body">
          <!-- SV 面板 -->
          <div class="config-section">
            <div class="sv-wrapper"
              @mousedown="onSvDown" @mousemove="onSvMove" @mouseup="onSvUp" @mouseleave="onSvUp"
              @touchstart.prevent="onSvDown" @touchmove.prevent="onSvMove" @touchend="onSvUp">
              <canvas ref="svCanvas" class="sv-canvas" width="360" height="200"></canvas>
              <div class="sv-cursor" :style="{ left: svCursor.x + '%', top: svCursor.y + '%' }"></div>
            </div>
          </div>

          <!-- 色相条 -->
          <div class="config-section">
            <div class="hue-bar"
              @mousedown="onHueDown" @mousemove="onHueMove" @mouseup="onHueUp" @mouseleave="onHueUp"
              @touchstart.prevent="onHueDown" @touchmove.prevent="onHueMove" @touchend="onHueUp">
              <div class="hue-cursor" :style="{ left: hueCursor + '%' }"></div>
            </div>
          </div>

          <!-- 透明度 -->
          <div class="config-section">
            <div class="config-row">
              <label class="config-label">透明度</label>
              <span class="alpha-val">{{ alpha }}%</span>
            </div>
            <div class="alpha-track-wrap">
              <div class="alpha-checker-bg"></div>
              <div class="alpha-gradient" :style="{ background: `linear-gradient(to right, transparent, ${hex})` }"></div>
              <input type="range" v-model.number="alpha" min="0" max="100" class="alpha-slider" />
            </div>
          </div>

          <!-- HEX 输入 -->
          <div class="config-section">
            <label class="config-label">HEX</label>
            <div class="hex-row">
              <input type="text" v-model="hexInput" class="tool-input mono" @change="onHexInput" spellcheck="false" />
              <input type="color" v-model="hex" class="native-picker" />
            </div>
          </div>

          <!-- RGB 输入 -->
          <div class="config-section">
            <label class="config-label">RGB</label>
            <div class="channel-inputs">
              <div class="channel-field">
                <span class="channel-label" style="color: #ef4444">R</span>
                <input type="number" v-model.number="rInput" min="0" max="255" class="tool-input" @change="onRgbInput" />
              </div>
              <div class="channel-field">
                <span class="channel-label" style="color: #22c55e">G</span>
                <input type="number" v-model.number="gInput" min="0" max="255" class="tool-input" @change="onRgbInput" />
              </div>
              <div class="channel-field">
                <span class="channel-label" style="color: #3b82f6">B</span>
                <input type="number" v-model.number="bInput" min="0" max="255" class="tool-input" @change="onRgbInput" />
              </div>
            </div>
          </div>

          <!-- HSL 输入 -->
          <div class="config-section">
            <label class="config-label">HSL</label>
            <div class="channel-inputs">
              <div class="channel-field">
                <span class="channel-label" style="color: var(--accent)">H</span>
                <input type="number" v-model.number="hInput" min="0" max="360" class="tool-input" @change="onHslInput" />
              </div>
              <div class="channel-field">
                <span class="channel-label" style="color: var(--accent)">S</span>
                <input type="number" v-model.number="sInput" min="0" max="100" class="tool-input" @change="onHslInput" />
              </div>
              <div class="channel-field">
                <span class="channel-label" style="color: var(--accent)">L</span>
                <input type="number" v-model.number="lInput" min="0" max="100" class="tool-input" @change="onHslInput" />
              </div>
            </div>
          </div>

          <!-- 最近使用 -->
          <div v-if="recentColors.length" class="config-section">
            <label class="config-label">最近使用</label>
            <div class="color-grid small-grid">
              <button v-for="c in recentColors" :key="c"
                class="color-swatch recent-swatch" :class="{ active: hex.toUpperCase() === c }"
                :style="{ background: c }" :title="c"
                @click="applyPreset(c)" />
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧：格式输出 + 预设色 -->
      <section class="tool-panel right-panel">
        <!-- 预览 -->
        <div class="preview-section">
          <div class="preview-card">
            <div class="preview-big" :style="{ background: hex }">
              <div class="preview-checker-bg"></div>
              <div class="preview-fill" :style="{ background: hex, opacity: alpha / 100 }"></div>
            </div>
            <div class="preview-info">
              <span class="preview-hex">{{ hex.toUpperCase() }}</span>
              <span class="preview-alpha" v-if="alpha < 100">{{ alpha }}%</span>
            </div>
          </div>
        </div>

        <div class="tool-panel-body" style="padding-top:0">
          <!-- 格式列表 -->
          <div class="format-list">
            <div v-for="fmt in formats" :key="fmt.label" class="format-row" @click="copyValue(fmt.label, fmt.value)">
              <span class="format-label">{{ fmt.label }}</span>
              <code class="format-value">{{ fmt.value }}</code>
              <button class="format-copy-btn">
                <Check v-if="copiedField === fmt.label" :size="12" style="color: var(--success)" />
                <Copy v-else :size="12" />
              </button>
            </div>
          </div>

          <!-- 预设色板 -->
          <div class="preset-section">
            <div class="preset-header">预设色板</div>
            <div class="color-grid">
              <button v-for="c in presetColors" :key="c"
                class="color-swatch" :class="{ active: hex.toUpperCase() === c }"
                :style="{ background: c }" :title="c"
                @click="applyPreset(c)" />
            </div>
          </div>
        </div>
      </section>
    </main>
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.hex-tag {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

/* ====== Layout ====== */
.color-layout {
  display: grid;
  grid-template-columns: minmax(320px, 400px) minmax(0, 1fr);
}

/* ====== Panel Actions ====== */
.pick-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.pick-btn:hover { border-color: var(--accent); color: var(--accent); }
.pick-btn.picking { color: var(--accent); border-color: var(--accent); background: var(--accent-light); }

.fav-btn {
  display: inline-flex;
  align-items: center;
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

/* ====== SV Picker ====== */
.sv-wrapper {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  cursor: crosshair;
  border: 1px solid var(--border-subtle);
  aspect-ratio: 16 / 9;
  user-select: none;
  -webkit-user-select: none;
}

.sv-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.sv-cursor {
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.3);
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 2;
}

/* ====== Hue Bar ====== */
.hue-bar {
  position: relative;
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(to right,
    hsl(0, 100%, 50%), hsl(30, 100%, 50%), hsl(60, 100%, 50%),
    hsl(90, 100%, 50%), hsl(120, 100%, 50%), hsl(150, 100%, 50%),
    hsl(180, 100%, 50%), hsl(210, 100%, 50%), hsl(240, 100%, 50%),
    hsl(270, 100%, 50%), hsl(300, 100%, 50%), hsl(330, 100%, 50%),
    hsl(360, 100%, 50%));
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  border: 1px solid var(--border-subtle);
}

.hue-cursor {
  position: absolute;
  top: 50%;
  width: 6px;
  height: 18px;
  border-radius: 3px;
  background: #fff;
  border: 2px solid rgba(0, 0, 0, 0.2);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* ====== Alpha Slider ====== */
.alpha-val {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

.alpha-track-wrap {
  position: relative;
  height: 14px;
  border-radius: 7px;
  overflow: hidden;
  margin-top: 6px;
  border: 1px solid var(--border-subtle);
}

.alpha-checker-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(45deg, var(--border-strong) 25%, transparent 25%),
    linear-gradient(-45deg, var(--border-strong) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--border-strong) 75%),
    linear-gradient(-45deg, transparent 75%, var(--border-strong) 75%);
  background-size: 10px 10px;
  background-position: 0 0, 0 5px, 5px -5px, -5px 0;
}

.alpha-gradient {
  position: absolute;
  inset: 0;
}

.alpha-slider {
  position: relative;
  width: 100%;
  height: 100%;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  outline: none;
  cursor: pointer;
  margin: 0;
}

.alpha-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 6px;
  height: 18px;
  border-radius: 3px;
  background: #fff;
  border: 2px solid rgba(0, 0, 0, 0.2);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  cursor: pointer;
}

/* ====== Inputs ====== */
.hex-row {
  display: flex;
  gap: 6px;
}

.tool-input {
  flex: 1;
  height: 30px;
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

.tool-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-light); }
.tool-input.mono { font-family: var(--font-mono); }

.native-picker {
  width: 30px;
  height: 30px;
  padding: 2px;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  cursor: pointer;
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.channel-inputs {
  display: flex;
  gap: 6px;
}

.channel-field {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.channel-label {
  font-size: 11px;
  font-weight: 700;
  font-family: var(--font-mono);
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}

/* ====== Preview Section ====== */
.preview-section {
  padding: 14px;
}

.preview-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.preview-big {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.preview-checker-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(45deg, var(--border-strong) 25%, transparent 25%),
    linear-gradient(-45deg, var(--border-strong) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--border-strong) 75%),
    linear-gradient(-45deg, transparent 75%, var(--border-strong) 75%);
  background-size: 12px 12px;
  background-position: 0 0, 0 6px, 6px -6px, -6px 0;
}

.preview-fill {
  position: absolute;
  inset: 0;
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.preview-hex {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.5px;
}

.preview-alpha {
  font-size: 12px;
  color: var(--text-muted);
}

/* ====== Format List ====== */
.format-list {
  display: flex;
  flex-direction: column;
  margin: 0 14px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}

.format-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.1s;
}

.format-row:hover { background: var(--bg-hover); }
.format-row + .format-row { border-top: 1px solid var(--border-subtle); }

.format-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-light);
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
  font-family: var(--font-mono);
  letter-spacing: 0.3px;
}

.format-value {
  flex: 1;
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
  border-radius: 5px;
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
  padding: 14px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.preset-header {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 10px;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
}

.color-grid.small-grid {
  gap: 5px;
}

.color-swatch {
  aspect-ratio: 1;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.color-swatch:hover {
  transform: scale(1.2);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1;
}

.color-swatch.active {
  border-color: var(--text-primary);
  box-shadow: 0 0 0 2px var(--accent-light), 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: scale(1.15);
}

.recent-swatch {
  border-radius: 50%;
  width: 22px;
  height: 22px;
  aspect-ratio: unset;
}

/* ====== Right Panel ====== */
.right-panel .tool-panel-body {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  min-height: 0;
}

.tool-panel-body {
  overflow-y: auto;
  min-height: 0;
}

/* ====== Scrollbar ====== */
.tool-panel-body::-webkit-scrollbar { width: 5px; }
.tool-panel-body::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.tool-panel-body::-webkit-scrollbar-track { background: transparent; }

/* ====== Responsive ====== */
@media (max-width: 760px) {
  .color-layout { grid-template-columns: 1fr !important; }
  .color-grid { grid-template-columns: repeat(8, 1fr); }
}
</style>
