<script setup lang="ts">
import {
  Copy, Check, Trash2, ClipboardPaste,
  ArrowLeftRight, Code,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import { useTooltip } from '@/composables/useTooltip'
import { useAscii, baseOptions, separatorOptions } from './useAscii'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
  mode, base, separator, inputText, outputText, copied,
  inputStats, outputStats,
  swapDirection, copyOutput, clearAll, pasteFromClipboard, loadExample,
} = useAscii()
</script>

<template>
  <div class="tool-page">
    <!-- 标题栏 -->
    <ToolTitleBar title="ASCII 转换" icon="icon-ascii">
      <div class="header-content">
        <span class="mode-tag" :class="mode">
          {{ mode === 'encode' ? '编码' : '解码' }}
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
            <button class="action-btn" @click="loadExample"
              @mouseenter="showTooltip('示例', $event)" @mouseleave="hideTooltip">
              <Code :size="13" />
            </button>
            <button class="action-btn" @click="pasteFromClipboard"
              @mouseenter="showTooltip('粘贴', $event)" @mouseleave="hideTooltip">
              <ClipboardPaste :size="13" />
            </button>
            <button class="action-btn" @click="clearAll" :disabled="!inputText"
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
              <button :class="['seg-btn xs', { active: mode === 'encode' }]" @click="mode = 'encode'">编码</button>
              <button :class="['seg-btn xs', { active: mode === 'decode' }]" @click="mode = 'decode'">解码</button>
            </div>
          </div>

          <!-- 进制 -->
          <div class="config-section">
            <label class="config-label">进制</label>
            <div class="format-chips">
              <button
                v-for="opt in baseOptions" :key="opt.value"
                class="format-chip" :class="{ active: base === opt.value }"
                @click="base = opt.value"
              >{{ opt.label }}</button>
            </div>
          </div>

          <!-- 分隔符 -->
          <div class="config-section">
            <label class="config-label">分隔符</label>
            <div class="format-chips">
              <button
                v-for="opt in separatorOptions" :key="opt.value"
                class="format-chip" :class="{ active: separator === opt.value }"
                @click="separator = opt.value"
              >{{ opt.label }}</button>
            </div>
          </div>

          <!-- 输入文本 -->
          <div class="config-section grow">
            <textarea
              v-model="inputText"
              class="config-textarea"
              :placeholder="mode === 'encode' ? '输入文本进行 ASCII 编码...' : '输入 ASCII 码进行解码（如 72 101 108）...'"
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
            <button class="action-btn" @click="swapDirection"
              @mouseenter="showTooltip('交换输入输出', $event)" @mouseleave="hideTooltip">
              <ArrowLeftRight :size="13" />
            </button>
            <button class="action-btn" @click="copyOutput" :disabled="!outputText"
              @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip">
              <Check v-if="copied" :size="13" /><Copy v-else :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body">
          <div v-if="outputText" class="ascii-output-area" @click="copyOutput">
            <div class="ascii-output-line" v-for="(line, index) in outputText.split('\n')" :key="index">
              <span class="line-num">{{ index + 1 }}</span>
              <pre class="line-content"><code>{{ line || ' ' }}</code></pre>
            </div>
          </div>
          <div v-else class="tool-empty">
            <div class="empty-icon"><ArrowLeftRight :size="28" /></div>
            <p class="empty-title">等待输入</p>
            <p class="empty-desc">在左侧输入文本，自动{{ mode === 'encode' ? '编码' : '解码' }}</p>
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
.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 4px;
}

.mode-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.mode-tag.encode { color: var(--accent); background: var(--accent-light); }
.mode-tag.decode { color: var(--success); background: var(--success-light); }

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
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.format-chip:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
.format-chip.active { background: var(--accent); border-color: var(--accent); color: #fff; }

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
.ascii-output-area { cursor: pointer; padding: 8px 0; }

.ascii-output-line {
  display: flex;
  align-items: flex-start;
  padding: 0 16px;
  transition: background 0.1s;
}

.ascii-output-line:hover { background: var(--bg-hover); }

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
