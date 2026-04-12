import { ref, computed, watch } from 'vue'
import { toast } from '@/composables/useToast'

export interface HSL { h: number; s: number; l: number }
export interface RGB { r: number; g: number; b: number }
export interface ColorFormat {
  label: string
  value: string
}

export const presetColors: string[] = [
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
  '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
  '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
  '#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD',
  '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0',
  '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79',
  '#85200C', '#990000', '#B45F06', '#BF9000', '#38761D', '#134F5C', '#1155CC', '#0B5394', '#351C75', '#741B47',
]

export function useColorPicker() {
  const hex = ref('#4A86E8')
  const alpha = ref(100)
  const copiedField = ref<string | null>(null)
  const recentColors = ref<string[]>([])

  // Parse hex to RGB
  const rgb = computed<RGB>(() => {
    const h = hex.value.replace('#', '')
    return {
      r: parseInt(h.substring(0, 2), 16) || 0,
      g: parseInt(h.substring(2, 4), 16) || 0,
      b: parseInt(h.substring(4, 6), 16) || 0,
    }
  })

  // RGB to HSL
  const hsl = computed<HSL>(() => {
    const r = rgb.value.r / 255
    const g = rgb.value.g / 255
    const b = rgb.value.b / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) / 2
    let h = 0, s = 0
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
  })

  const formats = computed<ColorFormat[]>(() => {
    const r = rgb.value.r, g = rgb.value.g, b = rgb.value.b
    const { h, s, l } = hsl.value
    return [
      { label: 'HEX', value: hex.value.toUpperCase() },
      { label: 'HEX8', value: hex.value.toUpperCase() + Math.round(alpha.value * 2.55).toString(16).toUpperCase().padStart(2, '0') },
      { label: 'RGB', value: `rgb(${r}, ${g}, ${b})` },
      { label: 'RGBA', value: `rgba(${r}, ${g}, ${b}, ${(alpha.value / 100).toFixed(2)})` },
      { label: 'HSL', value: `hsl(${h}, ${s}%, ${l}%)` },
      { label: 'HSLA', value: `hsla(${h}, ${s}%, ${l}%, ${(alpha.value / 100).toFixed(2)})` },
    ]
  })

  // Update from hex input
  const setHex = (value: string) => {
    const cleaned = value.replace('#', '').trim()
    if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
      hex.value = '#' + cleaned.toUpperCase()
    }
  }

  // Update from RGB inputs
  const setRGB = (r: number, g: number, b: number) => {
    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
    hex.value = '#' + [clamp(r), clamp(g), clamp(b)].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase()
  }

  // Update from HSL inputs
  const setHSL = (h: number, s: number, l: number) => {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const s2 = Math.max(0, Math.min(100, s)) / 100
    const l2 = Math.max(0, Math.min(100, l)) / 100
    const h2 = ((Math.max(0, Math.min(360, h)) % 360) + 360) % 360 / 360
    let r, g, b
    if (s2 === 0) {
      r = g = b = l2
    } else {
      const q = l2 < 0.5 ? l2 * (1 + s2) : l2 + s2 - l2 * s2
      const p = 2 * l2 - q
      r = hue2rgb(p, q, h2 + 1 / 3)
      g = hue2rgb(p, q, h2)
      b = hue2rgb(p, q, h2 - 1 / 3)
    }
    hex.value = '#' + [r, g, b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
  }

  const applyPreset = (color: string) => {
    hex.value = color
  }

  const copyValue = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      copiedField.value = label
      toast.success('已复制')
      setTimeout(() => { if (copiedField.value === label) copiedField.value = null }, 1500)
    } catch { toast.error('复制失败') }
  }

  const addRecent = () => {
    const color = hex.value.toUpperCase()
    recentColors.value = [color, ...recentColors.value.filter(c => c !== color)].slice(0, 20)
  }

  return {
    hex, alpha, rgb, hsl, formats, copiedField, recentColors,
    setHex, setRGB, setHSL, applyPreset, copyValue, addRecent,
  }
}
