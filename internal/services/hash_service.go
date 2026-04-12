package services

import (
	"crypto/md5"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/hex"
)

// HashService 哈希计算服务
type HashService struct{}

// NewHashService 创建哈希服务
func NewHashService() *HashService {
	return &HashService{}
}

// HashResult 哈希结果
type HashResult struct {
	Hash string `json:"hash"`
}

// CalculateMD5 计算MD5哈希
func (s *HashService) CalculateMD5(text string) HashResult {
	hash := md5.Sum([]byte(text))
	return HashResult{Hash: hex.EncodeToString(hash[:])}
}

// CalculateSHA1 计算SHA1哈希
func (s *HashService) CalculateSHA1(text string) HashResult {
	hash := sha1.Sum([]byte(text))
	return HashResult{Hash: hex.EncodeToString(hash[:])}
}

// CalculateSHA256 计算SHA256哈希
func (s *HashService) CalculateSHA256(text string) HashResult {
	hash := sha256.Sum256([]byte(text))
	return HashResult{Hash: hex.EncodeToString(hash[:])}
}

// CalculateSHA512 计算SHA512哈希
func (s *HashService) CalculateSHA512(text string) HashResult {
	hash := sha512.Sum512([]byte(text))
	return HashResult{Hash: hex.EncodeToString(hash[:])}
}

// CalculateSHA224 计算SHA224哈希
func (s *HashService) CalculateSHA224(text string) HashResult {
	hash := sha256.Sum224([]byte(text))
	return HashResult{Hash: hex.EncodeToString(hash[:])}
}

// CalculateSHA384 计算SHA384哈希
func (s *HashService) CalculateSHA384(text string) HashResult {
	hash := sha512.Sum384([]byte(text))
	return HashResult{Hash: hex.EncodeToString(hash[:])}
}

// CalculateAll 计算所有哈希
func (s *HashService) CalculateAll(text string) map[string]string {
	results := make(map[string]string)

	md5Hash := md5.Sum([]byte(text))
	results["md5"] = hex.EncodeToString(md5Hash[:])

	sha1Hash := sha1.Sum([]byte(text))
	results["sha1"] = hex.EncodeToString(sha1Hash[:])

	sha224Hash := sha256.Sum224([]byte(text))
	results["sha224"] = hex.EncodeToString(sha224Hash[:])

	sha256Hash := sha256.Sum256([]byte(text))
	results["sha256"] = hex.EncodeToString(sha256Hash[:])

	sha384Hash := sha512.Sum384([]byte(text))
	results["sha384"] = hex.EncodeToString(sha384Hash[:])

	sha512Hash := sha512.Sum512([]byte(text))
	results["sha512"] = hex.EncodeToString(sha512Hash[:])

	return results
}
