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

    <!-- 工具栏 -->
    <div class="tool-toolbar">
      <div class="tool-toolbar-left">
        <div class="tool-segment">
          <button class="tool-segment-btn" :class="{ active: currentTab === 'codec' }" @click="currentTab = 'codec'" @mouseenter="showTooltip('编解码', $event)" @mouseleave="hideTooltip">
            <Link :size="14" />
            <span>编解码</span>
          </button>
          <button class="tool-segment-btn" :class="{ active: currentTab === 'parse' }" @click="currentTab = 'parse'" @mouseenter="showTooltip('URL 拆解', $event)" @mouseleave="hideTooltip">
            <List :size="14" />
            <span>URL 拆解</span>
          </button>
        </div>

        <template v-if="currentTab === 'codec'">
          <div class="tool-divider"></div>
          <div class="tool-segment">
            <button class="tool-segment-btn" :class="{ active: mode === 'encode' }" @click="mode = 'encode'">编码</button>
            <button class="tool-segment-btn" :class="{ active: mode === 'decode' }" @click="mode = 'decode'">解码</button>
          </div>
        </template>

        <div class="tool-divider"></div>

        <button class="glass-icon-btn" @click="paste" @mouseenter="showTooltip('粘贴', $event)" @mouseleave="hideTooltip">
          <ClipboardPaste :size="15" />
        </button>
        <button v-if="currentTab === 'parse'" class="glass-icon-btn" @click="loadExample" @mouseenter="showTooltip('示例', $event)" @mouseleave="hideTooltip">
          <Code :size="15" />
        </button>
        <button class="glass-icon-btn danger" @click="clear" :disabled="!inputText" @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
          <Trash2 :size="15" />
        </button>
      </div>

      <div class="tool-toolbar-right">
        <span v-if="inputStats.chars" class="tool-stat">{{ inputStats.chars }} 字符</span>
      </div>
    </div>

    <!-- 编解码模式 -->
    <main v-if="currentTab === 'codec'" class="tool-main split">
      <!-- 输入面板 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Link :size="12" /></span>
            <span>输入</span>
          </div>
          <div class="tool-panel-actions">
            <button class="glass-icon-btn small" @click="paste" @mouseenter="showTooltip('粘贴', $event)" @mouseleave="hideTooltip">
              <ClipboardPaste :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body" style="padding:0">
          <textarea
            v-model="inputText"
            class="url-textarea"
            :placeholder="mode === 'encode' ? '输入需要编码的 URL 或文本...' : '输入需要解码的 URL 编码文本...'"
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
            <button class="glass-icon-btn small" @click="toggleMode" @mouseenter="showTooltip('交换输入输出', $event)" @mouseleave="hideTooltip">
              <ArrowLeftRight :size="13" />
            </button>
            <button class="glass-icon-btn small" @click="copyOutput" :disabled="!outputText" @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip">
              <Copy v-if="!copied" :size="13" />
              <Check v-else :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body" style="padding:0; overflow: auto">
          <div v-if="outputText" class="url-output-area" @click="copyOutput">
            <div class="url-output-line" v-for="(line, index) in outputText.split('\n')" :key="index">
              <span class="line-num">{{ index + 1 }}</span>
              <pre class="line-content"><code>{{ line || ' ' }}</code></pre>
            </div>
          </div>
          <div v-else class="tool-empty">
            <div class="empty-icon"><Link :size="24" /></div>
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
            <span class="panel-icon blue"><Link :size="12" /></span>
            <span>URL 输入</span>
          </div>
          <div class="tool-panel-actions">
            <button class="glass-icon-btn small" @click="paste" @mouseenter="showTooltip('粘贴', $event)" @mouseleave="hideTooltip">
              <ClipboardPaste :size="13" />
            </button>
            <button class="glass-icon-btn small" @click="loadExample" @mouseenter="showTooltip('示例', $event)" @mouseleave="hideTooltip">
              <Code :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body" style="padding:0">
          <textarea
            v-model="inputText"
            class="url-textarea"
            placeholder="输入完整的 URL 地址进行解析..."
            spellcheck="false"
          ></textarea>
        </div>
      </section>

      <!-- 右：解析结果 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><List :size="12" /></span>
            <span>解析结果</span>
          </div>
        </div>
        <div class="tool-panel-body url-parse-body">
          <template v-if="parsedUrl && parsedUrl.valid">
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
          </template>

          <div v-else class="tool-empty">
            <div class="empty-icon"><Link :size="24" /></div>
            <p class="empty-title">{{ parsedUrl && !parsedUrl.valid ? '无效的 URL' : '输入 URL 进行解析' }}</p>
            <p class="empty-desc">支持 HTTP/HTTPS 协议的完整 URL</p>
          </div>
        </div>
      </section>
    </main>

    <!-- 底部编码规则 -->
    <div v-if="currentTab === 'codec'" class="url-rules-bar">
      <span class="rules-label">编码规则</span>
      <div class="rules-list">
        <span class="rule-chip"><code>空格</code> → <code>%20</code></span>
        <span class="rule-chip"><code>中文</code> → <code>%XX</code></span>
        <span class="rule-chip"><code>&</code> → <code>%26</code></span>
        <span class="rule-chip"><code>=</code> → <code>%3D</code></span>
        <span class="rule-chip"><code>?</code> → <code>%3F</code></span>
        <span class="rule-chip"><code>/</code> → <code>%2F</code></span>
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
  color: var(--accent);
  background: var(--accent-light);
}

.mode-tag.success { color: var(--success); background: var(--success-light); }
.mode-tag.error { color: var(--error); background: var(--error-light, #fef2f2); }

.stat-tag {
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
}

/* ====== 统计 ====== */
.tool-stat {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  padding: 2px 8px;
  background: var(--bg-secondary);
  border-radius: var(--radius-xs);
}

/* ====== 输入区 ====== */
.url-textarea {
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

.url-textarea::placeholder { color: var(--text-muted); }

/* ====== 输出区 ====== */
.url-output-area {
  cursor: pointer;
}

.url-output-line {
  display: flex;
  align-items: flex-start;
  padding: 0 16px;
  min-height: 24px;
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

/* ====== 底部规则栏 ====== */
.url-rules-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  flex-shrink: 0;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
}

.rules-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  flex-shrink: 0;
}

.rules-list {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.rule-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  background: var(--bg-primary);
  border-radius: var(--radius-xs);
}

.rule-chip code {
  font-family: inherit;
  font-size: inherit;
}

/* ====== URL 拆解结果 ====== */
.url-parse-body {
  overflow-y: auto;
  padding: 12px;
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
  background: var(--bg-primary);
  border-radius: 10px;
  line-height: 18px;
}

.parse-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
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
  background: var(--bg-secondary);
  border-radius: 50%;
  flex-shrink: 0;
}

.parse-copy {
  color: var(--text-muted);
  opacity: 0;
  transition: opacity 0.12s;
  flex-shrink: 0;
}

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
}
</style>
