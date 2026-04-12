import type { SchemaField, SchemaDocument, CodeGenLanguage, CodeGenResult } from '@/types/json-schema'

// ====== 类型映射 ======

const typeMap: Record<CodeGenLanguage, Record<string, string>> = {
  typescript: { string: 'string', number: 'number', integer: 'number', boolean: 'boolean', null: 'null', object: 'object', array: 'any[]' },
  java: { string: 'String', number: 'Double', integer: 'Integer', boolean: 'Boolean', null: 'Object', object: 'Object', array: 'List<Object>' },
  python: { string: 'str', number: 'float', integer: 'int', boolean: 'bool', null: 'None', object: 'dict', array: 'list' },
  go: { string: 'string', number: 'float64', integer: 'int', boolean: 'bool', null: 'interface{}', object: 'struct', array: '[]any' },
  csharp: { string: 'string', number: 'double', integer: 'int', boolean: 'bool', null: 'object', object: 'object', array: 'List<object>' },
  cpp: { string: 'std::string', number: 'double', integer: 'int', boolean: 'bool', null: 'std::nullptr_t', object: 'struct', array: 'std::vector<any>' },
  php: { string: 'string', number: 'float', integer: 'int', boolean: 'bool', null: 'mixed', object: 'array', array: 'array' },
  rust: { string: 'String', number: 'f64', integer: 'i64', boolean: 'bool', null: '()', object: 'struct', array: 'Vec<serde_json::Value>' },
  swift: { string: 'String', number: 'Double', integer: 'Int', boolean: 'Bool', null: 'Any?', object: 'struct', array: '[Any]' },
  javascript: { string: 'string', number: 'number', integer: 'number', boolean: 'boolean', null: 'null', object: 'object', array: 'Array' },
}

// ====== 命名转换 ======

const toPascalCase = (s: string) => s.replace(/(^|[_\-\s])(\w)/g, (_, _sep, c) => c.toUpperCase())
const toCamelCase = (s: string) => { const p = toPascalCase(s); return p[0].toLowerCase() + p.slice(1) }
const toSnakeCase = (s: string) => s.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
const toKebabCase = (s: string) => s.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')

const formatFieldName = (name: string, lang: CodeGenLanguage): string => {
  switch (lang) {
    case 'java': case 'typescript': case 'javascript': case 'csharp': case 'php': case 'swift': return toCamelCase(name)
    case 'python': case 'rust': return toSnakeCase(name)
    case 'go': return toPascalCase(name)
    case 'cpp': return toCamelCase(name)
    default: return name
  }
}

const formatTypeName = (name: string, _lang: CodeGenLanguage): string => toPascalCase(name)

/** 获取字段的类型字符串 */
const getTypeStr = (field: SchemaField, lang: CodeGenLanguage, name: string, wrapOption = false): string => {
  let base: string
  if (field.type === 'object') {
    base = formatTypeName(name, lang)
  } else if (field.type === 'array') {
    const itemType = field.items ? getTypeStr(field.items, lang, name + 'Item') : typeMap[lang]['string']
    switch (lang) {
      case 'typescript': base = `${itemType}[]`; break
      case 'java': base = `List<${itemType}>`; break
      case 'go': base = `[]${itemType}`; break
      case 'csharp': base = `List<${itemType}>`; break
      case 'cpp': base = `std::vector<${itemType}>`; break
      case 'rust': base = `Vec<${itemType}>`; break
      case 'swift': base = `[${itemType}]`; break
      case 'php': base = 'array'; break
      case 'python': base = `list[${itemType}]`; break
      case 'javascript': base = 'Array'; break
      default: base = `${itemType}[]`; break
    }
  } else {
    base = typeMap[lang][field.type] || 'any'
  }

  if (wrapOption) {
    switch (lang) {
      case 'rust': return `Option<${base}>`
      case 'swift': return `${base}?`
      case 'typescript': return `${base} | null`
      default: return base
    }
  }
  return base
}

// ====== 辅助：收集所有嵌套 object 定义 ======

interface NestedDef {
  name: string
  field: SchemaField
}

const collectNestedObjects = (fields: SchemaField[], parentName: string): NestedDef[] => {
  const result: NestedDef[] = []
  for (const f of fields) {
    const typeName = formatTypeName(f.name, 'typescript')
    if (f.type === 'object' && f.children.length) {
      result.push({ name: parentName + typeName, field: f })
      result.push(...collectNestedObjects(f.children, parentName + typeName))
    }
    if (f.type === 'array' && f.items) {
      if (f.items.type === 'object' && f.items.children.length) {
        result.push({ name: parentName + typeName + 'Item', field: f.items })
        result.push(...collectNestedObjects(f.items.children, parentName + typeName + 'Item'))
      }
    }
  }
  return result
}

// ====== 各语言生成器 ======

const generateTypeScript = (doc: SchemaDocument, fields: SchemaField[], rootName: string): string => {
  const lines: string[] = []
  const rootPascal = formatTypeName(rootName, 'typescript')

  const emitInterface = (name: string, f: SchemaField) => {
    if (f.type !== 'object' || !f.children.length) return
    lines.push(`export interface ${name} {`)
    for (const child of f.children) {
      const fieldName = formatFieldName(child.name, 'typescript')
      const typeStr = getTypeStr(child, 'typescript', rootPascal + toPascalCase(child.name))
      const opt = child.required ? '' : '?'
      lines.push(`  ${fieldName}${opt}: ${typeStr}`)
    }
    lines.push('}')
    lines.push('')
  }

  // Nested objects first
  const nested = collectNestedObjects(fields, rootPascal)
  for (const n of nested) emitInterface(n.name, n.field)

  // Root interface
  lines.push(`export interface ${rootPascal} {`)
  for (const f of fields) {
    const fieldName = formatFieldName(f.name, 'typescript')
    const typeStr = getTypeStr(f, 'typescript', rootPascal + toPascalCase(f.name))
    const opt = f.required ? '' : '?'
    lines.push(`  ${fieldName}${opt}: ${typeStr}`)
  }
  lines.push('}')

  return lines.join('\n')
}

const generateJava = (doc: SchemaDocument, fields: SchemaField[], rootName: string): string => {
  const lines: string[] = []
  const className = formatTypeName(rootName, 'java')

  // Inner class definitions
  const nested = collectNestedObjects(fields, className)
  const innerClasses = new Map<string, string>()
  for (const n of nested) {
    const innerName = n.name.replace(className, '')
    let code = `    public static class ${innerName} {\n`
    for (const child of n.field.children) {
      const fieldName = formatFieldName(child.name, 'java')
      const typeStr = getTypeStr(child, 'java', innerName + toPascalCase(child.name))
      code += `        @JsonProperty("${child.name}")\n`
      code += `        private ${typeStr} ${fieldName};\n\n`
    }
    // getters
    for (const child of n.field.children) {
      const fieldName = formatFieldName(child.name, 'java')
      const typeStr = getTypeStr(child, 'java', innerName + toPascalCase(child.name))
      code += `        public ${typeStr} get${toPascalCase(fieldName)}() { return ${fieldName}; }\n`
    }
    code += '    }\n'
    innerClasses.set(n.name, code)
  }

  lines.push(`import com.fasterxml.jackson.annotation.JsonProperty;`)
  if (fields.some(f => f.type === 'array')) lines.push(`import java.util.List;`)
  lines.push('')
  lines.push(`public class ${className} {`)

  for (const f of fields) {
    const fieldName = formatFieldName(f.name, 'java')
    const typeStr = getTypeStr(f, 'java', className + toPascalCase(f.name))
    lines.push('')
    lines.push(`    @JsonProperty("${f.name}")`)
    lines.push(`    private ${typeStr} ${fieldName};`)
  }

  lines.push('')
  // Getters
  for (const f of fields) {
    const fieldName = formatFieldName(f.name, 'java')
    const typeStr = getTypeStr(f, 'java', className + toPascalCase(f.name))
    lines.push(`    public ${typeStr} get${toPascalCase(fieldName)}() {`)
    lines.push(`        return ${fieldName};`)
    lines.push(`    }`)
    lines.push('')
  }

  // Inner classes
  for (const [, code] of innerClasses) {
    lines.push(code)
  }

  lines.push('}')
  return lines.join('\n')
}

const generatePython = (doc: SchemaDocument, fields: SchemaField[], rootName: string): string => {
  const lines: string[] = ['from dataclasses import dataclass, field', 'from typing import Optional, List, Any', '']

  const rootPascal = formatTypeName(rootName, 'python')

  // Nested classes first
  const nested = collectNestedObjects(fields, rootPascal)
  for (const n of nested) {
    const name = n.name.replace(rootPascal, '')
    lines.push(`@dataclass`)
    lines.push(`class ${name}:`)
    if (n.field.children.length === 0) { lines.push('    pass') }
    for (const child of n.field.children) {
      const fieldName = formatFieldName(child.name, 'python')
      const typeStr = getTypeStr(child, 'python', name + toPascalCase(child.name))
      if (child.required) {
        lines.push(`    ${fieldName}: ${typeStr}`)
      } else {
        lines.push(`    ${fieldName}: Optional[${typeStr}] = None`)
      }
    }
    lines.push('')
  }

  lines.push(`@dataclass`)
  lines.push(`class ${rootPascal}:`)
  if (fields.length === 0) { lines.push('    pass') }
  for (const f of fields) {
    const fieldName = formatFieldName(f.name, 'python')
    const typeStr = getTypeStr(f, 'python', rootPascal + toPascalCase(f.name))
    if (f.required) {
      lines.push(`    ${fieldName}: ${typeStr}`)
    } else {
      lines.push(`    ${fieldName}: Optional[${typeStr}] = None`)
    }
  }

  return lines.join('\n')
}

const generateGo = (doc: SchemaDocument, fields: SchemaField[], rootName: string): string => {
  const lines: string[] = ['package main', '']
  const structName = formatTypeName(rootName, 'go')

  const emitStruct = (name: string, f: SchemaField) => {
    if (f.type !== 'object' || !f.children.length) return
    lines.push(`type ${name} struct {`)
    for (const child of f.children) {
      const fieldName = formatFieldName(child.name, 'go')
      const typeStr = getTypeStr(child, 'go', name + toPascalCase(child.name))
      lines.push(`  ${toPascalCase(fieldName)} ${typeStr} \`json:"${child.name}"\``)
    }
    lines.push('}')
    lines.push('')
  }

  const nested = collectNestedObjects(fields, structName)
  for (const n of nested) emitStruct(n.name, n.field)

  lines.push(`type ${structName} struct {`)
  for (const f of fields) {
    const fieldName = formatFieldName(f.name, 'go')
    const typeStr = getTypeStr(f, 'go', structName + toPascalCase(f.name))
    lines.push(`  ${toPascalCase(fieldName)} ${typeStr} \`json:"${f.name}"\``)
  }
  lines.push('}')

  return lines.join('\n')
}

const generateCSharp = (doc: SchemaDocument, fields: SchemaField[], rootName: string): string => {
  const lines: string[] = ['using System.Text.Json.Serialization;', 'using System.Collections.Generic;', '']
  const className = formatTypeName(rootName, 'csharp')

  const nested = collectNestedObjects(fields, className)
  for (const n of nested) {
    const name = n.name.replace(className, '')
    lines.push(`public class ${name}`)
    lines.push(`{`)
    for (const child of n.field.children) {
      const fieldName = formatFieldName(child.name, 'csharp')
      const typeStr = getTypeStr(child, 'csharp', name + toPascalCase(child.name))
      lines.push(`    [JsonPropertyName("${child.name}")]`)
      lines.push(`    public ${typeStr} ${toPascalCase(fieldName)} { get; set; }`)
      lines.push('')
    }
    lines.push('}')
    lines.push('')
  }

  lines.push(`public class ${className}`)
  lines.push(`{`)
  for (const f of fields) {
    const fieldName = formatFieldName(f.name, 'csharp')
    const typeStr = getTypeStr(f, 'csharp', className + toPascalCase(f.name))
    lines.push(`    [JsonPropertyName("${f.name}")]`)
    lines.push(`    public ${typeStr} ${toPascalCase(fieldName)} { get; set; }`)
    lines.push('')
  }
  lines.push('}')

  return lines.join('\n')
}

const generateRust = (doc: SchemaDocument, fields: SchemaField[], rootName: string): string => {
  const lines: string[] = ['use serde::{Serialize, Deserialize};', '']
  const structName = formatTypeName(rootName, 'rust')

  const nested = collectNestedObjects(fields, structName)
  for (const n of nested) {
    const name = n.name.replace(structName, '')
    lines.push(`#[derive(Debug, Clone, Serialize, Deserialize)]`)
    lines.push(`pub struct ${name} {`)
    for (const child of n.field.children) {
      const fieldName = formatFieldName(child.name, 'rust')
      const typeStr = getTypeStr(child, 'rust', name + toPascalCase(child.name), !child.required)
      const serdeAttrs = [`rename = "${child.name}"`]
      if (!child.required) serdeAttrs.push('default', 'skip_serializing_if = "Option::is_none"')
      lines.push(`    #[serde(${serdeAttrs.join(', ')})]`)
      lines.push(`    pub ${fieldName}: ${typeStr},`)
    }
    lines.push('}')
    lines.push('')
  }

  lines.push(`#[derive(Debug, Clone, Serialize, Deserialize)]`)
  lines.push(`pub struct ${structName} {`)
  for (const f of fields) {
    const fieldName = formatFieldName(f.name, 'rust')
    const typeStr = getTypeStr(f, 'rust', structName + toPascalCase(f.name), !f.required)
    const serdeAttrs = [`rename = "${f.name}"`]
    if (!f.required) serdeAttrs.push('default', 'skip_serializing_if = "Option::is_none"')
    lines.push(`    #[serde(${serdeAttrs.join(', ')})]`)
    lines.push(`    pub ${fieldName}: ${typeStr},`)
  }
  lines.push('}')

  return lines.join('\n')
}

const generateSwift = (doc: SchemaDocument, fields: SchemaField[], rootName: string): string => {
  const lines: string[] = ['import Foundation', '']
  const structName = formatTypeName(rootName, 'swift')

  const nested = collectNestedObjects(fields, structName)
  for (const n of nested) {
    const name = n.name.replace(structName, '')
    lines.push(`struct ${name}: Codable {`)
    for (const child of n.field.children) {
      const fieldName = formatFieldName(child.name, 'swift')
      const typeStr = getTypeStr(child, 'swift', name + toPascalCase(child.name))
      const codingKey = fieldName !== child.name ? `    enum CodingKeys: String, CodingKey { case ${fieldName} = "${child.name}" }\n` : ''
      if (codingKey) lines.push(codingKey)
      lines.push(`    let ${fieldName}: ${typeStr}${child.required ? '' : '?'}`)
    }
    lines.push('}')
    lines.push('')
  }

  lines.push(`struct ${structName}: Codable {`)
  for (const f of fields) {
    const fieldName = formatFieldName(f.name, 'swift')
    const typeStr = getTypeStr(f, 'swift', structName + toPascalCase(f.name))
    lines.push(`    let ${fieldName}: ${typeStr}${f.required ? '' : '?'}`)
  }
  lines.push('}')

  return lines.join('\n')
}

const generateCpp = (doc: SchemaDocument, fields: SchemaField[], rootName: string): string => {
  const lines: string[] = ['#include <string>', '#include <vector>', '#include <optional>', '#include <nlohmann/json.hpp>', '', 'using json = nlohmann::json;', '']
  const structName = formatTypeName(rootName, 'cpp')

  const nested = collectNestedObjects(fields, structName)
  for (const n of nested) {
    const name = n.name.replace(structName, '')
    lines.push(`struct ${name} {`)
    for (const child of n.field.children) {
      const fieldName = formatFieldName(child.name, 'cpp')
      const typeStr = getTypeStr(child, 'cpp', name + toPascalCase(child.name))
      lines.push(`    ${typeStr} ${fieldName};`)
    }
    lines.push('};')
    lines.push('')
  }

  lines.push(`struct ${structName} {`)
  for (const f of fields) {
    const fieldName = formatFieldName(f.name, 'cpp')
    const typeStr = getTypeStr(f, 'cpp', structName + toPascalCase(f.name))
    lines.push(`    ${typeStr} ${fieldName};`)
  }
  lines.push('};')

  return lines.join('\n')
}

const generatePhp = (doc: SchemaDocument, fields: SchemaField[], rootName: string): string => {
  const lines: string[] = ['<?php', '']
  const className = formatTypeName(rootName, 'php')

  lines.push(`class ${className}`)
  lines.push(`{`)
  for (const f of fields) {
    const fieldName = formatFieldName(f.name, 'php')
    const typeStr = getTypeStr(f, 'php', className + toPascalCase(f.name))
    lines.push(`    public ${typeStr} $${fieldName};`)
  }
  lines.push('}')

  return lines.join('\n')
}

const generateJavaScript = (doc: SchemaDocument, fields: SchemaField[], rootName: string): string => {
  const lines: string[] = ['/**', ` * @typedef {Object} ${formatTypeName(rootName, 'javascript')}`]
  for (const f of fields) {
    const typeStr = getTypeStr(f, 'javascript', rootName + toPascalCase(f.name))
    const desc = f.description ? ` - ${f.description}` : ''
    lines.push(` * @property {${typeStr}} ${f.name}${desc}`)
  }
  lines.push(' */')
  return lines.join('\n')
}

// ====== 主入口 ======

const generators: Record<CodeGenLanguage, (doc: SchemaDocument, fields: SchemaField[], rootName: string) => string> = {
  typescript: generateTypeScript,
  java: generateJava,
  python: generatePython,
  go: generateGo,
  csharp: generateCSharp,
  cpp: generateCpp,
  php: generatePhp,
  rust: generateRust,
  swift: generateSwift,
  javascript: generateJavaScript,
}

export const generateCode = (doc: SchemaDocument, language: CodeGenLanguage): CodeGenResult => {
  const langMeta = { typescript: { ext: '.ts', label: 'TypeScript' }, java: { ext: '.java', label: 'Java' }, python: { ext: '.py', label: 'Python' }, go: { ext: '.go', label: 'Go' }, csharp: { ext: '.cs', label: 'C#' }, cpp: { ext: '.h', label: 'C++' }, php: { ext: '.php', label: 'PHP' }, rust: { ext: '.rs', label: 'Rust' }, swift: { ext: '.swift', label: 'Swift' }, javascript: { ext: '.js', label: 'JavaScript' } }

  const generator = generators[language]
  const code = generator(doc, doc.fields, doc.title)
  const meta = langMeta[language]

  return {
    language,
    code,
    extension: meta.ext,
    label: meta.label,
  }
}
