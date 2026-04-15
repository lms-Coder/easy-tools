<script setup lang="ts">
import {
  Copy, Check, Trash2, ClipboardPaste,
  ArrowLeftRight, Code,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import { useTooltip } from '@/composables/useTooltip'
import { useUnicode, formatOptions } from './useUnicode'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
  currentMode, currentFormat, inputText, outputText, copied,
  inputStats, outputStats, formatRules,
  swapDirection, copyOutput, clearAll, pasteFromClipboard, loadExample,
} = useUnicode()
</script>

<template>
  <div class="tool-page">
    <!-- 标题栏 -->
    <ToolTitleBar title="Unicode 转换" icon="icon-unicode">
      <div class="header-content">
        <span class="mode-tag" :class="currentMode">
          {{ currentMode === 'encode' ? '编码' : '解码' }}
        </span>
      </div>
    </ToolTitleBar>

    <!-- 主内容 -->
    <main class="tool-main split">
      <!-- 左：配置 + 输入 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Code :size="14" /></span>
            <span>输入</span>
          </div>
          <div class="panel-actions">
            <span v-if="inputStats.chars" class="byte-info">{{ inputStats.chars }} 字符 / {{ inputStats.lines }} 行</span>
            <button class="tool-icon-btn" @click="loadExample"
              @mouseenter="showTooltip('示例', $event)" @mouseleave="hideTooltip">
              <Code :size="13" />
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
          <!-- 模式 -->
          <div class="config-section">
            <label class="config-label">模式</label>
            <div class="mode-toggle">
              <button :class="['seg-btn xs', { active: currentMode === 'encode' }]" @click="currentMode = 'encode'">编码</button>
              <button :class="['seg-btn xs', { active: currentMode === 'decode' }]" @click="currentMode = 'decode'">解码</button>
            </div>
          </div>

          <!-- 格式选择 -->
          <div class="config-section">
            <label class="config-label">格式</label>
            <div class="format-chips">
              <button
                v-for="opt in formatOptions"
                :key="opt.value"
                class="format-chip"
                :class="{ active: currentFormat === opt.value }"
                @click="currentFormat = opt.value"
                @mouseenter="showTooltip(opt.example, $event)" @mouseleave="hideTooltip"
              >{{ opt.label }}</button>
            </div>
          </div>

          <!-- 当前格式规则 -->
          <div class="config-section">
            <label class="config-label">当前格式</label>
            <div class="rules-list">
              <span v-for="rule in formatRules" :key="rule.desc" class="rule-chip">
                <code class="rule-from">{{ rule.from }}</code>
                <span class="rule-arrow">→</span>
                <code class="rule-to">{{ rule.to }}</code>
                <span class="rule-desc">{{ rule.desc }}</span>
              </span>
            </div>
          </div>

          <!-- 输入文本 -->
          <div class="config-section grow">
            <textarea
              v-model="inputText"
              class="config-textarea"
              :placeholder="currentMode === 'encode' ? '输入需要编码的文本（如中文）...' : '输入需要解码的 Unicode 文本...'"
              spellcheck="false"
            />
          </div>
        </div>
      </section>

      <!-- 右：输出 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Check :size="14" /></span>
            <span>输出</span>
          </div>
          <div class="panel-actions">
            <span v-if="outputStats.chars" class="byte-info">{{ outputStats.chars }} 字符</span>
            <div class="panel-divider"></div>
            <button class="tool-icon-btn" @click="swapDirection"
              @mouseenter="showTooltip('交换输入输出', $event)" @mouseleave="hideTooltip">
              <ArrowLeftRight :size="13" />
            </button>
            <button class="tool-icon-btn" @click="copyOutput" :disabled="!outputText"
              @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip">
              <Check v-if="copied" :size="13" /><Copy v-else :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body">
          <div v-if="outputText" class="unicode-output-area" @click="copyOutput">
            <div class="unicode-output-line" v-for="(line, index) in outputText.split('\n')" :key="index">
              <span class="line-num">{{ index + 1 }}</span>
              <pre class="line-content"><code>{{ line || ' ' }}</code></pre>
            </div>
          </div>
          <div v-else class="tool-empty">
            <div class="empty-icon"><ArrowLeftRight :size="28" /></div>
            <p class="empty-title">等待输入</p>
            <p class="empty-desc">在左侧输入文本，自动{{ currentMode === 'encode' ? '编码' : '解码' }}</p>
          </div>
        </div>
      </section>
    </main>

    <!-- Tooltip -->
    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">{{ tooltip.text }}</div>
  </div>
</template>

<style scoped>
/* ====== Header ====== */
.mode-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.mode-tag.encode { color: var(--accent); background: var(--accent-light); }
.mode-tag.decode { color: var(--success); background: var(--success-light); }

/* ====== Panel Actions ====== */
.panel-divider {
  width: 1px;
  height: 16px;
  background: var(--border-subtle);
  margin: 0 4px;
}

.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.byte-info {
  font-size: 10px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  padding: 1px 6px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  margin-right: 2px;
}

/* ====== Segment Buttons ====== */
.mode-toggle {
  display: flex;
  gap: 2px;
}

/* ====== Config Sections ====== */
.tool-panel-body {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
}

/* ====== Format Chips ====== */
.format-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.format-chip {
  padding: 3px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.format-chip:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
.format-chip.active { background: var(--accent); border-color: var(--accent); color: #fff; }

/* ====== Format Rules ====== */
.rules-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.rule-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  font-size: 11px;
  white-space: nowrap;
}

.rule-from, .rule-to {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
}

.rule-from { color: var(--text-secondary); }
.rule-to { color: var(--accent); }
.rule-arrow { font-size: 10px; color: var(--text-muted); }
.rule-desc { font-size: 10px; color: var(--text-muted); margin-left: 2px; }

/* ====== Textarea ====== */
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

/* ====== 输出区 ====== */
.unicode-output-area { cursor: pointer; padding: 8px 0; }

.unicode-output-line {
  display: flex;
  align-items: flex-start;
  padding: 0 16px;
  transition: background 0.1s;
}

.unicode-output-line:hover { background: var(--bg-hover); }

.line-num {
  width: 32px;
  flex-shrink: 0;
  padding: 2px 0;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  text-align: right;
  user-select: none;
  line-height: 1.7;
  padding-right: 12px;
  opacity: 0.5;
}

.line-content {
  flex: 1;
  margin: 0;
  padding: 2px 0;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.7;
  word-break: break-all;
  white-space: pre-wrap;
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

.config-textarea::-webkit-scrollbar { width: 4px; }
.config-textarea::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.config-textarea::-webkit-scrollbar-track { background: transparent; }

/* ====== Responsive ====== */
@media (max-width: 760px) {
  .tool-main { grid-template-columns: 1fr !important; }
}
</style>
