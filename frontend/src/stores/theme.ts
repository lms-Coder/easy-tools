import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

export const useThemeStore = defineStore('theme', () => {
  const {
    currentTheme,
    currentPrimaryColor,
    currentFontFamily,
    isDark: isDarkRef,
    applyTheme,
    applyPrimaryColor,
    applyFontFamily,
    setTheme,
    toggleTheme,
    initTheme,
    setThemeFromConfig,
    setPrimaryColorFromConfig,
    setFontFamilyFromConfig,
  } = useTheme()

  const isDark = computed(() => isDarkRef.value)

  function toggle(event?: MouseEvent): void {
    toggleTheme(event)
  }

  function set(theme: 'light' | 'dark'): void {
    setTheme(theme, false)
  }

  function setWithAnimation(theme: 'light' | 'dark', event?: MouseEvent): void {
    if (event) {
      setTheme(theme, true, event.clientX, event.clientY)
    } else {
      setTheme(theme, true)
    }
  }

  function initialize(): void {
    initTheme()
  }

  // 从 config store 传入已加载的配置
  function syncFromConfig(theme: 'light' | 'dark', primaryColor: string, fontFamily: string): void {
    setThemeFromConfig(theme)
    setPrimaryColorFromConfig(primaryColor)
    setFontFamilyFromConfig(fontFamily)
  }

  return {
    currentTheme,
    currentPrimaryColor,
    currentFontFamily,
    isDark,
    toggle,
    set,
    setWithAnimation,
    initialize,
    applyPrimaryColor,
    applyFontFamily,
    syncFromConfig,
  }
})
