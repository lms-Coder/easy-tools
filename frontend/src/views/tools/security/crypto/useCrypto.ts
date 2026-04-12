import { ref, computed } from 'vue'
import * as CryptoService from '../../../../../bindings/easy-tools/internal/services/cryptoservice.js'
import { toast } from '@/composables/useToast'

type Tab = 'symmetric' | 'rsa' | 'chacha20' | 'hash' | 'base64'
type Mode = 'encrypt' | 'decrypt'
type Algo = 'aes' | 'des' | '3des'
type CipherMode = 'cbc' | 'ecb' | 'cfb' | 'ofb' | 'ctr' | 'gcm'

const tabOptions: { value: Tab; label: string }[] = [
  { value: 'symmetric', label: 'AES/DES/3DES' },
  { value: 'rsa', label: 'RSA' },
  { value: 'chacha20', label: 'ChaCha20' },
  { value: 'hash', label: '哈希' },
  { value: 'base64', label: 'Base64' },
]

const algoOptions: { value: Algo; label: string; desc: string }[] = [
  { value: 'aes', label: 'AES', desc: '高级加密标准' },
  { value: 'des', label: 'DES', desc: '数据加密标准' },
  { value: '3des', label: '3DES', desc: '三重DES' },
]

const cipherModeOptions: { value: CipherMode; label: string }[] = [
  { value: 'cbc', label: 'CBC' },
  { value: 'ecb', label: 'ECB' },
  { value: 'cfb', label: 'CFB' },
  { value: 'ofb', label: 'OFB' },
  { value: 'ctr', label: 'CTR' },
  { value: 'gcm', label: 'GCM' },
]

export function useCrypto() {
  const currentTab = ref<Tab>('symmetric')
  const currentMode = ref<Mode>('encrypt')
  const currentAlgo = ref<Algo>('aes')
  const cipherMode = ref<CipherMode>('cbc')

  const inputText = ref('')
  const keyText = ref('')
  const ivText = ref('')
  const outputText = ref('')
  const loading = ref(false)

  // RSA
  const rsaPublicKey = ref('')
  const rsaPrivateKey = ref('')
  const rsaKeyBits = ref(2048)
  const showKeyPairPanel = ref(false)

  // Hash
  const hmacKey = ref('')
  const hashResult = ref<any>(null)

  // Clipboard
  const copiedId = ref('')

  const keyLengthHint = computed(() => {
    switch (currentAlgo.value) {
      case 'aes': return '密钥需为 16/24/32 字节（AES-128/192/256）'
      case 'des': return '密钥需为 8 字节'
      case '3des': return '密钥需为 24 字节'
      default: return ''
    }
  })

  const isSymmetric = computed(() => currentTab.value === 'symmetric')
  const isRsa = computed(() => currentTab.value === 'rsa')
  const isChacha = computed(() => currentTab.value === 'chacha20')
  const isHash = computed(() => currentTab.value === 'hash')
  const isBase64 = computed(() => currentTab.value === 'base64')

  const inputStats = computed(() => ({
    chars: inputText.value.length,
    lines: inputText.value ? inputText.value.split('\n').length : 0,
  }))
  const outputStats = computed(() => ({
    chars: outputText.value.length,
  }))

  async function doCrypto() {
    if (!inputText.value) { outputText.value = ''; hashResult.value = null; return }

    loading.value = true
    try {
      if (isSymmetric.value) {
        if (!keyText.value) { toast.error('请输入密钥'); return }
        const r = currentMode.value === 'encrypt'
          ? await CryptoService.AesEncrypt(inputText.value, keyText.value, ivText.value, cipherMode.value)
          : await CryptoService.AesDecrypt(inputText.value, keyText.value, ivText.value, cipherMode.value)
        handleResult(r)
      } else if (currentAlgo.value === 'des' || currentAlgo.value === '3des') {
        if (!keyText.value) { toast.error('请输入密钥'); return }
        const r = currentMode.value === 'encrypt'
          ? await CryptoService.DesEncrypt(inputText.value, keyText.value, ivText.value, cipherMode.value, currentAlgo.value)
          : await CryptoService.DesDecrypt(inputText.value, keyText.value, ivText.value, cipherMode.value, currentAlgo.value)
        handleResult(r)
      }
    } catch (e: any) {
      outputText.value = ''
      toast.error(`操作失败: ${e.message || e}`)
    } finally {
      loading.value = false
    }
  }

  async function doCryptoDispatch() {
    if (!inputText.value) { outputText.value = ''; hashResult.value = null; return }
    loading.value = true
    try {
      let r: any

      if (isSymmetric.value) {
        if (!keyText.value) { toast.error('请输入密钥'); return }
        if (currentAlgo.value === 'aes') {
          r = currentMode.value === 'encrypt'
            ? await CryptoService.AesEncrypt(inputText.value, keyText.value, ivText.value, cipherMode.value)
            : await CryptoService.AesDecrypt(inputText.value, keyText.value, ivText.value, cipherMode.value)
        } else {
          r = currentMode.value === 'encrypt'
            ? await CryptoService.DesEncrypt(inputText.value, keyText.value, ivText.value, cipherMode.value, currentAlgo.value)
            : await CryptoService.DesDecrypt(inputText.value, keyText.value, ivText.value, cipherMode.value, currentAlgo.value)
        }
        handleResult(r)
      } else if (isRsa.value) {
        if (currentMode.value === 'encrypt') {
          if (!rsaPublicKey.value) { toast.error('请输入或生成公钥'); return }
          r = await CryptoService.RsaEncrypt(inputText.value, rsaPublicKey.value)
        } else {
          if (!rsaPrivateKey.value) { toast.error('请输入或生成私钥'); return }
          r = await CryptoService.RsaDecrypt(inputText.value, rsaPrivateKey.value)
        }
        handleResult(r)
      } else if (isChacha.value) {
        if (!keyText.value) { toast.error('请输入密钥（32字节）'); return }
        r = currentMode.value === 'encrypt'
          ? await CryptoService.Chacha20Encrypt(inputText.value, keyText.value)
          : await CryptoService.Chacha20Decrypt(inputText.value, keyText.value)
        handleResult(r)
      } else if (isHash.value) {
        r = await CryptoService.HashCalculate(inputText.value, hmacKey.value)
        if (r.success) {
          hashResult.value = r
          outputText.value = [
            r.md5 ? `MD5:       ${r.md5}` : '',
            r.sha1 ? `SHA1:      ${r.sha1}` : '',
            r.sha256 ? `SHA256:    ${r.sha256}` : '',
            r.sha512 ? `SHA512:    ${r.sha512}` : '',
            r.hmac ? `HMAC-SHA256: ${r.hmac}` : '',
          ].filter(Boolean).join('\n')
        } else {
          toast.error(r.error || '计算失败')
        }
      } else if (isBase64.value) {
        if (currentMode.value === 'encrypt') {
          r = await CryptoService.Base64Encode(inputText.value)
        } else {
          r = await CryptoService.Base64Decode(inputText.value)
        }
        handleResult(r)
      }
    } catch (e: any) {
      outputText.value = ''
      toast.error(`操作失败: ${e.message || e}`)
    } finally {
      loading.value = false
    }
  }

  function handleResult(r: any) {
    if (r) {
      if (r.success) {
        outputText.value = r.data
      } else {
        outputText.value = ''
        toast.error(r.error || '操作失败')
      }
    }
  }

  async function generateRsaKeyPair() {
    loading.value = true
    try {
      const r = await CryptoService.RsaGenerateKeyPair(rsaKeyBits.value)
      if (r && r.success) {
        rsaPublicKey.value = r.publicKey
        rsaPrivateKey.value = r.privateKey
        toast.success('密钥对已生成')
      } else {
        toast.error(r?.error || '生成失败')
      }
    } catch (e: any) {
      toast.error(`生成失败: ${e.message || e}`)
    } finally {
      loading.value = false
    }
  }

  async function generateRandomKey() {
    try {
      let r: any
      if (isSymmetric.value) {
        if (currentAlgo.value === 'aes') {
          r = await CryptoService.GenerateAesKey(256)
        } else {
          r = await CryptoService.GenerateDesKey(currentAlgo.value)
        }
      } else if (isChacha.value) {
        r = await CryptoService.GenerateChacha20Key()
      }
      if (r && r.success) {
        keyText.value = r.data
        toast.success('已生成随机密钥')
      }
    } catch {
      toast.error('生成密钥失败')
    }
  }

  function swapDirection() {
    inputText.value = outputText.value
    outputText.value = ''
    hashResult.value = null
    currentMode.value = currentMode.value === 'encrypt' ? 'decrypt' : 'encrypt'
    toast.success(currentMode.value === 'encrypt' ? '切换为加密' : '切换为解密')
  }

  async function copyToClipboard(text: string, id: string) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      copiedId.value = id
      setTimeout(() => { copiedId.value = '' }, 2000)
      toast.success('已复制', 1500)
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        copiedId.value = id
        setTimeout(() => { copiedId.value = '' }, 2000)
        toast.success('已复制', 1500)
      } catch {
        toast.error('复制失败')
      }
    }
  }

  function clearAll() {
    inputText.value = ''
    outputText.value = ''
    keyText.value = ''
    ivText.value = ''
    hashResult.value = null
  }

  async function pasteFromClipboard() {
    try {
      inputText.value = await navigator.clipboard.readText()
      toast.success('已粘贴')
    } catch { toast.error('粘贴失败') }
  }

  function loadExample() {
    if (isBase64.value) {
      if (currentMode.value === 'encrypt') {
        inputText.value = 'Hello, 世界！Easy Tools 加密解密工具'
      } else {
        toast.info('解密模式请粘贴 Base64 密文')
      }
      return
    }
    if (isHash.value) {
      inputText.value = 'Hello, 世界！Easy Tools 哈希测试'
      hmacKey.value = 'my-secret-key'
      return
    }
    if (isRsa.value) {
      if (currentMode.value === 'encrypt' && rsaPublicKey.value) {
        inputText.value = 'Hello, RSA 加密测试！'
      } else {
        toast.info('请先生成 RSA 密钥对')
      }
      return
    }
    if (isChacha.value) {
      if (currentMode.value === 'encrypt') {
        inputText.value = 'Hello, ChaCha20 加密测试！'
        keyText.value = ''
      } else {
        toast.info('解密模式请粘贴密文')
      }
      return
    }
    // Symmetric
    if (currentMode.value === 'encrypt') {
      inputText.value = '你好，世界！Hello World 123'
      if (currentAlgo.value === 'aes') {
        keyText.value = '1234567890123456'
        ivText.value = '1234567890123456'
      } else if (currentAlgo.value === 'des') {
        keyText.value = '12345678'
        ivText.value = '12345678'
      } else {
        keyText.value = '123456789012345678901234'
        ivText.value = '12345678'
      }
    } else {
      toast.info('解密模式请粘贴密文')
    }
  }

  return {
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
  }
}
