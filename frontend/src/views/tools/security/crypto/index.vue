<script setup lang="ts">
import {
  Copy, Check, Terminal,
  Trash2, Lock, Unlock, RefreshCw, ArrowRightLeft, ClipboardPaste, RotateCw,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import { useCrypto } from './useCrypto'
import { useTooltip } from '@/composables/useTooltip'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
  tabOptions, algoOptions, cipherModeOptions,
  currentTab, currentMode, currentAlgo, cipherMode,
  inputText, keyText, ivText, outputText, loading, copiedId,
  rsaPublicKey, rsaPrivateKey, rsaKeyBits, showKeyPairPanel,
  hmacKey, hashResult,
  keyLengthHint,
  isSymmetric, isRsa, isChacha, isHash, isBase64,
  inputStats, outputStats,
  doCryptoDispatch, generateRsaKeyPair, generateRandomKey,
  swapDirection, copyToClipboard, clearAll, pasteFromClipboard, loadExample,
} = useCrypto()
</script>

<template>
  <div class="tool-page">
    <ToolTitleBar title="加密解密" icon="icon-crypto">
      <div class="header-content">
        <span class="mode-tag" :class="currentMode">{{ currentMode === 'encrypt' ? '加密' : '解密' }}</span>
        <span v-if="inputStats.chars" class="stat-tag">{{ inputStats.chars }} 字符</span>
        <span v-if="outputStats.chars" class="stat-tag">→ {{ outputStats.chars }} 字符</span>
      </div>
    </ToolTitleBar>

    <main class="tool-main split">
      <!-- Left: config + toolbar + input -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon purple"><Lock :size="14" /></span>
            <span>加密配置</span>
          </div>
          <div class="panel-actions">
            <button class="tool-icon-btn" @click="loadExample"
              @mouseenter="showTooltip('填入示例', $event)" @mouseleave="hideTooltip">
              <RotateCw :size="13" />
            </button>
            <button class="tool-icon-btn" @click="pasteFromClipboard"
              @mouseenter="showTooltip('粘贴', $event)" @mouseleave="hideTooltip">
              <ClipboardPaste :size="13" />
            </button>
            <button class="tool-icon-btn" :disabled="!inputText && !keyText" @click="clearAll"
              @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>

        <div class="tool-panel-body">
          <!-- Tab selector -->
          <div class="config-section">
            <label class="config-label">加密类型</label>
            <div class="segment-group">
              <button v-for="tab in tabOptions" :key="tab.value"
                :class="['seg-btn', { active: currentTab === tab.value }]"
                @click="currentTab = tab.value">
                {{ tab.label }}
              </button>
            </div>
          </div>

          <!-- Mode selector (not for hash) -->
          <div v-if="!isHash" class="config-section">
            <label class="config-label">操作模式</label>
            <div class="segment-group">
              <button :class="['seg-btn', { active: currentMode === 'encrypt' }]" @click="currentMode = 'encrypt'">
                <Lock :size="11" /> 加密
              </button>
              <button :class="['seg-btn', { active: currentMode === 'decrypt' }]" @click="currentMode = 'decrypt'">
                <Unlock :size="11" /> 解密
              </button>
            </div>
          </div>

          <!-- Symmetric: algo selector -->
          <div v-if="isSymmetric" class="config-section">
            <label class="config-label">算法</label>
            <div class="segment-group">
              <button v-for="algo in algoOptions" :key="algo.value"
                :class="['seg-btn', { active: currentAlgo === algo.value }]"
                @click="currentAlgo = algo.value">
                {{ algo.label }}
              </button>
            </div>
          </div>

          <!-- Symmetric: cipher mode -->
          <div v-if="isSymmetric" class="config-section">
            <label class="config-label">填充模式</label>
            <div class="segment-group wrap">
              <button v-for="cm in cipherModeOptions" :key="cm.value"
                :class="['seg-btn small', { active: cipherMode === cm.value }]"
                @click="cipherMode = cm.value">
                {{ cm.label }}
              </button>
            </div>
          </div>

          <!-- Symmetric/ChaCha20 key config -->
          <div v-if="isSymmetric || isChacha" class="config-section">
            <div class="config-row">
              <label class="config-label">{{ isChacha ? '密钥（32字节）' : '密钥' }}</label>
              <button class="tool-icon-btn mini" @click="generateRandomKey"
                @mouseenter="showTooltip('随机生成密钥', $event)" @mouseleave="hideTooltip">
                <RefreshCw :size="11" />
              </button>
            </div>
            <input v-model="keyText" type="text" class="config-input"
              :placeholder="isChacha ? '密钥需为 32 字节（ChaCha20-Poly1305）' : keyLengthHint" spellcheck="false" />
            <input v-if="isSymmetric && cipherMode !== 'ecb' && cipherMode !== 'gcm'" v-model="ivText" type="text" class="config-input"
              placeholder="IV（可选，留空自动生成）" spellcheck="false" />
          </div>

          <!-- RSA key management -->
          <template v-if="isRsa">
            <div class="config-section">
              <div class="config-row">
                <label class="config-label">密钥长度</label>
                <button class="tool-icon-btn mini" @click="generateRsaKeyPair" :disabled="loading"
                  @mouseenter="showTooltip('生成密钥对', $event)" @mouseleave="hideTooltip">
                  <RefreshCw :size="11" />
                </button>
              </div>
              <div class="segment-group">
                <button v-for="bits in [1024, 2048, 4096]" :key="bits"
                  :class="['seg-btn small', { active: rsaKeyBits === bits }]"
                  @click="rsaKeyBits = bits">
                  {{ bits }} bit
                </button>
              </div>
            </div>

            <div v-if="rsaPublicKey || rsaPrivateKey" class="config-section">
              <div class="config-row">
                <label class="config-label">密钥对</label>
                <button class="tool-icon-btn mini" @click="showKeyPairPanel = !showKeyPairPanel">
                  <ArrowRightLeft :size="11" />
                </button>
              </div>
              <div v-if="showKeyPairPanel" class="keypair-blocks">
                <div class="keypair-block">
                  <div class="keypair-head">
                    <span class="keypair-tag">公钥</span>
                    <button class="tool-icon-btn mini" @click="copyToClipboard(rsaPublicKey, 'pub')">
                      <Check v-if="copiedId === 'pub'" :size="10" />
                      <Copy v-else :size="10" />
                    </button>
                  </div>
                  <textarea v-model="rsaPublicKey" class="keypair-textarea" rows="3" placeholder="公钥（PEM 格式）" spellcheck="false" />
                </div>
                <div class="keypair-block">
                  <div class="keypair-head">
                    <span class="keypair-tag">私钥</span>
                    <button class="tool-icon-btn mini" @click="copyToClipboard(rsaPrivateKey, 'priv')">
                      <Check v-if="copiedId === 'priv'" :size="10" />
                      <Copy v-else :size="10" />
                    </button>
                  </div>
                  <textarea v-model="rsaPrivateKey" class="keypair-textarea" rows="3" placeholder="私钥（PEM 格式）" spellcheck="false" />
                </div>
              </div>
            </div>
          </template>

          <!-- Hash HMAC key -->
          <div v-if="isHash" class="config-section">
            <label class="config-label">HMAC 密钥（可选）</label>
            <input v-model="hmacKey" type="text" class="config-input" placeholder="留空则不计算 HMAC" spellcheck="false" />
          </div>

          <!-- Input -->
          <div class="config-section grow">
            <label class="config-label">输入</label>
            <textarea
              v-model="inputText"
              class="config-textarea"
              :placeholder="isHash ? '输入需要计算哈希的文本...' : isBase64 ? (currentMode === 'encrypt' ? '输入需要编码的文本...' : '输入需要解码的 Base64...') : currentMode === 'encrypt' ? '输入需要加密的明文...' : '输入需要解密的密文（Base64）...'"
              spellcheck="false"
            />
          </div>
        </div>

        <div class="action-bar">
          <button class="execute-btn" @click="doCryptoDispatch" :disabled="!inputText || loading">
            <Lock :size="14" />
            <span>{{ loading ? '处理中...' : isHash ? '计算哈希' : (currentMode === 'encrypt' ? '加密' : '解密') }}</span>
          </button>
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
            <button class="tool-icon-btn" @click="swapDirection"
              @mouseenter="showTooltip('交换输入输出', $event)" @mouseleave="hideTooltip">
              <ArrowRightLeft :size="13" />
            </button>
            <button class="tool-icon-btn" :disabled="!outputText" @click="copyToClipboard(outputText, 'output')"
              @mouseenter="showTooltip('复制', $event)" @mouseleave="hideTooltip">
              <Check v-if="copiedId === 'output'" :size="13" />
              <Copy v-else :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body">
          <div v-if="outputText" class="output-content">
            <!-- Hash mode: structured result -->
            <template v-if="isHash && hashResult">
              <div class="hash-item" v-if="hashResult.md5" @click="copyToClipboard(hashResult.md5, 'md5')">
                <div class="hash-row">
                  <span class="hash-algo">MD5</span>
                  <span class="hash-action"><Check v-if="copiedId === 'md5'" :size="11" /><Copy v-else :size="11" /></span>
                </div>
                <code class="hash-value">{{ hashResult.md5 }}</code>
              </div>
              <div class="hash-item" v-if="hashResult.sha1" @click="copyToClipboard(hashResult.sha1, 'sha1')">
                <div class="hash-row">
                  <span class="hash-algo">SHA1</span>
                  <span class="hash-action"><Check v-if="copiedId === 'sha1'" :size="11" /><Copy v-else :size="11" /></span>
                </div>
                <code class="hash-value">{{ hashResult.sha1 }}</code>
              </div>
              <div class="hash-item" v-if="hashResult.sha256" @click="copyToClipboard(hashResult.sha256, 'sha256')">
                <div class="hash-row">
                  <span class="hash-algo">SHA256</span>
                  <span class="hash-action"><Check v-if="copiedId === 'sha256'" :size="11" /><Copy v-else :size="11" /></span>
                </div>
                <code class="hash-value">{{ hashResult.sha256 }}</code>
              </div>
              <div class="hash-item" v-if="hashResult.sha512" @click="copyToClipboard(hashResult.sha512, 'sha512')">
                <div class="hash-row">
                  <span class="hash-algo">SHA512</span>
                  <span class="hash-action"><Check v-if="copiedId === 'sha512'" :size="11" /><Copy v-else :size="11" /></span>
                </div>
                <code class="hash-value">{{ hashResult.sha512 }}</code>
              </div>
              <div class="hash-item" v-if="hashResult.hmac" @click="copyToClipboard(hashResult.hmac, 'hmac')">
                <div class="hash-row">
                  <span class="hash-algo">HMAC-SHA256</span>
                  <span class="hash-action"><Check v-if="copiedId === 'hmac'" :size="11" /><Copy v-else :size="11" /></span>
                </div>
                <code class="hash-value">{{ hashResult.hmac }}</code>
              </div>
            </template>
            <!-- Non-hash: line-numbered output -->
            <template v-else>
              <div class="tool-code-line" v-for="(line, index) in outputText.split('\n')" :key="index">
                <span class="line-num">{{ index + 1 }}</span>
                <pre class="line-content"><code>{{ line || ' ' }}</code></pre>
              </div>
            </template>
          </div>
          <div v-else class="tool-empty">
            <div class="empty-icon"><Lock :size="40" /></div>
            <p class="empty-title">等待操作</p>
            <p class="empty-desc">配置参数后点击{{ isHash ? '计算哈希' : (currentMode === 'encrypt' ? '加密' : '解密') }}按钮</p>
          </div>
        </div>
      </section>
    </main>

    <!-- Tooltip -->
    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">{{ tooltip.text }}</div>
  </div>
</template>

<style scoped>
.mode-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.mode-tag.encrypt { color: var(--accent); background: var(--accent-light); }
.mode-tag.decrypt { color: var(--success); background: var(--success-light); }

.stat-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  font-family: var(--font-mono);
}

.panel-icon.purple { color: var(--accent); background: var(--accent-light); }

/* ===== Panel Actions ===== */
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.action-btn.mini {
  width: 22px;
  height: 22px;
}

/* ===== Config Sections (card style) ===== */
.tool-panel-body {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
}

.config-section:last-child {
  border-bottom: none;
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-row 
/* ===== Segment Group ===== */
.segment-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* ===== Config Input ===== */
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
  margin-bottom: 6px;
}

.config-input:last-child { margin-bottom: 0; }
.config-input:hover { border-color: var(--border-strong); }
.config-input:focus { border-color: var(--accent); box-shadow: var(--shadow-focus); }
.config-input::placeholder { color: var(--text-muted); }

/* ===== Config Textarea ===== */
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

/* ===== Key Pair ===== */
.keypair-blocks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}

.keypair-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.keypair-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.keypair-tag {
  font-size: 10px;
  font-weight: 700;
  color: var(--accent);
  padding: 1px 6px;
  background: var(--accent-light);
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.keypair-textarea {
  width: 100%;
  padding: 6px 8px;
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  outline: none;
  resize: none;
  line-height: 1.5;
  transition: all var(--transition-fast);
}

.keypair-textarea:focus { border-color: var(--accent); box-shadow: var(--shadow-focus); }

/* ===== Action Bar ===== */
.action-bar {
  display: flex;
  padding: 8px 14px;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.execute-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.execute-btn:hover:not(:disabled) { filter: brightness(1.1); }
.execute-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ===== Output ===== */
.output-content {
  padding: 0;
}

.tool-code-line {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid var(--border-subtle);
}

.tool-code-line:last-child { border-bottom: none; }

.line-num {
  min-width: 36px;
  padding: 4px 8px;
  text-align: right;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  background: var(--bg-tertiary);
  user-select: none;
  flex-shrink: 0;
  line-height: 1.7;
}

.line-content {
  flex: 1;
  padding: 4px 10px;
  margin: 0;
  font-size: 12px;
  font-family: var(--font-mono);
  line-height: 1.7;
  color: var(--text-primary);
  word-break: break-all;
}

.line-content code {
  font-family: inherit;
  background: none;
}

/* ===== Hash Output ===== */
.hash-item {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.hash-item:hover { background: var(--bg-hover); }
.hash-item:last-child { border-bottom: none; }

.hash-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.hash-algo {
  font-size: 10px;
  font-weight: 700;
  color: var(--accent);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.hash-action {
  display: flex;
  align-items: center;
  color: var(--text-muted);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.hash-item:hover .hash-action { opacity: 1; }

.hash-value {
  display: block;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-primary);
  word-break: break-all;
  line-height: 1.6;
  background: none;
  padding: 0;
}

/* ===== Empty State ===== */
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

/* ===== Scrollbar ===== */
.tool-panel-body::-webkit-scrollbar { width: 5px; }
.tool-panel-body::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.tool-panel-body::-webkit-scrollbar-track { background: transparent; }

/* ===== Responsive ===== */
@media (max-width: 760px) {
  .tool-main { grid-template-columns: 1fr !important; }
}
</style>
