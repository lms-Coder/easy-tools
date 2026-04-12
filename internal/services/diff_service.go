package services

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type DiffService struct {
	app *application.App
}

func NewDiffService(app *application.App) *DiffService {
	return &DiffService{app: app}
}

func (s *DiffService) SetApp(app *application.App) {
	s.app = app
}

// SelectFile opens a native file dialog and returns the selected file path.
// Returns empty string if user cancels.
func (s *DiffService) SelectFile() string {
	if s.app == nil {
		return ""
	}
	dialog := s.app.Dialog.OpenFileWithOptions(&application.OpenFileDialogOptions{
		Title:          "选择文件",
		CanChooseFiles: true,
		Filters: []application.FileFilter{
			{DisplayName: "文本文件", Pattern: "*.txt;*.md;*.json;*.xml;*.yaml;*.yml;*.toml;*.csv;*.log"},
			{DisplayName: "代码文件", Pattern: "*.go;*.ts;*.js;*.py;*.java;*.c;*.cpp;*.h;*.rs;*.rb;*.php"},
			{DisplayName: "所有文件", Pattern: "*.*"},
		},
	})
	path, err := dialog.PromptForSingleSelection()
	if err != nil || path == "" {
		return ""
	}
	return path
}

// ReadFile reads a file and returns its content as a string.
func (s *DiffService) ReadFile(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("读取文件失败: %w", err)
	}
	return string(data), nil
}

// SaveFile opens a save dialog and writes content to the selected file.
func (s *DiffService) SaveFile(content string, defaultName string) error {
	if s.app == nil {
		return fmt.Errorf("应用未初始化")
	}
	dialog := s.app.Dialog.SaveFileWithOptions(&application.SaveFileDialogOptions{
		Title:    "保存文件",
		Filename: defaultName,
		Filters: []application.FileFilter{
			{DisplayName: "所有文件", Pattern: "*.*"},
		},
	})
	path, err := dialog.PromptForSingleSelection()
	if err != nil || path == "" {
		return nil // user cancelled
	}
	return os.WriteFile(path, []byte(content), 0644)
}

// FileDiffResult holds the result of comparing two files.
type FileDiffResult struct {
	Path1    string `json:"path1"`
	Path2    string `json:"path2"`
	Content1 string `json:"content1"`
	Content2 string `json:"content2"`
}

// DiffFiles reads two files and returns their contents for frontend diffing.
func (s *DiffService) DiffFiles(path1, path2 string) (*FileDiffResult, error) {
	data1, err := os.ReadFile(path1)
	if err != nil {
		return nil, fmt.Errorf("读取文件1失败: %w", err)
	}
	data2, err := os.ReadFile(path2)
	if err != nil {
		return nil, fmt.Errorf("读取文件2失败: %w", err)
	}
	return &FileDiffResult{
		Path1:    path1,
		Path2:    path2,
		Content1: string(data1),
		Content2: string(data2),
	}, nil
}

// ExportDiffAsHTML generates a standalone HTML file with diff highlighting.
func (s *DiffService) ExportDiffAsHTML(htmlContent string, defaultName string) error {
	return s.SaveFile(htmlContent, defaultName)
}

// ExportDiffAsPatch generates a unified diff patch string.
type patchPart struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

// ExportDiffAsPatch takes JSON-encoded diff parts and returns a unified diff patch string.
func (s *DiffService) ExportDiffAsPatch(partsJSON string, file1Name string, file2Name string) string {
	var parts []patchPart
	if err := json.Unmarshal([]byte(partsJSON), &parts); err != nil {
		return ""
	}

	var sb strings.Builder
	sb.WriteString("--- " + file1Name + "\n")
	sb.WriteString("+++ " + file2Name + "\n")

	i := 0
	for i < len(parts) {
		if parts[i].Type == "same" {
			i++
			continue
		}
		start := i
		contextBefore := 3
		hunkStart := start - contextBefore
		if hunkStart < 0 {
			hunkStart = 0
		}
		for i < len(parts) && parts[i].Type != "same" {
			i++
		}
		contextAfter := 3
		end := i + contextAfter
		if end > len(parts) {
			end = len(parts)
		}

		oldStart := 0
		newStart := 0
		for j := 0; j < hunkStart; j++ {
			if parts[j].Type == "add" {
				newStart++
			} else {
				oldStart++
				if parts[j].Type == "same" {
					newStart++
				}
			}
		}
		oldStart++
		newStart++

		oldCount := 0
		newCount := 0
		for j := hunkStart; j < end; j++ {
			switch parts[j].Type {
			case "remove":
				oldCount++
			case "add":
				newCount++
			default:
				oldCount++
				newCount++
			}
		}

		sb.WriteString(fmt.Sprintf("@@ -%d,%d +%d,%d @@\n", oldStart, oldCount, newStart, newCount))
		for j := hunkStart; j < end; j++ {
			switch parts[j].Type {
			case "same":
				sb.WriteString(" " + parts[j].Value + "\n")
			case "remove":
				sb.WriteString("-" + parts[j].Value + "\n")
			case "add":
				sb.WriteString("+" + parts[j].Value + "\n")
			}
		}
	}

	return sb.String()
}
