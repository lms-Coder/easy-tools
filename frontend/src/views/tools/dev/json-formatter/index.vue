<script setup lang="ts">
import {
  Copy,
  Download,
  Upload,
  ClipboardPaste,
  FileJson,
  Search,
  History,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RotateCcw,
  Code,
  Check,
  CircleX,
  Eye,
  RefreshCw,
  ArrowRightLeft,
  ArrowLeftRight,
  Braces,
  GitCompare,
  Shield,
  X,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import Compress from '@/components/icons/Compress.vue'
import ToolHistoryPanel from '@/components/common/ToolHistoryPanel.vue'
import { useJsonFormatter, type ToolMode } from './useJsonFormatter'
import { useTooltip } from '@/composables/useTooltip'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const modes: { key: ToolMode; label: string; icon: any }[] = [
  { key: 'formatter', label: '格式化', icon: Braces },
  { key: 'convert', label: '互转', icon: ArrowLeftRight },
  { key: 'diff', label: '对比', icon: GitCompare },
  { key: 'schema', label: 'Schema', icon: Shield },
]

const {
  activeMode,
  // Formatter
  inputText, outputText, indentSize, sortKeys, viewMode, wordWrap,
  error, copied, isValid, isDragging, searchText, matchIndex,
  jsonStats, fileInputRef,
  treeViewHtml, treeData, nodeInfo, contextMenu,
  filterPanel,
  highlightedLines, matchedLines, matchCount, matchLineList,
  isEscaped, inputByteSize, outputByteSize, formatBytes,
  parseJson, minifyJson, unescapeJson, escapeJson,
  copyOutput, downloadJson, clearAll, pasteFromClipboard,
  importFile, handleFileSelect,
  handleDragOver, handleDragLeave, handleDrop, handleInput,
  navigateMatch,
  handleTreeMousemove, handleTreeMouseleave, handleTreeContextmenu,
  copyFromMenu, handleTreeClick,
  applyArrayFilter, resetFilter,
  // Tree enhancements
  treeExpandLevel, treeSearchText, treeSearchRegex, treeSearchMatchCount,
  expandAllTree, collapseAllTree, expandToLevel,
  setTreeNodeValue, deleteTreeNode, copyTreeNode, copyTreePath,
  treeEditNode, handleTreeDblclick, confirmTreeEdit, cancelTreeEdit,
  // Sub-modules
  jsonPathModule,
  convertModule,
  diffModule,
  schemaModule,
  // History
  history, showHistory, deleteItem, handleHistoryUse, handleClearHistory,
} = useJsonFormatter()

// Shorthand refs for template
const jp = jsonPathModule
const cv = convertModule
const df = diffModule
const sc = schemaModule
</script>

<template>
  <div class="tool-page" @click="contextMenu.visible = false; treeEditNode.visible = false">
    <ToolTitleBar title="JSON 格式化" icon="icon-json">
      <div class="header-content">
        <template v-if="activeMode === 'formatter'">
          <div class="header-stats" v-if="jsonStats && isValid">
            <span class="stat-tag">{{ jsonStats.keyCount }} 键</span>
            <span class="stat-tag">{{ jsonStats.depth }} 层</span>
            <span class="stat-tag">{{ jsonStats.size }}</span>
          </div>
        </template>
        <template v-if="activeMode === 'diff' && df.hasDiff.value">
          <div class="header-stats">
            <span class="stat-tag add">+{{ df.stats.value.added }}</span>
            <span class="stat-tag del">-{{ df.stats.value.removed }}</span>
            <span class="stat-tag mod">~{{ df.stats.value.changed }}</span>
          </div>
        </template>
        <button v-if="activeMode === 'formatter'" class="glass-icon-btn small" :class="{ active: showHistory }" @click="showHistory = !showHistory"
          @mouseenter="showTooltip('历史记录', $event)" @mouseleave="hideTooltip">
          <History :size="14" />
        </button>
      </div>
    </ToolTitleBar>

    <!-- ==================== 格式化模式 ==================== -->
    <main v-if="activeMode === 'formatter'" class="tool-main split">
      <!-- Left: config + input -->
      <section class="tool-panel">
        <!-- 模式切换标签栏 -->
        <div class="panel-mode-tabs">
          <button v-for="m in modes" :key="m.key"
            :class="['panel-mode-tab', { active: activeMode === m.key }]"
            @click="activeMode = m.key">
            <component :is="m.icon" :size="12" />
            <span>{{ m.label }}</span>
          </button>
        </div>
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Code :size="14" /></span>
            <span>输入</span>
          </div>
          <div class="panel-actions">
            <span :class="['status-badge', isValid ? 'success' : 'error']" v-if="inputText">
              <Check :size="10" v-if="isValid" /><CircleX :size="10" v-else />
              {{ isValid ? '有效' : '无效' }}
            </span>
            <button class="tool-icon-btn" @click="importFile"
              @mouseenter="showTooltip('导入文件', $event)" @mouseleave="hideTooltip">
              <Upload :size="13" />
            </button>
            <button class="tool-icon-btn" @click="pasteFromClipboard"
              @mouseenter="showTooltip('粘贴', $event)" @mouseleave="hideTooltip">
              <ClipboardPaste :size="13" />
            </button>
            <button class="tool-icon-btn" @click="clearAll" :disabled="!inputText"
              @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>

        <div class="tool-panel-body">
          <!-- Action buttons -->
          <div class="config-section">
            <label class="config-label">操作</label>
            <div class="action-group">
              <button class="execute-btn-sm" @click="parseJson">
                <RefreshCw :size="12" />
                <span>格式化</span>
              </button>
              <button class="seg-btn small" @click="minifyJson"
                @mouseenter="showTooltip('压缩', $event)" @mouseleave="hideTooltip">
                <Compress :size="11" />
              </button>
              <button class="seg-btn small" @click="isEscaped ? unescapeJson() : escapeJson()"
                @mouseenter="showTooltip(isEscaped ? '反转义' : '转义', $event)" @mouseleave="hideTooltip">
                <span class="escape-icon">\</span>
              </button>
            </div>
          </div>

          <!-- Options -->
          <div class="config-section">
            <label class="config-label">选项</label>
            <div class="options-row">
              <div class="indent-group">
                <button v-for="opt in [2, 4]" :key="opt"
                  :class="['seg-btn xxs', { active: indentSize === opt }]"
                  @click="indentSize = opt">
                  {{ opt }}空格
                </button>
                <button :class="['seg-btn xxs', { active: indentSize === 1 }]"
                  @click="indentSize = 1">
                  Tab
                </button>
              </div>
              <div class="toggle-group">
                <label class="toggle-label" @click="sortKeys = !sortKeys">
                  <span :class="['toggle-check', { on: sortKeys }]">
                    <Check v-if="sortKeys" :size="8" />
                  </span>
                  <span>排序</span>
                </label>
                <label class="toggle-label" @click="wordWrap = !wordWrap">
                  <span :class="['toggle-check', { on: wordWrap }]">
                    <Check v-if="wordWrap" :size="8" />
                  </span>
                  <span>换行</span>
                </label>
              </div>
            </div>
          </div>

          <!-- View mode -->
          <div class="config-section">
            <div class="config-row">
              <label class="config-label">视图</label>
              <div class="view-toggle">
                <button :class="['seg-btn xs', { active: viewMode === 'code' }]" @click="viewMode = 'code'">
                  <Code :size="11" /> 代码
                </button>
                <button :class="['seg-btn xs', { active: viewMode === 'tree' }]" @click="viewMode = 'tree'">
                  <Eye :size="11" /> 树形
                </button>
              </div>
            </div>
          </div>

          <!-- JSONPath -->
          <div class="config-section" v-if="isValid && outputText">
            <label class="config-label">JSONPath</label>
            <div class="jsonpath-bar">
              <input v-model="jp.jsonPathQuery.value" class="jsonpath-input"
                placeholder="$.store.book[0].title" spellcheck="false"
                @input="jp.executeJsonPathQuery(treeData)" />
              <template v-if="jp.jsonPathQuery.value">
                <span class="search-count">{{ jp.jsonPathMatchCount.value }} 匹配</span>
                <button class="search-nav" @click="jp.navigateJsonPath(-1)">
                  <ChevronLeft :size="12" />
                </button>
                <button class="search-nav" @click="jp.navigateJsonPath(1)">
                  <ChevronRight :size="12" />
                </button>
                <button class="search-nav" @click="jp.clearJsonPath()">
                  <X :size="12" />
                </button>
              </template>
            </div>
            <div v-if="jp.jsonPathError.value" class="ts-error">{{ jp.jsonPathError.value }}</div>
          </div>

          <!-- Input textarea -->
          <div class="config-section grow" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
            <textarea
              v-model="inputText"
              class="config-textarea"
              :class="{ 'jf-wrap': wordWrap }"
              placeholder="在此粘贴 JSON 数据或拖拽文件导入..."
              spellcheck="false"
              @input="handleInput"
            />
            <div v-if="isDragging" class="drag-overlay">
              <Upload :size="20" />
              <span>释放以导入文件</span>
            </div>
          </div>
        </div>

        <!-- Size info bar -->
        <div v-if="inputText" class="info-bar">
          <span class="info-tag">{{ formatBytes(inputByteSize) }}</span>
          <span v-if="outputText" class="info-tag">→ {{ formatBytes(outputByteSize) }}</span>
        </div>
      </section>

      <!-- Right: output -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Check :size="14" /></span>
            <span>输出</span>
          </div>
          <div class="panel-actions">
            <!-- Code mode search -->
            <div v-if="outputText && viewMode === 'code'" class="search-bar">
              <Search :size="12" style="color: var(--text-muted); flex-shrink: 0;" />
              <input v-model="searchText" class="search-input" placeholder="搜索..." spellcheck="false" />
              <template v-if="searchText">
                <span class="search-count">{{ matchCount > 0 ? matchIndex + 1 : 0 }}/{{ matchCount }}</span>
                <button class="search-nav" @click="navigateMatch(-1)" :disabled="matchCount === 0">
                  <ChevronLeft :size="12" />
                </button>
                <button class="search-nav" @click="navigateMatch(1)" :disabled="matchCount === 0">
                  <ChevronRight :size="12" />
                </button>
              </template>
            </div>
            <!-- Tree mode toolbar -->
            <template v-if="viewMode === 'tree' && treeViewHtml">
              <div class="tree-toolbar">
                <div class="tree-search-bar">
                  <Search :size="11" style="color: var(--text-muted); flex-shrink: 0;" />
                  <input v-model="treeSearchText" class="tree-search-input" placeholder="搜索节点..." spellcheck="false" />
                  <button :class="['tree-regex-btn', { active: treeSearchRegex }]" @click="treeSearchRegex = !treeSearchRegex" title="正则模式">.*</button>
                  <span v-if="treeSearchText" class="search-count">{{ treeSearchMatchCount }} 匹配</span>
                </div>
                <div class="tree-expand-group">
                  <button class="seg-btn xxs" @click="expandAllTree" title="全部展开">全部</button>
                  <button class="seg-btn xxs" @click="collapseAllTree" title="全部折叠">折叠</button>
                  <button v-for="lv in [1, 2, 3]" :key="lv"
                    :class="['seg-btn xxs', { active: treeExpandLevel === lv }]"
                    @click="expandToLevel(lv)">L{{ lv }}</button>
                </div>
              </div>
            </template>
            <button class="tool-icon-btn" @click="copyOutput" :disabled="!outputText"
              @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip">
              <Check v-if="copied" :size="13" />
              <Copy v-else :size="13" />
            </button>
            <button class="tool-icon-btn" @click="downloadJson" :disabled="!outputText"
              @mouseenter="showTooltip('下载', $event)" @mouseleave="hideTooltip">
              <Download :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body">
          <!-- Error -->
          <div v-if="error" class="output-error">
            <div class="output-error-head"><CircleX :size="14" /> <span>JSON 解析错误</span></div>
            <p class="output-error-msg">{{ error }}</p>
          </div>

          <!-- Code view -->
          <div v-if="viewMode === 'code' && outputText && !error" :class="['tool-code-output', { wrap: wordWrap }]">
            <div v-for="(line, index) in highlightedLines" :key="index" :data-line="index"
              :class="['tool-code-line', { 'search-current': matchedLines.has(index) && matchLineList[matchIndex] === index }, { 'search-match': matchedLines.has(index) && matchLineList[matchIndex] !== index }]">
              <span class="line-num">{{ index + 1 }}</span>
              <pre class="line-content"><code v-html="line || ' '"></code></pre>
            </div>
          </div>

          <!-- Tree view -->
          <div v-else-if="viewMode === 'tree' && treeViewHtml && !error" class="tree-viewer"
            v-html="treeViewHtml" @mousemove="handleTreeMousemove" @mouseleave="handleTreeMouseleave"
            @contextmenu.prevent="handleTreeContextmenu" @click="handleTreeClick"
            @dblclick="handleTreeDblclick" />

          <!-- Tree node edit popup -->
          <div v-if="treeEditNode.visible" class="tree-edit-popup"
            :style="{ left: treeEditNode.x + 'px', top: treeEditNode.y + 'px' }" @click.stop>
            <div class="tree-edit-header">
              <span>编辑 ({{ treeEditNode.type }})</span>
              <span class="tree-edit-path">{{ treeEditNode.path }}</span>
            </div>
            <input class="tree-edit-input" v-model="treeEditNode.rawValue" spellcheck="false"
              @keydown.enter="confirmTreeEdit" @keydown.escape="cancelTreeEdit" autofocus />
            <div class="tree-edit-actions">
              <button class="seg-btn xs primary" @click="confirmTreeEdit">确认</button>
              <button class="seg-btn xs" @click="cancelTreeEdit">取消</button>
            </div>
          </div>

          <!-- Node info bar -->
          <div v-if="viewMode === 'tree' && nodeInfo" class="node-info-bar">
            <span class="node-path">{{ nodeInfo.path }}</span>
            <span v-if="nodeInfo.value" class="node-value">{{ nodeInfo.value }}</span>
          </div>

          <!-- Empty -->
          <div v-if="!outputText && !error" class="tool-empty">
            <div class="empty-icon"><FileJson :size="36" /></div>
            <p class="empty-title">准备就绪</p>
            <p class="empty-desc">在左侧输入 JSON 数据开始格式化</p>
          </div>
        </div>

        <!-- Array filter panel -->
        <div v-if="filterPanel.show" class="filter-panel">
          <div class="filter-header">
            <span>数组筛选</span>
            <span class="filter-path">{{ filterPanel.path }}</span>
          </div>
          <div class="filter-body">
            <input v-model="filterPanel.field" class="filter-input" placeholder="字段名" spellcheck="false" />
            <select v-model="filterPanel.mode" class="filter-select">
              <option value="contains">包含</option>
              <option value="equals">等于</option>
              <option value="regex">正则</option>
            </select>
            <input v-model="filterPanel.keyword" class="filter-input" placeholder="关键词" spellcheck="false"
              @keydown.enter.prevent="applyArrayFilter" />
            <button class="filter-btn primary" @click="applyArrayFilter">筛选</button>
            <button class="filter-btn" @click="resetFilter">重置</button>
            <button class="filter-btn" @click="filterPanel.show = false">关闭</button>
          </div>
          <div v-if="filterPanel.resultCount >= 0" class="filter-stats">
            结果: {{ filterPanel.resultCount }} / {{ filterPanel.totalCount }} 项
          </div>
        </div>
      </section>

      <!-- Context menu -->
      <div v-if="contextMenu.visible" class="tool-context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }" @click.stop>
        <button @click="copyFromMenu('key')" v-if="contextMenu.type !== 'array' && contextMenu.type !== 'object'">
          <Copy :size="12" /> 复制键名
        </button>
        <button @click="copyFromMenu('value')">
          <Copy :size="12" /> 复制值
        </button>
        <button @click="copyTreeNode(contextMenu.path)">
          <Copy :size="12" /> 复制节点 JSON
        </button>
        <button @click="copyTreePath(contextMenu.path)">
          <Copy :size="12" /> 复制路径
        </button>
        <div class="context-divider"></div>
        <button class="danger" @click="deleteTreeNode(contextMenu.path); contextMenu.visible = false" v-if="contextMenu.path !== '$'">
          <Trash2 :size="12" /> 删除节点
        </button>
      </div>

      <!-- History panel -->
      <ToolHistoryPanel v-if="showHistory" :history="history" title="格式化历史"
        :display-fields="[{ key: 'inputPreview', label: '内容' }]"
        @use="handleHistoryUse" @delete="deleteItem" @clear="handleClearHistory" @close="showHistory = false" />
    </main>

    <!-- ==================== 互转模式 ==================== -->
    <main v-if="activeMode === 'convert'" class="tool-main split">
      <!-- 左侧：源格式输入 -->
      <section class="tool-panel">
        <div class="panel-mode-tabs">
          <button v-for="m in modes" :key="m.key"
            :class="['panel-mode-tab', { active: activeMode === m.key }]"
            @click="activeMode = m.key">
            <component :is="m.icon" :size="12" />
            <span>{{ m.label }}</span>
          </button>
        </div>
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Code :size="14" /></span>
            <span>源数据</span>
          </div>
          <div class="panel-actions">
            <span class="status-badge" :class="cv.sourceFormat.value">{{ cv.sourceFormat.value.toUpperCase() }}</span>
            <button class="tool-icon-btn" @click="cv.pasteConvertInput()"
              @mouseenter="showTooltip('粘贴', $event)" @mouseleave="hideTooltip">
              <ClipboardPaste :size="13" />
            </button>
            <button class="tool-icon-btn" @click="cv.clearConvert()"
              @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body">
          <div class="config-section">
            <label class="config-label">源格式</label>
            <div class="indent-group">
              <button v-for="f in (['json', 'yaml', 'csv'] as const)" :key="f"
                :class="['seg-btn xxs', { active: cv.sourceFormat.value === f }]"
                @click="cv.sourceFormat.value = f">
                {{ f.toUpperCase() }}
              </button>
            </div>
          </div>
          <div class="config-section grow">
            <textarea v-model="cv.convertInput.value" class="config-textarea"
              :placeholder="'在此粘贴 ' + cv.sourceFormat.value.toUpperCase() + ' 数据...'"
              spellcheck="false" @input="cv.executeConvert()" />
          </div>
        </div>
      </section>

      <!-- 右侧：目标格式输出 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Check :size="14" /></span>
            <span>输出</span>
          </div>
          <div class="panel-actions">
            <button class="tool-icon-btn" @click="cv.swapFormats()" title="交换源和目标">
              <ArrowLeftRight :size="13" />
            </button>
            <button class="tool-icon-btn" @click="cv.copyConvertOutput()" :disabled="!cv.convertOutput.value"
              @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip">
              <Copy :size="13" />
            </button>
            <button class="tool-icon-btn" @click="cv.downloadConvertOutput()" :disabled="!cv.convertOutput.value"
              @mouseenter="showTooltip('下载', $event)" @mouseleave="hideTooltip">
              <Download :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body">
          <div class="config-section">
            <label class="config-label">目标格式</label>
            <div class="indent-group">
              <button v-for="f in (['json', 'yaml', 'csv'] as const)" :key="f"
                :class="['seg-btn xxs', { active: cv.targetFormat.value === f }]"
                @click="cv.targetFormat.value = f">
                {{ f.toUpperCase() }}
              </button>
            </div>
          </div>
          <div v-if="cv.convertError.value" class="output-error">
            <div class="output-error-head"><CircleX :size="14" /> <span>转换错误</span></div>
            <p class="output-error-msg">{{ cv.convertError.value }}</p>
          </div>
          <div v-else-if="cv.convertOutput.value" class="tool-code-output wrap" style="flex:1">
            <div v-for="(line, index) in cv.convertOutput.value.split('\n')" :key="index" class="tool-code-line">
              <span class="line-num">{{ index + 1 }}</span>
              <pre class="line-content"><code>{{ line || ' ' }}</code></pre>
            </div>
          </div>
          <div v-else class="tool-empty">
            <div class="empty-icon"><ArrowLeftRight :size="36" /></div>
            <p class="empty-title">等待输入</p>
            <p class="empty-desc">在左侧输入数据后自动转换</p>
          </div>
        </div>
      </section>
    </main>

    <!-- ==================== Diff 对比模式 ==================== -->
    <main v-if="activeMode === 'diff'" class="tool-main split">
      <!-- 左面板：输入 -->
      <section class="tool-panel">
        <!-- 模式切换标签栏 -->
        <div class="panel-mode-tabs">
          <button v-for="m in modes" :key="m.key"
            :class="['panel-mode-tab', { active: activeMode === m.key }]"
            @click="activeMode = m.key">
            <component :is="m.icon" :size="12" />
            <span>{{ m.label }}</span>
          </button>
        </div>
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><GitCompare :size="14" /></span>
            <span>JSON 对比</span>
          </div>
          <div class="panel-actions">
            <button class="tool-icon-btn" @click="df.swapDiff()"
              @mouseenter="showTooltip('交换', $event)" @mouseleave="hideTooltip">
              <ArrowLeftRight :size="13" />
            </button>
            <button class="tool-icon-btn" @click="df.clearDiff()"
              @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body">
          <!-- 选项 -->
          <div class="config-section">
            <label class="config-label">选项</label>
            <div class="options-row">
              <div class="toggle-group">
                <label class="toggle-label" @click="df.ignoreKeyOrder.value = !df.ignoreKeyOrder.value">
                  <span :class="['toggle-check', { on: df.ignoreKeyOrder.value }]">
                    <Check v-if="df.ignoreKeyOrder.value" :size="8" />
                  </span>
                  <span>忽略键序</span>
                </label>
                <label class="toggle-label" @click="df.ignoreWhitespace.value = !df.ignoreWhitespace.value">
                  <span :class="['toggle-check', { on: df.ignoreWhitespace.value }]">
                    <Check v-if="df.ignoreWhitespace.value" :size="8" />
                  </span>
                  <span>忽略空白</span>
                </label>
              </div>
            </div>
          </div>
          <!-- 原始 JSON -->
          <div class="config-section" style="flex:1; display:flex; flex-direction:column">
            <div class="config-row">
              <label class="config-label">原始 JSON</label>
              <button class="tool-icon-btn small" @click="df.pasteToLeft()">
                <ClipboardPaste :size="11" />
              </button>
            </div>
            <textarea v-model="df.leftJsonText.value" class="config-textarea"
              style="flex:1; min-height:0"
              placeholder="粘贴原始 JSON..." spellcheck="false" />
            <span v-if="df.leftError.value" class="ts-error" style="margin-top:4px">{{ df.leftError.value }}</span>
          </div>
          <!-- 修改后 JSON -->
          <div class="config-section" style="flex:1; display:flex; flex-direction:column">
            <div class="config-row">
              <label class="config-label">修改后 JSON</label>
              <button class="tool-icon-btn small" @click="df.pasteToRight()">
                <ClipboardPaste :size="11" />
              </button>
            </div>
            <textarea v-model="df.rightJsonText.value" class="config-textarea"
              style="flex:1; min-height:0"
              placeholder="粘贴修改后的 JSON..." spellcheck="false" />
            <span v-if="df.rightError.value" class="ts-error" style="margin-top:4px">{{ df.rightError.value }}</span>
          </div>
        </div>
      </section>

      <!-- 右面板：结果 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Check :size="14" /></span>
            <span>对比结果</span>
          </div>
          <div class="panel-actions">
            <div class="view-toggle">
              <button :class="['seg-btn xs', { active: df.viewMode.value === 'split' }]" @click="df.viewMode.value = 'split'">
                并排
              </button>
              <button :class="['seg-btn xs', { active: df.viewMode.value === 'unified' }]" @click="df.viewMode.value = 'unified'">
                统一
              </button>
            </div>
            <template v-if="df.changeBlocks.value.length > 0">
              <button class="tool-icon-btn" @click="df.navigateToChange('prev')"
                @mouseenter="showTooltip('上一处差异', $event)" @mouseleave="hideTooltip">
                <ChevronLeft :size="13" />
              </button>
              <span class="nav-indicator">{{ df.activeChangeIndex.value + 1 }}/{{ df.changeBlocks.value.length }}</span>
              <button class="tool-icon-btn" @click="df.navigateToChange('next')"
                @mouseenter="showTooltip('下一处差异', $event)" @mouseleave="hideTooltip">
                <ChevronRight :size="13" />
              </button>
            </template>
          </div>
        </div>
        <div class="tool-panel-body" style="padding:0; overflow:hidden">
          <!-- Split view -->
          <div v-if="df.diffRows.value.length > 0 && df.viewMode.value === 'split'" class="diff-result-split">
            <div class="diff-result-side">
              <div v-for="(row, i) in df.diffRows.value" :key="'l'+i"
                :class="['diff-result-line', row.leftType, { active: df.isRowInActiveChange(i) }]">
                <span class="diff-num">{{ row.leftNumber ?? '' }}</span>
                <span class="diff-content">
                  <template v-for="(p, j) in row.leftPieces" :key="j">
                    <span :class="['diff-piece', p.type]">{{ p.value || ' ' }}</span>
                  </template>
                </span>
              </div>
            </div>
            <div class="diff-result-side">
              <div v-for="(row, i) in df.diffRows.value" :key="'r'+i"
                :class="['diff-result-line', row.rightType, { active: df.isRowInActiveChange(i) }]">
                <span class="diff-num">{{ row.rightNumber ?? '' }}</span>
                <span class="diff-content">
                  <template v-for="(p, j) in row.rightPieces" :key="j">
                    <span :class="['diff-piece', p.type]">{{ p.value || ' ' }}</span>
                  </template>
                </span>
              </div>
            </div>
          </div>

          <!-- Unified view -->
          <div v-else-if="df.diffRows.value.length > 0 && df.viewMode.value === 'unified'" class="diff-result-unified">
            <div v-for="(row, i) in df.diffRows.value" :key="i"
              :class="['diff-result-line', row.unifiedType, { active: df.isRowInActiveChange(i) }]">
              <span class="diff-num">{{ row.leftNumber ?? '' }}</span>
              <span class="diff-num">{{ row.rightNumber ?? '' }}</span>
              <span class="diff-content">
                <template v-for="(p, j) in row.unifiedPieces" :key="j">
                  <span :class="['diff-piece', p.type]">{{ p.value || ' ' }}</span>
                </template>
              </span>
            </div>
          </div>

          <!-- Empty -->
          <div v-if="df.diffRows.value.length === 0" class="tool-empty">
            <div class="empty-icon"><GitCompare :size="36" /></div>
            <p class="empty-title">JSON 对比</p>
            <p class="empty-desc">在左侧输入两份 JSON 数据进行对比</p>
          </div>
        </div>
      </section>
    </main>

    <!-- ==================== Schema 模式 ==================== -->
    <main v-if="activeMode === 'schema'" class="tool-main split">
      <!-- 左侧：输入 -->
      <section class="tool-panel">
        <div class="panel-mode-tabs">
          <button v-for="m in modes" :key="m.key"
            :class="['panel-mode-tab', { active: activeMode === m.key }]"
            @click="activeMode = m.key">
            <component :is="m.icon" :size="12" />
            <span>{{ m.label }}</span>
          </button>
        </div>
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Shield :size="14" /></span>
            <span>Schema 工具</span>
          </div>
          <div class="panel-actions">
            <div class="view-toggle">
              <button :class="['seg-btn xs', { active: sc.schemaMode.value === 'generate' }]"
                @click="sc.schemaMode.value = 'generate'">
                生成
              </button>
              <button :class="['seg-btn xs', { active: sc.schemaMode.value === 'validate' }]"
                @click="sc.schemaMode.value = 'validate'">
                验证
              </button>
            </div>
            <button class="tool-icon-btn" @click="sc.schemaMode.value === 'generate' ? sc.clearSchema() : sc.clearValidate()"
              @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body">
          <!-- 生成 Schema -->
          <template v-if="sc.schemaMode.value === 'generate'">
            <div class="config-section">
              <label class="config-label">JSON 数据</label>
              <div class="config-row" style="margin-bottom:4px">
                <span class="schema-hint">输入 JSON 数据，自动生成对应的 JSON Schema</span>
                <button class="tool-icon-btn small" @click="sc.pasteToSchemaInput()">
                  <ClipboardPaste :size="11" />
                </button>
              </div>
            </div>
            <div class="config-section grow" style="display:flex; flex-direction:column">
              <textarea v-model="sc.schemaInputJson.value" class="config-textarea"
                style="flex:1; min-height:0"
                placeholder='例如: { "name": "张三", "age": 25, "email": "test@example.com" }' spellcheck="false" />
            </div>
          </template>
          <!-- 验证数据 -->
          <template v-else>
            <div class="config-section" style="flex:1; display:flex; flex-direction:column">
              <div class="config-row">
                <label class="config-label">JSON Schema</label>
                <button class="tool-icon-btn small" @click="sc.pasteToValidateSchema()">
                  <ClipboardPaste :size="11" />
                </button>
              </div>
              <textarea v-model="sc.validateSchemaText.value" class="config-textarea"
                style="flex:1; min-height:0"
                placeholder="粘贴 JSON Schema 定义..." spellcheck="false" />
            </div>
            <div class="config-section" style="flex:1; display:flex; flex-direction:column">
              <div class="config-row">
                <label class="config-label">JSON 数据</label>
                <button class="tool-icon-btn small" @click="sc.pasteToValidateData()">
                  <ClipboardPaste :size="11" />
                </button>
              </div>
              <textarea v-model="sc.validateDataText.value" class="config-textarea"
                style="flex:1; min-height:0"
                placeholder="粘贴待验证的 JSON 数据..." spellcheck="false" />
            </div>
          </template>
        </div>
      </section>

      <!-- 右侧：结果 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Check :size="14" /></span>
            <span>{{ sc.schemaMode.value === 'generate' ? '生成的 Schema' : '验证结果' }}</span>
          </div>
          <div class="panel-actions">
            <button v-if="sc.schemaMode.value === 'generate'" class="tool-icon-btn" @click="sc.copyGeneratedSchema()"
              :disabled="!sc.generatedSchema.value"
              @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip">
              <Copy :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body">
          <!-- 生成结果 -->
          <template v-if="sc.schemaMode.value === 'generate'">
            <div v-if="sc.generateError.value" class="output-error">
              <div class="output-error-head"><CircleX :size="14" /> <span>生成错误</span></div>
              <p class="output-error-msg">{{ sc.generateError.value }}</p>
            </div>
            <div v-else-if="sc.generatedSchema.value" :class="['tool-code-output', { wrap: wordWrap }]" style="flex:1">
              <div v-for="(line, index) in sc.generatedSchema.value.split('\n')" :key="index"
                class="tool-code-line">
                <span class="line-num">{{ index + 1 }}</span>
                <pre class="line-content"><code>{{ line || ' ' }}</code></pre>
              </div>
            </div>
            <div v-else class="tool-empty">
              <div class="empty-icon"><Shield :size="36" /></div>
              <p class="empty-title">等待输入</p>
              <p class="empty-desc">在左侧输入 JSON 数据，自动生成 Schema</p>
            </div>
          </template>
          <!-- 验证结果 -->
          <template v-else>
            <div v-if="sc.validateError.value" class="output-error">
              <div class="output-error-head"><CircleX :size="14" /> <span>解析错误</span></div>
              <p class="output-error-msg">{{ sc.validateError.value }}</p>
            </div>
            <div v-else-if="sc.validatePassed.value" class="validate-pass">
              <Check :size="28" />
              <span>数据符合 Schema</span>
            </div>
            <div v-else-if="sc.validateErrors.value.length > 0" class="validate-errors">
              <div class="validate-errors-head">
                <CircleX :size="14" />
                <span>{{ sc.validateErrors.value.length }} 个验证错误</span>
              </div>
              <div v-for="(err, i) in sc.validateErrors.value" :key="i" class="validate-error-item">
                <span class="validate-error-path">{{ err.path }}</span>
                <span class="validate-error-msg">{{ err.message }}</span>
              </div>
            </div>
            <div v-else class="tool-empty">
              <div class="empty-icon"><Shield :size="36" /></div>
              <p class="empty-title">等待验证</p>
              <p class="empty-desc">在左侧输入 Schema 和数据，自动验证</p>
            </div>
          </template>
        </div>
      </section>
    </main>

    <!-- Hidden file input -->
    <input ref="fileInputRef" type="file" accept=".json,.txt,.geojson" style="display: none" @change="handleFileSelect" />

    <!-- Tooltip -->
    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">{{ tooltip.text }}</div>
  </div>
</template>

<style scoped>
/* JSON syntax colors */
.tool-page {
  --json-key-color: #0550ae;
  --json-string-color: #0a6640;
  --json-number-color: #b35900;
  --json-literal-color: #8250df;
  --search-match-bg: rgba(255, 213, 0, 0.15);
  --search-current-bg: rgba(255, 160, 0, 0.35);
}

html.dark .tool-page {
  --json-key-color: #79c0ff;
  --json-string-color: #7ee787;
  --json-number-color: #f0883e;
  --json-literal-color: #d2a8ff;
  --search-match-bg: rgba(255, 213, 0, 0.1);
  --search-current-bg: rgba(255, 160, 0, 0.25);
}

/* ====== Header ====== */
.header-stats {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  line-height: 1;
  color: var(--accent);
  background: var(--accent-light);
  font-family: var(--font-mono);
}

/* ====== Panel Actions ====== */
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  margin-right: 4px;
}

.status-badge.success { color: var(--accent); background: var(--accent-light); }
.status-badge.error { color: #ef4444; background: var(--error-light); }

/* ====== Config Sections ====== */
.tool-panel-body {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ====== Action Group ====== */
.action-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.execute-btn-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 14px;
  border: none;
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.execute-btn-sm:hover { filter: brightness(1.1); }

/* ====== Segment Buttons ====== */
.escape-icon {
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
}

/* ====== Options Row ====== */
.options-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.indent-group {
  display: flex;
  gap: 3px;
}

.toggle-group {
  display: flex;
  gap: 10px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary);
  cursor: pointer;
}

.toggle-check {
  width: 14px;
  height: 14px;
  border: 1px solid var(--border-default);
  border-radius: 3px;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.toggle-check.on {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

/* ====== View Toggle ====== */
.view-toggle {
  display: flex;
  gap: 2px;
}

/* ====== Config Textarea ====== */
.config-textarea {
  flex: 1;
  width: 100%;
  min-height: 100px;
  padding: 8px 10px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  outline: none;
  resize: none;
  line-height: 1.6;
  transition: all var(--transition-fast);
}

.config-textarea:hover { border-color: var(--border-strong); }
.config-textarea:focus { border-color: var(--accent); box-shadow: var(--shadow-focus); }
.config-textarea::placeholder { color: var(--text-muted); }
.config-textarea.jf-wrap { white-space: pre-wrap; word-break: break-all; }

/* ====== Drag Overlay ====== */
.drag-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--accent-light);
  border: 2px dashed var(--accent);
  border-radius: 6px;
  color: var(--accent);
  font-size: 13px;
  font-weight: 500;
  z-index: 10;
}

/* ====== Info Bar ====== */
.info-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.info-tag {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  padding: 1px 6px;
  background: var(--bg-tertiary);
  border-radius: 4px;
}

/* ====== Output: Code View ====== */
.tool-code-output {
  overflow: auto;
  padding: 8px 0;
  font-family: 'JetBrains Mono', 'Fira Code', var(--font-mono), monospace;
  font-size: 13px;
  line-height: 1.7;
}

.tool-code-output.wrap .line-content {
  white-space: pre-wrap;
  word-break: break-all;
}

.tool-code-line {
  display: flex;
  align-items: flex-start;
  padding: 0 16px;
}

.tool-code-line.search-match { background: var(--search-match-bg); }
.tool-code-line.search-current { background: var(--search-current-bg); }

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
}

.line-content code {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  background: transparent;
}

/* ====== Search Bar ====== */
.search-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 0 6px;
  height: 24px;
  margin-right: 4px;
}

.search-input {
  width: 80px;
  border: none;
  background: none;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  outline: none;
}

.search-input::placeholder { color: var(--text-muted); }

.search-count {
  font-size: 10px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  white-space: nowrap;
}

.search-nav {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
}

.search-nav:hover:not(:disabled) { background: var(--bg-hover); color: var(--text-primary); }
.search-nav:disabled { opacity: 0.4; cursor: not-allowed; }

/* ====== Output Error ====== */
.output-error {
  padding: 12px 14px;
}

.output-error-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #ef4444;
  margin-bottom: 4px;
}

.output-error-msg {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  font-family: var(--font-mono);
}

/* ====== Tree View ====== */
.tree-viewer {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 14px 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.8;
}

.tree-viewer :deep(summary) {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  list-style: none;
  padding: 1px 4px;
  border-radius: 3px;
}

.tree-viewer :deep(summary::-webkit-details-marker) { display: none; }
.tree-viewer :deep(summary::marker) { content: ''; }
.tree-viewer :deep(summary:hover) { background: var(--bg-hover); }
.tree-viewer :deep(.tv-item:hover) { background: var(--bg-hover); border-radius: 3px; }

.tree-viewer :deep(.tv-toggle) {
  font-size: 10px;
  color: var(--text-muted);
  width: 14px;
  text-align: center;
  display: inline-block;
}

.tree-viewer :deep(details[open] > summary .tv-toggle)::before { content: '▾'; }
.tree-viewer :deep(details:not([open]) > summary .tv-toggle)::before { content: '▸'; }

.tree-viewer :deep(.tv-children) {
  padding-left: 20px;
  border-left: 1px solid var(--border-subtle);
  margin-left: 7px;
}

.tree-viewer :deep(.tv-item) { padding-left: 4px; }
.tree-viewer :deep(.tv-key) { color: var(--json-key-color); font-weight: 500; }
.tree-viewer :deep(.tv-colon) { color: var(--text-muted); }
.tree-viewer :deep(.tv-string) { color: var(--json-string-color); }
.tree-viewer :deep(.tv-num) { color: var(--json-number-color); }
.tree-viewer :deep(.tv-bool) { color: var(--json-literal-color); }
.tree-viewer :deep(.tv-null) { color: var(--text-muted); }
.tree-viewer :deep(.tv-bracket) { color: var(--text-muted); }
.tree-viewer :deep(.tv-count) { font-size: 10px; color: var(--text-muted); margin-left: 4px; }
.tree-viewer :deep(.tv-collapsed) { font-size: 11px; color: var(--text-muted); }
.tree-viewer :deep(.tv-close) { display: block; }

.tree-viewer :deep(details[open] > summary .tv-collapsed) { display: none; }
.tree-viewer :deep(details:not([open]) > summary .tv-count) { display: none; }

.tree-viewer :deep(.tv-filter) {
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  margin-left: 4px;
  padding: 0 4px;
  border-radius: 3px;
  line-height: 1;
}

.tree-viewer :deep(.tv-filter:hover) {
  background: var(--accent-light);
  color: var(--accent);
}

/* Node info bar */
.node-info-bar {
  padding: 6px 14px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.node-path { color: var(--text-muted); }
.node-value { color: var(--text-secondary); word-break: break-all; }

/* ====== Syntax Highlighting ====== */
:deep(.hljs-attr) { color: var(--json-key-color); font-weight: 600; }
:deep(.hljs-string) { color: var(--json-string-color); }
:deep(.hljs-number) { color: var(--json-number-color); }
:deep(.hljs-literal) { color: var(--json-literal-color); font-style: italic; }
:deep(.hljs-punctuation) { color: var(--text-muted); }

/* ====== Filter Panel ====== */
.filter-panel {
  border-top: 1px solid var(--border-subtle);
  padding: 10px 14px;
  flex-shrink: 0;
  background: var(--bg-secondary);
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.filter-path {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--accent);
  font-weight: 400;
}

.filter-body {
  display: flex;
  gap: 4px;
  align-items: center;
}

.filter-input {
  height: 26px;
  padding: 0 8px;
  font-size: 11px;
  font-family: var(--font-mono);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
}

.filter-input:focus { border-color: var(--accent); }

.filter-select {
  height: 26px;
  padding: 0 4px;
  font-size: 11px;
  border: 1px solid var(--border-default);
  border-radius: 4px;
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
}

.filter-btn {
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--border-default);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-btn:hover { background: var(--bg-hover); }

.filter-btn.primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.filter-stats {
  margin-top: 6px;
  font-size: 11px;
  color: var(--text-muted);
}

/* ====== Context Menu ====== */
.tool-context-menu {
  position: fixed;
  z-index: 9999;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 4px;
  min-width: 140px;
}

.tool-context-menu button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background var(--transition-fast);
}

.tool-context-menu button:hover { background: var(--bg-hover); }
.tool-context-menu button.danger { color: #ef4444; }
.tool-context-menu button.danger:hover { background: rgba(239, 68, 68, 0.1); }

.context-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 4px 8px;
}

/* ====== Tree Toolbar ====== */
.tree-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tree-search-bar {
  display: flex;
  align-items: center;
  gap: 3px;
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: 5px;
  padding: 0 5px;
  height: 24px;
}

.tree-search-input {
  width: 80px;
  border: none;
  background: none;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  outline: none;
}

.tree-search-input::placeholder { color: var(--text-muted); }

.tree-regex-btn {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 10px;
  font-family: var(--font-mono);
  font-weight: 700;
  cursor: pointer;
  padding: 1px 4px;
  border-radius: 3px;
  transition: all var(--transition-fast);
}

.tree-regex-btn.active {
  color: var(--accent);
  background: var(--accent-light);
}

.tree-expand-group {
  display: flex;
  gap: 2px;
}

/* ====== Tree Search Highlight ====== */
.tree-viewer :deep(.tv-search-match) {
  background: rgba(59, 130, 246, 0.12);
  border-radius: 2px;
  outline: 1px solid rgba(59, 130, 246, 0.25);
}

.tree-viewer :deep(mark.tv-highlight) {
  background: rgba(234, 179, 8, 0.35);
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
}

/* ====== Tree Edit Popup ====== */
.tree-edit-popup {
  position: fixed;
  z-index: 10000;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  padding: 10px;
  min-width: 200px;
  max-width: 320px;
}

.tree-edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.tree-edit-path {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 400;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-edit-input {
  width: 100%;
  padding: 5px 8px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  outline: none;
  margin-bottom: 6px;
}

.tree-edit-input:focus {
  border-color: var(--accent);
}

.tree-edit-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

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

.tool-code-output::-webkit-scrollbar { width: 5px; height: 5px; }
.tool-code-output::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.tool-code-output::-webkit-scrollbar-track { background: transparent; }

.tree-viewer::-webkit-scrollbar { width: 5px; }
.tree-viewer::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.tree-viewer::-webkit-scrollbar-track { background: transparent; }

/* ====== Responsive ====== */
@media (max-width: 760px) {
  .tool-main { grid-template-columns: 1fr !important; }
}

/* ====== Mode Tabs (panel top) ====== */
.mode-tabs {
  display: flex;
  gap: 2px;
}

.panel-mode-tabs {
  display: flex;
  gap: 2px;
  padding: 8px 14px 0;
}

.panel-mode-tabs.compact {
  padding: 0;
}

.panel-mode-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  transition: all var(--transition-fast);
  border-bottom: 2px solid transparent;
}

.panel-mode-tab:hover {
  color: var(--text-secondary);
  background: var(--bg-hover);
}

.panel-mode-tab.active {
  color: var(--accent);
  background: var(--accent-light);
  border-bottom-color: var(--accent);
  font-weight: 600;
}

.panel-mode-tabs.compact .panel-mode-tab {
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  border-bottom: none;
}

/* ====== JSONPath ====== */
.jsonpath-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 0 6px;
  height: 26px;
}

.jsonpath-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  outline: none;
}

.jsonpath-input::placeholder { color: var(--text-muted); }

/* ====== Convert Mode ====== */
.format-toggle {
  display: flex;
  gap: 2px;
  margin-right: 4px;
}

/* ====== Diff Mode ====== */
.diff-result-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  flex: 1;
  overflow: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.7;
}

.diff-result-side {
  overflow: auto;
  border-right: 1px solid var(--border-subtle);
}

.diff-result-side:last-child { border-right: none; }

.diff-result-unified {
  flex: 1;
  overflow: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.7;
}

.diff-result-line {
  display: flex;
  min-height: 22px;
  line-height: 22px;
  padding: 0 10px;
}

.diff-result-line.same { background: transparent; }
.diff-result-line.add { background: rgba(34, 197, 94, 0.1); }
.diff-result-line.remove { background: rgba(239, 68, 68, 0.1); }
.diff-result-line.empty { background: var(--bg-secondary); }
.diff-result-line.active { background: rgba(234, 179, 8, 0.08) !important; }

.diff-num {
  width: 36px;
  text-align: right;
  padding-right: 8px;
  font-size: 10px;
  color: var(--text-muted);
  user-select: none;
  flex-shrink: 0;
  opacity: 0.6;
}

.diff-content {
  flex: 1;
  white-space: pre;
  overflow: hidden;
  text-overflow: ellipsis;
}

.diff-piece.same { color: var(--text-primary); }
.diff-piece.add { color: #1a7f37; background: rgba(34, 197, 94, 0.2); border-radius: 2px; }
.diff-piece.remove { color: #82071e; background: rgba(239, 68, 68, 0.2); border-radius: 2px; }

html.dark .diff-piece.add { color: #7ee787; }
html.dark .diff-piece.remove { color: #ff8182; }

/* Stat tags for diff */
.stat-tag.add { color: #1a7f37; background: rgba(34, 197, 94, 0.1); }
.stat-tag.del { color: #82071e; background: rgba(239, 68, 68, 0.1); }
.stat-tag.mod { color: #92400e; background: rgba(234, 179, 8, 0.1); }

html.dark .stat-tag.add { color: #7ee787; background: rgba(34, 197, 94, 0.15); }
html.dark .stat-tag.del { color: #ff8182; background: rgba(239, 68, 68, 0.15); }
html.dark .stat-tag.mod { color: #fbbf24; background: rgba(234, 179, 8, 0.15); }

/* ====== Schema Mode ====== */
.schema-hint {
  font-size: 11px;
  color: var(--text-muted);
}

.validate-pass {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 20px;
  color: var(--success);
  font-size: 15px;
  font-weight: 600;
}

.validate-errors {
  padding: 14px;
}

.validate-errors-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #ef4444;
  margin-bottom: 10px;
}

.validate-error-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: rgba(239, 68, 68, 0.05);
  margin-bottom: 4px;
}

.validate-error-path {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
  white-space: nowrap;
  flex-shrink: 0;
}

.validate-error-msg {
  font-size: 12px;
  color: var(--text-secondary);
}

</style>
