<script setup lang="ts">
import {
  Check, X, Search, Copy, Trash2, Eye,
  ArrowLeftRight, FileCode, HelpCircle,
  Braces, FlaskConical,
  ChevronDown, ChevronUp, XCircle, CheckCircle2, AlertCircle,
} from 'lucide-vue-next'
import { ref, computed } from 'vue'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import ReferenceModal from '@/components/common/ReferenceModal.vue'
import { useTooltip } from '@/composables/useTooltip'
import { tokenizePattern, type RegexToken } from './regexTokenizer'
import { useRegex, codeLanguages, presets, regexHelpContent } from './useRegex'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
  pattern, flags, testText, replaceText, activeTab,
  matches, error, matchCount, showHelpModal,
  codeLanguage, generatedCode, highlightedCode, replacedText,
  flagsString, highlightedText, explainLines,
  testCases, showTestSuite,
  applyPreset, copyResult, copyAllMatches, clearAll,
  addTestCase, removeTestCase, toggleTestCaseType,
} = useRegex()

const flagDefs = [
  { key: 'global', label: 'g', title: '全局匹配' },
  { key: 'ignoreCase', label: 'i', title: '忽略大小写' },
  { key: 'multiline', label: 'm', title: '多行模式' },
  { key: 'dotAll', label: 's', title: '点匹配换行' },
]

// Token tooltip
const tokenTooltip = ref({ show: false, text: '', x: 0, y: 0 })
let tokenTooltipTimer: ReturnType<typeof setTimeout> | null = null

const showTokenTooltip = (token: RegexToken, event: MouseEvent) => {
  if (tokenTooltipTimer) clearTimeout(tokenTooltipTimer)
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  tokenTooltip.value = { show: true, text: `${token.text}  ${token.desc}`, x: rect.left + rect.width / 2, y: rect.bottom + 6 }
}
const hideTokenTooltip = () => {
  tokenTooltipTimer = setTimeout(() => { tokenTooltip.value.show = false }, 80)
}

const tokens = computed(() => tokenizePattern(pattern.value))
</script>

<template>
  <div class="tool-page">
    <!-- 标题栏 -->
    <ToolTitleBar title="正则测试" icon="icon-regex">
      <div class="header-content">
        <span class="tool-status success" v-if="matchCount > 0">
          <Check :size="12" /> {{ matchCount }} 个匹配
        </span>
        <span class="tool-status error" v-else-if="error">
          <X :size="12" /> 语法错误
        </span>
        <span class="tool-status" v-else-if="pattern && testText && !error">无匹配</span>
        <button class="glass-icon-btn small" @click="showHelpModal = true" @mouseenter="showTooltip('正则参考', $event)" @mouseleave="hideTooltip">
          <HelpCircle :size="14" />
        </button>
      </div>
    </ToolTitleBar>

    <!-- 主内容 -->
    <main class="tool-main split">
      <!-- 左侧：配置 + 测试文本 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Braces :size="14" /></span>
            <span>正则配置</span>
          </div>
          <div class="panel-actions">
            <button class="action-btn" @click="clearAll" :disabled="!pattern && !testText"
              @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>

        <div class="tool-panel-body">
          <!-- 正则输入 -->
          <div class="config-section">
            <label class="config-label">正则表达式</label>
            <div class="regex-input-bar" :class="{ error: !!error, valid: matchCount > 0 && !error }">
              <span class="regex-slash">/</span>
              <input type="text" v-model="pattern" class="regex-field" placeholder="输入正则表达式..." spellcheck="false" autocomplete="off" />
              <span class="regex-slash">/{{ flagsString }}</span>
              <span v-if="matchCount > 0 && !error" class="regex-badge">{{ matchCount }}</span>
            </div>
          </div>

          <!-- Flags -->
          <div class="config-section">
            <label class="config-label">标志位</label>
            <div class="flag-chips">
              <button
                v-for="flag in flagDefs" :key="flag.key"
                class="flag-chip" :class="{ active: (flags as any)[flag.key] }"
                @click="(flags as any)[flag.key] = !(flags as any)[flag.key]"
                @mouseenter="showTooltip(flag.title, $event)" @mouseleave="hideTooltip"
              >{{ flag.label }}</button>
            </div>
          </div>

          <!-- Token 解析 -->
          <div v-if="tokens.length > 0" class="config-section">
            <label class="config-label">表达式解析</label>
            <div class="token-tags">
              <span
                v-for="(token, i) in tokens" :key="i"
                class="token-tag"
                :class="'tt-' + token.type"
                @mouseenter="showTokenTooltip(token, $event)" @mouseleave="hideTokenTooltip"
              >{{ token.text }}</span>
            </div>
          </div>

          <!-- 常用预设 -->
          <div class="config-section">
            <label class="config-label">常用正则</label>
            <div class="preset-bar">
              <button v-for="preset in presets" :key="preset.name" class="preset-chip" :class="{ active: pattern === preset.pattern }" @click="applyPreset(preset)">{{ preset.name }}</button>
            </div>
          </div>

          <!-- 测试文本 -->
          <div class="config-section grow" style="position: relative;">
            <label class="config-label">测试文本</label>
            <div class="test-text-area">
              <textarea v-model="testText" class="regex-textarea" placeholder="在此输入或粘贴要测试的文本..." spellcheck="false"></textarea>
              <div class="test-text-footer" v-if="testText">
                <span class="text-stat">{{ testText.length }} 字符</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧：结果 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Check :size="14" /></span>
            <span>结果</span>
            <span v-if="activeTab === 'match' && matchCount > 0" class="panel-stat accent">{{ matchCount }} 匹配</span>
          </div>
          <div class="panel-actions">
            <div class="preview-tabs">
              <button :class="['seg-btn xs', { active: activeTab === 'match' }]" @click="activeTab = 'match'">
                <Eye :size="11" /> 匹配
              </button>
              <button :class="['seg-btn xs', { active: activeTab === 'replace' }]" @click="activeTab = 'replace'">
                <ArrowLeftRight :size="11" /> 替换
              </button>
              <button :class="['seg-btn xs', { active: activeTab === 'code' }]" @click="activeTab = 'code'">
                <FileCode :size="11" /> 代码
              </button>
            </div>
            <div class="panel-divider"></div>
            <button v-if="activeTab === 'match' && matchCount > 0" class="action-btn" @click="copyAllMatches"
              @mouseenter="showTooltip('复制所有匹配', $event)" @mouseleave="hideTooltip">
              <Copy :size="13" />
            </button>
            <button v-if="activeTab === 'replace' && replacedText" class="action-btn" @click="copyResult(replacedText)"
              @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip">
              <Copy :size="13" />
            </button>
            <button v-if="activeTab === 'code' && generatedCode" class="action-btn" @click="copyResult(generatedCode)"
              @mouseenter="showTooltip('复制代码', $event)" @mouseleave="hideTooltip">
              <Copy :size="13" />
            </button>
          </div>
        </div>

        <div class="tool-panel-body">
          <!-- ====== 匹配模式 ====== -->
          <template v-if="activeTab === 'match'">
            <!-- 错误 -->
            <div v-if="error" class="regex-error-card">
              <div class="regex-error-icon"><X :size="16" /></div>
              <div class="regex-error-body">
                <span class="regex-error-title">正则语法错误</span>
                <p class="regex-error-msg">{{ error }}</p>
              </div>
            </div>

            <!-- 高亮 + 匹配详情 -->
            <template v-else-if="matches.length > 0">
              <!-- 高亮文本 -->
              <div class="regex-highlight-area">
                <template v-for="(segment, i) in highlightedText" :key="i">
                  <mark v-if="segment.isMatch" class="hl-match" :title="'匹配 #' + (segment.index ?? '')">{{ segment.text }}</mark>
                  <span v-else>{{ segment.text }}</span>
                </template>
              </div>

              <!-- 解释区域 -->
              <div v-if="explainLines.length > 0" class="explain-section">
                <div class="explain-header">
                  <span class="explain-title">表达式解释</span>
                </div>
                <div class="explain-list">
                  <div v-for="(line, i) in explainLines" :key="i" class="explain-item">{{ line }}</div>
                </div>
              </div>

              <!-- 匹配列表 -->
              <div class="match-section">
                <div class="match-section-header">
                  <span class="match-section-title">匹配详情</span>
                  <span class="match-section-count">{{ matchCount }} 项</span>
                </div>
                <div class="match-list">
                  <div v-for="(match, index) in matches" :key="index" class="match-card" @click="copyResult(match.fullMatch)">
                    <span class="match-idx">#{{ index + 1 }}</span>
                    <code class="match-val">{{ match.fullMatch }}</code>
                    <span class="match-pos">@{{ match.index }}</span>
                    <button class="match-copy-btn" @click.stop="copyResult(match.fullMatch)"><Copy :size="11" /></button>
                    <div v-if="(match.groups && match.groups.length) || (match.namedGroups && Object.keys(match.namedGroups).length)" class="match-groups-row">
                      <span v-for="(g, gi) in match.groups" :key="gi" class="match-group-tag"><span class="group-key">${{ Number(gi) + 1 }}</span>{{ g }}</span>
                      <span v-for="(val, name) in match.namedGroups" :key="name" class="match-group-tag named"><span class="group-key">{{ name }}</span>{{ val }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- 无匹配 -->
            <div v-else-if="testText && pattern" class="tool-empty">
              <div class="empty-icon"><Search :size="24" /></div>
              <p class="empty-title">无匹配结果</p>
              <p class="empty-desc">尝试修改正则表达式或测试文本</p>
            </div>

            <!-- 空状态 -->
            <div v-else class="tool-empty">
              <div class="empty-icon"><Braces :size="24" /></div>
              <p class="empty-title">输入正则和测试文本</p>
              <p class="empty-desc">在左侧输入正则表达式和测试文本</p>
            </div>
          </template>

          <!-- ====== 替换模式 ====== -->
          <template v-if="activeTab === 'replace'">
            <div class="replace-section">
              <div class="replace-label">替换文本</div>
              <input type="text" v-model="replaceText" class="replace-input" placeholder="输入替换内容（支持 $1, $2 引用分组）..." spellcheck="false" />
            </div>
            <div v-if="replacedText && replacedText !== testText" class="replace-result">
              <div class="replace-result-header">
                <span class="replace-result-label">替换结果</span>
                <span class="replace-diff-badge">与原文不同</span>
              </div>
              <pre class="replace-output">{{ replacedText }}</pre>
            </div>
            <div v-else-if="replaceText" class="tool-empty compact"><span>替换后结果与原文相同</span></div>
            <div v-else class="tool-empty compact"><span>输入替换文本预览效果</span></div>
          </template>

          <!-- ====== 代码模式 ====== -->
          <template v-if="activeTab === 'code'">
            <div v-if="!pattern" class="tool-empty">
              <div class="empty-icon"><FileCode :size="24" /></div>
              <p class="empty-title">输入正则表达式</p>
              <p class="empty-desc">输入正则后自动生成多语言代码</p>
            </div>
            <div v-else class="code-section">
              <div class="code-lang-bar">
                <button v-for="lang in codeLanguages" :key="lang.value" class="lang-chip" :class="{ active: codeLanguage === lang.value }" @click="codeLanguage = lang.value">
                  {{ lang.label }}
                </button>
              </div>
              <div v-if="generatedCode" class="code-output-wrap">
                <pre class="code-output"><code v-html="highlightedCode"></code></pre>
              </div>
            </div>
          </template>
        </div>
      </section>
    </main>

    <!-- Test Suite -->
    <div class="test-suite-section" v-if="testCases.length > 0">
      <div class="test-suite-header" @click="showTestSuite = !showTestSuite">
        <div class="test-suite-title">
          <FlaskConical :size="13" />
          <span>测试用例</span>
          <span class="test-suite-count">{{ testCases.length }}</span>
          <span v-if="testCases.every(tc => tc.pass !== null)" class="test-suite-status">
            <template v-if="testCases.every(tc => tc.pass)"><CheckCircle2 :size="12" class="text-success" /> 全部通过</template>
            <template v-else><AlertCircle :size="12" class="text-error" /> {{ testCases.filter(tc => !tc.pass).length }} 项失败</template>
          </span>
        </div>
        <component :is="showTestSuite ? ChevronDown : ChevronUp" :size="14" />
      </div>
      <div v-if="showTestSuite" class="test-suite-body">
        <div v-for="tc in testCases" :key="tc.id" class="test-case-row" :class="{ pass: tc.pass === true, fail: tc.pass === false }">
          <button class="test-type-btn" :class="{ 'should-not': !tc.shouldMatch }" @click="toggleTestCaseType(tc)">{{ tc.shouldMatch ? '✓' : '✗' }}</button>
          <input type="text" v-model="tc.text" class="test-case-input" placeholder="输入测试文本..." spellcheck="false" />
          <span v-if="tc.pass === true" class="test-pass"><CheckCircle2 :size="14" /></span>
          <span v-else-if="tc.pass === false" class="test-fail"><XCircle :size="14" /></span>
          <button class="test-remove-btn" @click="removeTestCase(tc.id)"><X :size="12" /></button>
        </div>
        <button class="add-case-btn" @click="addTestCase">
          <FlaskConical :size="12" />
          <span>添加用例</span>
        </button>
      </div>
    </div>

    <!-- 帮助 -->
    <ReferenceModal v-model:visible="showHelpModal" title="正则表达式参考" :sections="regexHelpContent" />

    <!-- Tooltips -->
    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">{{ tooltip.text }}</div>
    <div v-if="tokenTooltip.show" class="toolbar-tooltip" :style="{ left: tokenTooltip.x + 'px', top: tokenTooltip.y + 'px' }">{{ tokenTooltip.text }}</div>
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

.tool-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-tertiary);
}

.tool-status.success { color: var(--success); background: var(--success-light); }
.tool-status.error { color: var(--error); background: var(--error-light); }

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

.preview-tabs {
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

.panel-stat {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  padding: 1px 6px;
  background: var(--bg-secondary);
  border-radius: var(--radius-xs);
}

.panel-stat.accent {
  color: var(--accent);
  background: var(--accent-light);
}

/* ====== 正则输入栏 ====== */
.regex-input-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  height: 30px;
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  transition: all 0.15s;
}

.regex-input-bar:hover { border-color: var(--border-strong); }
.regex-input-bar:focus-within { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-light); }
.regex-input-bar.error { border-color: var(--error); }
.regex-input-bar.error:focus-within { box-shadow: 0 0 0 2px var(--error-light); }
.regex-input-bar.valid { border-color: var(--success); }
.regex-input-bar.valid:focus-within { box-shadow: 0 0 0 2px var(--success-light); }

.regex-slash {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  flex-shrink: 0;
  user-select: none;
}

.regex-field {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  outline: none;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
}

.regex-field::placeholder { color: var(--text-muted); }

.regex-badge {
  padding: 0 6px;
  height: 18px;
  line-height: 18px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--success);
  background: var(--success-light);
  border-radius: 999px;
  flex-shrink: 0;
}

/* ====== Flags ====== */
.flag-chips { display: flex; gap: 4px; }

.flag-chip {
  width: 28px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--border-default); border-radius: 6px;
  background: var(--bg-secondary);
  font-family: var(--font-mono); font-size: 12px; font-weight: 600;
  color: var(--text-muted); cursor: pointer; transition: all 0.15s;
}

.flag-chip:hover { border-color: var(--border-strong); color: var(--text-primary); }
.flag-chip.active { background: var(--accent-light); border-color: var(--accent); color: var(--accent); }

/* ====== Token 标签 ====== */
.token-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.token-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: default;
  white-space: nowrap;
  transition: filter 0.1s;
}

.token-tag:hover { filter: brightness(1.15); }

.tt-charClass     { color: #3b82f6; background: rgba(59,130,246,0.1); }
.tt-quantifier    { color: #f59e0b; background: rgba(245,158,11,0.1); }
.tt-anchor        { color: #10b981; background: rgba(16,185,129,0.1); }
.tt-group         { color: #8b5cf6; background: rgba(139,92,246,0.1); }
.tt-lookaround    { color: #a855f7; background: rgba(168,85,247,0.1); }
.tt-escape        { color: #ef4444; background: rgba(239,68,68,0.08); }
.tt-backreference { color: #6366f1; background: rgba(99,102,241,0.1); }
.tt-alternation   { color: #f43f5e; background: rgba(244,63,94,0.1); }
.tt-literal       { color: var(--text-primary); background: transparent; }
.tt-modifier      { color: #22d3ee; background: rgba(34,211,238,0.1); }

/* ====== 常用预设 ====== */
.preset-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.preset-chip {
  padding: 3px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.preset-chip:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
.preset-chip.active { background: var(--accent); border-color: var(--accent); color: #fff; }

/* ====== 测试文本区域 ====== */
.test-text-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  overflow: hidden;
  min-height: 0;
}

.regex-textarea {
  flex: 1;
  width: 100%;
  padding: 10px 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.7;
  border: none;
  outline: none;
  resize: none;
  background: var(--bg-input);
  color: var(--text-primary);
  tab-size: 2;
}

.regex-textarea::placeholder { color: var(--text-muted); }

.test-text-footer {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
}

.text-stat {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

/* ====== 高亮区 ====== */
.regex-highlight-area {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-all;
}

.hl-match {
  background: linear-gradient(135deg, var(--accent-light), color-mix(in srgb, var(--accent-light) 70%, var(--success-light)));
  color: var(--accent);
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: 600;
  border-bottom: 2px solid var(--accent);
}

/* ====== 解释区 ====== */
.explain-section {
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.explain-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.explain-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.explain-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.explain-item {
  padding: 3px 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.5;
  color: var(--text-secondary);
  border-radius: 4px;
}

.explain-item:hover { background: var(--bg-hover); }

/* ====== 匹配详情区 ====== */
.match-section {
  padding: 12px 16px;
}

.match-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.match-section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.match-section-count {
  font-size: 10px;
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-light);
  padding: 1px 7px;
  border-radius: 999px;
}

.match-list { display: flex; flex-direction: column; gap: 6px; }

.match-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  flex-wrap: wrap;
}

.match-card:hover { background: var(--bg-hover); border-color: var(--accent); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); }

.match-idx {
  width: 26px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-mono); font-size: 10px; font-weight: 700;
  color: var(--accent); background: var(--accent-light);
  border-radius: 4px; flex-shrink: 0;
}

.match-val {
  font-family: var(--font-mono); font-size: 12px; font-weight: 500;
  color: var(--text-primary); flex: 1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
}

.match-pos {
  font-size: 10px; font-family: var(--font-mono); font-weight: 600;
  color: var(--text-muted); background: var(--bg-secondary);
  padding: 2px 6px; border-radius: 4px; flex-shrink: 0;
}

.match-copy-btn {
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  border: none; border-radius: 4px;
  background: transparent; color: var(--text-muted);
  cursor: pointer; flex-shrink: 0; opacity: 0; transition: all 0.15s;
}

.match-card:hover .match-copy-btn { opacity: 1; }
.match-copy-btn:hover { background: var(--accent-light); color: var(--accent); }

.match-groups-row { display: flex; gap: 4px; flex-wrap: wrap; width: 100%; padding-top: 4px; }

.match-group-tag {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 8px; background: var(--bg-secondary);
  border: 1px solid var(--border-subtle); border-radius: 4px;
  font-family: var(--font-mono); font-size: 10px; color: var(--text-secondary);
}

.group-key { font-weight: 700; color: var(--text-muted); margin-right: 2px; }
.match-group-tag.named { background: rgba(99, 102, 241, 0.08); border-color: rgba(99, 102, 241, 0.2); color: #6366f1; }
.match-group-tag.named .group-key { color: #6366f1; }

/* ====== 错误卡片 ====== */
.regex-error-card {
  display: flex; gap: 12px; margin: 16px;
  padding: 14px 16px; background: var(--error-light);
  border: 1px solid var(--error); border-radius: 12px;
}

.regex-error-icon {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: var(--error); color: #fff; border-radius: 6px; flex-shrink: 0;
}

.regex-error-body { flex: 1; min-width: 0; }
.regex-error-title { font-size: 13px; font-weight: 600; color: var(--error); }
.regex-error-msg { margin: 4px 0 0; font-family: var(--font-mono); font-size: 12px; color: var(--error); line-height: 1.5; opacity: 0.85; }

/* ====== 紧凑空状态 ====== */
.tool-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  flex: 1;
}

.tool-empty.compact {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 60px;
  color: var(--text-muted);
  font-size: 12px;
  padding: 20px;
  gap: 8px;
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

/* ====== 替换 ====== */
.replace-section { padding: 14px 16px; }
.replace-label { font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; }

.replace-input {
  width: 100%; height: 32px; padding: 0 12px;
  font-family: var(--font-mono); font-size: 12px;
  color: var(--text-primary); background: var(--bg-input);
  border: 1px solid var(--border-default); border-radius: 6px;
  outline: none; transition: all 0.15s;
}

.replace-input:hover { border-color: var(--border-strong); }
.replace-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-light); }
.replace-input::placeholder { color: var(--text-muted); }

.replace-result { padding: 0 16px 14px; }
.replace-result-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.replace-result-label { font-size: 11px; font-weight: 600; color: var(--text-muted); }
.replace-diff-badge { font-size: 10px; font-weight: 600; color: var(--warning); background: var(--warning-light); padding: 1px 7px; border-radius: 999px; }

.replace-output {
  margin: 0; padding: 14px 16px;
  background: var(--bg-primary); border: 1px solid var(--border-subtle);
  border-radius: 10px; font-family: var(--font-mono); font-size: 12px;
  line-height: 1.7; color: var(--text-primary);
  white-space: pre-wrap; word-break: break-all;
}

/* ====== 代码 ====== */
.code-section { padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; height: 100%; }
.code-lang-bar { display: flex; flex-wrap: wrap; gap: 4px; }

.lang-chip {
  padding: 4px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  font-size: 11px; font-weight: 500; color: var(--text-secondary);
  background: var(--bg-secondary);
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}

.lang-chip:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
.lang-chip.active { background: var(--accent); border-color: var(--accent); color: #fff; }

.code-output-wrap { flex: 1; overflow: auto; }

.code-output {
  margin: 0; padding: 16px 18px;
  background: var(--bg-primary); border: 1px solid var(--border-subtle); border-radius: 10px;
  font-family: var(--font-mono); font-size: 12px; line-height: 1.7;
  color: var(--text-primary); white-space: pre; overflow-x: auto;
}

/* highlight.js */
.code-output :deep(.hljs-keyword) { color: #f43f5e; font-weight: 600; }
.code-output :deep(.hljs-built_in) { color: #22d3ee; }
.code-output :deep(.hljs-type) { color: #8b5cf6; }
.code-output :deep(.hljs-literal) { color: #f59e0b; }
.code-output :deep(.hljs-number) { color: #f59e0b; }
.code-output :deep(.hljs-string) { color: #10b981; }
.code-output :deep(.hljs-comment) { color: var(--text-muted); font-style: italic; }
.code-output :deep(.hljs-function) { color: #3b82f6; }
.code-output :deep(.hljs-title) { color: #3b82f6; }
.code-output :deep(.hljs-params) { color: var(--text-primary); }
.code-output :deep(.hljs-meta) { color: #22d3ee; }
.code-output :deep(.hljs-symbol) { color: #ef4444; }
.code-output :deep(.hljs-variable) { color: #6366f1; }
.code-output :deep(.hljs-attr) { color: #8b5cf6; }

/* ====== Test Suite ====== */
.test-suite-section {
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.test-suite-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 16px; cursor: pointer; user-select: none;
}

.test-suite-header:hover { background: var(--bg-hover); }

.test-suite-title { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--text-secondary); }
.test-suite-count { font-family: var(--font-mono); font-size: 10px; font-weight: 700; color: var(--accent); background: var(--accent-light); padding: 1px 6px; border-radius: 999px; }
.test-suite-status { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500; }
.text-success { color: var(--success); }
.text-error { color: var(--error); }

.test-suite-body { padding: 0 16px 8px; display: flex; flex-direction: column; gap: 4px; }

.test-case-row {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 8px; border-radius: 6px;
  border: 1px solid transparent; transition: all 0.15s;
}

.test-case-row.pass { border-color: var(--success); background: var(--success-light); }
.test-case-row.fail { border-color: var(--error); background: var(--error-light); }

.test-type-btn {
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--border-subtle); border-radius: 4px;
  background: var(--success-light); color: var(--success);
  font-size: 12px; font-weight: 700; cursor: pointer; flex-shrink: 0;
}

.test-type-btn.should-not { background: var(--error-light); color: var(--error); }
.test-type-btn:hover { opacity: 0.8; }

.test-case-input {
  flex: 1; height: 26px; padding: 0 8px;
  font-family: var(--font-mono); font-size: 12px;
  color: var(--text-primary); background: var(--bg-primary);
  border: 1px solid var(--border-subtle); border-radius: 4px;
  outline: none; min-width: 0;
}

.test-case-input:focus { border-color: var(--accent); }
.test-pass { color: var(--success); flex-shrink: 0; }
.test-fail { color: var(--error); flex-shrink: 0; }

.test-remove-btn {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  border: none; border-radius: 4px;
  background: transparent; color: var(--text-muted);
  cursor: pointer; flex-shrink: 0; opacity: 0; transition: all 0.15s;
}

.test-case-row:hover .test-remove-btn { opacity: 1; }
.test-remove-btn:hover { color: var(--error); background: var(--error-light); }

.add-case-btn {
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
  margin-top: 4px;
}

.add-case-btn:hover { background: var(--bg-hover); border-color: var(--accent); color: var(--accent); }

/* ====== Tooltip ====== */
.toolbar-tooltip {
  position: fixed; z-index: 9999; padding: 5px 10px;
  font-size: 12px; color: var(--text-inverse, #fff);
  background: var(--bg-tooltip, rgba(0, 0, 0, 0.85));
  border-radius: 4px;
  white-space: nowrap; pointer-events: none;
  transform: translateX(-50%);
  line-height: 1.4;
}

/* ====== Scrollbar ====== */
.tool-panel-body::-webkit-scrollbar { width: 5px; }
.tool-panel-body::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.tool-panel-body::-webkit-scrollbar-track { background: transparent; }

.regex-textarea::-webkit-scrollbar { width: 4px; }
.regex-textarea::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.regex-textarea::-webkit-scrollbar-track { background: transparent; }

/* ====== Responsive ====== */
@media (max-width: 760px) {
  .tool-main { grid-template-columns: 1fr !important; }
}
</style>
