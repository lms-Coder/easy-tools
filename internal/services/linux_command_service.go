package services

import (
	"encoding/json"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"easy-tools/internal/utils"
)

// CustomCommand 用户自定义命令
type CustomCommand struct {
	Name        string           `json:"name"`
	ShortDesc   string           `json:"shortDesc"`
	Category    string           `json:"category"`
	Syntax      string           `json:"syntax"`
	Description string           `json:"description"`
	Options     []CommandOption  `json:"options"`
	Examples    []CommandExample `json:"examples"`
	Tags        []string         `json:"tags"`
}

type CommandOption struct {
	Flag string `json:"flag"`
	Desc string `json:"desc"`
}

type CommandExample struct {
	Cmd  string `json:"cmd"`
	Desc string `json:"desc"`
}

// LinuxCommandService 管理用户自定义 Linux 命令
type LinuxCommandService struct {
	configPath string
	commands   []CustomCommand
}

func NewLinuxCommandService() *LinuxCommandService {
	service := &LinuxCommandService{}
	service.initConfig()
	return service
}

func (s *LinuxCommandService) initConfig() {
	configDir, err := utils.GetConfigDir()
	if err != nil {
		log.Printf("Failed to get config dir: %v", err)
		return
	}

	s.configPath = filepath.Join(configDir, "linux-commands.json")

	if err := utils.EnsureDir(configDir); err != nil {
		log.Printf("Failed to create config dir: %v", err)
		return
	}

	s.loadConfig()
}

func (s *LinuxCommandService) loadConfig() {
	data, err := os.ReadFile(s.configPath)
	if err != nil {
		s.commands = []CustomCommand{}
		s.saveConfig()
		return
	}

	if err := json.Unmarshal(data, &s.commands); err != nil {
		log.Printf("Failed to parse linux commands config: %v", err)
		s.commands = []CustomCommand{}
	}
}

func (s *LinuxCommandService) saveConfig() error {
	data, err := json.MarshalIndent(s.commands, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.configPath, data, 0644)
}

// GetCustomCommands 获取所有自定义命令
func (s *LinuxCommandService) GetCustomCommands() []CustomCommand {
	return s.commands
}

// AddCustomCommand 添加自定义命令
func (s *LinuxCommandService) AddCustomCommand(cmd CustomCommand) error {
	// 检查重复
	for _, c := range s.commands {
		if c.Name == cmd.Name {
			return os.ErrExist
		}
	}
	s.commands = append(s.commands, cmd)
	return s.saveConfig()
}

// RemoveCustomCommand 删除自定义命令
func (s *LinuxCommandService) RemoveCustomCommand(name string) error {
	for i, c := range s.commands {
		if c.Name == name {
			s.commands = append(s.commands[:i], s.commands[i+1:]...)
			return s.saveConfig()
		}
	}
	return os.ErrNotExist
}

// UpdateCustomCommand 更新自定义命令
func (s *LinuxCommandService) UpdateCustomCommand(name string, cmd CustomCommand) error {
	for i, c := range s.commands {
		if c.Name == name {
			s.commands[i] = cmd
			return s.saveConfig()
		}
	}
	return os.ErrNotExist
}

// ImportCommands 批量导入命令（跳过已存在的）
func (s *LinuxCommandService) ImportCommands(commands []CustomCommand) (int, int) {
	existing := make(map[string]bool)
	for _, c := range s.commands {
		existing[c.Name] = true
	}

	added := 0
	skipped := 0
	for _, cmd := range commands {
		if existing[cmd.Name] {
			skipped++
			continue
		}
		s.commands = append(s.commands, cmd)
		existing[cmd.Name] = true
		added++
	}

	if added > 0 {
		_ = s.saveConfig()
	}
	return added, skipped
}

// GetConfigPath 返回配置文件路径
func (s *LinuxCommandService) GetConfigPath() string {
	return s.configPath
}

// OpenConfigFile 用系统文件管理器打开配置文件所在目录
func (s *LinuxCommandService) OpenConfigFile() error {
	dir := filepath.Dir(s.configPath)
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("explorer", dir)
	case "darwin":
		cmd = exec.Command("open", dir)
	default:
		cmd = exec.Command("xdg-open", dir)
	}
	return cmd.Start()
}
