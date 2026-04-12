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
import { FIELD_TYPES, STRING_FORMATS, CODE_GEN_LANGUAGES } from '@/types/json-schema'

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
    <!-- 标题栏 -->
    <ToolTitleBar title="JSON Schema 设计器" icon="icon-schema">
      <div class="header-content">
        <span v-if="fieldCount" class="stat-tag">{{ fieldCount }} 个字段</span>
      </div>
    </ToolTitleBar>

    <!-- 工具栏 -->
    <div class="tool-toolbar">
      <div class="tool-toolbar-left"></div>

      <div class="tool-toolbar-right">
        <div class="tool-segment">
          <button
            v-for="tab in previewTabs"
            :key="tab.key"
            class="tool-segment-btn"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
            :title="tab.label"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 主内容 -->
    <main class="tool-main split" style="grid-template-columns: 1fr 1fr; gap: 16px;">
      <!-- 左侧：Schema 编辑器 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><FileJson :size="12" /></span>
            <span>Schema 编辑器</span>
          </div>
          <div class="tool-panel-actions"></div>
        </div>

        <div class="tool-panel-body schema-editor-body">
          <!-- Schema 元数据 -->
          <div class="schema-metadata">
            <div class="meta-row">
              <div class="meta-field">
                <label class="meta-label">标题</label>
                <input
                  v-model="document.title"
                  type="text"
                  class="meta-input"
                  placeholder="Schema 标题"
                />
              </div>
              <div class="meta-field">
                <label class="meta-label">描述</label>
                <input
                  v-model="document.description"
                  type="text"
                  class="meta-input"
                  placeholder="Schema 描述（可选）"
                />
              </div>
            </div>
          </div>

          <!-- 字段树 -->
          <div class="field-tree-section">
            <div class="field-tree-header">
              <span class="field-tree-title">字段列表</span>
              <div class="field-tree-actions">
                <button class="glass-icon-btn small" @click="showImportModal = true" title="导入 Schema">
                  <Upload :size="12" />
                </button>
                <button class="glass-icon-btn small" @click="addField" title="添加字段" style="background: var(--accent); color: white; border-color: var(--accent);">
                  <Plus :size="12" />
                </button>
              </div>
            </div>
            <div class="field-tree">
              <div
                v-for="item in flattenedFields"
                :key="item.field.id"
                class="field-row"
                :class="{
                  selected: selectedFieldId === item.field.id,
                  'has-children':
                    item.field.type === 'object' || item.field.type === 'array',
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
                  <button class="glass-icon-btn small" @click.stop="moveField(item.field.id, 'up')" title="上移"><ArrowUp :size="12" /></button>
                  <button class="glass-icon-btn small" @click.stop="moveField(item.field.id, 'down')" title="下移"><ArrowDown :size="12" /></button>
                  <button class="glass-icon-btn small" @click.stop="duplicateField(item.field.id)" title="复制"><Copy :size="12" /></button>
                  <button class="glass-icon-btn small danger" @click.stop="deleteField(item.field.id)" title="删除"><Trash2 :size="12" /></button>
                </div>
              </div>

              <div v-if="flattenedFields.length === 0" class="tool-empty">
                <div class="empty-icon"><FileJson :size="12" /></div>
                <p class="empty-title">暂无字段</p>
                <p class="empty-desc">点击"添加字段"按钮开始设计 Schema</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧：预览 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Check :size="12" /></span>
            <span>预览</span>
          </div>
          <div class="tool-panel-actions">
            <button v-if="activeTab === 'schema'" class="glass-icon-btn small" @click="copyToClipboard(schemaJson, 'Schema JSON')" title="复制"><Copy :size="12" /></button>
            <button v-if="activeTab === 'sample'" class="glass-icon-btn small" @click="copyToClipboard(sampleJson, '示例数据')" title="复制"><Copy :size="12" /></button>
            <button v-if="activeTab === 'codegen'" class="glass-icon-btn small" @click="copyToClipboard(codeGenResult.code, '生成的代码')" title="复制"><Copy :size="12" /></button>
            <button v-if="activeTab === 'openapi'" class="glass-icon-btn small" @click="copyToClipboard(openApiJson, 'OpenAPI 规范')" title="复制"><Copy :size="12" /></button>
          </div>
        </div>

        <div class="tool-panel-body preview-body">
          <!-- Schema JSON -->
          <template v-if="activeTab === 'schema'">
            <div v-if="!document.fields.length" class="tool-empty">
              <div class="empty-icon"><FileJson :size="12" /></div>
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

          <!-- 示例数据 -->
          <template v-if="activeTab === 'sample'">
            <div v-if="!document.fields.length" class="tool-empty">
              <div class="empty-icon"><FileJson :size="12" /></div>
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

          <!-- 代码生成 -->
          <template v-if="activeTab === 'codegen'">
            <div class="codegen-lang-bar">
              <button
                v-for="lang in CODE_GEN_LANGUAGES"
                :key="lang.value"
                class="lang-chip"
                :class="{ active: codeGenLanguage === lang.value }"
                @click="codeGenLanguage = lang.value"
              >
                {{ lang.label }}
              </button>
            </div>
            <div v-if="!document.fields.length" class="tool-empty">
              <div class="empty-icon"><FileJson :size="12" /></div>
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
              <div class="empty-icon"><FileJson :size="12" /></div>
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

    <!-- 字段编辑器浮动弹窗 -->
    <Teleport to="body">
      <div
        v-if="selectedField"
        ref="fieldEditorEl"
        class="field-editor-popup"
        :style="{ top: editorPos.top + 'px', left: editorPos.left + 'px' }"
      >
        <div class="editor-header" @mousedown.prevent="startDrag">
          <span class="editor-title">编辑字段</span>
          <button class="glass-icon-btn small" @click="selectedFieldId = null" title="关闭"><X :size="12" /></button>
        </div>
        <div class="editor-body">
          <!-- 基本属性 -->
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

          <!-- 字符串约束 -->
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

          <!-- 数字/整数约束 -->
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

          <!-- 数组约束 -->
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

          <!-- 对象字段 -->
          <div v-if="selectedField.type === 'object'" class="editor-section">
            <div class="section-title">对象属性</div>
            <div class="editor-row">
              <button class="action-btn" @click="addChildField(selectedField.id)">
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

    <!-- 导入模态框 -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <span class="modal-title">导入 JSON Schema</span>
          <button class="glass-icon-btn small" @click="showImportModal = false"><X :size="12" /></button>
        </div>
        <div class="modal-body">
          <textarea
            v-model="importJson"
            class="tool-textarea"
            rows="10"
            placeholder='粘贴 JSON Schema，例如：{ "type": "object", "properties": { ... } }'
          ></textarea>
          <div v-if="importError" class="tool-error">
            <p>{{ importError }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-btn" @click="showImportModal = false">取消</button>
          <button class="action-btn primary" @click="importSchema">导入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ====== 标题栏 ====== */
.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 4px;
}

.stat-tag {
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-tertiary);
}

/* ====== Schema 编辑器 ====== */
.schema-editor-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  overflow: hidden;
}

.schema-metadata {
  padding: 12px 14px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.meta-row {
  display: flex;
  gap: 12px;
}

.meta-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.meta-input {
  width: 100%;
  padding: 6px 10px;
  font-size: 13px;
  line-height: 1.4;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);
  outline: none;
  transition: border-color var(--transition-fast);
}

.meta-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-light);
}

.meta-input::placeholder {
  color: var(--text-muted);
}

.meta-row input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 13px;
  transition: all var(--transition-fast);
}

.meta-row input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

/* 字段树 */
.field-tree-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

.field-tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-subtle);
  min-height: 44px;
}

.field-tree-header .glass-icon-btn.small {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.field-tree-header .glass-icon-btn.small:hover {
  transform: scale(1.05);
}

.field-tree-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.field-tree-actions {
  display: flex;
  gap: 4px;
}

.field-tree {
  flex: 1;
  overflow: auto;
  padding: 8px;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: 2px;
  position: relative;
}

.field-row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: transparent;
  pointer-events: none;
}

.field-row:hover {
  background: var(--bg-hover);
}

.field-row.selected {
  background: var(--accent-light);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius-sm) 0 0 var(--radius-sm);
}

.expand-arrow {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast);
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-muted);
}

.expand-arrow.expanded {
  transform: rotate(90deg);
}

.expand-arrow-placeholder {
  width: 16px;
  flex-shrink: 0;
}

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
  padding: 3px 8px;
  border-radius: var(--radius-full);
  font-weight: 600;
  text-transform: uppercase;
  flex-shrink: 0;
  letter-spacing: 0.3px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
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
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.field-row:hover .field-actions {
  opacity: 1;
}

.field-actions .glass-icon-btn.small {
  width: 24px;
  height: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 字段编辑器 */
.field-editor-popup {
  position: fixed;
  z-index: 1000;
  width: 360px;
  max-height: 520px;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
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

.field-editor-popup .editor-header {
  cursor: grab;
  user-select: none;
  padding: 10px 12px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.field-editor-popup .editor-header:active {
  cursor: grabbing;
}

.field-editor-popup .editor-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
}

.editor-section {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.editor-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.editor-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.editor-row:last-child {
  margin-bottom: 0;
}

.editor-row label {
  min-width: 70px;
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.editor-row.checkbox-row label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: auto;
  cursor: pointer;
  padding: 6px 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  transition: all var(--transition-fast);
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
  padding: 8px 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 13px;
  transition: all var(--transition-fast);
}

.editor-row input[type='text']:focus,
.editor-row input[type='number']:focus,
.editor-row select:focus,
.editor-row textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.editor-row input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}

.editor-row textarea {
  resize: vertical;
  min-height: 60px;
  font-family: var(--font-mono);
  line-height: 1.5;
}

.hint-text {
  font-size: 11px;
  color: var(--text-muted);
  font-style: italic;
  padding: 4px 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

.action-btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.action-btn.primary:hover {
  opacity: 0.9;
}

/* ====== 预览区域 ====== */
.preview-body {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.codegen-lang-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
}

.lang-chip {
  padding: 5px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.lang-chip:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-light);
  transform: translateY(-1px);
}

.lang-chip.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  box-shadow: 0 2px 8px rgba(var(--accent-rgb, 59, 130, 246), 0.4);
}

.code-output {
  flex: 1;
  overflow: auto;
  padding: 8px 0;
  background: #fafafa;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  font-family: 'JetBrains Mono', 'Fira Code', var(--font-mono), monospace;
  font-size: 13px;
  line-height: 1.7;
}

.code-line {
  display: flex;
  align-items: flex-start;
  padding: 0 16px;
  height: 22.1px;
  box-sizing: content-box;
}

.code-line:hover {
  background: rgba(0, 0, 0, 0.03);
}

.line-num {
  width: 40px;
  padding-right: 12px;
  text-align: right;
  color: var(--text-muted);
  font-size: 11px;
  font-family: 'JetBrains Mono', 'Fira Code', var(--font-mono), monospace;
  line-height: 22.1px;
  user-select: none;
  opacity: 0.5;
  flex-shrink: 0;
}

.line-content {
  flex: 1;
  margin: 0;
  padding: 0;
  font-size: 13px;
  font-family: 'JetBrains Mono', 'Fira Code', var(--font-mono), monospace;
  line-height: 22.1px;
  white-space: pre;
  background: transparent;
}

.line-content code {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  background: transparent;
}

/* ====== 模态框 ====== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow: auto;
}

.modal-body textarea {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 12px;
  resize: vertical;
}

.modal-body .tool-error {
  margin-top: 12px;
}

.modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid var(--border-subtle);
}

/* ====== 空状态 ====== */
.tool-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  height: 100%;
  flex: 1;
}

.empty-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  margin-bottom: 12px;
  font-size: 22px;
  color: var(--text-muted);
}

.empty-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.empty-desc {
  font-size: 11px;
  color: var(--text-muted);
  margin: 0;
}

/* ====== 暗色模式 ====== */
body[arco-theme='dark'] .field-editor-popup {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
}

body[arco-theme='dark'] .type-string { color: #4ade80; background: rgba(74, 222, 128, 0.15); }
body[arco-theme='dark'] .type-number { color: #60a5fa; background: rgba(96, 165, 250, 0.15); }
body[arco-theme='dark'] .type-integer { color: #22d3ee; background: rgba(34, 211, 238, 0.15); }
body[arco-theme='dark'] .type-boolean { color: #fbbf24; background: rgba(251, 191, 36, 0.15); }
body[arco-theme='dark'] .type-null { color: #cbd5e1; background: rgba(203, 213, 225, 0.15); }
body[arco-theme='dark'] .type-object { color: #c084fc; background: rgba(192, 132, 252, 0.15); }
body[arco-theme='dark'] .type-array { color: #f472b6; background: rgba(244, 114, 182, 0.15); }

body[arco-theme='dark'] .code-output {
  background: #1e2030;
}
body[arco-theme='dark'] .code-output .hljs { color: #abb2bf; background: #1e2030; }
body[arco-theme='dark'] .code-output .hljs-comment,
body[arco-theme='dark'] .code-output .hljs-quote { color: #5c6370; font-style: italic; }
body[arco-theme='dark'] .code-output .hljs-doctag,
body[arco-theme='dark'] .code-output .hljs-keyword,
body[arco-theme='dark'] .code-output .hljs-formula { color: #c678dd; }
body[arco-theme='dark'] .code-output .hljs-section,
body[arco-theme='dark'] .code-output .hljs-name,
body[arco-theme='dark'] .code-output .hljs-selector-tag,
body[arco-theme='dark'] .code-output .hljs-deletion,
body[arco-theme='dark'] .code-output .hljs-subst { color: #e06c75; }
body[arco-theme='dark'] .code-output .hljs-literal { color: #56b6c2; }
body[arco-theme='dark'] .code-output .hljs-string,
body[arco-theme='dark'] .code-output .hljs-regexp,
body[arco-theme='dark'] .code-output .hljs-addition,
body[arco-theme='dark'] .code-output .hljs-attribute,
body[arco-theme='dark'] .code-output .hljs-meta .hljs-string { color: #98c379; }
body[arco-theme='dark'] .code-output .hljs-attr,
body[arco-theme='dark'] .code-output .hljs-variable,
body[arco-theme='dark'] .code-output .hljs-template-variable,
body[arco-theme='dark'] .code-output .hljs-type,
body[arco-theme='dark'] .code-output .hljs-selector-class,
body[arco-theme='dark'] .code-output .hljs-selector-attr,
body[arco-theme='dark'] .code-output .hljs-selector-pseudo,
body[arco-theme='dark'] .code-output .hljs-number { color: #d19a66; }
body[arco-theme='dark'] .code-output .hljs-symbol,
body[arco-theme='dark'] .code-output .hljs-bullet,
body[arco-theme='dark'] .code-output .hljs-link,
body[arco-theme='dark'] .code-output .hljs-meta,
body[arco-theme='dark'] .code-output .hljs-selector-id,
body[arco-theme='dark'] .code-output .hljs-title { color: #61aeee; }
body[arco-theme='dark'] .code-output .hljs-built_in,
body[arco-theme='dark'] .code-output .hljs-title.class_,
body[arco-theme='dark'] .code-output .hljs-class .hljs-title { color: #e6c07b; }
</style>
