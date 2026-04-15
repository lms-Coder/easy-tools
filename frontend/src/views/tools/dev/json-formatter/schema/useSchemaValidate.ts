import { ref, computed, watch } from 'vue'

// ====== Schema 生成 ======

function inferType(value: any): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number'
  return 'string'
}

function inferFormat(value: string): string | undefined {
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return 'date-time'
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date'
  if (/^[\w.-]+@[\w.-]+\.\w+$/.test(value)) return 'email'
  if (/^https?:\/\//.test(value)) return 'uri'
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return 'uuid'
  return undefined
}

function inferSchema(data: any, title?: string): any {
  const schema: any = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: inferType(data),
  }
  if (title) schema.title = title

  switch (schema.type) {
    case 'object': {
      schema.properties = {}
      const requiredKeys: string[] = []
      for (const [key, value] of Object.entries(data)) {
        schema.properties[key] = inferSchema(value, key)
        if (value !== null && value !== undefined) requiredKeys.push(key)
      }
      schema.required = requiredKeys
      break
    }
    case 'array': {
      if (data.length > 0) {
        const firstItem = data[0]
        schema.items = inferSchema(firstItem)
        // 检查元素类型是否一致
        if (data.length > 1) {
          const types = new Set(data.map((item: any) => inferType(item)))
          if (types.size > 1) {
            schema.items = { oneOf: [...types].map(t => ({ type: t })) }
          }
        }
      } else {
        schema.items = {}
      }
      break
    }
    case 'string': {
      const fmt = inferFormat(data)
      if (fmt) schema.format = fmt
      break
    }
    // number, integer, boolean, null 不需要额外约束
  }

  return schema
}

// ====== Schema 验证 ======

export interface ValidationError {
  path: string
  message: string
  keyword: string
}

function validateValue(value: any, subSchema: any, path: string, errors: ValidationError[]) {
  if (!subSchema || typeof subSchema !== 'object') return

  // type 检查
  if (subSchema.type) {
    const actualType = inferType(value)
    const expected = subSchema.type
    if (expected === 'integer') {
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        errors.push({ path, message: `期望 integer，实际为 ${actualType}`, keyword: 'type' })
      }
    } else if (expected === 'number' && actualType === 'integer') {
      // integer 是 number 的子集，通过
    } else if (actualType !== expected) {
      errors.push({ path, message: `期望 ${expected}，实际为 ${actualType}`, keyword: 'type' })
    }
  }

  // required 检查
  if (subSchema.required && typeof value === 'object' && value !== null && !Array.isArray(value)) {
    for (const key of subSchema.required) {
      if (!(key in value)) {
        errors.push({ path: `${path}.${key}`, message: `缺少必填属性 "${key}"`, keyword: 'required' })
      }
    }
  }

  // properties 递归
  if (subSchema.properties && typeof value === 'object' && value !== null && !Array.isArray(value)) {
    for (const [key, propSchema] of Object.entries(subSchema.properties)) {
      if (key in value) {
        validateValue(value[key], propSchema, `${path}.${key}`, errors)
      }
    }
    // additionalProperties
    if (subSchema.additionalProperties === false) {
      const allowedKeys = new Set(Object.keys(subSchema.properties))
      for (const key of Object.keys(value)) {
        if (!allowedKeys.has(key)) {
          errors.push({ path: `${path}.${key}`, message: `不允许的额外属性 "${key}"`, keyword: 'additionalProperties' })
        }
      }
    }
  }

  // items 检查（数组）
  if (subSchema.items && Array.isArray(value)) {
    value.forEach((item, i) => validateValue(item, subSchema.items, `${path}[${i}]`, errors))
  }

  // enum 检查
  if (subSchema.enum) {
    if (!subSchema.enum.includes(value)) {
      errors.push({ path, message: `值必须是以下之一: ${JSON.stringify(subSchema.enum)}`, keyword: 'enum' })
    }
  }

  // 数值约束
  if (typeof value === 'number') {
    if (subSchema.minimum !== undefined && value < subSchema.minimum) {
      errors.push({ path, message: `值 ${value} 小于最小值 ${subSchema.minimum}`, keyword: 'minimum' })
    }
    if (subSchema.maximum !== undefined && value > subSchema.maximum) {
      errors.push({ path, message: `值 ${value} 大于最大值 ${subSchema.maximum}`, keyword: 'maximum' })
    }
    if (subSchema.exclusiveMinimum !== undefined && value <= subSchema.exclusiveMinimum) {
      errors.push({ path, message: `值 ${value} 不大于 ${subSchema.exclusiveMinimum}`, keyword: 'exclusiveMinimum' })
    }
    if (subSchema.exclusiveMaximum !== undefined && value >= subSchema.exclusiveMaximum) {
      errors.push({ path, message: `值 ${value} 不小于 ${subSchema.exclusiveMaximum}`, keyword: 'exclusiveMaximum' })
    }
    if (subSchema.multipleOf !== undefined && value % subSchema.multipleOf !== 0) {
      errors.push({ path, message: `值 ${value} 不是 ${subSchema.multipleOf} 的倍数`, keyword: 'multipleOf' })
    }
  }

  // 字符串约束
  if (typeof value === 'string') {
    if (subSchema.minLength !== undefined && value.length < subSchema.minLength) {
      errors.push({ path, message: `字符串长度 ${value.length} 小于最小长度 ${subSchema.minLength}`, keyword: 'minLength' })
    }
    if (subSchema.maxLength !== undefined && value.length > subSchema.maxLength) {
      errors.push({ path, message: `字符串长度 ${value.length} 大于最大长度 ${subSchema.maxLength}`, keyword: 'maxLength' })
    }
    if (subSchema.pattern) {
      try {
        if (!new RegExp(subSchema.pattern).test(value)) {
          errors.push({ path, message: `不匹配正则模式: ${subSchema.pattern}`, keyword: 'pattern' })
        }
      } catch { /* invalid pattern, skip */ }
    }
    if (subSchema.format) {
      // 基本 format 验证
      const formatPatterns: Record<string, RegExp> = {
        email: /^[\w.-]+@[\w.-]+\.\w+$/,
        'date-time': /^\d{4}-\d{2}-\d{2}T/,
        date: /^\d{4}-\d{2}-\d{2}$/,
        uri: /^https?:\/\//,
        uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      }
      const pat = formatPatterns[subSchema.format]
      if (pat && !pat.test(value)) {
        errors.push({ path, message: `不符合 ${subSchema.format} 格式`, keyword: 'format' })
      }
    }
  }

  // 数组约束
  if (Array.isArray(value)) {
    if (subSchema.minItems !== undefined && value.length < subSchema.minItems) {
      errors.push({ path, message: `数组长度 ${value.length} 小于最小项数 ${subSchema.minItems}`, keyword: 'minItems' })
    }
    if (subSchema.maxItems !== undefined && value.length > subSchema.maxItems) {
      errors.push({ path, message: `数组长度 ${value.length} 大于最大项数 ${subSchema.maxItems}`, keyword: 'maxItems' })
    }
    if (subSchema.uniqueItems) {
      const seen = new Set<string>()
      for (const item of value) {
        const key = JSON.stringify(item)
        if (seen.has(key)) {
          errors.push({ path, message: `数组包含重复项`, keyword: 'uniqueItems' })
          break
        }
        seen.add(key)
      }
    }
  }
}

function validateJson(data: any, schema: any): ValidationError[] {
  const errors: ValidationError[] = []
  validateValue(data, schema, '$', errors)
  return errors
}

// ====== Composable ======

export type SchemaSubMode = 'generate' | 'validate'

export function useSchemaValidate() {
  const schemaMode = ref<SchemaSubMode>('generate')

  // Generate
  const schemaInputJson = ref('')
  const generatedSchema = ref('')
  const generateError = ref('')

  // Validate
  const validateSchemaText = ref('')
  const validateDataText = ref('')
  const validateErrors = ref<ValidationError[]>([])
  const validateError = ref('')
  const validatePassed = ref(false)

  function generateSchema() {
    generateError.value = ''
    generatedSchema.value = ''
    const input = schemaInputJson.value.trim()
    if (!input) return

    try {
      const data = JSON.parse(input)
      const schema = inferSchema(data)
      generatedSchema.value = JSON.stringify(schema, null, 2)
    } catch (e: any) {
      generateError.value = e.message || 'JSON 解析失败'
    }
  }

  function validateData() {
    validateError.value = ''
    validateErrors.value = []
    validatePassed.value = false

    const schemaText = validateSchemaText.value.trim()
    const dataText = validateDataText.value.trim()
    if (!schemaText || !dataText) return

    try {
      const schema = JSON.parse(schemaText)
      const data = JSON.parse(dataText)
      const errors = validateJson(data, schema)
      validateErrors.value = errors
      validatePassed.value = errors.length === 0
    } catch (e: any) {
      validateError.value = e.message || 'JSON 解析失败'
    }
  }

  function clearSchema() {
    schemaInputJson.value = ''
    generatedSchema.value = ''
    generateError.value = ''
  }

  function clearValidate() {
    validateSchemaText.value = ''
    validateDataText.value = ''
    validateErrors.value = []
    validateError.value = ''
    validatePassed.value = false
  }

  async function pasteToSchemaInput() {
    try { schemaInputJson.value = await navigator.clipboard.readText(); generateSchema() } catch { /* ignore */ }
  }

  async function pasteToValidateSchema() {
    try { validateSchemaText.value = await navigator.clipboard.readText(); validateData() } catch { /* ignore */ }
  }

  async function pasteToValidateData() {
    try { validateDataText.value = await navigator.clipboard.readText(); validateData() } catch { /* ignore */ }
  }

  async function copyGeneratedSchema() {
    if (!generatedSchema.value) return
    try { await navigator.clipboard.writeText(generatedSchema.value) } catch { /* ignore */ }
  }

  // 自动触发：输入变化时自动执行
  let generateTimer: ReturnType<typeof setTimeout> | null = null
  watch(schemaInputJson, () => {
    if (schemaMode.value !== 'generate') return
    if (generateTimer) clearTimeout(generateTimer)
    generateTimer = setTimeout(generateSchema, 400)
  })

  let validateTimer: ReturnType<typeof setTimeout> | null = null
  watch([validateSchemaText, validateDataText], () => {
    if (schemaMode.value !== 'validate') return
    if (validateTimer) clearTimeout(validateTimer)
    validateTimer = setTimeout(validateData, 400)
  })

  return {
    schemaMode,
    // Generate
    schemaInputJson, generatedSchema, generateError,
    generateSchema, clearSchema, pasteToSchemaInput, copyGeneratedSchema,
    // Validate
    validateSchemaText, validateDataText, validateErrors, validateError, validatePassed,
    validateData, clearValidate, pasteToValidateSchema, pasteToValidateData,
  }
}
