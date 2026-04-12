import type { SchemaField, SchemaDocument } from '@/types/json-schema'

/** 根据 format 生成示例字符串 */
const generateFormattedSample = (format: string, _minLength?: number | null, _maxLength?: number | null): string => {
  switch (format) {
    case 'email': return 'user@example.com'
    case 'date': return '2024-01-15'
    case 'date-time': return '2024-01-15T10:30:00Z'
    case 'time': return '10:30:00'
    case 'uri': return 'https://example.com/path'
    case 'uuid': return '550e8400-e29b-41d4-a716-446655440000'
    case 'hostname': return 'example.com'
    case 'ipv4': return '192.168.1.1'
    case 'ipv6': return '::1'
    case 'password': return '********'
    default: return 'example'
  }
}

/** 生成单个字段的示例值 */
export const generateFieldValue = (field: SchemaField): any => {
  // 有 enum 时取第一个
  if (field.enumValues.length) return field.enumValues[0]

  // 有默认值时使用默认值
  if (field.defaultValue !== null) {
    switch (field.type) {
      case 'number':
      case 'integer': {
        const n = Number(field.defaultValue)
        return isNaN(n) ? field.defaultValue : n
      }
      case 'boolean': return field.defaultValue === 'true'
      case 'null': return null
      default: return field.defaultValue
    }
  }

  switch (field.type) {
    case 'string':
      if (field.format) return generateFormattedSample(field.format, field.minLength, field.maxLength)
      if (field.pattern) return field.name || 'text'
      const base = field.name || 'field'
      return base
    case 'number':
      if (field.minimum !== null && field.maximum !== null) return (field.minimum + field.maximum) / 2
      if (field.minimum !== null) return field.minimum + 10
      if (field.maximum !== null) return field.maximum - 10
      return 42.5
    case 'integer':
      if (field.minimum !== null && field.maximum !== null) return Math.floor((field.minimum + field.maximum) / 2)
      if (field.minimum !== null) return Math.floor(field.minimum) + 10
      if (field.maximum !== null) return Math.floor(field.maximum) - 10
      return 42
    case 'boolean':
      return true
    case 'null':
      return null
    case 'object': {
      const obj: Record<string, any> = {}
      for (const child of field.children) {
        obj[child.name] = generateFieldValue(child)
      }
      return obj
    }
    case 'array': {
      if (!field.items) return []
      const count = field.items.type === 'object' ? 2 : 3
      return Array.from({ length: count }, () => generateFieldValue(field.items!))
    }
    default:
      return null
  }
}

/** 生成完整示例 JSON */
export const generateSampleData = (doc: SchemaDocument): Record<string, any> => {
  const result: Record<string, any> = {}
  for (const field of doc.fields) {
    result[field.name] = generateFieldValue(field)
  }
  return result
}
