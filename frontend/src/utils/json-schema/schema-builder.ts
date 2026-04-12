import type { SchemaField, SchemaDocument, SchemaFieldType, StringFormat } from '@/types/json-schema'

let idCounter = 0
export const generateFieldId = (): string => `field-${Date.now()}-${++idCounter}`

/** 创建默认字段 */
export const createDefaultField = (type: SchemaFieldType = 'string', name = ''): SchemaField => ({
  id: generateFieldId(),
  name,
  type,
  description: '',
  required: true,
  defaultValue: null,
  format: '' as StringFormat,
  pattern: '',
  enumValues: [],
  minLength: null,
  maxLength: null,
  minimum: null,
  maximum: null,
  exclusiveMinimum: false,
  exclusiveMaximum: false,
  multipleOf: null,
  minItems: null,
  maxItems: null,
  uniqueItems: false,
  children: [],
  items: type === 'array' ? createDefaultField('string', 'item') : null,
  expanded: true,
})

/** 创建默认文档 */
export const createDefaultDocument = (): SchemaDocument => ({
  title: 'MySchema',
  description: '',
  schemaVersion: 'https://json-schema.org/draft/2020-12/schema',
  fields: [],
})

/** 在树中查找字段（递归 DFS） */
export const findFieldById = (fields: SchemaField[], id: string): SchemaField | null => {
  for (const f of fields) {
    if (f.id === id) return f
    const found = findFieldById(f.children, id)
    if (found) return found
    if (f.items) {
      if (f.items.id === id) return f.items
      const itemFound = findFieldById([f.items], id)
      if (itemFound) return itemFound
    }
  }
  return null
}

/** 查找字段的父数组和索引 */
export const findFieldParent = (
  fields: SchemaField[],
  id: string
): { parent: SchemaField[]; index: number } | null => {
  for (let i = 0; i < fields.length; i++) {
    if (fields[i].id === id) return { parent: fields, index: i }
    const found = findFieldParent(fields[i].children, id)
    if (found) return found
    const items = fields[i].items
    if (items) {
      if (items.id === id) {
        // items 是单字段，不是数组——返回父字段引用
        return { parent: [items], index: 0 }
      }
      const itemFound = findFieldParent([items], id)
      if (itemFound) return itemFound
    }
  }
  return null
}

/** 从字段树中移除字段 */
export const removeFieldFromTree = (fields: SchemaField[], id: string): SchemaField[] => {
  return fields
    .filter(f => f.id !== id)
    .map(f => ({
      ...f,
      children: removeFieldFromTree(f.children, id),
      items: f.items
        ? (f.items.id === id
          ? null
          : { ...f.items, children: removeFieldFromTree(f.items.children, id), items: f.items.items ? { ...f.items.items, children: removeFieldFromTree(f.items.items.children, id) } : null })
        : null,
    }))
}

/** 深拷贝字段（带新 ID） */
export const cloneField = (field: SchemaField): SchemaField => ({
  ...field,
  id: generateFieldId(),
  name: field.name + '_copy',
  children: field.children.map(cloneField),
  items: field.items ? cloneField(field.items) : null,
})

/** 移动字段（上/下） */
export const moveFieldInArray = (fields: SchemaField[], id: string, direction: 'up' | 'down'): SchemaField[] => {
  const idx = fields.findIndex(f => f.id === id)
  if (idx === -1) {
    return fields.map(f => ({
      ...f,
      children: moveFieldInArray(f.children, id, direction),
      items: f.items ? { ...f.items, children: moveFieldInArray(f.items.children, id, direction) } : null,
    }))
  }
  const newIdx = direction === 'up' ? idx - 1 : idx + 1
  if (newIdx < 0 || newIdx >= fields.length) return fields
  const arr = [...fields]
  ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
  return arr
}

/** 更新树中的字段 */
export const updateFieldInTree = (fields: SchemaField[], id: string, updates: Partial<SchemaField>): SchemaField[] => {
  return fields.map(f => {
    if (f.id === id) {
      const updated = { ...f, ...updates }
      if (updates.type && updates.type !== f.type) {
        if (updates.type === 'object') {
          updated.children = f.children.length ? f.children : []
          updated.items = null
        } else if (updates.type === 'array') {
          updated.items = f.items || createDefaultField('string', 'item')
          updated.children = []
        } else {
          updated.children = []
          updated.items = null
        }
      }
      return updated
    }
    return {
      ...f,
      children: updateFieldInTree(f.children, id, updates),
      items: f.items
        ? (() => {
            if (f.items!.id === id) return { ...f.items, ...updates }
            return { ...f.items, children: updateFieldInTree(f.items!.children, id, updates), items: f.items!.items ? { ...f.items!.items, children: updateFieldInTree(f.items!.items.children, id, updates) } : null }
          })()
        : null,
    }
  })
}

/** 切换字段展开状态 */
export const toggleFieldExpanded = (fields: SchemaField[], id: string): SchemaField[] => {
  return fields.map(f => {
    if (f.id === id) return { ...f, expanded: !f.expanded }
    return {
      ...f,
      children: toggleFieldExpanded(f.children, id),
      items: f.items ? { ...f.items, children: toggleFieldExpanded(f.items.children, id) } : null,
    }
  })
}

/** SchemaField → 标准 JSON Schema 片段 */
export const fieldToSchema = (field: SchemaField): Record<string, any> => {
  const schema: Record<string, any> = {}

  if (field.description) schema.description = field.description
  if (field.defaultValue !== null) {
    try { schema.default = JSON.parse(field.defaultValue) } catch { schema.default = field.defaultValue }
  }

  switch (field.type) {
    case 'string':
      schema.type = 'string'
      if (field.format) schema.format = field.format
      if (field.pattern) schema.pattern = field.pattern
      if (field.enumValues.length) schema.enum = field.enumValues
      if (field.minLength !== null) schema.minLength = field.minLength
      if (field.maxLength !== null) schema.maxLength = field.maxLength
      break

    case 'number':
      schema.type = 'number'
      if (field.minimum !== null) schema.minimum = field.minimum
      if (field.maximum !== null) schema.maximum = field.maximum
      if (field.exclusiveMinimum && field.minimum !== null) { delete schema.minimum; schema.exclusiveMinimum = field.minimum }
      if (field.exclusiveMaximum && field.maximum !== null) { delete schema.maximum; schema.exclusiveMaximum = field.maximum }
      if (field.multipleOf !== null) schema.multipleOf = field.multipleOf
      break

    case 'integer':
      schema.type = 'integer'
      if (field.minimum !== null) schema.minimum = field.minimum
      if (field.maximum !== null) schema.maximum = field.maximum
      if (field.exclusiveMinimum && field.minimum !== null) { delete schema.minimum; schema.exclusiveMinimum = field.minimum }
      if (field.exclusiveMaximum && field.maximum !== null) { delete schema.maximum; schema.exclusiveMaximum = field.maximum }
      if (field.multipleOf !== null) schema.multipleOf = field.multipleOf
      break

    case 'boolean':
      schema.type = 'boolean'
      break

    case 'null':
      schema.type = 'null'
      break

    case 'object':
      schema.type = 'object'
      if (field.children.length) {
        schema.properties = {}
        const required: string[] = []
        for (const child of field.children) {
          schema.properties[child.name] = fieldToSchema(child)
          if (child.required) required.push(child.name)
        }
        if (required.length) schema.required = required
      }
      break

    case 'array':
      schema.type = 'array'
      if (field.items) schema.items = fieldToSchema(field.items)
      if (field.minItems !== null) schema.minItems = field.minItems
      if (field.maxItems !== null) schema.maxItems = field.maxItems
      if (field.uniqueItems) schema.uniqueItems = true
      break
  }

  return schema
}

/** 完整文档 → JSON Schema */
export const buildJsonSchema = (doc: SchemaDocument): Record<string, any> => {
  const schema: Record<string, any> = {
    $schema: doc.schemaVersion,
    title: doc.title,
  }
  if (doc.description) schema.description = doc.description

  schema.type = 'object'
  schema.properties = {}
  const required: string[] = []
  for (const field of doc.fields) {
    schema.properties[field.name] = fieldToSchema(field)
    if (field.required) required.push(field.name)
  }
  if (required.length) schema.required = required

  return schema
}
