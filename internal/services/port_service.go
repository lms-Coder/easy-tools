package services

import (
	"fmt"
	"log"
	"os/exec"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"syscall"
)

// windowsHideCmdAttr Windows 下隐藏命令行窗口的属性
var windowsHideCmdAttr = &syscall.SysProcAttr{
	HideWindow:    true,
	CreationFlags: 0x08000000, // CREATE_NO_WINDOW
}

// PortInfo 端口占用信息
type PortInfo struct {
	Port     int    `json:"port"`
	Protocol string `json:"protocol"`
	PID      int    `json:"pid"`
	Process  string `json:"process"`
	State    string `json:"state"`
}

// PortService 端口管理服务
type PortService struct {
	app any
}

// NewPortService 创建端口管理服务
func NewPortService(app any) *PortService {
	return &PortService{app: app}
}

// LookupPort 查询端口占用情况
func (s *PortService) LookupPort(port int) ([]PortInfo, error) {
	if runtime.GOOS == "windows" {
		return s.lookupPortWindows(port)
	}
	return s.lookupPortUnix(port)
}

// lookupPortWindows Windows 系统查询端口
func (s *PortService) lookupPortWindows(port int) ([]PortInfo, error) {
	cmd := exec.Command("netstat", "-ano")
	cmd.SysProcAttr = windowsHideCmdAttr
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("netstat command failed: %v", err)
		return []PortInfo{}, nil
	}

	pidProcessMap := s.getAllProcessNames()
	return s.parseWindowsNetstat(string(output), port, pidProcessMap)
}

// getAllProcessNames 获取所有进程名映射
func (s *PortService) getAllProcessNames() map[int]string {
	pidMap := make(map[int]string)

	cmd := exec.Command("tasklist", "/NH", "/FO", "CSV")
	cmd.SysProcAttr = windowsHideCmdAttr
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("tasklist command failed: %v", err)
		return pidMap
	}

	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		parts := strings.Split(line, ",")
		if len(parts) >= 2 {
			name := strings.Trim(parts[0], `"`)
			pidStr := strings.Trim(parts[1], `"`)
			if pid, err := strconv.Atoi(pidStr); err == nil {
				pidMap[pid] = name
			}
		}
	}

	return pidMap
}

// parseWindowsNetstat 解析 Windows netstat 输出
func (s *PortService) parseWindowsNetstat(output string, targetPort int, pidProcessMap map[int]string) ([]PortInfo, error) {
	var results []PortInfo
	lines := strings.Split(output, "\n")

	reTCP := regexp.MustCompile(`^\s*(TCP)\s+[\d\[\]:.]+:(\d+)\s+[\d\[\]:.*]+(?:\s+(\w+)\s+)?(\d+)\s*$`)
	reUDP := regexp.MustCompile(`^\s*(UDP)\s+[\d\[\]:.]+:(\d+)\s+[\d\[\]:.*]+\s+(\d+)\s*$`)

	seen := make(map[string]bool)

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "Active") || strings.HasPrefix(line, "Proto") {
			continue
		}

		var protocol, state string
		var port, pid int
		var matches []string

		matches = reTCP.FindStringSubmatch(line)
		if len(matches) >= 5 {
			protocol = matches[1]
			port, _ = strconv.Atoi(matches[2])
			state = matches[3]
			if state == "" {
				state = "LISTEN"
			}
			pid, _ = strconv.Atoi(matches[4])
		} else {
			matches = reUDP.FindStringSubmatch(line)
			if len(matches) >= 4 {
				protocol = matches[1]
				port, _ = strconv.Atoi(matches[2])
				state = "N/A"
				pid, _ = strconv.Atoi(matches[3])
			}
		}

		if port != targetPort || pid == 0 {
			continue
		}

		key := fmt.Sprintf("%s-%d", protocol, pid)
		if seen[key] {
			continue
		}
		seen[key] = true

		processName := "Unknown"
		if name, ok := pidProcessMap[pid]; ok && name != "" {
			processName = name
		}

		results = append(results, PortInfo{
			Port:     port,
			Protocol: protocol,
			PID:      pid,
			Process:  processName,
			State:    state,
		})
	}

	return results, nil
}

// lookupPortUnix Unix 系统查询端口
func (s *PortService) lookupPortUnix(port int) ([]PortInfo, error) {
	cmd := exec.Command("sh", "-c", fmt.Sprintf("lsof -i :%d 2>/dev/null || netstat -tlnp 2>/dev/null | grep :%d", port, port))
	output, err := cmd.CombinedOutput()
	if err != nil {
		return []PortInfo{}, nil
	}

	return s.parseUnixNetstat(string(output), port)
}

// parseUnixNetstat 解析 Unix netstat/lsof 输出
func (s *PortService) parseUnixNetstat(output string, targetPort int) ([]PortInfo, error) {
	var results []PortInfo
	lines := strings.Split(output, "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		fields := strings.Fields(line)
		if len(fields) < 7 {
			continue
		}

		if strings.Contains(line, fmt.Sprintf(":%d", targetPort)) || strings.Contains(line, fmt.Sprintf("*:%d", targetPort)) {
			pid, _ := strconv.Atoi(fields[1])
			processName := fields[0]
			protocol := "TCP"
			if strings.Contains(fields[4], "UDP") {
				protocol = "UDP"
			}

			state := "LISTEN"
			if strings.Contains(line, "ESTABLISHED") {
				state = "ESTABLISHED"
			}

			results = append(results, PortInfo{
				Port:     targetPort,
				Protocol: protocol,
				PID:      pid,
				Process:  processName,
				State:    state,
			})
		}
	}

	return results, nil
}

// KillProcess 终止进程
func (s *PortService) KillProcess(pid int) error {
	if pid <= 0 {
		return fmt.Errorf("invalid PID: %d", pid)
	}

	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.Command("taskkill", "/F", "/PID", strconv.Itoa(pid))
		cmd.SysProcAttr = windowsHideCmdAttr
	} else {
		cmd = exec.Command("kill", "-9", strconv.Itoa(pid))
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to kill process %d: %v, output: %s", pid, err, string(output))
	}

	return nil
}

// KillProcessByPort 通过端口号终止占用该端口的进程
func (s *PortService) KillProcessByPort(port int) error {
	infos, err := s.LookupPort(port)
	if err != nil {
		return fmt.Errorf("failed to lookup port %d: %v", port, err)
	}

	if len(infos) == 0 {
		return fmt.Errorf("no process found using port %d", port)
	}

	var errs []string
	for _, info := range infos {
		if err := s.KillProcess(info.PID); err != nil {
			errs = append(errs, fmt.Sprintf("PID %d: %v", info.PID, err))
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("failed to kill some processes: %s", strings.Join(errs, "; "))
	}

	return nil
}
