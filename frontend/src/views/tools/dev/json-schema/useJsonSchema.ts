import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { toast } from '@/composables/useToast'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import typescript from 'highlight.js/lib/languages/typescript'
import java from 'highlight.js/lib/languages/java'
import python from 'highlight.js/lib/languages/python'
import go from 'highlight.js/lib/languages/go'
import csharp from 'highlight.js/lib/languages/csharp'
import cpp from 'highlight.js/lib/languages/cpp'
import php from 'highlight.js/lib/languages/php'
import rust from 'highlight.js/lib/languages/rust'
import swift from 'highlight.js/lib/languages/swift'
import javascript from 'highlight.js/lib/languages/javascript'
import 'highlight.js/styles/atom-one-light.css'
import type {
  SchemaField,
  SchemaDocument,
  SchemaFieldType,
  PreviewTab,
  CodeGenLanguage,
} from '@/types/json-schema'
import {
  FIELD_TYPES,
  STRING_FORMATS,
  CODE_GEN_LANGUAGES,
} from '@/types/json-schema'
import {
  createDefaultField,
  createDefaultDocument,
  findFieldById,
  findFieldParent,
  removeFieldFromTree,
  cloneField,
  moveFieldInArray,
  updateFieldInTree,
  toggleFieldExpanded,
  buildJsonSchema,
  generateSampleData,
  generateCode,
  exportToOpenApi,
} from '@/utils/json-schema'

hljs.registerLanguage('json', json)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('java', java)
hljs.registerLanguage('python', python)
hljs.registerLanguage('go', go)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('php', php)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('swift', swift)
hljs.registerLanguage('javascript', javascript)

export const previewTabs = [
  { key: 'schema' as PreviewTab, label: 'Schema JSON' },
  { key: 'sample' as PreviewTab, label: '示例数据' },
  { key: 'codegen' as PreviewTab, label: '代码生成' },
  { key: 'openapi' as PreviewTab, label: 'OpenAPI' },
]

export function useJsonSchema() {
  // ====== State ======
  const document = ref<SchemaDocument>(createDefaultDocument())
  const selectedFieldId = ref<string | null>(null)
  const activeTab = ref<PreviewTab>('schema')
  const codeGenLanguage = ref<CodeGenLanguage>('typescript')
  const showImportModal = ref(false)
  const importJson = ref('')
  const importError = ref('')

  const fieldEditorEl = ref<HTMLElement | null>(null)
  const editorPos = ref({ top: 0, left: 0 })
  const isDragging = ref(false)
  const dragOffset = ref({ x: 0, y: 0 })

  // ====== Computed ======
  const selectedField = computed(() => {
    if (!selectedFieldId.value) return null
    return findFieldById(document.value.fields, selectedFieldId.value)
  })

  const fieldCount = computed(() => {
    const count = (fields: SchemaField[]): number => {
      let total = 0
      for (const field of fields) {
        total += 1
        if (field.type === 'object' && field.children.length) {
          total += count(field.children)
        }
        if (field.type === 'array' && field.items) {
          total += 1
          if (field.items.type === 'object' && field.items.children.length) {
            total += count(field.items.children)
          }
        }
      }
      return total
    }
    return count(document.value.fields)
  })

  const flattenedFields = computed(() => {
    const result: { field: SchemaField; depth: number }[] = []
    const flatten = (fields: SchemaField[], depth: number) => {
      for (const f of fields) {
        result.push({ field: f, depth })
        if (
          (f.type === 'object' && f.expanded && f.children.length) ||
          (f.type === 'array' && f.expanded && f.items)
        ) {
          if (f.type === 'object') flatten(f.children, depth + 1)
          if (f.type === 'array' && f.items) {
            result.push({ field: f.items, depth: depth + 1 })
            if (f.items.type === 'object' && f.items.expanded) {
              flatten(f.items.children, depth + 2)
            }
          }
        }
      }
    }
    flatten(document.value.fields, 0)
    return result
  })

  const enumValuesInput = computed({
    get() {
      return selectedField.value?.enumValues?.join(', ') || ''
    },
    set() {},
  })

  const schemaJson = computed(() => {
    return JSON.stringify(buildJsonSchema(document.value), null, 2)
  })

  const schemaJsonLines = computed(() => {
    return hljs.highlight(schemaJson.value, { language: 'json' }).value.split('\n')
  })

  const sampleJson = computed(() => {
    return JSON.stringify(generateSampleData(document.value), null, 2)
  })

  const sampleJsonLines = computed(() => {
    return hljs.highlight(sampleJson.value, { language: 'json' }).value.split('\n')
  })

  const codeGenResult = computed(() => {
    return generateCode(document.value, codeGenLanguage.value)
  })

  const codeGenLines = computed(() => {
    const langMap: Record<string, string> = {
      typescript: 'typescript',
      javascript: 'javascript',
      java: 'java',
      python: 'python',
      go: 'go',
      csharp: 'csharp',
      cpp: 'cpp',
      php: 'php',
      rust: 'rust',
      swift: 'swift',
    }
    const lang = langMap[codeGenLanguage.value] || 'plaintext'
    const raw = codeGenResult.value.code
    const highlighted = lang === 'plaintext' ? raw : hljs.highlight(raw, { language: lang }).value
    return highlighted.split('\n')
  })

  const openApiJson = computed(() => {
    return JSON.stringify(exportToOpenApi(document.value), null, 2)
  })

  const openApiJsonLines = computed(() => {
    return hljs.highlight(openApiJson.value, { language: 'json' }).value.split('\n')
  })

  // ====== Actions ======
  const addField = () => {
    const newField = createDefaultField()
    newField.name = `field${document.value.fields.length + 1}`
    document.value.fields.push(newField)
    selectedFieldId.value = newField.id
  }

  const addChildField = (parentId: string) => {
    const parent = findFieldById(document.value.fields, parentId)
    if (!parent || parent.type !== 'object') return
    const newField = createDefaultField()
    newField.name = `field${parent.children.length + 1}`
    parent.children.push(newField)
    parent.expanded = true
    selectedFieldId.value = newField.id
  }

  const deleteField = (id: string) => {
    document.value.fields = removeFieldFromTree(document.value.fields, id)
    if (selectedFieldId.value === id) selectedFieldId.value = null
  }

  const moveField = (id: string, direction: 'up' | 'down') => {
    document.value.fields = moveFieldInArray(document.value.fields, id, direction)
  }

  const duplicateField = (id: string) => {
    const field = findFieldById(document.value.fields, id)
    const result = findFieldParent(document.value.fields, id)
    if (field && result) {
      const cloned = cloneField(field)
      cloned.name = `${field.name}_副本`
      result.parent.splice(result.index + 1, 0, cloned)
    }
  }

  const selectField = (id: string) => {
    selectedFieldId.value = id
  }

  const updateField = (id: string, updates: Partial<SchemaField>) => {
    updateFieldInTree(document.value.fields, id, updates)
  }

  const toggleExpand = (id: string) => {
    toggleFieldExpanded(document.value.fields, id)
  }

  const onFieldTypeChange = () => {
    if (!selectedField.value) return
    const field = selectedField.value
    if (field.type !== 'string') {
      field.format = ''
      field.pattern = ''
      field.enumValues = []
      field.minLength = null
      field.maxLength = null
    }
    if (field.type !== 'number' && field.type !== 'integer') {
      field.minimum = null
      field.maximum = null
      field.exclusiveMinimum = false
      field.exclusiveMaximum = false
      field.multipleOf = null
    }
    if (field.type !== 'array') {
      field.minItems = null
      field.maxItems = null
      field.uniqueItems = false
      field.items = null
    }
    if (field.type === 'array' && !field.items) {
      field.items = createDefaultField()
      field.items.name = 'items'
      field.items.type = 'string'
    }
    if (field.type !== 'object') {
      field.children = []
    }
    updateField(field.id, field)
  }

  const onItemsTypeChange = () => {
    if (!selectedField.value || !selectedField.value.items) return
    const items = selectedField.value.items
    if (items.type !== 'object') {
      items.children = []
    }
    updateField(selectedField.value.id, { items: { ...items } })
  }

  const onEnumValuesChange = () => {
    if (!selectedField.value) return
    const values = enumValuesInput.value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
    updateField(selectedField.value.id, {
      enumValues: values.length > 0 ? values : [],
    })
  }

  const copyToClipboard = async (content: string, label: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success(`${label}已复制`)
    } catch {
      toast.error('复制失败')
    }
  }

  const importSchema = () => {
    importError.value = ''
    try {
      const schema = JSON.parse(importJson.value)
      if (schema.title) document.value.title = schema.title
      if (schema.description) document.value.description = schema.description

      const parseProperties = (
        properties: any,
        required: string[] = []
      ): SchemaField[] => {
        const fields: SchemaField[] = []
        for (const [name, propSchema] of Object.entries(properties)) {
          const prop = propSchema as any
          const field = createDefaultField()
          field.name = name
          field.type = (prop.type || 'string') as SchemaFieldType
          field.description = prop.description || ''
          field.required = required.includes(name)
          field.defaultValue = prop.default !== undefined ? JSON.stringify(prop.default) : ''

          if (field.type === 'string') {
            field.format = prop.format || ''
            field.pattern = prop.pattern || ''
            field.enumValues = prop.enum || []
            field.minLength = prop.minLength || null
            field.maxLength = prop.maxLength || null
          }
          if (field.type === 'number' || field.type === 'integer') {
            field.minimum = prop.minimum || null
            field.maximum = prop.maximum || null
            field.exclusiveMinimum = prop.exclusiveMinimum || false
            field.exclusiveMaximum = prop.exclusiveMaximum || false
            field.multipleOf = prop.multipleOf || null
          }
          if (field.type === 'array') {
            field.minItems = prop.minItems || null
            field.maxItems = prop.maxItems || null
            field.uniqueItems = prop.uniqueItems || false
            if (prop.items) {
              const itemsType = prop.items.type || 'string'
              field.items = createDefaultField()
              field.items.name = 'items'
              field.items.type = itemsType as SchemaFieldType
              if (itemsType === 'object' && prop.items.properties) {
                field.items.children = parseProperties(prop.items.properties, prop.items.required || [])
                field.items.expanded = false
              }
            }
          }
          if (field.type === 'object' && prop.properties) {
            field.children = parseProperties(prop.properties, prop.required || [])
            field.expanded = false
          }
          fields.push(field)
        }
        return fields
      }

      if (schema.properties) {
        document.value.fields = parseProperties(schema.properties, schema.required || [])
      }

      showImportModal.value = false
      importJson.value = ''
      toast.success('导入成功')
    } catch (err) {
      importError.value = '无效的 JSON Schema：' + (err as Error).message
    }
  }

  // ====== Editor positioning & dragging ======
  const updateEditorPosition = () => {
    if (!selectedFieldId.value) {
      editorPos.value = { top: 0, left: 0 }
      return
    }
    setTimeout(() => {
      const selectedRow = window.document.querySelector('.field-row.selected') as HTMLElement
      if (!selectedRow) {
        editorPos.value = { top: 0, left: 0 }
        return
      }
      const rect = selectedRow.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const popupWidth = 380
      const popupMaxHeight = 500
      const padding = 16

      let left = rect.right + padding
      let top = rect.top

      if (left + popupWidth > viewportWidth - padding) {
        left = rect.left
        top = rect.bottom + padding
      }
      if (top + popupMaxHeight > viewportHeight - padding) {
        if (rect.top > popupMaxHeight + padding) {
          top = rect.top - popupMaxHeight - padding
        } else {
          top = Math.max(padding, viewportHeight - popupMaxHeight - padding)
        }
      }
      editorPos.value = { top, left: Math.max(padding, left) }
    }, 0)
  }

  const startDrag = (event: MouseEvent) => {
    isDragging.value = true
    dragOffset.value = {
      x: event.clientX - editorPos.value.left,
      y: event.clientY - editorPos.value.top,
    }
    window.document.addEventListener('mousemove', onDrag)
    window.document.addEventListener('mouseup', stopDrag)
  }

  const onDrag = (event: MouseEvent) => {
    if (!isDragging.value) return
    editorPos.value = {
      left: Math.max(0, event.clientX - dragOffset.value.x),
      top: Math.max(0, event.clientY - dragOffset.value.y),
    }
  }

  const stopDrag = () => {
    isDragging.value = false
    window.document.removeEventListener('mousemove', onDrag)
    window.document.removeEventListener('mouseup', stopDrag)
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (!selectedFieldId.value) return
    const target = event.target as Node
    const editor = fieldEditorEl.value
    const fieldRows = window.document.querySelectorAll('.field-row')
    const isClickOutsideEditor = editor && !editor.contains(target)
    const isClickOutsideFieldRows = Array.from(fieldRows).every(
      (row: Element) => !row.contains(target)
    )
    if (isClickOutsideEditor && isClickOutsideFieldRows) {
      selectedFieldId.value = null
    }
  }

  onMounted(() => {
    window.document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    window.document.removeEventListener('click', handleClickOutside)
  })

  watch(selectedFieldId, () => {
    updateEditorPosition()
  })

  return {
    // State
    document,
    selectedFieldId,
    activeTab,
    codeGenLanguage,
    showImportModal,
    importJson,
    importError,
    fieldEditorEl,
    editorPos,
    // Computed
    selectedField,
    fieldCount,
    flattenedFields,
    enumValuesInput,
    schemaJson,
    schemaJsonLines,
    sampleJson,
    sampleJsonLines,
    codeGenResult,
    codeGenLines,
    openApiJson,
    openApiJsonLines,
    // Actions
    addField,
    addChildField,
    deleteField,
    moveField,
    duplicateField,
    selectField,
    updateField,
    toggleExpand,
    onFieldTypeChange,
    onItemsTypeChange,
    onEnumValuesChange,
    copyToClipboard,
    importSchema,
    startDrag,
  }
}
