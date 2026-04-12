package services

import (
	"fmt"
	"sync"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

// WindowService manages child windows for tools
type WindowService struct {
	app        *application.App
	mainWindow *application.WebviewWindow
	windows    map[string]*application.WebviewWindow
	mu         sync.RWMutex
}

// NewWindowService creates a new window service
func NewWindowService(app *application.App) *WindowService {
	return &WindowService{
		app:     app,
		windows: make(map[string]*application.WebviewWindow),
	}
}

// SetApp sets the application reference
func (s *WindowService) SetApp(app *application.App) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.app = app
}

// SetMainWindow sets the main window reference
func (s *WindowService) SetMainWindow(window *application.WebviewWindow) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.mainWindow = window
}

// MinimizeMainWindow minimizes the main window
func (s *WindowService) MinimizeMainWindow() {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.mainWindow != nil {
		s.mainWindow.Hide()
	}
}

// CloseMainWindow closes the main window (and the app)
func (s *WindowService) CloseMainWindow() {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.mainWindow != nil {
		s.mainWindow.Close()
	}
}

// ToolWindowConfig defines configuration for a tool window
type ToolWindowConfig struct {
	ID        string
	Title     string
	Width     int
	Height    int
	MinWidth  int
	MinHeight int
	URL       string
}

// removeWindowByID safely removes a window from the map
func (s *WindowService) removeWindowByID(id string) {
	s.mu.Lock()
	delete(s.windows, id)
	s.mu.Unlock()
}

// OpenToolWindow opens a new window for a tool
func (s *WindowService) OpenToolWindow(config ToolWindowConfig) error {
	s.mu.Lock()

	// Check if window already exists for this tool
	if existingWindow, exists := s.windows[config.ID]; exists {
		existingWindow.Focus()
		s.mu.Unlock()
		return nil
	}

	// Set default dimensions
	width := config.Width
	if width == 0 {
		width = 1024
	}
	height := config.Height
	if height == 0 {
		height = 768
	}
	minWidth := config.MinWidth
	if minWidth == 0 {
		minWidth = 700
	}
	minHeight := config.MinHeight
	if minHeight == 0 {
		minHeight = 500
	}

	// Store window ID for cleanup
	windowID := config.ID

	// Create new window
	window := s.app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:     config.Title,
		Frameless: true,
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 40,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHidden,
		},
		BackgroundColour: application.NewRGB(255, 255, 255),
		URL:              config.URL,
		Width:            width,
		Height:           height,
		MinWidth:         minWidth,
		MinHeight:        minHeight,
	})

	// Center the window
	window.Center()

	// Store the window
	s.windows[config.ID] = window
	s.mu.Unlock()

	// Handle window close event - register outside lock to avoid deadlock
	window.OnWindowEvent(events.Common.WindowClosing, func(_ *application.WindowEvent) {
		s.removeWindowByID(windowID)
	})

	return nil
}

// CloseToolWindow closes a tool window by ID
func (s *WindowService) CloseToolWindow(id string) error {
	s.mu.Lock()
	window, exists := s.windows[id]
	if !exists {
		s.mu.Unlock()
		return fmt.Errorf("window with ID %s not found", id)
	}
	delete(s.windows, id)
	s.mu.Unlock()

	window.Close()
	return nil
}

// CloseAllToolWindows closes all tool windows
func (s *WindowService) CloseAllToolWindows() {
	s.mu.Lock()
	windows := make([]*application.WebviewWindow, 0, len(s.windows))
	for id, window := range s.windows {
		windows = append(windows, window)
		delete(s.windows, id)
	}
	s.mu.Unlock()

	// Close windows outside lock to avoid deadlock with WindowClosing callback
	for _, window := range windows {
		window.Close()
	}
}

// GetOpenToolWindows returns a list of open tool window IDs
func (s *WindowService) GetOpenToolWindows() []string {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ids := make([]string, 0, len(s.windows))
	for id := range s.windows {
		ids = append(ids, id)
	}
	return ids
}
