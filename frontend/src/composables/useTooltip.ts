import { ref } from 'vue'

export function useTooltip() {
  const tooltip = ref({ show: false, text: '', x: 0, y: 0 })
  let timer: ReturnType<typeof setTimeout> | null = null

  const show = (text: string, e: MouseEvent) => {
    if (timer) clearTimeout(timer)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    let x = rect.left + rect.width / 2
    const y = rect.bottom + 4
    const w = text.length * 12 + 24
    if (x + w / 2 > window.innerWidth - 8) x = window.innerWidth - w / 2 - 8
    if (x - w / 2 < 8) x = w / 2 + 8
    tooltip.value = { show: true, text, x, y }
  }

  const hide = () => {
    timer = setTimeout(() => { tooltip.value.show = false }, 100)
  }

  return { tooltip, showTooltip: show, hideTooltip: hide }
}
