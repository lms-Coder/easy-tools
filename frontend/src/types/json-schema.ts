// ====== JSON Schema Designer 类型定义 ======

/** 字段类型枚举 */
export type SchemaFieldType = 'string' | 'number' | 'integer' | 'boolean' | 'null' | 'object' | 'array'

/** 代码生成语言 */
export type CodeGenLanguage = 'java' | 'python' | 'go' | 'typescript' | 'csharp' | 'cpp' | 'php' | 'rust' | 'swift' | 'javascript'

/** 字符串 format */
export type StringFormat = '' | 'date' | 'date-time' | 'time' | 'email' | 'uri' | 'uuid' | 'hostname' | 'ipv4' | 'ipv6' | 'password'

/** 右侧面板标签页 */
export type PreviewTab = 'schema' | 'sample' | 'codegen' | 'openapi'

/** Schema 字段节点 */
export interface SchemaField {
  id: string
  name: string
  type: SchemaFieldType
  description: string
  required: boolean
  defaultValue: string | null

  // 字符串约束
  format: StringFormat
  pattern: string
  enumValues: string[]
  minLength: number | null
  maxLength: number | null

  // 数字约束
  minimum: number | null
  maximum: number | null
  exclusiveMinimum: boolean
  exclusiveMaximum: boolean
  multipleOf: number | null
  minItems: number | null
  maxItems: number | null
  uniqueItems: boolean

  // 嵌套结构
  children: SchemaField[]  // object 类型的子字段
  items: SchemaField | null  // array 类型的元素 schema

  // UI 状态
  expanded: boolean
}

/** Schema 文档 */
export interface SchemaDocument {
  title: string
  description: string
  schemaVersion: string
  fields: SchemaField[]
}

/** 代码生成选项 */
export interface CodeGenOptions {
  language: CodeGenLanguage
  rootName: string
  namespace?: string
}

/** 代码生成结果 */
export interface CodeGenResult {
  language: CodeGenLanguage
  code: string
  extension: string
  label: string
}

/** OpenAPI 导出选项 */
export interface OpenApiExportOptions {
  title: string
  version: string
  description: string
  endpointPath: string
  method: 'get' | 'post' | 'put' | 'patch' | 'delete'
}

/** 历史记录数据 */
export interface SchemaHistoryData {
  document: SchemaDocument
  title: string
}

/** 所有字段类型 */
export const FIELD_TYPES: { value: SchemaFieldType; label: string }[] = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'integer', label: 'Integer' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'null', label: 'Null' },
  { value: 'object', label: 'Object' },
  { value: 'array', label: 'Array' },
]

/** 所有字符串格式 */
export const STRING_FORMATS: { value: StringFormat; label: string }[] = [
  { value: '', label: '无' },
  { value: 'date', label: 'Date' },
  { value: 'date-time', label: 'Date-Time' },
  { value: 'time', label: 'Time' },
  { value: 'email', label: 'Email' },
  { value: 'uri', label: 'URI' },
  { value: 'uuid', label: 'UUID' },
  { value: 'hostname', label: 'Hostname' },
  { value: 'ipv4', label: 'IPv4' },
  { value: 'ipv6', label: 'IPv6' },
]

/** 所有代码生成语言 */
export const CODE_GEN_LANGUAGES: { value: CodeGenLanguage; label: string; extension: string }[] = [
  { value: 'typescript', label: 'TypeScript', extension: '.ts' },
  { value: 'java', label: 'Java', extension: '.java' },
  { value: 'python', label: 'Python', extension: '.py' },
  { value: 'go', label: 'Go', extension: '.go' },
  { value: 'csharp', label: 'C#', extension: '.cs' },
  { value: 'cpp', label: 'C++', extension: '.h' },
  { value: 'php', label: 'PHP', extension: '.php' },
  { value: 'rust', label: 'Rust', extension: '.rs' },
  { value: 'swift', label: 'Swift', extension: '.swift' },
  { value: 'javascript', label: 'JavaScript', extension: '.js' },
]

/** 类型对应颜色类名 */
export const TYPE_COLORS: Record<SchemaFieldType, string> = {
  string: 'type-string',
  number: 'type-number',
  integer: 'type-integer',
  boolean: 'type-boolean',
  null: 'type-null',
  object: 'type-object',
  array: 'type-array',
}
