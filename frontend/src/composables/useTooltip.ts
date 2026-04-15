import { ref } from 'vue'

export function useTooltip() {
  const tooltip = ref({ show: false, text: '', x: 0, y: 0 })
  let timer: ReturnType<typeof setTimeout> | null = null

  const show = (text: string, e: MouseEvent) => {
    if (timer) clearTimeout(timer)
    const el = e.currentTarget as HTMLElement
    // 如果元素已禁用则不显示
    if ((el as HTMLButtonElement).disabled || el.classList.contains('disabled')) return
    const rect = el.getBoundingClientRect()
    let x = rect.left + rect.width / 2
    const y = rect.bottom + 4
    const w = text.length * 12 + 24
    if (x + w / 2 > window.innerWidth - 8) x = window.innerWidth - w / 2 - 8
    if (x - w / 2 < 8) x = w / 2 + 8
    tooltip.value = { show: true, text, x, y }

    // 监听元素的 disabled 属性变化，禁用时立即隐藏
    const observer = new MutationObserver(() => {
      if ((el as HTMLButtonElement).disabled) {
        hide()
        observer.disconnect()
      }
    })
    observer.observe(el, { attributes: true, attributeFilter: ['disabled'] })
    // 元素移除时也清理
    if (el.parentElement) {
      const parentObserver = new MutationObserver(() => {
        if (!document.contains(el)) {
          tooltip.value.show = false
          parentObserver.disconnect()
          observer.disconnect()
        }
      })
      parentObserver.observe(el.parentElement, { childList: true, subtree: true })
    }
  }

  const hide = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { tooltip.value.show = false }, 100)
  }

  return { tooltip, showTooltip: show, hideTooltip: hide }
}
