package services

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"

	"easy-tools/internal/utils"
)

var jdkWindowsHideCmdAttr = &syscall.SysProcAttr{
	HideWindow:    true,
	CreationFlags: 0x08000000,
}

type JDKConfig struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

type JDKService struct {
	configPath  string
	linkPath    string
	jdkVersions []JDKConfig
}

func NewJDKService() *JDKService {
	service := &JDKService{}
	service.initConfig()
	return service
}

func (s *JDKService) initConfig() {
	configDir, err := utils.GetConfigDir()
	if err != nil {
		log.Printf("Failed to get config dir: %v", err)
		return
	}

	s.configPath = filepath.Join(configDir, "jdk-config.json")
	s.linkPath = os.Getenv("JAVA_HOME")

	if err := utils.EnsureDir(configDir); err != nil {
		log.Printf("Failed to create config dir: %v", err)
		return
	}

	s.loadConfig()
}

func (s *JDKService) loadConfig() {
	data, err := os.ReadFile(s.configPath)
	if err != nil {
		s.jdkVersions = []JDKConfig{}
		s.saveConfig()
		return
	}

	var config struct {
		LinkPath    string      `json:"linkPath"`
		JDKVersions []JDKConfig `json:"jdkVersions"`
	}

	if err := json.Unmarshal(data, &config); err != nil {
		s.jdkVersions = []JDKConfig{}
		s.saveConfig()
		return
	}

	s.jdkVersions = config.JDKVersions
	if config.LinkPath != "" {
		s.linkPath = config.LinkPath
	}
}

func (s *JDKService) saveConfig() error {
	config := struct {
		LinkPath    string      `json:"linkPath"`
		JDKVersions []JDKConfig `json:"jdkVersions"`
	}{
		LinkPath:    s.linkPath,
		JDKVersions: s.jdkVersions,
	}

	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(s.configPath, data, 0644)
}

func (s *JDKService) GetJDKVersions() []JDKConfig {
	return s.jdkVersions
}

func (s *JDKService) GetCurrentJDK() *JDKConfig {
	linkInfo, err := os.Lstat(s.linkPath)
	if err != nil {
		return nil
	}

	if linkInfo.Mode()&os.ModeSymlink == 0 {
		return nil
	}

	target, err := os.Readlink(s.linkPath)
	if err != nil {
		return nil
	}

	for _, jdk := range s.jdkVersions {
		if strings.EqualFold(jdk.Path, target) {
			return &jdk
		}
	}

	return &JDKConfig{
		Name: "Unknown",
		Path: target,
	}
}

func (s *JDKService) GetLinkPath() string {
	return s.linkPath
}

// removeSymlink 尝试移除旧的符号链接
func (s *JDKService) removeSymlink() {
	if _, err := os.Lstat(s.linkPath); err != nil {
		return
	}
	// 先尝试普通删除
	if err := os.Remove(s.linkPath); err == nil {
		return
	}
	// 普通删除失败，用 cmd rmdir
	cmd := exec.Command("cmd", "/c", "rmdir", s.linkPath)
	cmd.SysProcAttr = jdkWindowsHideCmdAttr
	_ = cmd.Run()
}

// runElevatedMklink 通过提权 PowerShell 执行 mklink
func (s *JDKService) runElevatedMklink(linkPath, targetPath string) error {
	// 用 PowerShell 脚本提权执行，-WindowStyle Hidden 隐藏弹出的 cmd 窗口
	psScript := fmt.Sprintf(
		`Start-Process cmd -ArgumentList '/c','rmdir','%s' -Verb RunAs -WindowStyle Hidden -Wait; Start-Process cmd -ArgumentList '/c','mklink','/D','%s','%s' -Verb RunAs -WindowStyle Hidden -Wait`,
		linkPath, linkPath, targetPath,
	)
	cmd := exec.Command("powershell", "-WindowStyle", "Hidden", "-Command", psScript)
	cmd.SysProcAttr = jdkWindowsHideCmdAttr
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("提权创建符号链接失败: %v, output: %s", err, string(output))
	}
	return nil
}

func (s *JDKService) SwitchJDK(index int) error {
	if index < 0 || index >= len(s.jdkVersions) {
		return fmt.Errorf("invalid JDK index: %d", index)
	}

	jdk := s.jdkVersions[index]

	if _, err := os.Stat(jdk.Path); os.IsNotExist(err) {
		return fmt.Errorf("JDK path does not exist: %s", jdk.Path)
	}

	// 确保父目录存在
	parentDir := filepath.Dir(s.linkPath)
	if err := os.MkdirAll(parentDir, 0755); err != nil {
		return fmt.Errorf("failed to create parent directory: %v", err)
	}

	// 移除旧符号链接
	s.removeSymlink()

	// 先尝试普通权限创建符号链接
	cmd := exec.Command("cmd", "/c", "mklink", "/D", s.linkPath, jdk.Path)
	cmd.SysProcAttr = jdkWindowsHideCmdAttr
	_, err := cmd.CombinedOutput()
	if err == nil {
		log.Printf("JDK switched to: %s -> %s", jdk.Name, jdk.Path)
		return nil
	}

	// 普通权限失败，自动尝试提权
	if err := s.runElevatedMklink(s.linkPath, jdk.Path); err != nil {
		return fmt.Errorf("创建符号链接失败（已尝试提权）: %v", err)
	}

	log.Printf("JDK switched (elevated) to: %s -> %s", jdk.Name, jdk.Path)
	return nil
}

func (s *JDKService) AddJDK(name, path string) error {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return fmt.Errorf("JDK path does not exist: %s", path)
	}

	for _, jdk := range s.jdkVersions {
		if strings.EqualFold(jdk.Path, path) {
			return fmt.Errorf("JDK path already exists: %s", path)
		}
	}

	s.jdkVersions = append(s.jdkVersions, JDKConfig{
		Name: name,
		Path: path,
	})

	return s.saveConfig()
}

func (s *JDKService) RemoveJDK(index int) error {
	if index < 0 || index >= len(s.jdkVersions) {
		return fmt.Errorf("invalid JDK index: %d", index)
	}

	s.jdkVersions = append(s.jdkVersions[:index], s.jdkVersions[index+1:]...)
	return s.saveConfig()
}

func (s *JDKService) UpdateJDK(index int, name, path string) error {
	if index < 0 || index >= len(s.jdkVersions) {
		return fmt.Errorf("invalid JDK index: %d", index)
	}

	s.jdkVersions[index] = JDKConfig{
		Name: name,
		Path: path,
	}

	return s.saveConfig()
}

func (s *JDKService) SetLinkPath(path string) error {
	s.linkPath = path
	return s.saveConfig()
}

func (s *JDKService) CheckJDKPath(path string) (bool, string) {
	info, err := os.Stat(path)
	if err != nil {
		return false, fmt.Sprintf("路径不存在: %s", path)
	}

	if !info.IsDir() {
		return false, "路径不是目录"
	}

	javaExe := filepath.Join(path, "bin", "java.exe")
	if _, err := os.Stat(javaExe); os.IsNotExist(err) {
		javaExe = filepath.Join(path, "bin", "java")
		if _, err := os.Stat(javaExe); os.IsNotExist(err) {
			return false, "路径不是有效的 JDK 目录（缺少 java 可执行文件）"
		}
	}

	return true, "有效的 JDK 目录"
}

func (s *JDKService) GetJDKVersion(jdkPath string) string {
	javaExe := filepath.Join(jdkPath, "bin", "java.exe")
	if _, err := os.Stat(javaExe); os.IsNotExist(err) {
		javaExe = filepath.Join(jdkPath, "bin", "java")
	}

	cmd := exec.Command(javaExe, "-version")
	cmd.SysProcAttr = jdkWindowsHideCmdAttr
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "Unknown"
	}

	lines := strings.Split(string(output), "\n")
	if len(lines) > 0 {
		versionLine := lines[0]
		if strings.Contains(versionLine, "version") {
			parts := strings.Split(versionLine, "\"")
			if len(parts) >= 2 {
				return parts[1]
			}
		}
		return strings.TrimSpace(versionLine)
	}

	return "Unknown"
}
