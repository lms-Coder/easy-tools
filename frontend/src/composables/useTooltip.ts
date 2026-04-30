import { ref } from 'vue'

export interface TooltipState {
  show: boolean
  text: string
  x: number
  y: number
  placement: 'top' | 'bottom'
}

export function useTooltip() {
  const tooltip = ref<TooltipState>({ show: false, text: '', x: 0, y: 0, placement: 'bottom' })
  let timer: ReturnType<typeof setTimeout> | null = null

  const show = (text: string, e: MouseEvent, placement: 'top' | 'bottom' = 'bottom') => {
    if (timer) clearTimeout(timer)
    const el = e.currentTarget as HTMLElement
    if ((el as HTMLButtonElement).disabled || el.classList.contains('disabled')) return

    const rect = el.getBoundingClientRect()
    const estimatedHeight = 28
    const gap = 4
    const margin = 8

    let x = rect.left + rect.width / 2
    let y: number
    let actualPlacement = placement

    // 自动翻转：空间不足则换方向
    if (placement === 'bottom') {
      if (window.innerHeight - rect.bottom < estimatedHeight + gap + margin) {
        actualPlacement = 'top'
      }
    } else {
      if (rect.top < estimatedHeight + gap + margin) {
        actualPlacement = 'bottom'
      }
    }

    if (actualPlacement === 'bottom') {
      y = rect.bottom + gap
    } else {
      y = rect.top - gap
    }

    // 水平边界 clamp
    const w = text.length * 7 + 20
    if (x + w / 2 > window.innerWidth - margin) x = window.innerWidth - w / 2 - margin
    if (x - w / 2 < margin) x = w / 2 + margin

    tooltip.value = { show: true, text, x, y, placement: actualPlacement }

    const observer = new MutationObserver(() => {
      if ((el as HTMLButtonElement).disabled) {
        hide()
        observer.disconnect()
      }
    })
    observer.observe(el, { attributes: true, attributeFilter: ['disabled'] })
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
