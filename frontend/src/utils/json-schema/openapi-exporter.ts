import type { SchemaField, SchemaDocument } from '@/types/json-schema'
import { fieldToSchema } from './schema-builder'

/** 导出为 OpenAPI 3.0.3 文档 */
export const exportToOpenApi = (
  doc: SchemaDocument,
  options: {
    title?: string
    version?: string
    description?: string
    endpointPath?: string
    method?: string
  } = {}
): Record<string, any> => {
  const schemaName = doc.title || 'Schema'
  const method = (options.method || 'post').toLowerCase()

  // 构建 schema
  const properties: Record<string, any> = {}
  const required: string[] = []
  for (const field of doc.fields) {
    properties[field.name] = fieldToSchema(field)
    if (field.required) required.push(field.name)
  }

  const schema: Record<string, any> = {
    type: 'object',
    properties,
  }
  if (required.length) schema.required = required

  // 构建完整文档
  const openapi: Record<string, any> = {
    openapi: '3.0.3',
    info: {
      title: options.title || doc.title || 'API Schema',
      version: options.version || '1.0.0',
      description: options.description || doc.description || '',
    },
    paths: {},
    components: {
      schemas: {
        [schemaName]: schema,
      },
    },
  }

  // 如果有端点路径，生成端点
  const path = options.endpointPath || `/api/${toKebabCase(schemaName)}`
  const pathItem: Record<string, any> = {}

  const operation: Record<string, any> = {
    summary: `${method.toUpperCase()} ${schemaName}`,
    tags: [schemaName],
  }

  if (['post', 'put', 'patch'].includes(method)) {
    operation.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: `#/components/schemas/${schemaName}` },
        },
      },
    }
  }

  operation.responses = {
    '200': {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: { $ref: `#/components/schemas/${schemaName}` },
        },
      },
    },
  }

  pathItem[method] = operation
  openapi.paths[path] = pathItem

  return openapi
}

const toKebabCase = (s: string) =>
  s.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
