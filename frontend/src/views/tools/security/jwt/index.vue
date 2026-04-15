<script setup lang="ts">
import {
  Copy, Check, Trash2, Lock, Unlock, RefreshCw, ArrowRightLeft,
  ClipboardPaste, RotateCw, Shield, Clock, AlertCircle, Pencil, Plus,
  Eye, EyeOff, ChevronDown, ChevronUp, Key, HelpCircle,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import ReferenceModal from '@/components/common/ReferenceModal.vue'
import { useJwt } from './useJwt'
import { ref } from 'vue'
import { useTooltip } from '@/composables/useTooltip'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const showSecret = ref(false)
const showQuickClaims = ref(false)

function decodeSegment(seg: string): string {
  try {
    const b = seg.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.stringify(JSON.parse(atob(b)), null, 2)
  } catch { return '' }
}

const {
  ALGO_FAMILIES, QUICK_CLAIMS, JWT_HELP_SECTIONS,
  currentMode, copiedField, showHelpModal,
  // Decode
  tokenInput, verifySecret, signatureValid, isVerifying,
  header, payload, signature, parseError,
  // Generate
  selectedFamily, selectedAlgo,
  genPayload,
  hmacSecret, rsaPublicKey, rsaPrivateKey,
  ecPublicKey, ecPrivateKey, edPublicKey, edPrivateKey,
  showKeyPairPanel, keyGenerating, keyFormat,
  genToken, genError,
  // Computed
  currentFamilyAlgos, algoDescription, familyDescription,
  isHmacFamily, isAsymmetricFamily,
  tokenStatus, hasGeneratedKeyPair,
  // Helpers
  formatTimestamp, formatJson, getFieldDescription, isTimestampField,
  // Actions
  verifySignature,
  generateJwt, generateKeyPair, generateHmacSecret,
  addClaimToPayload, addCurrentTimestamp, addExpiry,
  copyText, paste, clearDecode, loadExample, clearGenerate,
} = useJwt()
</script>

<template>
  <div class="tool-page">
    <ToolTitleBar title="JWT 工具" icon="icon-jwt">
      <div class="header-content">
        <span v-if="currentMode === 'decode' && tokenStatus" :class="['mode-tag', tokenStatus.type]">
          <Check v-if="tokenStatus.type === 'success'" :size="12" />
          <AlertCircle v-else :size="12" />
          {{ tokenStatus.message }}
        </span>
        <button class="glass-icon-btn small" @click="showHelpModal = true"
          @mouseenter="showTooltip('JWT 工作原理', $event)" @mouseleave="hideTooltip">
          <HelpCircle :size="14" />
        </button>
      </div>
    </ToolTitleBar>

    <main class="tool-main split">
      <!-- Left: config + input -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon purple"><Lock :size="14" /></span>
            <span>{{ currentMode === 'decode' ? 'JWT 解码' : 'JWT 生成' }}</span>
          </div>
          <div class="panel-actions">
            <!-- Mode toggle -->
            <button :class="['seg-btn xs', { active: currentMode === 'decode' }]" @click="currentMode = 'decode'">
              <Unlock :size="11" /> 解码
            </button>
            <button :class="['seg-btn xs', { active: currentMode === 'generate' }]" @click="currentMode = 'generate'">
              <Lock :size="11" /> 生成
            </button>

            <div class="panel-divider"></div>

            <button class="action-btn" @click="loadExample"
              @mouseenter="showTooltip('示例', $event)" @mouseleave="hideTooltip">
              <RotateCw :size="13" />
            </button>
            <button class="action-btn" @click="currentMode === 'decode' ? paste() : (() => {})()"
              @mouseenter="showTooltip('粘贴', $event)" @mouseleave="hideTooltip">
              <ClipboardPaste :size="13" />
            </button>
            <button class="action-btn" @click="currentMode === 'decode' ? clearDecode() : clearGenerate()"
              @mouseenter="showTooltip('清空', $event)" @mouseleave="hideTooltip">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>

        <div class="tool-panel-body">
          <!-- ====== DECODE MODE ====== -->
          <template v-if="currentMode === 'decode'">
            <div class="config-section grow">
              <label class="config-label">JWT Token</label>
              <textarea
                v-model="tokenInput"
                class="config-textarea"
                placeholder="粘贴 JWT Token 到这里..."
                spellcheck="false"
              />
            </div>

            <!-- Verify section -->
            <div v-if="header && !parseError" class="config-section">
              <div class="config-row">
                <label class="config-label">签名验证</label>
                <span v-if="signatureValid !== null" :class="['verify-badge', signatureValid ? 'valid' : 'invalid']">
                  <Check v-if="signatureValid" :size="10" />
                  <AlertCircle v-else :size="10" />
                  {{ signatureValid ? '通过' : '失败' }}
                </span>
              </div>
              <div class="verify-row">
                <div class="verify-input-wrap">
                  <input
                    v-model="verifySecret"
                    :type="showSecret ? 'text' : 'password'"
                    class="config-input"
                    placeholder="HMAC 密钥 / 公钥 (JWK/PEM)..."
                    @keyup.enter="verifySignature"
                    spellcheck="false"
                  />
                  <button class="input-suffix" @click="showSecret = !showSecret">
                    <Eye v-if="!showSecret" :size="12" />
                    <EyeOff v-else :size="12" />
                  </button>
                </div>
                <button class="verify-btn" @click="verifySignature" :disabled="isVerifying || !verifySecret">
                  <Shield :size="12" />
                  <span>{{ isVerifying ? '...' : '验证' }}</span>
                </button>
              </div>
              <div class="verify-hint">
                HMAC 算法输入共享密钥；RSA/ECDSA/EdDSA 输入公钥（JWK JSON 或 PEM 格式）
              </div>
            </div>
          </template>

          <!-- ====== GENERATE MODE ====== -->
          <template v-else>
            <!-- Algorithm family -->
            <div class="config-section">
              <label class="config-label">算法类型</label>
              <div class="segment-group wrap">
                <button v-for="fam in ALGO_FAMILIES" :key="fam.value"
                  :class="['seg-btn small', { active: selectedFamily === fam.value }]"
                  @click="selectedFamily = fam.value">
                  {{ fam.label }}
                </button>
              </div>
              <div class="algo-hint">{{ familyDescription }}</div>
            </div>

            <!-- Specific algorithm -->
            <div class="config-section">
              <label class="config-label">签名算法</label>
              <div class="segment-group wrap">
                <button v-for="algo in currentFamilyAlgos" :key="algo"
                  :class="['seg-btn small', { active: selectedAlgo === algo }]"
                  @click="selectedAlgo = algo">
                  {{ algo }}
                </button>
              </div>
              <div class="algo-hint">{{ algoDescription }}</div>
            </div>

            <!-- HMAC secret -->
            <div v-if="isHmacFamily" class="config-section">
              <div class="config-row">
                <label class="config-label">密钥</label>
                <button class="action-btn mini" @click="generateHmacSecret"
                  @mouseenter="showTooltip('随机生成', $event)" @mouseleave="hideTooltip">
                  <RefreshCw :size="11" />
                </button>
              </div>
              <div class="verify-input-wrap">
                <input v-model="hmacSecret" :type="showSecret ? 'text' : 'password'"
                  class="config-input" placeholder="输入 HMAC 密钥或点击生成..." spellcheck="false" />
                <button class="input-suffix" @click="showSecret = !showSecret">
                  <Eye v-if="!showSecret" :size="12" />
                  <EyeOff v-else :size="12" />
                </button>
              </div>
            </div>

            <!-- Asymmetric key pair -->
            <template v-if="isAsymmetricFamily">
              <div class="config-section">
                <div class="config-row">
                  <label class="config-label">密钥对</label>
                  <div class="config-row-actions">
                    <div class="segment-group xs">
                      <button :class="['seg-btn xxs', { active: keyFormat === 'jwk' }]" @click="keyFormat = 'jwk'">JWK</button>
                      <button :class="['seg-btn xxs', { active: keyFormat === 'pem' }]" @click="keyFormat = 'pem'">PEM</button>
                    </div>
                    <button class="action-btn mini" @click="generateKeyPair" :disabled="keyGenerating"
                      @mouseenter="showTooltip('生成密钥对', $event)" @mouseleave="hideTooltip">
                      <RefreshCw :size="11" />
                    </button>
                  </div>
                </div>

                <template v-if="hasGeneratedKeyPair || showKeyPairPanel">
                  <button class="toggle-panel-btn" @click="showKeyPairPanel = !showKeyPairPanel">
                    <Key :size="11" />
                    <span>{{ showKeyPairPanel ? '收起密钥对' : '查看密钥对' }}</span>
                    <ChevronUp v-if="showKeyPairPanel" :size="11" />
                    <ChevronDown v-else :size="11" />
                  </button>

                  <div v-if="showKeyPairPanel" class="keypair-blocks">
                    <!-- RSA keys -->
                    <template v-if="selectedFamily === 'rsa'">
                      <div class="keypair-block">
                        <div class="keypair-head">
                          <span class="keypair-tag">公钥</span>
                          <button class="action-btn mini" @click="copyText(rsaPublicKey, 'pub')">
                            <Check v-if="copiedField === 'pub'" :size="10" />
                            <Copy v-else :size="10" />
                          </button>
                        </div>
                        <textarea v-model="rsaPublicKey" class="keypair-textarea" rows="3"
                          :placeholder="keyFormat === 'pem' ? 'PEM 公钥...' : 'JWK 公钥 JSON...'" spellcheck="false" />
                      </div>
                      <div class="keypair-block">
                        <div class="keypair-head">
                          <span class="keypair-tag">私钥</span>
                          <button class="action-btn mini" @click="copyText(rsaPrivateKey, 'priv')">
                            <Check v-if="copiedField === 'priv'" :size="10" />
                            <Copy v-else :size="10" />
                          </button>
                        </div>
                        <textarea v-model="rsaPrivateKey" class="keypair-textarea" rows="3"
                          :placeholder="keyFormat === 'pem' ? 'PEM 私钥...' : 'JWK 私钥 JSON...'" spellcheck="false" />
                      </div>
                    </template>
                    <!-- ECDSA keys -->
                    <template v-if="selectedFamily === 'ecdsa'">
                      <div class="keypair-block">
                        <div class="keypair-head">
                          <span class="keypair-tag">公钥</span>
                          <button class="action-btn mini" @click="copyText(ecPublicKey, 'ecpub')">
                            <Check v-if="copiedField === 'ecpub'" :size="10" />
                            <Copy v-else :size="10" />
                          </button>
                        </div>
                        <textarea v-model="ecPublicKey" class="keypair-textarea" rows="3"
                          :placeholder="keyFormat === 'pem' ? 'PEM 公钥...' : 'JWK 公钥 JSON...'" spellcheck="false" />
                      </div>
                      <div class="keypair-block">
                        <div class="keypair-head">
                          <span class="keypair-tag">私钥</span>
                          <button class="action-btn mini" @click="copyText(ecPrivateKey, 'ecpriv')">
                            <Check v-if="copiedField === 'ecpriv'" :size="10" />
                            <Copy v-else :size="10" />
                          </button>
                        </div>
                        <textarea v-model="ecPrivateKey" class="keypair-textarea" rows="3"
                          :placeholder="keyFormat === 'pem' ? 'PEM 私钥...' : 'JWK 私钥 JSON...'" spellcheck="false" />
                      </div>
                    </template>
                    <!-- EdDSA keys -->
                    <template v-if="selectedFamily === 'eddsa'">
                      <div class="keypair-block">
                        <div class="keypair-head">
                          <span class="keypair-tag">公钥</span>
                          <button class="action-btn mini" @click="copyText(edPublicKey, 'edpub')">
                            <Check v-if="copiedField === 'edpub'" :size="10" />
                            <Copy v-else :size="10" />
                          </button>
                        </div>
                        <textarea v-model="edPublicKey" class="keypair-textarea" rows="3"
                          :placeholder="keyFormat === 'pem' ? 'PEM 公钥...' : 'JWK 公钥 JSON...'" spellcheck="false" />
                      </div>
                      <div class="keypair-block">
                        <div class="keypair-head">
                          <span class="keypair-tag">私钥</span>
                          <button class="action-btn mini" @click="copyText(edPrivateKey, 'edpriv')">
                            <Check v-if="copiedField === 'edpriv'" :size="10" />
                            <Copy v-else :size="10" />
                          </button>
                        </div>
                        <textarea v-model="edPrivateKey" class="keypair-textarea" rows="3"
                          :placeholder="keyFormat === 'pem' ? 'PEM 私钥...' : 'JWK 私钥 JSON...'" spellcheck="false" />
                      </div>
                    </template>
                  </div>
                </template>

                <div v-else class="gen-key-hint">
                  点击 <RefreshCw :size="11" /> 按钮生成 {{ selectedFamily.toUpperCase() }} 密钥对
                </div>
              </div>
            </template>

            <!-- Quick claims -->
            <div class="config-section">
              <button class="toggle-panel-btn" @click="showQuickClaims = !showQuickClaims">
                <Plus :size="11" />
                <span>快速添加字段</span>
                <ChevronUp v-if="showQuickClaims" :size="11" />
                <ChevronDown v-else :size="11" />
              </button>
              <div v-if="showQuickClaims" class="quick-claims-grid">
                <button v-for="claim in QUICK_CLAIMS" :key="claim.key"
                  class="quick-claim-btn" @click="claim.key === 'iat' ? addCurrentTimestamp('iat') : claim.key === 'exp' ? addExpiry(1) : addClaimToPayload(claim.key, '')"
                  @mouseenter="showTooltip(claim.desc, $event)" @mouseleave="hideTooltip">
                  <Plus :size="10" /> {{ claim.label }}
                </button>
              </div>
            </div>

            <!-- Payload -->
            <div class="config-section grow">
              <div class="config-row">
                <label class="config-label">Payload</label>
                <button class="action-btn mini" @click="addCurrentTimestamp('iat')"
                  @mouseenter="showTooltip('添加 iat', $event)" @mouseleave="hideTooltip">
                  <Clock :size="11" />
                </button>
              </div>
              <textarea v-model="genPayload" class="config-textarea" spellcheck="false"
                placeholder="输入 JSON 格式的 Payload..." />
            </div>
          </template>
        </div>

        <!-- Generate action bar -->
        <div v-if="currentMode === 'generate'" class="action-bar">
          <button class="execute-btn" @click="generateJwt" :disabled="!genPayload">
            <Lock :size="14" />
            <span>生成 JWT</span>
          </button>
        </div>
      </section>

      <!-- Right: output -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon green"><Shield :size="14" /></span>
            <span>{{ currentMode === 'decode' ? '解析结果' : '生成结果' }}</span>
          </div>
          <div class="panel-actions">
            <button v-if="currentMode === 'decode' && tokenInput" class="action-btn"
              @click="copyText(tokenInput, 'raw-token')"
              @mouseenter="showTooltip('复制原始 Token', $event)" @mouseleave="hideTooltip">
              <Check v-if="copiedField === 'raw-token'" :size="13" />
              <Copy v-else :size="13" />
            </button>
            <button v-if="currentMode === 'generate' && genToken" class="action-btn"
              @click="copyText(genToken, 'gen-token')"
              @mouseenter="showTooltip('复制 Token', $event)" @mouseleave="hideTooltip">
              <Check v-if="copiedField === 'gen-token'" :size="13" />
              <Copy v-else :size="13" />
            </button>
          </div>
        </div>
        <div class="tool-panel-body">
          <!-- ====== DECODE OUTPUT ====== -->
          <template v-if="currentMode === 'decode'">
            <div v-if="parseError" class="output-error">
              <div class="output-error-head"><AlertCircle :size="14" /> <span>解析错误</span></div>
              <p class="output-error-msg">{{ parseError }}</p>
            </div>

            <template v-else-if="header || payload">
              <!-- Header -->
              <div class="jwt-part" v-if="header">
                <div class="jwt-part-header">
                  <div class="jwt-part-title">
                    <span class="jwt-dot blue"></span>
                    <span>Header</span>
                    <span class="jwt-tag" v-if="header.parsed?.alg">{{ header.parsed.alg }}</span>
                    <span class="jwt-tag" v-if="header.parsed?.typ">{{ header.parsed.typ }}</span>
                  </div>
                  <button class="action-btn mini" @click="copyText(formatJson(header.parsed), 'header')">
                    <Check v-if="copiedField === 'header'" :size="10" />
                    <Copy v-else :size="10" />
                  </button>
                </div>
                <pre class="jwt-code-block">{{ formatJson(header.parsed) }}</pre>
              </div>

              <!-- Payload -->
              <div class="jwt-part" v-if="payload && payload.parsed">
                <div class="jwt-part-header">
                  <div class="jwt-part-title">
                    <span class="jwt-dot green"></span>
                    <span>Payload</span>
                    <span class="jwt-tag">{{ Object.keys(payload.parsed).length }} 字段</span>
                  </div>
                  <button class="action-btn mini" @click="copyText(formatJson(payload.parsed), 'payload')">
                    <Check v-if="copiedField === 'payload'" :size="10" />
                    <Copy v-else :size="10" />
                  </button>
                </div>
                <div class="jwt-fields">
                  <div v-for="(value, key) in payload.parsed" :key="String(key)" class="jwt-field">
                    <div class="jwt-field-left">
                      <code class="jwt-field-key">{{ key }}</code>
                      <span class="jwt-field-desc" v-if="getFieldDescription(String(key))">{{ getFieldDescription(String(key)) }}</span>
                    </div>
                    <div class="jwt-field-right">
                      <span class="jwt-field-value">{{ value }}</span>
                      <span class="jwt-field-time" v-if="isTimestampField(String(key)) && typeof value === 'number'">
                        <Clock :size="11" /> {{ formatTimestamp(value) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Signature -->
              <div class="jwt-part" v-if="signature">
                <div class="jwt-part-header">
                  <div class="jwt-part-title">
                    <span class="jwt-dot purple"></span>
                    <span>Signature</span>
                  </div>
                  <button class="action-btn mini" @click="copyText(signature, 'sig')">
                    <Check v-if="copiedField === 'sig'" :size="10" />
                    <Copy v-else :size="10" />
                  </button>
                </div>
                <code class="jwt-sig-code">{{ signature }}</code>
              </div>
            </template>

            <!-- Empty decode -->
            <div v-else class="tool-empty">
              <div class="empty-icon"><Shield :size="40" /></div>
              <p class="empty-title">粘贴 JWT Token 解析</p>
              <p class="empty-desc">支持 HS256/384/512、RS256/384/512、ES256/384/512、EdDSA 签名验证</p>
            </div>
          </template>

          <!-- ====== GENERATE OUTPUT ====== -->
          <template v-else>
            <div v-if="genError" class="output-error">
              <div class="output-error-head"><AlertCircle :size="14" /> <span>生成错误</span></div>
              <p class="output-error-msg">{{ genError }}</p>
            </div>

            <div v-else-if="genToken" class="gen-result">
              <div class="gen-section-label">分段预览</div>
              <div class="gen-token-parts">
                <div class="gen-token-part">
                  <span class="gen-token-label">Header</span>
                  <code class="gen-token-value blue">{{ genToken.split('.')[0] }}</code>
                </div>
                <span class="gen-token-dot">.</span>
                <div class="gen-token-part">
                  <span class="gen-token-label">Payload</span>
                  <code class="gen-token-value green">{{ genToken.split('.')[1] }}</code>
                </div>
                <span class="gen-token-dot">.</span>
                <div class="gen-token-part">
                  <span class="gen-token-label">Signature</span>
                  <code class="gen-token-value purple">{{ genToken.split('.')[2] }}</code>
                </div>
              </div>

              <div class="gen-section-label" style="margin-top: 16px;">完整 Token</div>
              <pre class="gen-full-token">{{ genToken }}</pre>

              <!-- Decoded preview -->
              <div class="gen-section-label" style="margin-top: 16px;">解码预览</div>
              <div class="gen-decoded">
                <div class="gen-decoded-part">
                  <div class="gen-decoded-head">
                    <span class="jwt-dot blue"></span>
                    <span>Header</span>
                  </div>
                  <pre class="gen-decoded-code">{{ decodeSegment(genToken.split('.')[0]) }}</pre>
                </div>
                <div class="gen-decoded-part">
                  <div class="gen-decoded-head">
                    <span class="jwt-dot green"></span>
                    <span>Payload</span>
                  </div>
                  <pre class="gen-decoded-code">{{ decodeSegment(genToken.split('.')[1]) }}</pre>
                </div>
              </div>
            </div>

            <div v-else class="tool-empty">
              <div class="empty-icon"><Lock :size="40" /></div>
              <p class="empty-title">配置参数后生成 JWT</p>
              <p class="empty-desc">选择算法、配置密钥、填写 Payload 后生成</p>
            </div>
          </template>
        </div>
      </section>
    </main>

    <!-- Tooltip -->
    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">{{ tooltip.text }}</div>

    <ReferenceModal v-model:visible="showHelpModal" title="JWT 工作原理" :sections="JWT_HELP_SECTIONS" />
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.mode-tag.success { color: var(--accent); background: var(--accent-light); }
.mode-tag.warning { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
.mode-tag.error { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

.panel-icon.purple { color: #6366f1; background: rgba(99, 102, 241, 0.1); }

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

/* ====== Segment Buttons ====== */
.segment-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.segment-group.xs { gap: 2px; }

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

.seg-btn:hover {
  border-color: var(--border-default);
  background: var(--bg-hover);
  color: var(--text-primary);
}

.seg-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.seg-btn.small {
  padding: 3px 9px;
  font-size: 11px;
  font-family: var(--font-mono);
}

.seg-btn.xs {
  padding: 2px 8px;
  font-size: 11px;
  height: 22px;
}

.seg-btn.xxs {
  padding: 1px 6px;
  font-size: 10px;
  height: 18px;
  font-family: var(--font-mono);
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

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-row .config-label { margin-bottom: 0; }

.config-row-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.algo-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 6px;
  line-height: 1.5;
}

/* ====== Config Input ====== */
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

.verify-input-wrap {
  position: relative;
  display: flex;
}

.verify-input-wrap .config-input {
  padding-right: 30px;
}

.input-suffix {
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  padding: 0;
}

.input-suffix:hover { color: var(--text-primary); }

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

/* ====== Verify Section ====== */
.verify-row {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.verify-row .verify-input-wrap { flex: 1; }

.verify-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 30px;
  padding: 0 12px;
  border: none;
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  flex-shrink: 0;
}

.verify-btn:hover:not(:disabled) { filter: brightness(1.1); }
.verify-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.verify-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.verify-badge.valid { color: var(--accent); background: var(--accent-light); }
.verify-badge.invalid { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

.verify-hint {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 6px;
  line-height: 1.5;
  opacity: 0.7;
}

/* ====== Key Pair ====== */
.toggle-panel-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 11px;
  transition: color var(--transition-fast);
}

.toggle-panel-btn:hover { color: var(--text-primary); }

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

.gen-key-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 6px;
}

/* ====== Quick Claims ====== */
.quick-claims-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.quick-claim-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border: 1px dashed var(--border-default);
  background: transparent;
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.quick-claim-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-light);
  border-style: solid;
}

/* ====== Action Bar ====== */
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

/* ====== Output: JWT Parts ====== */
.jwt-part {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.jwt-part:last-child { border-bottom: none; }

.jwt-part-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.jwt-part-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.jwt-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.jwt-dot.blue { background: var(--accent); }
.jwt-dot.green { background: var(--success); }
.jwt-dot.purple { background: #8b5cf6; }

.jwt-tag {
  padding: 1px 6px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.jwt-code-block {
  margin: 0;
  padding: 10px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-all;
  overflow: auto;
  max-height: 120px;
}

/* ====== Payload Fields ====== */
.jwt-fields {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.jwt-field {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 6px 10px;
  border-radius: 4px;
  gap: 12px;
}

.jwt-field:hover { background: var(--bg-hover); }

.jwt-field-left {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex-shrink: 0;
}

.jwt-field-key {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  background: transparent;
  padding: 0;
}

.jwt-field-desc {
  font-size: 10px;
  color: var(--text-muted);
}

.jwt-field-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  text-align: right;
  min-width: 0;
}

.jwt-field-value {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-primary);
  word-break: break-all;
}

.jwt-field-time {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  color: var(--text-muted);
}

.jwt-sig-code {
  display: block;
  padding: 10px 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
  word-break: break-all;
  line-height: 1.6;
}

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
}

/* ====== Generate Result ====== */
.gen-result {
  padding: 14px;
}

.gen-section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 8px;
}

.gen-token-parts {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  flex-wrap: wrap;
}

.gen-token-part {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.gen-token-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.gen-token-value {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 5px 8px;
  border-radius: 4px;
  word-break: break-all;
  line-height: 1.4;
}

.gen-token-value.blue { background: var(--accent-light); color: var(--accent); }
.gen-token-value.green { background: var(--success-light); color: var(--success); }
.gen-token-value.purple { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }

.gen-token-dot {
  font-size: 14px;
  font-weight: bold;
  color: var(--text-muted);
  margin-top: 16px;
}

.gen-full-token {
  margin: 0;
  padding: 10px 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  word-break: break-all;
  white-space: pre-wrap;
}

.gen-decoded {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gen-decoded-part {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gen-decoded-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
}

.gen-decoded-code {
  margin: 0;
  padding: 8px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.5;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-all;
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

/* ====== Responsive ====== */
@media (max-width: 760px) {
  .tool-main { grid-template-columns: 1fr !important; }
}
</style>
