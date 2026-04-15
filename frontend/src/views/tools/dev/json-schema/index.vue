<script setup lang="ts">
import {
  Plus,
  Upload,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  X,
  ChevronRight,
  FileJson,
  Check,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import { useJsonSchema, previewTabs } from './useJsonSchema'
import { useTooltip } from '@/composables/useTooltip'
import { FIELD_TYPES, STRING_FORMATS, CODE_GEN_LANGUAGES } from '@/types/json-schema'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
  document,
  selectedFieldId,
  activeTab,
  codeGenLanguage,
  showImportModal,
  importJson,
  importError,
  fieldEditorEl,
  editorPos,
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
} = useJsonSchema()
</script>

<template>
  <div class="tool-page">
    <ToolTitleBar title="JSON Schema 设计器" icon="icon-schema">
      <div class="header-content">
        <span v-if="fieldCount" class="stat-tag">{{ fieldCount }} 个字段</span>
      </div>
    </ToolTitleBar>

    <main class="tool-main split">
      <!-- Left: Schema editor -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><FileJson :size="14" /></span>
            <span>Schema 编辑器</span>
          </div>
          <div class="panel-actions">
            <button class="action-btn" @click="showImportModal = true"
              @mouseenter="showTooltip('导入 Schema', $event)" @mouseleave="hideTooltip">
              <Upload :size="13" />
            </button>
            <button class="add-field-btn" @click="addField"
              @mouseenter="showTooltip('添加字段', $event)" @mouseleave="hideTooltip">
              <Plus :size="13" />
            </button>
          </div>
        </div>

        <div class="tool-panel-body">
          <!-- Metadata -->
          <div class="config-section">
            <div class="meta-row">
              <div class="meta-field">
                <label class="config-label">标题</label>
                <input v-model="document.title" type="text" class="config-input" placeholder="Schema 标题" />
              </div>
              <div class="meta-field">
                <label class="config-label">描述</label>
                <input v-model="document.description" type="text" class="config-input" placeholder="Schema 描述（可选）" />
              </div>
            </div>
          </div>

          <!-- Field tree -->
          <div class="config-section grow">
            <label class="config-label">字段列表</label>
            <div class="field-tree">
              <div
                v-for="item in flattenedFields"
                :key="item.field.id"
                class="field-row"
                :class="{
                  selected: selectedFieldId === item.field.id,
                  'has-children': item.field.type === 'object' || item.field.type === 'array',
                }"
                :style="{ paddingLeft: item.depth * 20 + 8 + 'px' }"
                @click="selectField(item.field.id)"
              >
                <span
                  v-if="item.field.type === 'object' || item.field.type === 'array'"
                  class="expand-arrow"
                  :class="{ expanded: item.field.expanded }"
                  @click.stop="toggleExpand(item.field.id)"
                >
                  <ChevronRight :size="12" />
                </span>
                <span v-else class="expand-arrow-placeholder"></span>

                <span class="field-name">{{ item.field.name }}</span>

                <span class="type-badge" :class="'type-' + item.field.type">
                  {{ item.field.type }}
                </span>

                <span v-if="item.field.required" class="required-indicator" title="必填">*</span>

                <div class="field-actions">
                  <button class="action-btn mini" @click.stop="moveField(item.field.id, 'up')"
                    @mouseenter="showTooltip('上移', $event)" @mouseleave="hideTooltip"><ArrowUp :size="11" /></button>
                  <button class="action-btn mini" @click.stop="moveField(item.field.id, 'down')"
                    @mouseenter="showTooltip('下移', $event)" @mouseleave="hideTooltip"><ArrowDown :size="11" /></button>
                  <button class="action-btn mini" @click.stop="duplicateField(item.field.id)"
                    @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip"><Copy :size="11" /></button>
                  <button class="action-btn mini danger" @click.stop="deleteField(item.field.id)"
                    @mouseenter="showTooltip('删除', $event)" @mouseleave="hideTooltip"><Trash2 :size="11" /></button>
                </div>
              </div>

              <div v-if="flattenedFields.length === 0" class="tool-empty">
                <div class="empty-icon"><FileJson :size="28" /></div>
                <p class="empty-title">暂无字段</p>
                <p class="empty-desc">点击上方 + 按钮开始设计 Schema</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Right: Preview -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Check :size="14" /></span>
            <span>预览</span>
          </div>
          <div class="panel-actions">
            <div class="preview-tabs">
              <button v-for="tab in previewTabs" :key="tab.key"
                :class="['seg-btn xs', { active: activeTab === tab.key }]"
                @click="activeTab = tab.key">
                {{ tab.label }}
              </button>
            </div>
            <div class="panel-divider"></div>
            <button v-if="activeTab === 'schema'" class="action-btn" @click="copyToClipboard(schemaJson, 'Schema JSON')"
              @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip">
              <Copy :size="13" />
            </button>
            <button v-if="activeTab === 'sample'" class="action-btn" @click="copyToClipboard(sampleJson, '示例数据')"
              @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip">
              <Copy :size="13" />
            </button>
            <button v-if="activeTab === 'codegen'" class="action-btn" @click="copyToClipboard(codeGenResult.code, '生成的代码')"
              @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip">
              <Copy :size="13" />
            </button>
            <button v-if="activeTab === 'openapi'" class="action-btn" @click="copyToClipboard(openApiJson, 'OpenAPI 规范')"
              @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip">
              <Copy :size="13" />
            </button>
          </div>
        </div>

        <div class="tool-panel-body">
          <!-- Code gen language bar -->
          <div v-if="activeTab === 'codegen'" class="config-section">
            <div class="lang-bar">
              <button v-for="lang in CODE_GEN_LANGUAGES" :key="lang.value"
                :class="['seg-btn xxs', { active: codeGenLanguage === lang.value }]"
                @click="codeGenLanguage = lang.value">
                {{ lang.label }}
              </button>
            </div>
          </div>

          <!-- Schema JSON -->
          <template v-if="activeTab === 'schema'">
            <div v-if="!document.fields.length" class="tool-empty">
              <div class="empty-icon"><FileJson :size="36" /></div>
              <p class="empty-title">暂无内容</p>
              <p class="empty-desc">添加字段后生成 JSON Schema</p>
            </div>
            <div v-else class="code-output">
              <div v-for="(line, idx) in schemaJsonLines" :key="idx" class="code-line">
                <span class="line-num">{{ idx + 1 }}</span>
                <pre class="line-content"><code v-html="line || ' '"></code></pre>
              </div>
            </div>
          </template>

          <!-- Sample data -->
          <template v-if="activeTab === 'sample'">
            <div v-if="!document.fields.length" class="tool-empty">
              <div class="empty-icon"><FileJson :size="36" /></div>
              <p class="empty-title">暂无内容</p>
              <p class="empty-desc">添加字段后生成示例数据</p>
            </div>
            <div v-else class="code-output">
              <div v-for="(line, idx) in sampleJsonLines" :key="idx" class="code-line">
                <span class="line-num">{{ idx + 1 }}</span>
                <pre class="line-content"><code v-html="line || ' '"></code></pre>
              </div>
            </div>
          </template>

          <!-- Code generation -->
          <template v-if="activeTab === 'codegen'">
            <div v-if="!document.fields.length" class="tool-empty">
              <div class="empty-icon"><FileJson :size="36" /></div>
              <p class="empty-title">暂无内容</p>
              <p class="empty-desc">添加字段后生成代码</p>
            </div>
            <div v-else class="code-output">
              <div v-for="(line, idx) in codeGenLines" :key="idx" class="code-line">
                <span class="line-num">{{ idx + 1 }}</span>
                <pre class="line-content"><code v-html="line || ' '"></code></pre>
              </div>
            </div>
          </template>

          <!-- OpenAPI -->
          <template v-if="activeTab === 'openapi'">
            <div v-if="!document.fields.length" class="tool-empty">
              <div class="empty-icon"><FileJson :size="36" /></div>
              <p class="empty-title">暂无内容</p>
              <p class="empty-desc">添加字段后生成 OpenAPI 规范</p>
            </div>
            <div v-else class="code-output">
              <div v-for="(line, idx) in openApiJsonLines" :key="idx" class="code-line">
                <span class="line-num">{{ idx + 1 }}</span>
                <pre class="line-content"><code v-html="line || ' '"></code></pre>
              </div>
            </div>
          </template>
        </div>
      </section>
    </main>

    <!-- Field editor popup -->
    <Teleport to="body">
      <div v-if="selectedField" ref="fieldEditorEl" class="field-editor-popup"
        :style="{ top: editorPos.top + 'px', left: editorPos.left + 'px' }">
        <div class="editor-header" @mousedown.prevent="startDrag">
          <span class="editor-title">编辑字段</span>
          <button class="action-btn mini" @click="selectedFieldId = null"
            @mouseenter="showTooltip('关闭', $event)" @mouseleave="hideTooltip"><X :size="11" /></button>
        </div>
        <div class="editor-body">
          <!-- Basic -->
          <div class="editor-section">
            <div class="editor-row">
              <label>字段名</label>
              <input v-model="selectedField.name" type="text" class="tool-input" @input="updateField(selectedField.id, { name: selectedField.name })" />
            </div>
            <div class="editor-row">
              <label>类型</label>
              <select v-model="selectedField.type" class="tool-select" @change="onFieldTypeChange">
                <option v-for="type in FIELD_TYPES" :key="type.value" :value="type.value">{{ type.label }}</option>
              </select>
            </div>
            <div class="editor-row">
              <label>描述</label>
              <textarea v-model="selectedField.description" class="tool-textarea" rows="2" placeholder="字段描述" @input="updateField(selectedField.id, { description: selectedField.description })"></textarea>
            </div>
            <div class="editor-row checkbox-row">
              <label>
                <input v-model="selectedField.required" type="checkbox" @change="updateField(selectedField.id, { required: selectedField.required })" />
                <span>必填</span>
              </label>
            </div>
            <div class="editor-row">
              <label>默认值</label>
              <input v-model="selectedField.defaultValue" type="text" class="tool-input" placeholder="默认值 (JSON)" @input="updateField(selectedField.id, { defaultValue: selectedField.defaultValue })" />
            </div>
          </div>

          <!-- String constraints -->
          <div v-if="selectedField.type === 'string'" class="editor-section">
            <div class="section-title">字符串约束</div>
            <div class="editor-row">
              <label>格式</label>
              <select v-model="selectedField.format" class="tool-select" @change="updateField(selectedField.id, { format: selectedField.format })">
                <option value="">无</option>
                <option v-for="fmt in STRING_FORMATS" :key="fmt.value" :value="fmt.value">{{ fmt.label }}</option>
              </select>
            </div>
            <div class="editor-row">
              <label>正则</label>
              <input v-model="selectedField.pattern" type="text" class="tool-input" placeholder="^.*$" @input="updateField(selectedField.id, { pattern: selectedField.pattern })" />
            </div>
            <div class="editor-row">
              <label>枚举值</label>
              <input v-model="enumValuesInput" type="text" class="tool-input" placeholder="值1, 值2, 值3" @input="onEnumValuesChange" />
            </div>
            <div class="editor-row">
              <label>最小长度</label>
              <input v-model.number="selectedField.minLength" type="number" class="tool-input" min="0" @input="updateField(selectedField.id, { minLength: selectedField.minLength })" />
            </div>
            <div class="editor-row">
              <label>最大长度</label>
              <input v-model.number="selectedField.maxLength" type="number" class="tool-input" min="0" @input="updateField(selectedField.id, { maxLength: selectedField.maxLength })" />
            </div>
          </div>

          <!-- Number constraints -->
          <div v-if="selectedField.type === 'number' || selectedField.type === 'integer'" class="editor-section">
            <div class="section-title">数值约束</div>
            <div class="editor-row">
              <label>最小值</label>
              <input v-model.number="selectedField.minimum" type="number" class="tool-input" @input="updateField(selectedField.id, { minimum: selectedField.minimum })" />
            </div>
            <div class="editor-row">
              <label>最大值</label>
              <input v-model.number="selectedField.maximum" type="number" class="tool-input" @input="updateField(selectedField.id, { maximum: selectedField.maximum })" />
            </div>
            <div class="editor-row checkbox-row">
              <label>
                <input v-model="selectedField.exclusiveMinimum" type="checkbox" @change="updateField(selectedField.id, { exclusiveMinimum: selectedField.exclusiveMinimum })" />
                <span>排他最小值</span>
              </label>
            </div>
            <div class="editor-row checkbox-row">
              <label>
                <input v-model="selectedField.exclusiveMaximum" type="checkbox" @change="updateField(selectedField.id, { exclusiveMaximum: selectedField.exclusiveMaximum })" />
                <span>排他最大值</span>
              </label>
            </div>
            <div class="editor-row">
              <label>倍数</label>
              <input v-model.number="selectedField.multipleOf" type="number" class="tool-input" min="0" step="any" @input="updateField(selectedField.id, { multipleOf: selectedField.multipleOf })" />
            </div>
          </div>

          <!-- Array constraints -->
          <div v-if="selectedField.type === 'array'" class="editor-section">
            <div class="section-title">数组约束</div>
            <div class="editor-row">
              <label>最小项数</label>
              <input v-model.number="selectedField.minItems" type="number" class="tool-input" min="0" @input="updateField(selectedField.id, { minItems: selectedField.minItems })" />
            </div>
            <div class="editor-row">
              <label>最大项数</label>
              <input v-model.number="selectedField.maxItems" type="number" class="tool-input" min="0" @input="updateField(selectedField.id, { maxItems: selectedField.maxItems })" />
            </div>
            <div class="editor-row checkbox-row">
              <label>
                <input v-model="selectedField.uniqueItems" type="checkbox" @change="updateField(selectedField.id, { uniqueItems: selectedField.uniqueItems })" />
                <span>唯一项</span>
              </label>
            </div>
            <div v-if="selectedField.items" class="editor-row">
              <label>元素类型</label>
              <select v-model="selectedField.items.type" class="tool-select" @change="onItemsTypeChange">
                <option v-for="type in FIELD_TYPES" :key="type.value" :value="type.value">{{ type.label }}</option>
              </select>
            </div>
          </div>

          <!-- Object children -->
          <div v-if="selectedField.type === 'object'" class="editor-section">
            <div class="section-title">对象属性</div>
            <div class="editor-row">
              <button class="add-child-btn" @click="addChildField(selectedField.id)">
                <Plus :size="12" />
                <span>添加子字段</span>
              </button>
            </div>
            <div v-if="selectedField.children.length === 0" class="hint-text">
              暂无子字段，添加字段以定义对象属性
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Import modal -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <span class="modal-title">导入 JSON Schema</span>
          <button class="action-btn mini" @click="showImportModal = false"
            @mouseenter="showTooltip('关闭', $event)" @mouseleave="hideTooltip"><X :size="11" /></button>
        </div>
        <div class="modal-body">
          <textarea v-model="importJson" class="tool-textarea" rows="10"
            placeholder='粘贴 JSON Schema，例如：{ "type": "object", "properties": { ... } }' />
          <div v-if="importError" class="import-error">
            <p>{{ importError }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn" @click="showImportModal = false">取消</button>
          <button class="modal-btn primary" @click="importSchema">导入</button>
        </div>
      </div>
    </div>

    <!-- Tooltip -->
    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">{{ tooltip.text }}</div>
  </div>
</template>

<style scoped>
/* ====== Header ====== */
.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 4px;
}

.stat-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  font-family: var(--font-mono);
}

/* ====== Panel Actions ====== */
.panel-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.panel-divider {
  width: 1px;
  height: 16px;
  background: var(--border-subtle);
  margin: 0 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 6px;
  transition: all var(--transition-fast);
  padding: 0;
}

.action-btn:hover { color: var(--text-primary); background: var(--bg-hover); }
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.action-btn.mini { width: 22px; height: 22px; }
.action-btn.mini.danger:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

.add-field-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;
}

.add-field-btn:hover { filter: brightness(1.1); }

/* ====== Config Sections ====== */
.tool-panel-body {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
}

.config-section {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.config-section.grow {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-bottom: none;
  min-height: 0;
}

.config-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* ====== Segment Buttons ====== */
.seg-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 5px 12px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.seg-btn:hover { border-color: var(--border-default); background: var(--bg-hover); color: var(--text-primary); }

.seg-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.seg-btn.xs { padding: 3px 8px; font-size: 11px; height: 24px; }
.seg-btn.xxs { padding: 2px 7px; font-size: 10px; height: 20px; }

/* ====== Preview Tabs ====== */
.preview-tabs {
  display: flex;
  gap: 2px;
}

/* ====== Metadata ====== */
.meta-row {
  display: flex;
  gap: 10px;
}

.meta-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-input {
  width: 100%;
  height: 30px;
  padding: 0 10px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  outline: none;
  transition: all var(--transition-fast);
}

.config-input:hover { border-color: var(--border-strong); }
.config-input:focus { border-color: var(--accent); box-shadow: var(--shadow-focus); }
.config-input::placeholder { color: var(--text-muted); }

/* ====== Field Tree ====== */
.field-tree {
  flex: 1;
  overflow: auto;
  min-height: 0;
  padding: 4px 0;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  background: var(--bg-secondary);
}

.field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.field-row:hover { background: var(--bg-hover); }

.field-row.selected {
  background: var(--accent-light);
  border-left: 3px solid var(--accent);
}

.expand-arrow {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast);
  flex-shrink: 0;
  color: var(--text-muted);
}

.expand-arrow.expanded { transform: rotate(90deg); }

.expand-arrow-placeholder { width: 16px; flex-shrink: 0; }

.field-name {
  flex: 1;
  font-size: 12px;
  color: var(--text-primary);
  font-family: var(--font-mono);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-badge {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 10px;
  font-weight: 600;
  text-transform: uppercase;
  flex-shrink: 0;
  letter-spacing: 0.3px;
}

.type-string { color: #22c55e; background: rgba(34, 197, 94, 0.1); }
.type-number { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
.type-integer { color: #06b6d4; background: rgba(6, 182, 212, 0.1); }
.type-boolean { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
.type-null { color: #94a3b8; background: rgba(148, 163, 184, 0.1); }
.type-object { color: #a855f7; background: rgba(168, 85, 247, 0.1); }
.type-array { color: #ec4899; background: rgba(236, 72, 153, 0.1); }

.required-indicator {
  color: var(--error);
  font-size: 14px;
  font-weight: bold;
  flex-shrink: 0;
}

.field-actions {
  display: flex;
  gap: 1px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.field-row:hover .field-actions { opacity: 1; }

/* ====== Code Output ====== */
.lang-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.code-output {
  flex: 1;
  overflow: auto;
  padding: 8px 0;
  font-family: 'JetBrains Mono', 'Fira Code', var(--font-mono), monospace;
  font-size: 13px;
  line-height: 1.7;
}

.code-line {
  display: flex;
  align-items: flex-start;
  padding: 0 16px;
}

.code-line:hover {
  background: rgba(0, 0, 0, 0.03);
}

.line-num {
  width: 40px;
  padding-right: 12px;
  text-align: right;
  font-size: 11px;
  font-family: inherit;
  color: var(--text-muted);
  line-height: 1.7;
  user-select: none;
  opacity: 0.5;
  flex-shrink: 0;
}

.line-content {
  flex: 1;
  margin: 0;
  padding: 0;
  font-size: 13px;
  font-family: inherit;
  line-height: 1.7;
  white-space: pre;
  color: var(--text-primary);
  background: transparent;
}

.line-content code {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  background: transparent;
}

/* ====== Field Editor Popup ====== */
.field-editor-popup {
  position: fixed;
  z-index: 1000;
  width: 360px;
  max-height: 520px;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: editorPopupIn 0.15s ease-out;
}

@keyframes editorPopupIn {
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.editor-header {
  cursor: grab;
  user-select: none;
  padding: 8px 12px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.editor-header:active { cursor: grabbing; }

.editor-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.editor-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px;
}

.editor-section {
  margin-bottom: 14px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.editor-section:last-child { margin-bottom: 0; }

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-subtle);
}

.editor-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.editor-row:last-child { margin-bottom: 0; }

.editor-row label {
  min-width: 60px;
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

.editor-row.checkbox-row label {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: auto;
  cursor: pointer;
  padding: 5px 10px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  transition: all var(--transition-fast);
  font-size: 12px;
}

.editor-row.checkbox-row label:hover {
  border-color: var(--accent);
  background: var(--accent-light);
}

.editor-row input[type='text'],
.editor-row input[type='number'],
.editor-row select,
.editor-row textarea {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 12px;
  transition: all var(--transition-fast);
  outline: none;
}

.editor-row input:focus,
.editor-row select:focus,
.editor-row textarea:focus {
  border-color: var(--accent);
  box-shadow: var(--shadow-focus);
}

.editor-row input[type='checkbox'] {
  width: 14px;
  height: 14px;
  accent-color: var(--accent);
  cursor: pointer;
}

.editor-row textarea {
  resize: vertical;
  min-height: 50px;
  font-family: var(--font-mono);
  line-height: 1.5;
}

.hint-text {
  font-size: 11px;
  color: var(--text-muted);
  font-style: italic;
  padding: 4px 0;
}

.add-child-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.add-child-btn:hover { background: var(--bg-hover); border-color: var(--accent); color: var(--accent); }

/* ====== Modal ====== */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  width: 90%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-body {
  padding: 18px;
  flex: 1;
  overflow: auto;
}

.modal-body .tool-textarea {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 12px;
  resize: vertical;
  padding: 10px 12px;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  line-height: 1.5;
}

.modal-body .tool-textarea:focus { border-color: var(--accent); }

.import-error {
  margin-top: 10px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 6px;
  color: #ef4444;
  font-size: 12px;
}

.modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 14px 18px;
  border-top: 1px solid var(--border-subtle);
}

.modal-btn {
  height: 30px;
  padding: 0 16px;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.modal-btn:hover { background: var(--bg-hover); }

.modal-btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.modal-btn.primary:hover { filter: brightness(1.1); }

/* ====== Empty State ====== */
.tool-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  flex: 1;
}

.empty-icon {
  color: var(--text-muted);
  opacity: 0.25;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0 0 4px 0;
}

.empty-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

/* ====== Scrollbar ====== */
.tool-panel-body::-webkit-scrollbar { width: 5px; }
.tool-panel-body::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.tool-panel-body::-webkit-scrollbar-track { background: transparent; }

.field-tree::-webkit-scrollbar { width: 4px; }
.field-tree::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.field-tree::-webkit-scrollbar-track { background: transparent; }

.code-output::-webkit-scrollbar { width: 5px; }
.code-output::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.code-output::-webkit-scrollbar-track { background: transparent; }

.editor-body::-webkit-scrollbar { width: 4px; }
.editor-body::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.editor-body::-webkit-scrollbar-track { background: transparent; }

/* ====== Responsive ====== */
@media (max-width: 760px) {
  .tool-main { grid-template-columns: 1fr !important; }
}
</style>
