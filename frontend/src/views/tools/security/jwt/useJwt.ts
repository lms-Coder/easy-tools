import { ref, computed, watch } from 'vue'
import { toast } from '@/composables/useToast'

// ====== Types ======
export type JwtMode = 'decode' | 'generate'

export type JwtAlgorithm =
  | 'HS256' | 'HS384' | 'HS512'
  | 'RS256' | 'RS384' | 'RS512'
  | 'PS256' | 'PS384' | 'PS512'
  | 'ES256' | 'ES384' | 'ES512'
  | 'EdDSA'

export type AlgoFamily = 'hmac' | 'rsa' | 'ecdsa' | 'eddsa'

export interface JwtPart {
  raw: string
  parsed: any
  valid: boolean
}

export interface TokenStatus {
  type: 'success' | 'warning' | 'error'
  message: string
}

export interface AlgorithmInfo {
  value: JwtAlgorithm
  label: string
  family: AlgoFamily
  description: string
}

// ====== Algorithm definitions ======
const ALGORITHMS: AlgorithmInfo[] = [
  { value: 'HS256', label: 'HS256', family: 'hmac', description: 'HMAC SHA-256（对称密钥）' },
  { value: 'HS384', label: 'HS384', family: 'hmac', description: 'HMAC SHA-384（对称密钥）' },
  { value: 'HS512', label: 'HS512', family: 'hmac', description: 'HMAC SHA-512（对称密钥）' },
  { value: 'RS256', label: 'RS256', family: 'rsa', description: 'RSA-PSS SHA-256（非对称）' },
  { value: 'RS384', label: 'RS384', family: 'rsa', description: 'RSA-PSS SHA-384（非对称）' },
  { value: 'RS512', label: 'RS512', family: 'rsa', description: 'RSA-PSS SHA-512（非对称）' },
  { value: 'PS256', label: 'PS256', family: 'rsa', description: 'RSA-PSS SHA-256（概率签名）' },
  { value: 'PS384', label: 'PS384', family: 'rsa', description: 'RSA-PSS SHA-384（概率签名）' },
  { value: 'PS512', label: 'PS512', family: 'rsa', description: 'RSA-PSS SHA-512（概率签名）' },
  { value: 'ES256', label: 'ES256', family: 'ecdsa', description: 'ECDSA P-256 SHA-256' },
  { value: 'ES384', label: 'ES384', family: 'ecdsa', description: 'ECDSA P-384 SHA-384' },
  { value: 'ES512', label: 'ES512', family: 'ecdsa', description: 'ECDSA P-521 SHA-512' },
  { value: 'EdDSA', label: 'EdDSA', family: 'eddsa', description: 'EdDSA Ed25519' },
]

const ALGO_FAMILIES: { value: AlgoFamily; label: string; algos: JwtAlgorithm[] }[] = [
  { value: 'hmac', label: 'HMAC', algos: ['HS256', 'HS384', 'HS512'] },
  { value: 'rsa', label: 'RSA', algos: ['RS256', 'RS384', 'RS512'] },
  { value: 'ecdsa', label: 'ECDSA', algos: ['ES256', 'ES384', 'ES512'] },
  { value: 'eddsa', label: 'EdDSA', algos: ['EdDSA'] },
]

const FAMILY_DESCRIPTIONS: Record<AlgoFamily, string> = {
  hmac: '对称密钥算法，使用共享密钥签名和验证。适合单服务场景，密钥需安全保管。',
  rsa: 'RSA 非对称算法，使用私钥签名、公钥验证。适合分布式系统间的身份验证。',
  ecdsa: '椭圆曲线签名算法，密钥更短、性能更好。适合移动端和高性能场景。',
  eddsa: 'Ed25519 签名算法，基于 EdDSA 曲线。签名速度快、密钥短、安全性高。',
}

// Standard JWT payload claims for quick add
const QUICK_CLAIMS = [
  { key: 'iss', label: '签发者 (iss)', desc: 'Token 签发者标识' },
  { key: 'sub', label: '主题 (sub)', desc: 'Token 主题（通常是用户 ID）' },
  { key: 'aud', label: '受众 (aud)', desc: 'Token 接收者' },
  { key: 'exp', label: '过期时间 (exp)', desc: 'Token 过期的 Unix 时间戳' },
  { key: 'nbf', label: '生效时间 (nbf)', desc: 'Token 生效的 Unix 时间戳' },
  { key: 'iat', label: '签发时间 (iat)', desc: 'Token 签发的 Unix 时间戳' },
  { key: 'jti', label: 'JWT ID (jti)', desc: 'Token 唯一标识符' },
]

// JWT help content for reference modal
const JWT_HELP_SECTIONS = [
  {
    title: 'JWT 是什么',
    items: [
      { code: 'JWT', desc: 'JSON Web Token，一种开放标准（RFC 7519），用于在各方之间安全传输信息' },
      { code: '结构', desc: '由 Header.Payload.Signature 三段 Base64Url 编码的字符串组成' },
      { code: '用途', desc: '身份认证、信息交换、单点登录（SSO）、API 授权' },
      { code: '特点', desc: '自包含（载荷含用户信息）、无状态（服务端不存储会话）、可验证（防篡改）' },
    ],
  },
  {
    title: 'Token 结构',
    items: [
      { code: 'Header', desc: '头部，包含令牌类型 typ 和签名算法 alg' },
      { code: 'Payload', desc: '载荷，包含声明（Claims），即实际传输的数据' },
      { code: 'Signature', desc: '签名，对 Header + Payload 进行签名，确保数据完整性' },
      { code: '格式', desc: 'xxxxx.yyyyy.zzzzz（三段用 . 连接的 Base64Url 字符串）' },
    ],
  },
  {
    title: '标准声明字段',
    items: [
      { code: 'iss', desc: 'Issuer — 签发者，标识签发 JWT 的主体' },
      { code: 'sub', desc: 'Subject — 主题，JWT 所面向的用户或实体' },
      { code: 'aud', desc: 'Audience — 受众，JWT 的预期接收者' },
      { code: 'exp', desc: 'Expiration — 过期时间（Unix 时间戳），超过此时间 JWT 无效' },
      { code: 'nbf', desc: 'Not Before — 生效时间，在此时间之前 JWT 无效' },
      { code: 'iat', desc: 'Issued At — 签发时间（Unix 时间戳）' },
      { code: 'jti', desc: 'JWT ID — JWT 的唯一标识符，可用于防止重放攻击' },
    ],
  },
  {
    title: '签名算法',
    items: [
      { code: 'HS256', desc: 'HMAC SHA-256 — 对称密钥算法，签名和验证使用同一密钥' },
      { code: 'HS384', desc: 'HMAC SHA-384 — 更高位数的对称密钥算法' },
      { code: 'HS512', desc: 'HMAC SHA-512 — 最高位数的对称密钥算法' },
      { code: 'RS256', desc: 'RSA-PKCS1 SHA-256 — 非对称算法，私钥签名、公钥验证' },
      { code: 'RS384/512', desc: 'RSA-PKCS1 SHA-384/512 — 更高位数的 RSA 算法' },
      { code: 'PS256/384/512', desc: 'RSA-PSS — 带概率签名的 RSA 算法，安全性更高' },
      { code: 'ES256', desc: 'ECDSA P-256 — 椭圆曲线签名，密钥短、性能好' },
      { code: 'ES384/512', desc: 'ECDSA P-384/P-521 — 更高位数的椭圆曲线算法' },
      { code: 'EdDSA', desc: 'Ed25519 — 基于 EdDSA 曲线的签名，速度最快' },
    ],
  },
  {
    title: '算法选择建议',
    items: [
      { code: 'HS256', desc: '单体应用、微服务内部通信 — 简单高效，但密钥需保密' },
      { code: 'RS256', desc: '跨服务/开放平台 — 公钥可公开分发，私钥仅签发方持有' },
      { code: 'ES256', desc: '移动端/高性能场景 — 密钥更短（256bit ≈ RSA 3072bit 安全性）' },
      { code: 'PS256', desc: '新项目推荐 — 比 RS256 安全性更高的概率签名方案' },
      { code: 'EdDSA', desc: '前沿选择 — 最快的签名速度，最短的密钥长度' },
    ],
  },
  {
    title: '安全注意事项',
    items: [
      { code: 'alg: none', desc: '绝不使用！禁用算法攻击可让攻击者绕过签名验证' },
      { code: '密钥管理', desc: 'HMAC 密钥至少 256 位（32 字节），RSA 密钥至少 2048 位' },
      { code: '敏感数据', desc: 'JWT 载荷仅 Base64 编码，不要存放密码等敏感信息' },
      { code: '有效期', desc: '设置合理的 exp 过期时间，长期 Token 风险高' },
      { code: 'HTTPS', desc: '始终在 HTTPS 下传输 JWT，防止中间人攻击' },
      { code: '密钥轮换', desc: '定期更换签名密钥，降低密钥泄露风险' },
    ],
  },
]

// ====== Helpers ======
function base64UrlEncode(data: string | ArrayBuffer): string {
  let binary: string
  if (typeof data === 'string') {
    binary = data
  } else {
    const arr = new Uint8Array(data)
    binary = ''
    for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) base64 += '='
  try {
    return decodeURIComponent(atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''))
  } catch {
    return atob(base64)
  }
}

function base64UrlToBuffer(str: string): ArrayBuffer {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) base64 += '='
  const binary = atob(base64)
  const buf = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i)
  return buf.buffer
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  return base64UrlEncode(buffer)
}

function arrayBufferToPem(buffer: ArrayBuffer, type: 'PUBLIC KEY' | 'PRIVATE KEY' | 'EC PUBLIC KEY' | 'EC PRIVATE KEY'): string {
  const binary = String.fromCharCode(...new Uint8Array(buffer))
  const base64 = btoa(binary)
  const lines = base64.match(/.{1,64}/g) || []
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')
  const binary = atob(b64)
  const buf = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i)
  return buf.buffer
}

function getAlgoFamily(alg: JwtAlgorithm): AlgoFamily {
  if (alg.startsWith('HS')) return 'hmac'
  if (alg.startsWith('RS') || alg.startsWith('PS')) return 'rsa'
  if (alg.startsWith('ES')) return 'ecdsa'
  return 'eddsa'
}

function getAlgoInfo(alg: JwtAlgorithm): AlgorithmInfo | undefined {
  return ALGORITHMS.find(a => a.value === alg)
}

function getHashAlgo(alg: JwtAlgorithm): string {
  if (alg.includes('256') || alg === 'EdDSA') return 'SHA-256'
  if (alg.includes('384')) return 'SHA-384'
  if (alg.includes('512')) return 'SHA-512'
  return 'SHA-256'
}

// For RS* algorithms (RSASSA-PKCS1-v1_5)
function getRsaAlgoParams(alg: JwtAlgorithm): RsaHashedImportParams {
  const hash = getHashAlgo(alg)
  return { name: 'RSASSA-PKCS1-v1_5', hash: { name: hash } }
}

// For PS* algorithms (RSA-PSS)
function getRsaPssAlgoParams(alg: JwtAlgorithm): RsaPssParams & RsaHashedImportParams {
  const hash = getHashAlgo(alg)
  return { name: 'RSA-PSS', hash: { name: hash } as any } as any
}

// For ES* algorithms
function getEcdsaAlgoParams(alg: JwtAlgorithm): EcKeyImportParams {
  const curves: Record<string, string> = {
    'ES256': 'P-256', 'ES384': 'P-384', 'ES512': 'P-521',
  }
  return { name: 'ECDSA', namedCurve: curves[alg] || 'P-256' }
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`
  return `${Math.floor(seconds / 86400)}天`
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

const FIELD_DESCRIPTIONS: Record<string, string> = {
  iss: '签发者', sub: '主题', aud: '受众',
  exp: '过期时间', nbf: '生效时间', iat: '签发时间', jti: 'JWT ID',
}

// ====== Main composable ======
export function useJwt() {
  // ====== Shared State ======
  const currentMode = ref<JwtMode>('decode')
  const copiedField = ref<string | null>(null)

  watch(copiedField, val => {
    if (!val) return
    setTimeout(() => { if (copiedField.value === val) copiedField.value = null }, 2000)
  })

  // ====== Decode State ======
  const tokenInput = ref('')
  const verifySecret = ref('')
  const signatureValid = ref<boolean | null>(null)
  const isVerifying = ref(false)
  const header = ref<JwtPart | null>(null)
  const payload = ref<JwtPart | null>(null)
  const signature = ref('')
  const parseError = ref('')

  // ====== Generate State ======
  const selectedFamily = ref<AlgoFamily>('hmac')
  const selectedAlgo = ref<JwtAlgorithm>('HS256')
  const genPayload = ref('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": ' + Math.floor(Date.now() / 1000) + '\n}')

  // Keys
  const hmacSecret = ref('')
  const rsaPublicKey = ref('')
  const rsaPrivateKey = ref('')
  const ecPublicKey = ref('')
  const ecPrivateKey = ref('')
  const edPublicKey = ref('')
  const edPrivateKey = ref('')
  const showKeyPairPanel = ref(false)
  const keyGenerating = ref(false)

  // Key format
  const keyFormat = ref<'jwk' | 'pem'>('jwk')

  // Result
  const genToken = ref('')
  const genError = ref('')

  // ====== Computed ======
  const currentFamilyAlgos = computed(() =>
    ALGO_FAMILIES.find(f => f.value === selectedFamily.value)?.algos || []
  )

  const algoDescription = computed(() => {
    const info = getAlgoInfo(selectedAlgo.value)
    return info ? `${info.description}` : ''
  })

  const familyDescription = computed(() =>
    FAMILY_DESCRIPTIONS[selectedFamily.value] || ''
  )

  const isHmacFamily = computed(() => selectedFamily.value === 'hmac')
  const isAsymmetricFamily = computed(() => ['rsa', 'ecdsa', 'eddsa'].includes(selectedFamily.value))

  const tokenStatus = computed<TokenStatus | null>(() => {
    if (!payload.value?.parsed) return null
    const p = payload.value.parsed
    const now = Math.floor(Date.now() / 1000)

    if (p.nbf && now < p.nbf) {
      return { type: 'warning', message: `尚未生效（${formatTime(p.nbf - now)}后生效）` }
    }

    if (p.exp) {
      const expired = now > p.exp
      if (expired) {
        const ago = now - p.exp
        return { type: 'error', message: `已过期（${formatTime(ago)}前过期）` }
      }
      const remaining = p.exp - now
      if (remaining < 3600) {
        return { type: 'warning', message: `${formatTime(remaining)}后过期` }
      }
      return { type: 'success', message: `${formatTime(remaining)}后过期` }
    }

    return { type: 'success', message: '无过期时间' }
  })

  const hasGeneratedKeyPair = computed(() => {
    if (selectedFamily.value === 'rsa') return !!(rsaPublicKey.value && rsaPrivateKey.value)
    if (selectedFamily.value === 'ecdsa') return !!(ecPublicKey.value && ecPrivateKey.value)
    if (selectedFamily.value === 'eddsa') return !!(edPublicKey.value && edPrivateKey.value)
    return false
  })

  // ====== Crypto: Signing ======
  async function signJwt(headerB64: string, payloadB64: string): Promise<string> {
    const message = `${headerB64}.${payloadB64}`
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const alg = selectedAlgo.value

    if (alg.startsWith('HS')) {
      const hash = getHashAlgo(alg)
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(hmacSecret.value),
        { name: 'HMAC', hash } as any, false, ['sign']
      )
      const sig = await crypto.subtle.sign('HMAC', key, data)
      return arrayBufferToBase64Url(sig)
    }

    if (alg.startsWith('RS')) {
      const privateKey = keyFormat.value === 'pem'
        ? await crypto.subtle.importKey('pkcs8', pemToArrayBuffer(rsaPrivateKey.value), getRsaAlgoParams(alg), false, ['sign'])
        : await crypto.subtle.importKey('jwk', JSON.parse(rsaPrivateKey.value), getRsaAlgoParams(alg), false, ['sign'])
      const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, data)
      return arrayBufferToBase64Url(sig)
    }

    if (alg.startsWith('PS')) {
      const privateKey = keyFormat.value === 'pem'
        ? await crypto.subtle.importKey('pkcs8', pemToArrayBuffer(rsaPrivateKey.value), { name: 'RSA-PSS', hash: { name: getHashAlgo(alg) } } as any, false, ['sign'])
        : await crypto.subtle.importKey('jwk', JSON.parse(rsaPrivateKey.value), { name: 'RSA-PSS', hash: { name: getHashAlgo(alg) } } as any, false, ['sign'])
      const sig = await (crypto.subtle as any).sign({ name: 'RSA-PSS', saltLength: getSaltLength(alg) }, privateKey, data)
      return arrayBufferToBase64Url(sig)
    }

    if (alg.startsWith('ES')) {
      const privateKey = keyFormat.value === 'pem'
        ? await crypto.subtle.importKey('pkcs8', pemToArrayBuffer(ecPrivateKey.value), getEcdsaAlgoParams(alg), false, ['sign'])
        : await crypto.subtle.importKey('jwk', JSON.parse(ecPrivateKey.value), getEcdsaAlgoParams(alg), false, ['sign'])
      const sig = await (crypto.subtle as any).sign({ name: 'ECDSA', hash: { name: getHashAlgo(alg) } }, privateKey, data)
      // Convert DER to raw format for JWT
      return derToRaw(sig, alg)
    }

    if (alg === 'EdDSA') {
      // Ed25519 is not directly supported in Web Crypto API in all browsers
      // We'll use a workaround via SubtleCrypto if available
      try {
        const privateKey = keyFormat.value === 'pem'
          ? await crypto.subtle.importKey('pkcs8', pemToArrayBuffer(edPrivateKey.value), { name: 'Ed25519' } as any, false, ['sign'])
          : await crypto.subtle.importKey('jwk', JSON.parse(edPrivateKey.value), { name: 'Ed25519' } as any, false, ['sign'])
        const sig = await crypto.subtle.sign('Ed25519', privateKey, data)
        return arrayBufferToBase64Url(sig)
      } catch {
        throw new Error('Ed25519 签名不被当前浏览器支持，请使用 Chrome 113+ 或 Edge 113+')
      }
    }

    throw new Error(`不支持的算法: ${alg}`)
  }

  function getSaltLength(alg: JwtAlgorithm): number {
    if (alg.includes('256')) return 32
    if (alg.includes('384')) return 48
    if (alg.includes('512')) return 64
    return 32
  }

  // Convert DER-encoded ECDSA signature to raw r||s format for JWT
  function derToRaw(derSig: ArrayBuffer, alg: JwtAlgorithm): string {
    const bytes = new Uint8Array(derSig)
    // Parse DER SEQUENCE
    let offset = 2 // skip SEQUENCE tag + length
    const readInteger = (): Uint8Array => {
      if (bytes[offset] !== 0x02) throw new Error('Invalid DER')
      offset++ // skip INTEGER tag
      const len = bytes[offset++]
      let data = bytes.slice(offset, offset + len)
      offset += len
      // Remove leading zero padding
      if (data[0] === 0 && data.length > 1) data = data.slice(1)
      return data
    }
    const r = readInteger()
    const s = readInteger()

    // Pad to expected length
    const byteLen = alg === 'ES256' ? 32 : alg === 'ES384' ? 48 : 66
    const padR = new Uint8Array(byteLen)
    const padS = new Uint8Array(byteLen)
    padR.set(r, byteLen - r.length)
    padS.set(s, byteLen - s.length)

    const raw = new Uint8Array(byteLen * 2)
    raw.set(padR, 0)
    raw.set(padS, byteLen)
    return arrayBufferToBase64Url(raw.buffer)
  }

  // ====== Crypto: Verification ======
  async function verifyJwtSignature(token: string, secretOrPublicKey: string): Promise<boolean> {
    const parts = token.split('.')
    if (parts.length !== 3) return false

    const message = `${parts[0]}.${parts[1]}`
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const sigBuffer = base64UrlToBuffer(parts[2])

    // Detect algorithm from header
    let headerParsed: any
    try {
      headerParsed = JSON.parse(base64UrlDecode(parts[0]))
    } catch { return false }

    const alg: string = headerParsed.alg || 'HS256'
    const family = getAlgoFamily(alg as JwtAlgorithm)

    try {
      if (family === 'hmac') {
        const hash = getHashAlgo(alg as JwtAlgorithm)
        const key = await crypto.subtle.importKey(
          'raw', encoder.encode(secretOrPublicKey),
          { name: 'HMAC', hash } as any, false, ['verify']
        )
        return crypto.subtle.verify('HMAC', key, sigBuffer, data)
      }

      if (family === 'rsa') {
        const isPss = alg.startsWith('PS')
        let publicKey: CryptoKey
        if (secretOrPublicKey.includes('-----BEGIN')) {
          // PEM format
          if (isPss) {
            publicKey = await crypto.subtle.importKey('spki', pemToArrayBuffer(secretOrPublicKey), { name: 'RSA-PSS', hash: { name: getHashAlgo(alg as JwtAlgorithm) } } as any, false, ['verify'])
          } else {
            publicKey = await crypto.subtle.importKey('spki', pemToArrayBuffer(secretOrPublicKey), getRsaAlgoParams(alg as JwtAlgorithm), false, ['verify'])
          }
        } else {
          // JWK format
          const jwk = JSON.parse(secretOrPublicKey)
          if (isPss) {
            publicKey = await crypto.subtle.importKey('jwk', jwk, { name: 'RSA-PSS', hash: { name: getHashAlgo(alg as JwtAlgorithm) } } as any, false, ['verify'])
          } else {
            publicKey = await crypto.subtle.importKey('jwk', jwk, getRsaAlgoParams(alg as JwtAlgorithm), false, ['verify'])
          }
        }
        if (isPss) {
          return (crypto.subtle as any).verify({ name: 'RSA-PSS', saltLength: getSaltLength(alg as JwtAlgorithm) }, publicKey, sigBuffer, data)
        }
        return crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, sigBuffer, data)
      }

      if (family === 'ecdsa') {
        let publicKey: CryptoKey
        if (secretOrPublicKey.includes('-----BEGIN')) {
          publicKey = await crypto.subtle.importKey('spki', pemToArrayBuffer(secretOrPublicKey), getEcdsaAlgoParams(alg as JwtAlgorithm), false, ['verify'])
        } else {
          publicKey = await crypto.subtle.importKey('jwk', JSON.parse(secretOrPublicKey), getEcdsaAlgoParams(alg as JwtAlgorithm), false, ['verify'])
        }
        // Need to convert raw signature back to DER for Web Crypto
        const derSig = rawToDer(sigBuffer, alg as JwtAlgorithm)
        return (crypto.subtle as any).verify({ name: 'ECDSA', hash: { name: getHashAlgo(alg as JwtAlgorithm) } }, publicKey, derSig, data)
      }

      if (family === 'eddsa') {
        let publicKey: CryptoKey
        if (secretOrPublicKey.includes('-----BEGIN')) {
          publicKey = await crypto.subtle.importKey('spki', pemToArrayBuffer(secretOrPublicKey), { name: 'Ed25519' } as any, false, ['verify'])
        } else {
          publicKey = await crypto.subtle.importKey('jwk', JSON.parse(secretOrPublicKey), { name: 'Ed25519' } as any, false, ['verify'])
        }
        return crypto.subtle.verify('Ed25519', publicKey, sigBuffer, data)
      }
    } catch (e) {
      console.error('Verify error:', e)
      return false
    }

    return false
  }

  // Convert raw r||s signature to DER format for ECDSA verification
  function rawToDer(rawSig: ArrayBuffer, alg: JwtAlgorithm): ArrayBuffer {
    const bytes = new Uint8Array(rawSig)
    const byteLen = alg === 'ES256' ? 32 : alg === 'ES384' ? 48 : 66
    const r = bytes.slice(0, byteLen)
    const s = bytes.slice(byteLen, byteLen * 2)

    const encodeInteger = (data: Uint8Array): Uint8Array => {
      // Add leading zero if high bit is set
      let pad = false
      if (data[0] & 0x80) pad = true
      const result = new Uint8Array((pad ? 1 : 0) + data.length)
      if (pad) { result[0] = 0; result.set(data, 1) }
      else result.set(data)
      return result
    }

    const rEnc = encodeInteger(r)
    const sEnc = encodeInteger(s)

    // DER SEQUENCE
    const totalLen = 2 + rEnc.length + 2 + sEnc.length
    const der = new Uint8Array(2 + totalLen)
    der[0] = 0x30 // SEQUENCE
    der[1] = totalLen
    let offset = 2
    der[offset++] = 0x02 // INTEGER
    der[offset++] = rEnc.length
    der.set(rEnc, offset)
    offset += rEnc.length
    der[offset++] = 0x02 // INTEGER
    der[offset++] = sEnc.length
    der.set(sEnc, offset)
    return der.buffer
  }

  // ====== Key Generation ======
  async function generateKeyPair() {
    keyGenerating.value = true
    try {
      const family = selectedFamily.value
      const algo = selectedAlgo.value

      if (family === 'rsa') {
        const hash = getHashAlgo(algo)
        const isPss = algo.startsWith('PS')
        const algoParams = isPss
          ? { name: 'RSA-PSS' as const, hash: hash as HashAlgorithmIdentifier, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) }
          : { name: 'RSASSA-PKCS1-v1_5' as const, hash: hash as HashAlgorithmIdentifier, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) }
        const keyPair = await crypto.subtle.generateKey(algoParams, true, ['sign', 'verify'])

        const pubJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
        const privJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey)
        rsaPublicKey.value = JSON.stringify(pubJwk, null, 2)
        rsaPrivateKey.value = JSON.stringify(privJwk, null, 2)
      }

      if (family === 'ecdsa') {
        const curve = algo === 'ES256' ? 'P-256' : algo === 'ES384' ? 'P-384' : 'P-521'
        const keyPair = await crypto.subtle.generateKey(
          { name: 'ECDSA', namedCurve: curve }, true, ['sign', 'verify']
        )
        const pubJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
        const privJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey)
        ecPublicKey.value = JSON.stringify(pubJwk, null, 2)
        ecPrivateKey.value = JSON.stringify(privJwk, null, 2)
      }

      if (family === 'eddsa') {
        try {
          const keyPair = await crypto.subtle.generateKey(
            { name: 'Ed25519' } as any, true, ['sign', 'verify'] as any
          )
          const pubJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
          const privJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey)
          edPublicKey.value = JSON.stringify(pubJwk, null, 2)
          edPrivateKey.value = JSON.stringify(privJwk, null, 2)
        } catch {
          throw new Error('Ed25519 不被当前浏览器支持，请使用 Chrome 113+ 或 Edge 113+')
        }
      }

      showKeyPairPanel.value = true
      toast.success('密钥对已生成')
    } catch (e: any) {
      toast.error(`生成密钥对失败: ${e.message || e}`)
    } finally {
      keyGenerating.value = false
    }
  }

  async function generateHmacSecret() {
    const lengths: Record<string, number> = {
      'HS256': 32, 'HS384': 48, 'HS512': 64,
    }
    const len = lengths[selectedAlgo.value] || 32
    const arr = new Uint8Array(len)
    crypto.getRandomValues(arr)
    // Use base64 for compact representation
    hmacSecret.value = arrayBufferToBase64Url(arr.buffer)
    toast.success('已生成随机密钥')
  }

  // ====== Decode Actions ======
  const parseJwt = () => {
    parseError.value = ''
    header.value = null
    payload.value = null
    signature.value = ''

    const token = tokenInput.value.trim()
    if (!token) return

    const parts = token.split('.')
    if (parts.length !== 3) {
      parseError.value = '无效的 JWT 格式，应包含 3 段以 . 分隔'
      return
    }

    try {
      const headerJson = base64UrlDecode(parts[0])
      header.value = { raw: parts[0], parsed: JSON.parse(headerJson), valid: true }
    } catch {
      header.value = { raw: parts[0], parsed: null, valid: false }
      parseError.value = 'Header 解析失败'
      return
    }

    try {
      const payloadJson = base64UrlDecode(parts[1])
      payload.value = { raw: parts[1], parsed: JSON.parse(payloadJson), valid: true }
    } catch {
      payload.value = { raw: parts[1], parsed: null, valid: false }
      parseError.value = 'Payload 解析失败'
      return
    }

    signature.value = parts[2]
  }

  watch(tokenInput, () => parseJwt())

  const verifySignature = async () => {
    if (!verifySecret.value.trim()) { toast.error('请输入密钥/公钥'); return }
    const token = tokenInput.value.trim()
    if (!token) { toast.error('请输入 JWT Token'); return }

    isVerifying.value = true
    try {
      signatureValid.value = await verifyJwtSignature(token, verifySecret.value)
      toast.success(signatureValid.value ? '签名验证通过' : '签名验证失败')
    } catch (e: any) {
      signatureValid.value = false
      toast.error(`验证失败: ${e.message || e}`)
    } finally {
      isVerifying.value = false
    }
  }

  // ====== Generate Actions ======
  const generateJwt = async () => {
    genError.value = ''
    genToken.value = ''

    // Validate key
    if (isHmacFamily.value && !hmacSecret.value.trim()) {
      genError.value = '请输入或生成 HMAC 密钥'
      return
    }
    if (selectedFamily.value === 'rsa' && !rsaPrivateKey.value.trim()) {
      genError.value = '请输入或生成 RSA 密钥对'
      return
    }
    if (selectedFamily.value === 'ecdsa' && !ecPrivateKey.value.trim()) {
      genError.value = '请输入或生成 ECDSA 密钥对'
      return
    }
    if (selectedFamily.value === 'eddsa' && !edPrivateKey.value.trim()) {
      genError.value = '请输入或生成 EdDSA 密钥对'
      return
    }

    try {
      const payloadObj = JSON.parse(genPayload.value)
      const headerObj = { alg: selectedAlgo.value, typ: 'JWT' }
      const headerEncoded = base64UrlEncode(JSON.stringify(headerObj))
      const payloadEncoded = base64UrlEncode(JSON.stringify(payloadObj))
      const sig = await signJwt(headerEncoded, payloadEncoded)
      genToken.value = `${headerEncoded}.${payloadEncoded}.${sig}`
      toast.success('JWT 生成成功')
    } catch (e: any) {
      genError.value = e.message || '生成失败'
      toast.error(genError.value)
    }
  }

  // ====== Shared Actions ======
  const copyText = async (text: string, field: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      copiedField.value = field
      toast.success('已复制')
    } catch {
      toast.error('复制失败')
    }
  }

  const paste = async () => {
    try {
      tokenInput.value = await navigator.clipboard.readText()
      toast.success('已粘贴')
    } catch { toast.error('粘贴失败') }
  }

  const clearDecode = () => {
    tokenInput.value = ''
    verifySecret.value = ''
    signatureValid.value = null
  }

  const loadExample = () => {
    tokenInput.value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MDAwMDAwMDB9.4Adcj3UF6z4V-A1z3ULxF3qD0R3m9q_P5Qh4yZqpNGg'
  }

  const clearGenerate = () => {
    genPayload.value = '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": ' + Math.floor(Date.now() / 1000) + '\n}'
    hmacSecret.value = ''
    rsaPublicKey.value = ''
    rsaPrivateKey.value = ''
    ecPublicKey.value = ''
    ecPrivateKey.value = ''
    edPublicKey.value = ''
    edPrivateKey.value = ''
    genToken.value = ''
    genError.value = ''
  }

  const addClaimToPayload = (key: string, value: any) => {
    try {
      const p = JSON.parse(genPayload.value)
      p[key] = value
      genPayload.value = JSON.stringify(p, null, 2)
      toast.success(`已添加 ${key}`)
    } catch {
      toast.error('Payload 格式错误')
    }
  }

  const addCurrentTimestamp = (key: string = 'iat') => {
    addClaimToPayload(key, Math.floor(Date.now() / 1000))
  }

  const addExpiry = (hours: number) => {
    addClaimToPayload('exp', Math.floor(Date.now() / 1000) + hours * 3600)
  }

  const formatJson = (obj: any): string => JSON.stringify(obj, null, 2)

  const getFieldDescription = (key: string): string => FIELD_DESCRIPTIONS[key] || ''

  const isTimestampField = (key: string): boolean => ['exp', 'nbf', 'iat'].includes(key)

  // Help modal
  const showHelpModal = ref(false)

  // Watch family change to reset algo
  watch(selectedFamily, (family) => {
    const algos = ALGO_FAMILIES.find(f => f.value === family)?.algos || []
    if (!algos.includes(selectedAlgo.value)) {
      selectedAlgo.value = algos[0]
    }
    showKeyPairPanel.value = false
  })

  return {
    // Constants
    ALGO_FAMILIES,
    ALGORITHMS,
    QUICK_CLAIMS,
    JWT_HELP_SECTIONS,
    // State
    currentMode,
    copiedField,
    showHelpModal,
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
    parseJwt, verifySignature,
    generateJwt, generateKeyPair, generateHmacSecret,
    addClaimToPayload, addCurrentTimestamp, addExpiry,
    copyText, paste, clearDecode, loadExample, clearGenerate,
  }
}
