<script setup lang="ts">
import {
  Copy, Check, Trash2, Link, ClipboardPaste,
  ArrowLeftRight, List, Code,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import { useTooltip } from '@/composables/useTooltip'
import { useUrlTool } from './useUrlTool'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
  currentTab, mode, inputText, outputText, copied, parsedUrl,
  inputStats, parseStats,
  toggleMode, copyOutput, copyText, clear, paste, loadExample,
} = useUrlTool()
</script>

<template>
  <div class="tool-page">
    <!-- 标题栏 -->
    <ToolTitleBar title="URL 工具" icon="icon-link">
      <div class="header-content">
        <template v-if="currentTab === 'codec'">
          <span class="mode-tag" :class="mode">{{ mode === 'encode' ? '编码' : '解码' }}</span>
        </template>
        <template v-else-if="parsedUrl">
          <span class="mode-tag" :class="parsedUrl.valid ? 'success' : 'error'">
            {{ parsedUrl.valid ? '解析成功' : '无效 URL' }}
          </span>
          <span v-if="parsedUrl.valid" class="stat-tag">{{ parseStats.params }} 参数 · {{ parseStats.segments }} 路径段</span>
        </template>
      </div>
    </ToolTitleBar>

    <!-- 编解码模式 -->
    <main v-if="currentTab === 'codec'" class="tool-main split">
      <!-- 左：配置 + 输入 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Link :size="14" /></span>
            <span>输入</span>
          </div>
          <div class="panel-actions">
            <span v-if="inputStats.chars" class="byte-info">{{ inputStats.chars }} 字符</span>
            <button class="action-btn" @click="paste"
              @mouseenter="showTooltip('粘贴', $event)" @mouseleave="hideTooltip">
              <ClipboardPaste :size="13" />
            </button>
            <button class="action-btn" @click="clear" :disabled="!inputText"
              @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>

        <div class="tool-panel-body">
          <!-- 模式切换 -->
          <div class="config-section">
            <label class="config-label">功能</label>
            <div class="tab-toggle">
              <button class="seg-btn xs active">
                <Link :size="11" /> 编解码
              </button>
              <button class="seg-btn xs" @click="currentTab = 'parse'">
                <List :size="11" /> URL 拆解
              </button>
            </div>
          </div>

          <!-- 编码/解码 -->
          <div class="config-section">
            <label class="config-label">模式</label>
            <div class="mode-toggle">
              <button :class="['seg-btn xs', { active: mode === 'encode' }]" @click="mode = 'encode'">编码</button>
              <button :class="['seg-btn xs', { active: mode === 'decode' }]" @click="mode = 'decode'">解码</button>
            </div>
          </div>

          <!-- 编码规则 -->
          <div class="config-section">
            <label class="config-label">编码规则</label>
            <div class="rules-list">
              <span class="rule-chip"><code>空格</code> → <code>%20</code></span>
              <span class="rule-chip"><code>中文</code> → <code>%XX</code></span>
              <span class="rule-chip"><code>&</code> → <code>%26</code></span>
              <span class="rule-chip"><code>=</code> → <code>%3D</code></span>
            </div>
          </div>

          <!-- 输入文本 -->
          <div class="config-section grow">
            <textarea
              v-model="inputText"
              class="config-textarea"
              :placeholder="mode === 'encode' ? '输入需要编码的 URL 或文本...' : '输入需要解码的 URL 编码文本...'"
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
            <button class="action-btn" @click="toggleMode"
              @mouseenter="showTooltip('交换输入输出', $event)" @mouseleave="hideTooltip">
              <ArrowLeftRight :size="13" />
            </button>
            <div class="panel-divider"></div>
            <button class="action-btn" @click="copyOutput" :disabled="!outputText"
              @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip">
              <Check v-if="copied" :size="13" /><Copy v-else :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body">
          <div v-if="outputText" class="url-output-area" @click="copyOutput">
            <div class="url-output-line" v-for="(line, index) in outputText.split('\n')" :key="index">
              <span class="line-num">{{ index + 1 }}</span>
              <pre class="line-content"><code>{{ line || ' ' }}</code></pre>
            </div>
          </div>
          <div v-else class="tool-empty">
            <div class="empty-icon"><Link :size="28" /></div>
            <p class="empty-title">等待输入</p>
            <p class="empty-desc">在左侧输入文本，自动{{ mode === 'encode' ? '编码' : '解码' }}</p>
          </div>
        </div>
      </section>
    </main>

    <!-- URL 拆解模式 -->
    <main v-else class="tool-main split">
      <!-- 左：输入 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Link :size="14" /></span>
            <span>URL 输入</span>
          </div>
          <div class="panel-actions">
            <button class="action-btn" @click="paste"
              @mouseenter="showTooltip('粘贴', $event)" @mouseleave="hideTooltip">
              <ClipboardPaste :size="13" />
            </button>
            <button class="action-btn" @click="loadExample"
              @mouseenter="showTooltip('示例', $event)" @mouseleave="hideTooltip">
              <Code :size="13" />
            </button>
            <button class="action-btn" @click="clear" :disabled="!inputText"
              @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>

        <div class="tool-panel-body">
          <!-- 功能切换 -->
          <div class="config-section">
            <label class="config-label">功能</label>
            <div class="tab-toggle">
              <button class="seg-btn xs" @click="currentTab = 'codec'">
                <Link :size="11" /> 编解码
              </button>
              <button class="seg-btn xs active">
                <List :size="11" /> URL 拆解
              </button>
            </div>
          </div>

          <!-- 输入 -->
          <div class="config-section grow">
            <textarea
              v-model="inputText"
              class="config-textarea"
              placeholder="输入完整的 URL 地址进行解析..."
              spellcheck="false"
            />
          </div>
        </div>
      </section>

      <!-- 右：解析结果 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><List :size="14" /></span>
            <span>解析结果</span>
          </div>
        </div>
        <div class="tool-panel-body">
          <div v-if="parsedUrl && parsedUrl.valid" class="parse-body">
            <!-- URL 组成 -->
            <div class="parse-section">
              <div class="parse-section-head">
                <span class="dot blue"></span>
                <span>URL 组成</span>
              </div>
              <div class="parse-list">
                <div v-for="part in parsedUrl.parts" :key="part.key" class="parse-row" @click="copyText(part.value)">
                  <div class="parse-row-left">
                    <code class="parse-key">{{ part.key }}</code>
                    <span v-if="part.desc" class="parse-desc">{{ part.desc }}</span>
                  </div>
                  <div class="parse-row-right">
                    <code class="parse-val">{{ part.value }}</code>
                    <Copy :size="12" class="parse-copy" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Query 参数 -->
            <div v-if="parsedUrl.queryParams.length" class="parse-section">
              <div class="parse-section-head">
                <span class="dot green"></span>
                <span>Query 参数</span>
                <span class="parse-count">{{ parsedUrl.queryParams.length }}</span>
              </div>
              <div class="parse-list">
                <div v-for="(param, i) in parsedUrl.queryParams" :key="i" class="parse-row" @click="copyText(param.value)">
                  <div class="parse-row-left">
                    <span class="parse-idx">{{ i + 1 }}</span>
                    <code class="parse-key green">{{ param.key }}</code>
                    <span class="parse-eq">=</span>
                    <code class="parse-val-inline">{{ param.value || '(空)' }}</code>
                  </div>
                  <Copy :size="12" class="parse-copy" />
                </div>
              </div>
            </div>

            <!-- 路径段 -->
            <div v-if="parsedUrl.pathSegments.length" class="parse-section">
              <div class="parse-section-head">
                <span class="dot orange"></span>
                <span>路径段</span>
                <span class="parse-count">{{ parsedUrl.pathSegments.length }}</span>
              </div>
              <div class="parse-list">
                <div v-for="(seg, i) in parsedUrl.pathSegments" :key="i" class="parse-row" @click="copyText(seg)">
                  <div class="parse-row-left">
                    <span class="parse-idx">{{ i + 1 }}</span>
                    <code class="parse-key">/{{ seg }}</code>
                  </div>
                  <Copy :size="12" class="parse-copy" />
                </div>
              </div>
            </div>
          </div>

          <div v-else class="tool-empty">
            <div class="empty-icon"><Link :size="28" /></div>
            <p class="empty-title">{{ parsedUrl && !parsedUrl.valid ? '无效的 URL' : '输入 URL 进行解析' }}</p>
            <p class="empty-desc">支持 HTTP/HTTPS 协议的完整 URL</p>
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
  color: var(--accent);
  background: var(--accent-light);
}

.mode-tag.success { color: var(--success); background: var(--success-light); }
.mode-tag.error { color: var(--error); background: var(--error-light); }

.stat-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-tertiary);
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

.tab-toggle, .mode-toggle {
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

/* ====== 编码规则 ====== */
.rules-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.rule-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  background: var(--bg-secondary);
  border-radius: 4px;
}

.rule-chip code {
  font-family: inherit;
  font-size: inherit;
}

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
.url-output-area {
  cursor: pointer;
  padding: 8px 0;
}

.url-output-line {
  display: flex;
  align-items: flex-start;
  padding: 0 16px;
  transition: background 0.1s;
}

.url-output-line:hover { background: var(--bg-hover); }

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

/* ====== URL 拆解结果 ====== */
.parse-body {
  padding: 14px;
}

.parse-section {
  margin-bottom: 16px;
}

.parse-section:last-child { margin-bottom: 0; }

.parse-section-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot.blue { background: var(--accent); }
.dot.green { background: var(--success); }
.dot.orange { background: #f59e0b; }

.parse-count {
  padding: 0 6px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-secondary);
  border-radius: 10px;
  line-height: 18px;
}

.parse-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
}

.parse-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.12s;
}

.parse-row:hover { background: var(--bg-hover); }
.parse-row:hover .parse-copy { opacity: 1; }

.parse-row-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.parse-row-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.parse-key {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
}

.parse-key.green { color: var(--success); }

.parse-desc {
  font-size: 11px;
  color: var(--text-muted);
}

.parse-val {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-primary);
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.parse-val-inline {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.parse-eq {
  color: var(--text-muted);
  font-size: 12px;
}

.parse-idx {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-primary);
  border-radius: 50%;
  flex-shrink: 0;
}

.parse-copy {
  color: var(--text-muted);
  opacity: 0;
  transition: opacity 0.12s;
  flex-shrink: 0;
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

/* ====== Tooltip ====== */
.toolbar-tooltip {
  position: fixed;
  z-index: 9999;
  padding: 5px 10px;
  font-size: 12px;
  color: var(--text-inverse, #fff);
  background: var(--bg-tooltip, rgba(0, 0, 0, 0.85));
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  transform: translateX(-50%);
  line-height: 1.4;
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
