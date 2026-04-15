import { ref, reactive, computed, watch, nextTick } from 'vue'
import { toast } from '@/composables/useToast'
import * as FileService from '../../../../../bindings/easy-tools/internal/services/fileservice.js'
import {
  type WatermarkMode,
  type ExportFormat,
  type TextConfig,
  type ImageConfig,
  type TileConfig,
  type PositionConfig,
  type WatermarkPosition,
  getDefaultTextConfig,
  getDefaultImageConfig,
  getDefaultTileConfig,
} from './watermarkTypes'

export function useWatermark() {
  // 状态
  const mode = ref<WatermarkMode>('text')
  const sourceImage = ref<HTMLImageElement | null>(null)
  const sourceFileName = ref('')
  const previewDataUrl = ref('')
  const exportFormat = ref<ExportFormat>('png')
  const jpegQuality = ref(92)

  // 各模式配置
  const textConfig = reactive<TextConfig>(getDefaultTextConfig())
  const imageConfig = reactive<ImageConfig>(getDefaultImageConfig())
  const tileConfig = reactive<TileConfig>(getDefaultTileConfig())
  const position = reactive<PositionConfig>({
    preset: 'center',
    offsetX: 0,
    offsetY: 0,
  })

  // 水印图片（image 模式用）
  const watermarkImage = ref<HTMLImageElement | null>(null)
  const watermarkFileName = ref('')

  // Canvas 引用
  let previewCanvas: HTMLCanvasElement | null = null

  const hasSourceImage = computed(() => !!sourceImage.value)
  const imageInfo = computed(() => {
    if (!sourceImage.value) return null
    const img = sourceImage.value
    return { width: img.naturalWidth, height: img.naturalHeight, name: sourceFileName.value }
  })

  // 上传原图
  const uploadSourceImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }
    sourceFileName.value = file.name
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        sourceImage.value = img
        // renderPreview 由 watch 中的 nextTick 触发，不需要这里调用
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // 上传水印图片
  const uploadWatermarkImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }
    watermarkFileName.value = file.name
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        watermarkImage.value = img
        imageConfig.src = e.target?.result as string
        tileConfig.image.src = e.target?.result as string
        renderPreview()
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // 设置 Canvas 引用
  const setPreviewCanvas = (canvas: HTMLCanvasElement | null) => {
    previewCanvas = canvas
  }

  // 计算水印位置（像素坐标）
  const calcPosition = (
    canvasW: number,
    canvasH: number,
    wmW: number,
    wmH: number,
    preset: WatermarkPosition,
  ): { x: number; y: number } => {
    const margin = Math.min(canvasW, canvasH) * 0.05
    let x = 0, y = 0

    // 水平方向
    if (preset.includes('left')) x = margin
    else if (preset.includes('right')) x = canvasW - wmW - margin
    else x = (canvasW - wmW) / 2

    // 垂直方向
    if (preset.startsWith('top')) y = margin
    else if (preset.startsWith('bottom')) y = canvasH - wmH - margin
    else y = (canvasH - wmH) / 2

    return { x, y }
  }

  // 绘制单个文字水印
  const drawTextWatermark = (
    ctx: CanvasRenderingContext2D,
    config: TextConfig,
    x: number,
    y: number,
    scaleFactor: number = 1,
  ) => {
    const fontSize = config.fontSize * scaleFactor
    const style = `${config.italic ? 'italic ' : ''}${config.bold ? 'bold ' : ''}${fontSize}px ${config.fontFamily}`
    ctx.save()
    ctx.globalAlpha = config.opacity / 100
    ctx.font = style
    ctx.fillStyle = config.color
    ctx.textBaseline = 'top'
    ctx.translate(x, y)
    ctx.rotate((config.rotation * Math.PI) / 180)
    ctx.fillText(config.content, 0, 0)
    ctx.restore()
  }

  // 绘制单个图片水印
  const drawImageWatermark = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    config: { scale: number; opacity: number; rotation: number },
    x: number,
    y: number,
    scaleFactor: number = 1,
  ) => {
    const w = img.naturalWidth * (config.scale / 100) * scaleFactor
    const h = img.naturalHeight * (config.scale / 100) * scaleFactor
    ctx.save()
    ctx.globalAlpha = config.opacity / 100
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate((config.rotation * Math.PI) / 180)
    ctx.drawImage(img, -w / 2, -h / 2, w, h)
    ctx.restore()
  }

  // 渲染预览
  const renderPreview = () => {
    if (!previewCanvas || !sourceImage.value) {
      previewDataUrl.value = ''
      return
    }

    const img = sourceImage.value
    const canvas = previewCanvas
    const container = canvas.parentElement
    if (!container) return

    // 预览时缩放到容器大小
    const maxW = container.clientWidth
    const maxH = container.clientHeight
    if (maxW === 0 || maxH === 0) return // 容器尺寸未就绪

    // 使用高分辨率渲染，确保文字清晰
    const dpr = window.devicePixelRatio || 1
    const displayScale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
    const displayW = Math.round(img.naturalWidth * displayScale)
    const displayH = Math.round(img.naturalHeight * displayScale)
    canvas.width = displayW * dpr
    canvas.height = displayH * dpr
    canvas.style.width = displayW + 'px'
    canvas.style.height = displayH + 'px'

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)

    // 绘制原图
    ctx.drawImage(img, 0, 0, displayW, displayH)

    // 根据模式绘制水印
    const sf = displayScale // scaleFactor: 预览缩放比例

    if (mode.value === 'text') {
      if (!textConfig.content) return
      const fontSize = textConfig.fontSize * sf
      ctx.font = `${textConfig.italic ? 'italic ' : ''}${textConfig.bold ? 'bold ' : ''}${fontSize}px ${textConfig.fontFamily}`
      const metrics = ctx.measureText(textConfig.content)
      const wmW = metrics.width
      const wmH = fontSize
      const pos = calcPosition(displayW, displayH, wmW, wmH, position.preset)
      drawTextWatermark(ctx, textConfig, pos.x + position.offsetX * sf, pos.y + position.offsetY * sf, sf)
    } else if (mode.value === 'image') {
      if (!watermarkImage.value) return
      const wmW = watermarkImage.value.naturalWidth * (imageConfig.scale / 100) * sf
      const wmH = watermarkImage.value.naturalHeight * (imageConfig.scale / 100) * sf
      const pos = calcPosition(displayW, displayH, wmW, wmH, position.preset)
      drawImageWatermark(ctx, watermarkImage.value, imageConfig, pos.x + position.offsetX * sf, pos.y + position.offsetY * sf, sf)
    } else if (mode.value === 'tile') {
      drawTileWatermark(ctx, displayW, displayH, sf)
    }

    previewDataUrl.value = canvas.toDataURL()
  }

  // 满屏水印绘制
  const drawTileWatermark = (ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, sf: number) => {
    const { rowGap, colGap, rotation, opacity } = tileConfig

    ctx.save()
    ctx.globalAlpha = opacity / 100
    ctx.translate(canvasW / 2, canvasH / 2)
    ctx.rotate((rotation * Math.PI) / 180)

    // 扩大绘制范围以覆盖旋转后的区域
    const diagonal = Math.sqrt(canvasW * canvasW + canvasH * canvasH)
    const startX = -diagonal
    const startY = -diagonal
    const endX = diagonal
    const endY = diagonal

    if (tileConfig.type === 'text' && tileConfig.text.content) {
      const tc = tileConfig.text
      const fontSize = tc.fontSize * sf
      ctx.font = `${tc.italic ? 'italic ' : ''}${tc.bold ? 'bold ' : ''}${fontSize}px ${tc.fontFamily}`
      ctx.fillStyle = tc.color
      ctx.globalAlpha = (opacity / 100) * (tc.opacity / 100)
      ctx.textBaseline = 'top'

      const metrics = ctx.measureText(tc.content)
      const stepX = metrics.width + colGap * sf
      const stepY = fontSize + rowGap * sf

      for (let y = startY; y < endY; y += stepY) {
        for (let x = startX; x < endX; x += stepX) {
          ctx.fillText(tc.content, x, y)
        }
      }
    } else if (tileConfig.type === 'image' && watermarkImage.value) {
      const ic = tileConfig.image
      const w = watermarkImage.value.naturalWidth * (ic.scale / 100) * sf
      const h = watermarkImage.value.naturalHeight * (ic.scale / 100) * sf
      const stepX = w + colGap * sf
      const stepY = h + rowGap * sf

      for (let y = startY; y < endY; y += stepY) {
        for (let x = startX; x < endX; x += stepX) {
          ctx.drawImage(watermarkImage.value!, x, y, w, h)
        }
      }
    }

    ctx.restore()
  }

  // 导出图片（原始尺寸）
  const exportImage = async () => {
    if (!sourceImage.value) {
      toast.error('请先上传原图')
      return
    }

    const img = sourceImage.value
    const offscreen = document.createElement('canvas')
    offscreen.width = img.naturalWidth
    offscreen.height = img.naturalHeight
    const ctx = offscreen.getContext('2d')
    if (!ctx) return

    // 绘制原图
    ctx.drawImage(img, 0, 0)

    // 原始尺寸绘制水印（scaleFactor = 1）
    if (mode.value === 'text') {
      if (!textConfig.content) return
      ctx.font = `${textConfig.italic ? 'italic ' : ''}${textConfig.bold ? 'bold ' : ''}${textConfig.fontSize}px ${textConfig.fontFamily}`
      const metrics = ctx.measureText(textConfig.content)
      const wmW = metrics.width
      const wmH = textConfig.fontSize
      const pos = calcPosition(offscreen.width, offscreen.height, wmW, wmH, position.preset)
      drawTextWatermark(ctx, textConfig, pos.x + position.offsetX, pos.y + position.offsetY, 1)
    } else if (mode.value === 'image') {
      if (!watermarkImage.value) return
      const wmW = watermarkImage.value.naturalWidth * (imageConfig.scale / 100)
      const wmH = watermarkImage.value.naturalHeight * (imageConfig.scale / 100)
      const pos = calcPosition(offscreen.width, offscreen.height, wmW, wmH, position.preset)
      drawImageWatermark(ctx, watermarkImage.value, imageConfig, pos.x + position.offsetX, pos.y + position.offsetY, 1)
    } else if (mode.value === 'tile') {
      drawTileWatermark(ctx, offscreen.width, offscreen.height, 1)
    }

    // 生成 base64
    const mimeType = exportFormat.value === 'jpeg' ? 'image/jpeg' : 'image/png'
    const quality = exportFormat.value === 'jpeg' ? jpegQuality.value / 100 : undefined
    const base64Data = offscreen.toDataURL(mimeType, quality)

    // 调用原生保存对话框
    const ext = exportFormat.value === 'jpeg' ? 'jpg' : 'png'
    const baseName = sourceFileName.value.replace(/\.[^.]+$/, '') || 'image'
    const defaultName = `${baseName}-watermark.${ext}`
    const filterName = exportFormat.value === 'jpeg' ? 'JPEG 图片' : 'PNG 图片'
    const filterPattern = `*.${ext}`

    try {
      const savedPath = await FileService.SaveFileFromBase64(base64Data, defaultName, filterName, filterPattern)
      if (savedPath) {
        toast.success('导出成功')
      }
    } catch {
      toast.error('导出失败')
    }
  }

  // 清除
  const clear = () => {
    sourceImage.value = null
    sourceFileName.value = ''
    previewDataUrl.value = ''
    watermarkImage.value = null
    watermarkFileName.value = ''
    Object.assign(textConfig, getDefaultTextConfig())
    Object.assign(imageConfig, getDefaultImageConfig())
    Object.assign(tileConfig, getDefaultTileConfig())
    position.preset = 'center'
    position.offsetX = 0
    position.offsetY = 0
  }

  // 监听配置变化，自动刷新预览
  watch(
    [mode, sourceImage, watermarkImage, textConfig, imageConfig, tileConfig, position, exportFormat],
    () => { nextTick(renderPreview) },
    { deep: true },
  )

  return {
    mode, sourceImage, sourceFileName, previewDataUrl,
    exportFormat, jpegQuality,
    textConfig, imageConfig, tileConfig, position,
    watermarkImage, watermarkFileName,
    hasSourceImage, imageInfo,
    setPreviewCanvas, uploadSourceImage, uploadWatermarkImage,
    renderPreview, exportImage, clear,
  }
}
