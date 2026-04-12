/**
 * 图标工具函数
 * 统一管理 Lucide 图标映射
 */
import {
  Code,
  ArrowLeftRight,
  Calendar,
  Clock,
  Link,
  Search,
  File as FileIcon,
  Settings,
  Tag,
  Star,
  QrCode,
  Lock,
  Eye,
  Wrench,
  Hash,
  Fingerprint,
} from 'lucide-vue-next'
import LetsIconsJson from '@/components/icons/LetsIconsJson.vue'
import LogosJsonSchema from '@/components/icons/LogosJsonSchema.vue'
import DeviconPlainJwt from '@/components/icons/DeviconPlainJwt.vue'
import GravityUiTimestamps from '@/components/icons/GravityUiTimestamps.vue'
import CodiconDiffMultiple from '@/components/icons/CodiconDiffMultiple.vue'
import FluentSerialPort16Regular from '@/components/icons/FluentSerialPort16Regular.vue'
import BiRegex from '@/components/icons/BiRegex.vue'
import DeviconPlainJava from '@/components/icons/DeviconPlainJava.vue'
import EosIconsCronjob from '@/components/icons/EosIconsCronjob.vue'
import FileIconsUnicode from '@/components/icons/FileIconsUnicode.vue'
import LaMarkdown from '@/components/icons/LaMarkdown.vue'
import FluentMdl2Color from '@/components/icons/FluentMdl2Color.vue'
import HugeiconsXml01 from '@/components/icons/HugeiconsXml01.vue'
import UilLinux from '@/components/icons/UilLinux.vue'
import EosIconsEnv from '@/components/icons/EosIconsEnv.vue'

const iconMap: Record<string, any> = {
  'icon-json': LetsIconsJson,
  'icon-schema': LogosJsonSchema,
  'icon-jwt': DeviconPlainJwt,
  'icon-code': Code,
  'icon-markdown': LaMarkdown,
  'icon-xml': HugeiconsXml01,
  'icon-linux': UilLinux,
  'icon-swap': ArrowLeftRight,
  'icon-unicode': FileIconsUnicode,
  'icon-cron': EosIconsCronjob,
  'icon-clock-circle': GravityUiTimestamps,
  'icon-calendar': Calendar,
  'icon-lock': Lock,
  'icon-hash': Hash,
  'icon-link': Link,
  'icon-search': Search,
  'icon-regex': BiRegex,
  'icon-calculator': FileIcon,
  'icon-settings': Settings,
  'icon-palette': FluentMdl2Color,
  'icon-qrcode': QrCode,
  'icon-diff': CodiconDiffMultiple,
  'icon-port': FluentSerialPort16Regular,
  'icon-tag': Tag,
  'icon-star': Star,
  'icon-eye': Eye,
  'icon-nav': Wrench,
  'icon-fingerprint': Fingerprint,
  'icon-crypto': Lock,
  'icon-env': EosIconsEnv,
  'icon-jdk': DeviconPlainJava,
  'icon-idcard': FileIcon,
  'icon-drive-file': FileIcon,
}

export function getIcon(iconName?: string): any {
  if (!iconName) return Code
  return iconMap[iconName] || Code
}

export function hasIcon(iconName: string): boolean {
  return iconName in iconMap
}

export function getAllIcons(): Record<string, any> {
  return { ...iconMap }
}
