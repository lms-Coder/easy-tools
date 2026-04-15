// 水印工具类型定义和常量

export type WatermarkMode = 'text' | 'image' | 'tile'
export type WatermarkPosition = 'center' | 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
export type ExportFormat = 'png' | 'jpeg'

export interface TextConfig {
  content: string
  fontFamily: string
  fontSize: number
  color: string
  opacity: number
  rotation: number
  bold: boolean
  italic: boolean
}

export interface ImageConfig {
  src: string
  scale: number
  opacity: number
  rotation: number
}

export interface TileConfig {
  type: 'text' | 'image'
  text: TextConfig
  image: Pick<ImageConfig, 'src' | 'scale'>
  rowGap: number
  colGap: number
  rotation: number
  opacity: number
}

export interface PositionConfig {
  preset: WatermarkPosition
  offsetX: number
  offsetY: number
}

export const FONT_FAMILIES = [
  { label: '微软雅黑', value: 'Microsoft YaHei' },
  { label: '宋体', value: 'SimSun' },
  { label: '黑体', value: 'SimHei' },
  { label: '楷体', value: 'KaiTi' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Georgia', value: 'Georgia' },
]

export const POSITION_OPTIONS: { label: string; value: WatermarkPosition }[] = [
  { label: '左上', value: 'top-left' },
  { label: '上中', value: 'top-center' },
  { label: '右上', value: 'top-right' },
  { label: '左中', value: 'center-left' },
  { label: '居中', value: 'center' },
  { label: '右中', value: 'center-right' },
  { label: '左下', value: 'bottom-left' },
  { label: '下中', value: 'bottom-center' },
  { label: '右下', value: 'bottom-right' },
]

export const EXPORT_FORMATS: { label: string; value: ExportFormat }[] = [
  { label: 'PNG', value: 'png' },
  { label: 'JPG', value: 'jpeg' },
]

export const ACCEPTED_IMAGE_TYPES = '.png,.jpg,.jpeg,.bmp,.webp'

export function getDefaultTextConfig(): TextConfig {
  return {
    content: '水印文字',
    fontFamily: 'Microsoft YaHei',
    fontSize: 32,
    color: '#000000',
    opacity: 30,
    rotation: 0,
    bold: false,
    italic: false,
  }
}

export function getDefaultImageConfig(): ImageConfig {
  return {
    src: '',
    scale: 50,
    opacity: 30,
    rotation: 0,
  }
}

export function getDefaultTileConfig(): TileConfig {
  return {
    type: 'text',
    text: {
      content: '内部文件 禁止外传',
      fontFamily: 'Microsoft YaHei',
      fontSize: 20,
      color: '#000000',
      opacity: 15,
      rotation: -30,
      bold: false,
      italic: false,
    },
    image: { src: '', scale: 30 },
    rowGap: 80,
    colGap: 120,
    rotation: -30,
    opacity: 15,
  }
}
