import { ref, watch } from 'vue'
import yaml from 'js-yaml'
import Papa from 'papaparse'
import { toast } from '@/composables/useToast'

export type ConvertFormat = 'json' | 'yaml' | 'csv'

export function useConvert() {
  const sourceFormat = ref<ConvertFormat>('json')
  const targetFormat = ref<ConvertFormat>('yaml')
  const convertInput = ref('')
  const convertOutput = ref('')
  const convertError = ref('')

  function executeConvert() {
    convertError.value = ''
    convertOutput.value = ''

    if (sourceFormat.value === targetFormat.value) {
      convertOutput.value = convertInput.value
      return
    }

    const input = convertInput.value.trim()
    if (!input) return

    try {
      // 解析源格式
      let data: any
      switch (sourceFormat.value) {
        case 'json':
          data = JSON.parse(input)
          break
        case 'yaml':
          data = yaml.load(input)
          break
        case 'csv':
          const csvResult = Papa.parse(input, { header: true, skipEmptyLines: true, dynamicTyping: true })
          if (csvResult.errors.length > 0) {
            convertError.value = `CSV 解析错误: ${csvResult.errors[0].message}`
            return
          }
          data = csvResult.data
          break
      }

      if (data === undefined || data === null) {
        convertError.value = '源数据为空'
        return
      }

      // 生成目标格式
      switch (targetFormat.value) {
        case 'json':
          convertOutput.value = JSON.stringify(data, null, 2)
          break
        case 'yaml':
          convertOutput.value = yaml.dump(data, { indent: 2, lineWidth: 120, noRefs: true, quotingType: '"' })
          break
        case 'csv':
          if (!Array.isArray(data)) {
            convertError.value = 'CSV 转换仅支持对象数组'
            return
          }
          if (data.length === 0) {
            convertError.value = '数组为空，无法生成 CSV'
            return
          }
          // 检查是否嵌套
          const hasNested = data.some((item: any) =>
            item !== null && typeof item === 'object' && !Array.isArray(item) &&
            Object.values(item).some((v: any) => v !== null && typeof v === 'object')
          )
          if (hasNested) {
            // 将嵌套对象序列化为 JSON 字符串
            const flattened = data.map((item: any) => {
              if (item === null || typeof item !== 'object') return item
              const row: Record<string, any> = {}
              for (const [k, v] of Object.entries(item)) {
                row[k] = v !== null && typeof v === 'object' ? JSON.stringify(v) : v
              }
              return row
            })
            convertOutput.value = Papa.unparse(flattened)
          } else if (typeof data[0] === 'object' && data[0] !== null && !Array.isArray(data[0])) {
            convertOutput.value = Papa.unparse(data)
          } else {
            convertError.value = 'CSV 转换仅支持对象数组（如 [{...}, {...}]）'
            return
          }
          break
      }
    } catch (e: any) {
      convertError.value = e.message || '转换失败'
    }
  }

  async function copyConvertOutput() {
    if (!convertOutput.value) return
    try {
      await navigator.clipboard.writeText(convertOutput.value)
      toast.success('已复制到剪贴板', 1500)
    } catch { /* ignore */ }
  }

  function downloadConvertOutput() {
    if (!convertOutput.value) return
    const extMap: Record<ConvertFormat, string> = { json: '.json', yaml: '.yaml', csv: '.csv' }
    const mimeMap: Record<ConvertFormat, string> = { json: 'application/json', yaml: 'text/yaml', csv: 'text/csv' }
    const blob = new Blob([convertOutput.value], { type: mimeMap[targetFormat.value] })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted${extMap[targetFormat.value]}`
    a.click()
    URL.revokeObjectURL(url)
  }

  function clearConvert() {
    convertInput.value = ''
    convertOutput.value = ''
    convertError.value = ''
  }

  async function pasteConvertInput() {
    try {
      const text = await navigator.clipboard.readText()
      convertInput.value = text
      executeConvert()
    } catch { /* ignore */ }
  }

  function swapFormats() {
    const tmp = sourceFormat.value
    sourceFormat.value = targetFormat.value
    targetFormat.value = tmp
    if (convertOutput.value) {
      convertInput.value = convertOutput.value
      convertOutput.value = ''
      executeConvert()
    }
  }

  // 源/目标格式变化时自动重转换
  watch([sourceFormat, targetFormat], () => {
    if (convertInput.value.trim()) executeConvert()
  })

  return {
    sourceFormat, targetFormat,
    convertInput, convertOutput, convertError,
    executeConvert, clearConvert, pasteConvertInput,
    copyConvertOutput, downloadConvertOutput, swapFormats,
  }
}
