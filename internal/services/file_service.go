package services

import (
	"encoding/base64"
	"fmt"
	"os"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type FileService struct {
	app *application.App
}

func NewFileService(app *application.App) *FileService {
	return &FileService{app: app}
}

func (s *FileService) SetApp(app *application.App) {
	s.app = app
}

// SelectFile opens a native file open dialog and returns the selected file path.
// Returns empty string if user cancels.
func (s *FileService) SelectFile() string {
	if s.app == nil {
		return ""
	}
	dialog := s.app.Dialog.OpenFileWithOptions(&application.OpenFileDialogOptions{
		Title: "选择文件",
		Filters: []application.FileFilter{
			{DisplayName: "所有文件", Pattern: "*.*"},
		},
	})
	path, err := dialog.PromptForSingleSelection()
	if err != nil || path == "" {
		return ""
	}
	return path
}

// SaveFile opens a native save dialog and writes content to the selected file.
// Returns the saved file path on success, or empty string if user cancelled.
func (s *FileService) SaveFile(content string, defaultName string) (string, error) {
	if s.app == nil {
		return "", fmt.Errorf("应用未初始化")
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
		return "", nil // user cancelled
	}
	if writeErr := os.WriteFile(path, []byte(content), 0644); writeErr != nil {
		return "", writeErr
	}
	return path, nil
}

// SaveFileWithFilter opens a native save dialog with custom filter and writes content.
// Returns the saved file path on success, or empty string if user cancelled.
func (s *FileService) SaveFileWithFilter(content string, defaultName string, filterName string, filterPattern string) (string, error) {
	if s.app == nil {
		return "", fmt.Errorf("应用未初始化")
	}
	dialog := s.app.Dialog.SaveFileWithOptions(&application.SaveFileDialogOptions{
		Title:    "保存文件",
		Filename: defaultName,
		Filters: []application.FileFilter{
			{DisplayName: filterName, Pattern: filterPattern},
			{DisplayName: "所有文件", Pattern: "*.*"},
		},
	})
	path, err := dialog.PromptForSingleSelection()
	if err != nil || path == "" {
		return "", nil // user cancelled
	}
	if writeErr := os.WriteFile(path, []byte(content), 0644); writeErr != nil {
		return "", writeErr
	}
	return path, nil
}

// ReadFile reads a file and returns its content as string.
func (s *FileService) ReadFile(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("读取文件失败: %w", err)
	}
	return string(data), nil
}

// SaveFileFromBase64 opens a native save dialog and writes base64-encoded data to the selected file.
// base64Data should include the data URL prefix (e.g., "data:image/png;base64,...").
// Returns the saved file path on success, or empty string if user cancelled.
func (s *FileService) SaveFileFromBase64(base64Data string, defaultName string, filterName string, filterPattern string) (string, error) {
	if s.app == nil {
		return "", fmt.Errorf("应用未初始化")
	}
	dialog := s.app.Dialog.SaveFileWithOptions(&application.SaveFileDialogOptions{
		Title:    "保存图片",
		Filename: defaultName,
		Filters: []application.FileFilter{
			{DisplayName: filterName, Pattern: filterPattern},
			{DisplayName: "所有文件", Pattern: "*.*"},
		},
	})
	path, err := dialog.PromptForSingleSelection()
	if err != nil || path == "" {
		return "", nil // user cancelled
	}

	// 去除 data URL 前缀 (e.g., "data:image/png;base64,")
	b64 := base64Data
	if idx := strings.Index(base64Data, ","); idx != -1 {
		b64 = base64Data[idx+1:]
	}

	data, err := base64.StdEncoding.DecodeString(b64)
	if err != nil {
		return "", fmt.Errorf("Base64 解码失败: %w", err)
	}

	if writeErr := os.WriteFile(path, data, 0644); writeErr != nil {
		return "", writeErr
	}
	return path, nil
}
