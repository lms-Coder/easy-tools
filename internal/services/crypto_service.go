package services

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/des"
	"crypto/hmac"
	"crypto/md5"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/sha512"
	"crypto/x509"
	"encoding/base64"
	"encoding/hex"
	"encoding/pem"
	"errors"
	"fmt"
	"hash"
	"io"

	"golang.org/x/crypto/chacha20poly1305"
)

// CryptoService 加密解密服务
type CryptoService struct{}

// NewCryptoService 创建加密解密服务
func NewCryptoService() *CryptoService {
	return &CryptoService{}
}

// CryptoResult 加密解密结果
type CryptoResult struct {
	Success bool   `json:"success"`
	Data    string `json:"data"`
	Error   string `json:"error,omitempty"`
}

// KeyPairResult 密钥对结果
type KeyPairResult struct {
	Success    bool   `json:"success"`
	PublicKey  string `json:"publicKey"`
	PrivateKey string `json:"privateKey"`
	Error      string `json:"error,omitempty"`
}

// CryptoHashResult 哈希结果
type CryptoHashResult struct {
	Success bool   `json:"success"`
	MD5     string `json:"md5,omitempty"`
	SHA1    string `json:"sha1,omitempty"`
	SHA256  string `json:"sha256,omitempty"`
	SHA512  string `json:"sha512,omitempty"`
	HMAC    string `json:"hmac,omitempty"`
	Error   string `json:"error,omitempty"`
}

// ====== AES ======

// AesEncrypt AES 加密（支持 CBC/ECB/CFB/OFB/CTR/GCM 模式）
func (s *CryptoService) AesEncrypt(plaintext, key, iv, mode string) CryptoResult {
	block, err := aes.NewCipher([]byte(key))
	if err != nil {
		return CryptoResult{Success: false, Error: fmt.Sprintf("密钥无效: %v", err)}
	}

	data := []byte(plaintext)
	var ciphertext []byte

	switch mode {
	case "ecb":
		padded := pkcs5Padding(data, block.BlockSize())
		ciphertext = make([]byte, len(padded))
		for i := 0; i < len(padded); i += block.BlockSize() {
			block.Encrypt(ciphertext[i:i+block.BlockSize()], padded[i:i+block.BlockSize()])
		}

	case "cbc":
		padded := pkcs5Padding(data, block.BlockSize())
		ivBytes := ensureIV(iv, aes.BlockSize)
		ciphertext = make([]byte, len(padded))
		copy(ciphertext, padded)
		cipher.NewCBCEncrypter(block, ivBytes).CryptBlocks(ciphertext, ciphertext)
		result := make([]byte, aes.BlockSize+len(ciphertext))
		copy(result[:aes.BlockSize], ivBytes)
		copy(result[aes.BlockSize:], ciphertext)
		ciphertext = result

	case "cfb":
		ivBytes := ensureIV(iv, aes.BlockSize)
		ciphertext = make([]byte, len(data))
		cipher.NewCFBEncrypter(block, ivBytes).XORKeyStream(ciphertext, data)
		result := make([]byte, aes.BlockSize+len(ciphertext))
		copy(result[:aes.BlockSize], ivBytes)
		copy(result[aes.BlockSize:], ciphertext)
		ciphertext = result

	case "ofb":
		ivBytes := ensureIV(iv, aes.BlockSize)
		ciphertext = make([]byte, len(data))
		cipher.NewOFB(block, ivBytes).XORKeyStream(ciphertext, data)
		result := make([]byte, aes.BlockSize+len(ciphertext))
		copy(result[:aes.BlockSize], ivBytes)
		copy(result[aes.BlockSize:], ciphertext)
		ciphertext = result

	case "ctr":
		ivBytes := ensureIV(iv, aes.BlockSize)
		ciphertext = make([]byte, len(data))
		cipher.NewCTR(block, ivBytes).XORKeyStream(ciphertext, data)
		result := make([]byte, aes.BlockSize+len(ciphertext))
		copy(result[:aes.BlockSize], ivBytes)
		copy(result[aes.BlockSize:], ciphertext)
		ciphertext = result

	case "gcm":
		aead, err := cipher.NewGCM(block)
		if err != nil {
			return CryptoResult{Success: false, Error: fmt.Sprintf("GCM 初始化失败: %v", err)}
		}
		nonce := make([]byte, aead.NonceSize())
		if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
			return CryptoResult{Success: false, Error: "生成随机 nonce 失败"}
		}
		sealed := aead.Seal(nil, nonce, data, nil)
		ciphertext = make([]byte, len(nonce)+len(sealed))
		copy(ciphertext[:len(nonce)], nonce)
		copy(ciphertext[len(nonce):], sealed)

	default:
		return CryptoResult{Success: false, Error: fmt.Sprintf("不支持的模式: %s", mode)}
	}

	return CryptoResult{Success: true, Data: base64.StdEncoding.EncodeToString(ciphertext)}
}

// AesDecrypt AES 解密
func (s *CryptoService) AesDecrypt(ciphertext, key, iv, mode string) CryptoResult {
	block, err := aes.NewCipher([]byte(key))
	if err != nil {
		return CryptoResult{Success: false, Error: fmt.Sprintf("密钥无效: %v", err)}
	}

	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return CryptoResult{Success: false, Error: "密文不是有效的 Base64 格式"}
	}

	var plaintext []byte

	switch mode {
	case "ecb":
		if len(data)%block.BlockSize() != 0 {
			return CryptoResult{Success: false, Error: "密文长度不正确"}
		}
		for i := 0; i < len(data); i += block.BlockSize() {
			block.Decrypt(data[i:i+block.BlockSize()], data[i:i+block.BlockSize()])
		}
		plaintext, err = pkcs5UnPadding(data)
		if err != nil {
			return CryptoResult{Success: false, Error: "解密失败，密钥或密文可能不正确"}
		}

	case "cbc":
		ivBytes, body := extractIV(iv, data, aes.BlockSize)
		if len(body)%block.BlockSize() != 0 {
			return CryptoResult{Success: false, Error: "密文长度不正确"}
		}
		cipher.NewCBCDecrypter(block, ivBytes).CryptBlocks(body, body)
		plaintext, err = pkcs5UnPadding(body)
		if err != nil {
			return CryptoResult{Success: false, Error: "解密失败，密钥或密文可能不正确"}
		}

	case "cfb":
		ivBytes, body := extractIV(iv, data, aes.BlockSize)
		plaintext = make([]byte, len(body))
		cipher.NewCFBDecrypter(block, ivBytes).XORKeyStream(plaintext, body)

	case "ofb":
		ivBytes, body := extractIV(iv, data, aes.BlockSize)
		plaintext = make([]byte, len(body))
		cipher.NewOFB(block, ivBytes).XORKeyStream(plaintext, body)

	case "ctr":
		ivBytes, body := extractIV(iv, data, aes.BlockSize)
		plaintext = make([]byte, len(body))
		cipher.NewCTR(block, ivBytes).XORKeyStream(plaintext, body)

	case "gcm":
		aead, err2 := cipher.NewGCM(block)
		if err2 != nil {
			return CryptoResult{Success: false, Error: fmt.Sprintf("GCM 初始化失败: %v", err2)}
		}
		nonceSize := aead.NonceSize()
		if len(data) < nonceSize+aead.Overhead() {
			return CryptoResult{Success: false, Error: "密文长度不足"}
		}
		plaintext, err = aead.Open(nil, data[:nonceSize], data[nonceSize:], nil)
		if err != nil {
			return CryptoResult{Success: false, Error: "GCM 解密失败，密钥或密文可能不正确"}
		}

	default:
		return CryptoResult{Success: false, Error: fmt.Sprintf("不支持的模式: %s", mode)}
	}

	return CryptoResult{Success: true, Data: string(plaintext)}
}

// ====== DES / 3DES ======

// DesEncrypt DES/3DES 加密
func (s *CryptoService) DesEncrypt(plaintext, key, iv, mode, algo string) CryptoResult {
	var block cipher.Block
	var err error

	switch algo {
	case "3des":
		block, err = des.NewTripleDESCipher([]byte(key))
	default:
		block, err = des.NewCipher([]byte(key))
	}
	if err != nil {
		return CryptoResult{Success: false, Error: fmt.Sprintf("密钥无效: %v", err)}
	}

	data := pkcs5Padding([]byte(plaintext), block.BlockSize())
	var ciphertext []byte
	bs := block.BlockSize()

	switch mode {
	case "ecb":
		ciphertext = make([]byte, len(data))
		for i := 0; i < len(data); i += bs {
			block.Encrypt(ciphertext[i:i+bs], data[i:i+bs])
		}
	default:
		ivBytes := ensureIV(iv, bs)
		ciphertext = make([]byte, len(data))
		copy(ciphertext, data)
		cipher.NewCBCEncrypter(block, ivBytes).CryptBlocks(ciphertext, ciphertext)
		result := make([]byte, bs+len(ciphertext))
		copy(result[:bs], ivBytes)
		copy(result[bs:], ciphertext)
		ciphertext = result
	}

	return CryptoResult{Success: true, Data: base64.StdEncoding.EncodeToString(ciphertext)}
}

// DesDecrypt DES/3DES 解密
func (s *CryptoService) DesDecrypt(ciphertext, key, iv, mode, algo string) CryptoResult {
	var block cipher.Block
	var err error

	switch algo {
	case "3des":
		block, err = des.NewTripleDESCipher([]byte(key))
	default:
		block, err = des.NewCipher([]byte(key))
	}
	if err != nil {
		return CryptoResult{Success: false, Error: fmt.Sprintf("密钥无效: %v", err)}
	}

	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return CryptoResult{Success: false, Error: "密文不是有效的 Base64 格式"}
	}

	bs := block.BlockSize()

	switch mode {
	case "ecb":
		if len(data)%bs != 0 {
			return CryptoResult{Success: false, Error: "密文长度不正确"}
		}
		for i := 0; i < len(data); i += bs {
			block.Decrypt(data[i:i+bs], data[i:i+bs])
		}
		plaintext, err := pkcs5UnPadding(data)
		if err != nil {
			return CryptoResult{Success: false, Error: "解密失败"}
		}
		return CryptoResult{Success: true, Data: string(plaintext)}
	default:
		ivBytes, body := extractIV(iv, data, bs)
		if len(body)%bs != 0 {
			return CryptoResult{Success: false, Error: "密文长度不正确"}
		}
		cipher.NewCBCDecrypter(block, ivBytes).CryptBlocks(body, body)
		plaintext, err := pkcs5UnPadding(body)
		if err != nil {
			return CryptoResult{Success: false, Error: "解密失败"}
		}
		return CryptoResult{Success: true, Data: string(plaintext)}
	}
}

// ====== RSA ======

// RsaGenerateKeyPair 生成 RSA 密钥对
func (s *CryptoService) RsaGenerateKeyPair(bits int) KeyPairResult {
	privateKey, err := rsa.GenerateKey(rand.Reader, bits)
	if err != nil {
		return KeyPairResult{Success: false, Error: fmt.Sprintf("生成密钥对失败: %v", err)}
	}

	privBytes := x509.MarshalPKCS1PrivateKey(privateKey)
	privPEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: privBytes})

	pubBytes, err := x509.MarshalPKIXPublicKey(&privateKey.PublicKey)
	if err != nil {
		return KeyPairResult{Success: false, Error: fmt.Sprintf("编码公钥失败: %v", err)}
	}
	pubPEM := pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: pubBytes})

	return KeyPairResult{
		Success:    true,
		PrivateKey: string(privPEM),
		PublicKey:  string(pubPEM),
	}
}

// RsaEncrypt RSA 加密
func (s *CryptoService) RsaEncrypt(plaintext, publicKey string) CryptoResult {
	pub, err := parsePublicKey(publicKey)
	if err != nil {
		return CryptoResult{Success: false, Error: fmt.Sprintf("公钥无效: %v", err)}
	}
	ciphertext, err := rsa.EncryptPKCS1v15(rand.Reader, pub, []byte(plaintext))
	if err != nil {
		return CryptoResult{Success: false, Error: fmt.Sprintf("加密失败: %v", err)}
	}
	return CryptoResult{Success: true, Data: base64.StdEncoding.EncodeToString(ciphertext)}
}

// RsaDecrypt RSA 解密
func (s *CryptoService) RsaDecrypt(ciphertext, privateKey string) CryptoResult {
	priv, err := parsePrivateKey(privateKey)
	if err != nil {
		return CryptoResult{Success: false, Error: fmt.Sprintf("私钥无效: %v", err)}
	}
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return CryptoResult{Success: false, Error: "密文不是有效的 Base64 格式"}
	}
	plaintext, err := rsa.DecryptPKCS1v15(rand.Reader, priv, data)
	if err != nil {
		return CryptoResult{Success: false, Error: "解密失败，密钥或密文可能不正确"}
	}
	return CryptoResult{Success: true, Data: string(plaintext)}
}

// ====== ChaCha20-Poly1305 ======

// Chacha20Encrypt ChaCha20-Poly1305 加密
func (s *CryptoService) Chacha20Encrypt(plaintext, key string) CryptoResult {
	aead, err := chacha20poly1305.NewX([]byte(key))
	if err != nil {
		return CryptoResult{Success: false, Error: fmt.Sprintf("密钥无效（需32字节）: %v", err)}
	}
	nonce := make([]byte, aead.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return CryptoResult{Success: false, Error: "生成随机 nonce 失败"}
	}
	sealed := aead.Seal(nil, nonce, []byte(plaintext), nil)
	result := make([]byte, len(nonce)+len(sealed))
	copy(result[:len(nonce)], nonce)
	copy(result[len(nonce):], sealed)
	return CryptoResult{Success: true, Data: base64.StdEncoding.EncodeToString(result)}
}

// Chacha20Decrypt ChaCha20-Poly1305 解密
func (s *CryptoService) Chacha20Decrypt(ciphertext, key string) CryptoResult {
	aead, err := chacha20poly1305.NewX([]byte(key))
	if err != nil {
		return CryptoResult{Success: false, Error: fmt.Sprintf("密钥无效（需32字节）: %v", err)}
	}
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return CryptoResult{Success: false, Error: "密文不是有效的 Base64 格式"}
	}
	nonceSize := aead.NonceSize()
	if len(data) < nonceSize+aead.Overhead() {
		return CryptoResult{Success: false, Error: "密文长度不足"}
	}
	plaintext, err := aead.Open(nil, data[:nonceSize], data[nonceSize:], nil)
	if err != nil {
		return CryptoResult{Success: false, Error: "解密失败，密钥或密文可能不正确"}
	}
	return CryptoResult{Success: true, Data: string(plaintext)}
}

// ====== 哈希计算 ======

// HashCalculate 计算文本的多种哈希值
func (s *CryptoService) HashCalculate(text, hmacKey string) CryptoHashResult {
	if text == "" {
		return CryptoHashResult{Success: false, Error: "输入不能为空"}
	}
	result := CryptoHashResult{Success: true}
	result.MD5 = computeHash(md5.New(), text)
	result.SHA1 = computeHash(sha1.New(), text)
	result.SHA256 = computeHash(sha256.New(), text)
	result.SHA512 = computeHash(sha512.New(), text)
	if hmacKey != "" {
		mac := hmac.New(sha256.New, []byte(hmacKey))
		mac.Write([]byte(text))
		result.HMAC = hex.EncodeToString(mac.Sum(nil))
	}
	return result
}

// ====== Base64 ======

// Base64Encode Base64 编码
func (s *CryptoService) Base64Encode(text string) CryptoResult {
	return CryptoResult{Success: true, Data: base64.StdEncoding.EncodeToString([]byte(text))}
}

// Base64Decode Base64 解码
func (s *CryptoService) Base64Decode(text string) CryptoResult {
	data, err := base64.StdEncoding.DecodeString(text)
	if err != nil {
		return CryptoResult{Success: false, Error: fmt.Sprintf("Base64 解码失败: %v", err)}
	}
	return CryptoResult{Success: true, Data: string(data)}
}

// Base64UrlEncode URL-safe Base64 编码
func (s *CryptoService) Base64UrlEncode(text string) CryptoResult {
	return CryptoResult{Success: true, Data: base64.URLEncoding.EncodeToString([]byte(text))}
}

// Base64UrlDecode URL-safe Base64 解码
func (s *CryptoService) Base64UrlDecode(text string) CryptoResult {
	data, err := base64.URLEncoding.DecodeString(text)
	if err != nil {
		return CryptoResult{Success: false, Error: fmt.Sprintf("Base64 URL 解码失败: %v", err)}
	}
	return CryptoResult{Success: true, Data: string(data)}
}

// ====== 密钥生成 ======

// GenerateAesKey 生成指定长度的 AES 密钥（hex 编码）
func (s *CryptoService) GenerateAesKey(bits int) CryptoResult {
	key := make([]byte, bits/8)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		return CryptoResult{Success: false, Error: "生成密钥失败"}
	}
	return CryptoResult{Success: true, Data: hex.EncodeToString(key)}
}

// GenerateDesKey 生成 DES/3DES 密钥（hex 编码）
func (s *CryptoService) GenerateDesKey(algo string) CryptoResult {
	size := 8
	if algo == "3des" {
		size = 24
	}
	key := make([]byte, size)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		return CryptoResult{Success: false, Error: "生成密钥失败"}
	}
	return CryptoResult{Success: true, Data: hex.EncodeToString(key)}
}

// GenerateChacha20Key 生成 ChaCha20 密钥（hex 编码，32字节）
func (s *CryptoService) GenerateChacha20Key() CryptoResult {
	key := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		return CryptoResult{Success: false, Error: "生成密钥失败"}
	}
	return CryptoResult{Success: true, Data: hex.EncodeToString(key)}
}

// ====== 内部辅助 ======

func pkcs5Padding(data []byte, blockSize int) []byte {
	padding := blockSize - len(data)%blockSize
	padText := make([]byte, padding)
	for i := range padText {
		padText[i] = byte(padding)
	}
	return append(data, padText...)
}

func pkcs5UnPadding(data []byte) ([]byte, error) {
	if len(data) == 0 {
		return nil, errors.New("数据为空")
	}
	padding := int(data[len(data)-1])
	if padding == 0 || padding > len(data) {
		return nil, errors.New("padding 错误")
	}
	for i := len(data) - padding; i < len(data); i++ {
		if data[i] != byte(padding) {
			return nil, errors.New("padding 错误")
		}
	}
	return data[:len(data)-padding], nil
}

func ensureIV(iv string, blockSize int) []byte {
	if iv != "" {
		if len(iv) >= blockSize {
			return []byte(iv[:blockSize])
		}
		b := make([]byte, blockSize)
		copy(b, []byte(iv))
		return b
	}
	ivBytes := make([]byte, blockSize)
	io.ReadFull(rand.Reader, ivBytes)
	return ivBytes
}

func extractIV(iv string, data []byte, blockSize int) ([]byte, []byte) {
	if iv != "" {
		if len(iv) >= blockSize {
			return []byte(iv[:blockSize]), data
		}
		b := make([]byte, blockSize)
		copy(b, []byte(iv))
		return b, data
	}
	if len(data) < blockSize {
		return nil, nil
	}
	return data[:blockSize], data[blockSize:]
}

func computeHash(h hash.Hash, text string) string {
	h.Reset()
	h.Write([]byte(text))
	return hex.EncodeToString(h.Sum(nil))
}

func parsePublicKey(pubKeyStr string) (*rsa.PublicKey, error) {
	block, _ := pem.Decode([]byte(pubKeyStr))
	if block == nil {
		return nil, errors.New("无法解析 PEM 格式公钥")
	}
	if pub, err := x509.ParsePKIXPublicKey(block.Bytes); err == nil {
		if rsaPub, ok := pub.(*rsa.PublicKey); ok {
			return rsaPub, nil
		}
		return nil, errors.New("不是 RSA 公钥")
	}
	if rsaPub, err := x509.ParsePKCS1PublicKey(block.Bytes); err == nil {
		return rsaPub, nil
	}
	return nil, errors.New("无法解析公钥")
}

func parsePrivateKey(privKeyStr string) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode([]byte(privKeyStr))
	if block == nil {
		return nil, errors.New("无法解析 PEM 格式私钥")
	}
	if priv, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return priv, nil
	}
	if key, err := x509.ParsePKCS8PrivateKey(block.Bytes); err == nil {
		if rsaPriv, ok := key.(*rsa.PrivateKey); ok {
			return rsaPriv, nil
		}
		return nil, errors.New("不是 RSA 私钥")
	}
	return nil, errors.New("无法解析私钥")
}
