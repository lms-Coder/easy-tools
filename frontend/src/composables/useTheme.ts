import { ref, computed } from 'vue'
import { Events } from '@wailsio/runtime'
import type { Theme } from '@/types/config'
import * as ConfigService from '../../bindings/easy-tools/internal/services/configservice.js'

const THEME_CHANGE_EVENT = 'app:ThemeChanged'
const PRIMARY_COLOR_CHANGE_EVENT = 'app:PrimaryColorChanged'

const currentTheme = ref<Theme>('light')
const currentPrimaryColor = ref('#007AFF')
let initialized = false
let themeUnsubscriber: (() => void) | null = null
let primaryColorUnsubscriber: (() => void) | null = null

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 122, b: 255 }
}

function lightenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex)
  const newR = Math.min(255, r + amount)
  const newG = Math.min(255, g + amount)
  const newB = Math.min(255, b + amount)
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
}

function darkenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex)
  const newR = Math.max(0, r - amount)
  const newG = Math.max(0, g - amount)
  const newB = Math.max(0, b - amount)
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
}

function applyThemeCSS(theme: Theme): void {
  currentTheme.value = theme
  const root = document.documentElement

  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

function applyThemeCSSAndSync(theme: Theme): void {
  applyThemeCSS(theme)
  try { ConfigService.SetTheme(theme) } catch (e) { console.error(e) }
  try { Events.Emit(THEME_CHANGE_EVENT, { theme }) } catch (e) { console.error(e) }
}

function applyPrimaryColorCSS(color: string): void {
  currentPrimaryColor.value = color
  const root = document.documentElement

  const { r, g, b } = hexToRgb(color)
  const hover = lightenColor(color, 20)
  const active = darkenColor(color, 20)
  const light = `rgba(${r}, ${g}, ${b}, 0.15)`

  root.style.setProperty('--accent', color)
  root.style.setProperty('--accent-hover', hover)
  root.style.setProperty('--accent-active', active)
  root.style.setProperty('--accent-light', light)
  root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`)
}

function applyPrimaryColorCSSAndSync(color: string): void {
  applyPrimaryColorCSS(color)
  try { ConfigService.SetPrimaryColor(color) } catch (e) { console.error(e) }
  try { Events.Emit(PRIMARY_COLOR_CHANGE_EVENT, color) } catch (e) { console.error(e) }
}

async function setTheme(theme: Theme, animate: boolean, x?: number, y?: number): Promise<void> {
  if (!animate) {
    applyThemeCSSAndSync(theme)
    return
  }

  if (x !== undefined && y !== undefined && 'startViewTransition' in document) {
    const root = document.documentElement
    root.style.setProperty('--x', `${x}px`)
    root.style.setProperty('--y', `${y}px`)

    ;(document as any).startViewTransition(async () => {
      await applyThemeCSSAndSync(theme)
    })
  } else {
    applyThemeCSSAndSync(theme)
  }
}

function toggleTheme(event?: MouseEvent): void {
  const newTheme: Theme = currentTheme.value === 'dark' ? 'light' : 'dark'
  if (event) {
    setTheme(newTheme, true, event.clientX, event.clientY)
  } else {
    setTheme(newTheme, true)
  }
}

function initTheme(): void {
  if (initialized) return
  initialized = true

  applyThemeCSS(currentTheme.value)
  applyPrimaryColorCSS(currentPrimaryColor.value)

  // 仅子窗口监听主题变更广播（主窗口通过 setTheme 直接切换，不需要监听）
  const isSubWindow = window.location.hash.includes('/tool/')
  if (isSubWindow) {
    try {
      if (!themeUnsubscriber) {
        themeUnsubscriber = Events.On(THEME_CHANGE_EVENT, (ev: any) => {
          const theme = (ev.data?.theme ?? ev.data) as Theme
          const root = document.documentElement

          // 应用主题
          currentTheme.value = theme
          if (theme === 'dark') {
            root.classList.add('dark')
          } else {
            root.classList.remove('dark')
          }

          // macOS 风格：短暂的亮度脉冲
          const flash = document.createElement('div')
          flash.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;transition:opacity 0.25s ease;'
          flash.style.backgroundColor = theme === 'dark'
            ? 'rgba(0,0,0,0.12)'
            : 'rgba(255,255,255,0.15)'
          document.body.appendChild(flash)

          requestAnimationFrame(() => {
            flash.style.opacity = '0'
            flash.addEventListener('transitionend', () => flash.remove())
            // 保底移除
            setTimeout(() => flash.remove(), 300)
          })
        })
      }
    } catch (e) { console.error(e) }
  }

  // 监听其他窗口的主题色变更广播
  try {
    if (!primaryColorUnsubscriber) {
      primaryColorUnsubscriber = Events.On(PRIMARY_COLOR_CHANGE_EVENT, (ev: any) => {
        applyPrimaryColorCSS(ev.data as string)
      })
    }
  } catch (e) { console.error(e) }
}

function setThemeFromConfig(theme: Theme): void {
  currentTheme.value = theme
}

function setPrimaryColorFromConfig(color: string): void {
  currentPrimaryColor.value = color
}

export function useTheme() {
  const isDark = computed(() => currentTheme.value === 'dark')

  return {
    currentTheme,
    currentPrimaryColor,
    isDark,
    applyTheme: applyThemeCSSAndSync,
    applyPrimaryColor: applyPrimaryColorCSSAndSync,
    setTheme,
    toggleTheme,
    initTheme,
    setThemeFromConfig,
    setPrimaryColorFromConfig,
    hexToRgb,
    lightenColor,
    darkenColor,
  }
}
