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

    <!-- 工具栏 -->
    <div class="tool-toolbar">
      <div class="tool-toolbar-left">
        <div class="tool-segment">
          <button class="tool-segment-btn" :class="{ active: currentMode === 'encode' }" @click="currentMode = 'encode'">编码</button>
          <button class="tool-segment-btn" :class="{ active: currentMode === 'decode' }" @click="currentMode = 'decode'">解码</button>
        </div>

        <div class="tool-divider"></div>

        <!-- 格式选择 -->
        <div class="tool-segment format-segment">
          <button
            v-for="opt in formatOptions"
            :key="opt.value"
            class="tool-segment-btn format-btn"
            :class="{ active: currentFormat === opt.value }"
            @click="currentFormat = opt.value"
            @mouseenter="showTooltip(opt.example, $event)" @mouseleave="hideTooltip"
          >
            <span>{{ opt.label }}</span>
          </button>
        </div>

        <div class="tool-divider"></div>

        <button class="glass-icon-btn" @click="loadExample" @mouseenter="showTooltip('示例', $event)" @mouseleave="hideTooltip">
          <Code :size="15" />
        </button>
        <button class="glass-icon-btn" @click="pasteFromClipboard" @mouseenter="showTooltip('粘贴', $event)" @mouseleave="hideTooltip">
          <ClipboardPaste :size="15" />
        </button>
        <button class="glass-icon-btn danger" @click="clearAll" :disabled="!inputText" @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
          <Trash2 :size="15" />
        </button>
      </div>

      <div class="tool-toolbar-right">
        <span v-if="inputStats.chars" class="tool-stat">{{ inputStats.chars }} 字符 / {{ inputStats.lines }} 行</span>
        <span v-if="outputStats.chars" class="tool-stat">→ {{ outputStats.chars }} 字符</span>
      </div>
    </div>

    <!-- 主内容 -->
    <main class="tool-main split">
      <!-- 输入面板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Code :size="12" /></span>
            <span>输入</span>
          </div>
          <div class="tool-panel-actions">
            <button class="glass-icon-btn small" @click="pasteFromClipboard" @mouseenter="showTooltip('粘贴', $event)" @mouseleave="hideTooltip">
              <ClipboardPaste :size="13" />
            </button>
            <button class="glass-icon-btn small" @click="inputText = ''" :disabled="!inputText" @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body" style="padding:0">
          <textarea
            v-model="inputText"
            class="unicode-textarea"
            :placeholder="currentMode === 'encode' ? '输入需要编码的文本（如中文）...' : '输入需要解码的 Unicode 文本...'"
            spellcheck="false"
          ></textarea>
        </div>
      </section>

      <!-- 输出面板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Check :size="12" /></span>
            <span>输出</span>
          </div>
          <div class="tool-panel-actions">
            <button class="glass-icon-btn small" @click="swapDirection" @mouseenter="showTooltip('交换输入输出', $event)" @mouseleave="hideTooltip">
              <ArrowLeftRight :size="13" />
            </button>
            <button class="glass-icon-btn small" @click="copyOutput" :disabled="!outputText" @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip">
              <Copy v-if="!copied" :size="13" />
              <Check v-else :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body" style="padding:0; overflow: auto">
          <div v-if="outputText" class="unicode-output-area" @click="copyOutput">
            <div class="unicode-output-line" v-for="(line, index) in outputText.split('\n')" :key="index">
              <span class="line-num">{{ index + 1 }}</span>
              <pre class="line-content"><code>{{ line || ' ' }}</code></pre>
            </div>
          </div>
          <div v-else class="tool-empty">
            <div class="empty-icon"><ArrowLeftRight :size="24" /></div>
            <p class="empty-title">等待输入</p>
            <p class="empty-desc">在左侧输入文本，自动{{ currentMode === 'encode' ? '编码' : '解码' }}</p>
          </div>
        </div>
      </section>
    </main>

    <!-- 底部格式说明 -->
    <div class="format-rules-bar">
      <span class="rules-label">当前格式</span>
      <div class="rules-list">
        <span v-for="rule in formatRules" :key="rule.desc" class="rule-chip">
          <code class="rule-from">{{ rule.from }}</code>
          <span class="rule-arrow">→</span>
          <code class="rule-to">{{ rule.to }}</code>
          <span class="rule-desc">{{ rule.desc }}</span>
        </span>
      </div>
    </div>

    <!-- Tooltip -->
    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">{{ tooltip.text }}</div>
  </div>
</template>

<style scoped>
.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 4px;
}

.mode-tag {
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-weight: 600;
}

.mode-tag.encode { color: var(--accent); background: var(--accent-light); }
.mode-tag.decode { color: var(--success); background: var(--success-light); }

/* ====== 统计 ====== */
.tool-stat {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  padding: 2px 8px;
  background: var(--bg-secondary);
  border-radius: var(--radius-xs);
}

/* ====== 格式按钮 ====== */
.format-segment { max-width: none; }

.format-btn span {
  font-family: var(--font-mono);
  font-size: 11px;
}

/* ====== 输入区 ====== */
.unicode-textarea {
  width: 100%;
  height: 100%;
  padding: 14px 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--text-primary);
  tab-size: 2;
}

.unicode-textarea::placeholder { color: var(--text-muted); }

/* ====== 输出区 ====== */
.unicode-output-area { cursor: pointer; }

.unicode-output-line {
  display: flex;
  align-items: flex-start;
  padding: 0 16px;
  min-height: 24px;
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

/* ====== 底部格式栏 ====== */
.format-rules-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
  overflow-x: auto;
}

.rules-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}

.rules-list {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
}

.rule-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  font-size: 11px;
  white-space: nowrap;
}

.rule-from,
.rule-to {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
}

.rule-from { color: var(--text-secondary); }
.rule-to { color: var(--accent); }
.rule-arrow { font-size: 10px; color: var(--text-muted); }
.rule-desc { font-size: 10px; color: var(--text-muted); margin-left: 2px; }

/* ====== Tooltip ====== */
.toolbar-tooltip {
  position: fixed;
  z-index: 9999;
  padding: 5px 12px;
  font-size: 12px;
  color: var(--text-inverse, #fff);
  background: var(--bg-tooltip, rgba(0, 0, 0, 0.85));
  border-radius: var(--radius-sm, 4px);
  white-space: nowrap;
  pointer-events: none;
  transform: translateX(-50%);
  min-width: 60px;
  text-align: center;
}

/* ====== 响应式 ====== */
@media (max-width: 760px) {
  .tool-main { grid-template-columns: 1fr !important; }
  .format-segment { display: none; }
}
</style>
