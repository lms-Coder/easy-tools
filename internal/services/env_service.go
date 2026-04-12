package services

import (
	"os"
	"sort"
	"strings"

	"golang.org/x/sys/windows/registry"
)

// EnvVar 环境变量
type EnvVar struct {
	Name  string `json:"name"`
	Value string `json:"value"`
	Scope string `json:"scope"` // "system" | "user"
}

// EnvService 环境变量服务
type EnvService struct{}

// NewEnvService 创建环境变量服务
func NewEnvService() *EnvService {
	return &EnvService{}
}

// GetSystemEnvVars 读取系统级环境变量（HKLM）
func (s *EnvService) GetSystemEnvVars() ([]EnvVar, error) {
	return s.readRegistryVars(registry.LOCAL_MACHINE, `SYSTEM\CurrentControlSet\Control\Session Manager\Environment`, "system")
}

// GetUserEnvVars 读取用户级环境变量（HKCU）
func (s *EnvService) GetUserEnvVars() ([]EnvVar, error) {
	return s.readRegistryVars(registry.CURRENT_USER, `Environment`, "user")
}

// GetAllEnvVars 读取所有环境变量（合并系统+用户+进程）
func (s *EnvService) GetAllEnvVars() ([]EnvVar, error) {
	// Build lookup maps for system and user vars
	systemMap := make(map[string]string)
	userMap := make(map[string]string)

	sysVars, _ := s.GetSystemEnvVars()
	for _, v := range sysVars {
		systemMap[strings.ToUpper(v.Name)] = v.Scope
	}

	usrVars, _ := s.GetUserEnvVars()
	for _, v := range usrVars {
		userMap[strings.ToUpper(v.Name)] = v.Scope
	}

	// Read all env vars from current process
	envVars := os.Environ()
	result := make([]EnvVar, 0, len(envVars))

	for _, entry := range envVars {
		idx := strings.Index(entry, "=")
		if idx < 0 {
			continue
		}
		name := entry[:idx]
		value := entry[idx+1:]
		upperName := strings.ToUpper(name)

		scope := "other"
		if _, ok := systemMap[upperName]; ok {
			scope = "system"
		} else if _, ok := userMap[upperName]; ok {
			scope = "user"
		}

		result = append(result, EnvVar{
			Name:  name,
			Value: value,
			Scope: scope,
		})
	}

	sort.Slice(result, func(i, j int) bool {
		return strings.ToUpper(result[i].Name) < strings.ToUpper(result[j].Name)
	})

	return result, nil
}

// readRegistryVars 从注册表读取环境变量
func (s *EnvService) readRegistryVars(key registry.Key, subkey string, scope string) ([]EnvVar, error) {
	k, err := registry.OpenKey(key, subkey, registry.QUERY_VALUE)
	if err != nil {
		return nil, err
	}
	defer k.Close()

	names, err := k.ReadValueNames(0)
	if err != nil {
		return nil, err
	}

	result := make([]EnvVar, 0, len(names))
	for _, name := range names {
		val, _, err := k.GetStringValue(name)
		if err != nil {
			// Try expanding if REG_EXPAND_SZ
			val, _, err = k.GetStringValue(name)
			if err != nil {
				continue
			}
		}
		// Expand environment variables in the value (e.g., %SystemRoot%)
		expanded := os.ExpandEnv(val)
		result = append(result, EnvVar{
			Name:  name,
			Value: expanded,
			Scope: scope,
		})
	}

	sort.Slice(result, func(i, j int) bool {
		return strings.ToUpper(result[i].Name) < strings.ToUpper(result[j].Name)
	})

	return result, nil
}
