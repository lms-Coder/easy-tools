package services

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"golang.org/x/sys/windows/registry"

	"easy-tools/internal/database"
)

type ConfigService struct {
	app    *application.App
	window *application.WebviewWindow
}

func NewConfigService(app *application.App) *ConfigService {
	return &ConfigService{app: app}
}

func (s *ConfigService) SetApp(app *application.App) {
	s.app = app
}

func (s *ConfigService) SetWindow(win *application.WebviewWindow) {
	s.window = win
}

// Helper to get a setting value
func (s *ConfigService) getSetting(key string) string {
	db := database.Get()
	var value string
	db.QueryRow(`SELECT value FROM app_settings WHERE key = ?`, key).Scan(&value)
	return value
}

// Helper to set a setting value
func (s *ConfigService) setSetting(key, value string) error {
	db := database.Get()
	_, err := db.Exec(`UPDATE app_settings SET value = ?, updated_at = datetime('now', 'localtime') WHERE key = ?`, value, key)
	return err
}

// Theme methods
func (s *ConfigService) GetTheme() string { return s.getSetting("theme") }
func (s *ConfigService) SetTheme(theme string) error {
	return s.setSetting("theme", theme)
}

// Primary color methods
func (s *ConfigService) GetPrimaryColor() string { return s.getSetting("primary_color") }
func (s *ConfigService) SetPrimaryColor(color string) error {
	return s.setSetting("primary_color", color)
}

// App name methods
func (s *ConfigService) GetAppName() string { return s.getSetting("app_name") }
func (s *ConfigService) SetAppName(name string) error {
	return s.setSetting("app_name", name)
}

// Font family methods
func (s *ConfigService) GetFontFamily() string { return s.getSetting("font_family") }
func (s *ConfigService) SetFontFamily(family string) error {
	return s.setSetting("font_family", family)
}

// Layout methods
func (s *ConfigService) GetSidebarCollapsed() bool {
	return s.getSetting("sidebar_collapsed") == "true"
}

func (s *ConfigService) SetSidebarCollapsed(collapsed bool) error {
	return s.setSetting("sidebar_collapsed", fmt.Sprintf("%v", collapsed))
}

// System config
type SystemConfig struct {
	MinimizeToTray  bool   `json:"MinimizeToTray"`
	CloseBehavior   string `json:"CloseBehavior"`
	LaunchOnStartup bool   `json:"LaunchOnStartup"`
}

func (s *ConfigService) GetSystemConfig() *SystemConfig {
	return &SystemConfig{
		MinimizeToTray:  s.getSetting("minimize_to_tray") == "true",
		CloseBehavior:   s.getSetting("close_behavior"),
		LaunchOnStartup: s.getSetting("launch_on_startup") == "true",
	}
}

func (s *ConfigService) SetMinimizeToTray(enabled bool) error {
	return s.setSetting("minimize_to_tray", fmt.Sprintf("%v", enabled))
}

func (s *ConfigService) SetCloseBehavior(behavior string) error {
	return s.setSetting("close_behavior", behavior)
}

func (s *ConfigService) GetCloseBehavior() string {
	return s.getSetting("close_behavior")
}

func (s *ConfigService) GetLaunchOnStartup() bool {
	return s.getSetting("launch_on_startup") == "true"
}

// SyncLaunchOnStartup writes the current DB setting to Windows registry
func (s *ConfigService) SyncLaunchOnStartup() error {
	enabled := s.GetLaunchOnStartup()
	exePath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("get exe path: %w", err)
	}

	key, _, err := registry.CreateKey(registry.CURRENT_USER, `Software\Microsoft\Windows\CurrentVersion\Run`, registry.SET_VALUE)
	if err != nil {
		return fmt.Errorf("open registry key: %w", err)
	}
	defer key.Close()

	if enabled {
		return key.SetStringValue("EasyTools", exePath)
	}
	_ = key.DeleteValue("EasyTools")
	return nil
}

func (s *ConfigService) SetLaunchOnStartup(enabled bool) error {
	// Save to database
	if err := s.setSetting("launch_on_startup", fmt.Sprintf("%v", enabled)); err != nil {
		return err
	}

	// Write/remove Windows registry
	exePath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("get exe path: %w", err)
	}

	key, _, err := registry.CreateKey(registry.CURRENT_USER, `Software\Microsoft\Windows\CurrentVersion\Run`, registry.SET_VALUE)
	if err != nil {
		return fmt.Errorf("open registry key: %w", err)
	}
	defer key.Close()

	if enabled {
		return key.SetStringValue("EasyTools", exePath)
	}
	return key.DeleteValue("EasyTools")
}

// Tool definitions (received from frontend)
type ToolDefinition struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Icon        string `json:"icon"`
	Route       string `json:"route"`
	SortOrder   int    `json:"sortOrder"`
	Implemented bool   `json:"implemented"`
}

// Full tool config (returned to frontend)
type ToolConfig struct {
	ID            string `json:"ID"`
	Name          string `json:"Name"`
	Description   string `json:"Description"`
	Category      string `json:"Category"`
	Icon          string `json:"Icon"`
	Route         string `json:"Route"`
	SortOrder     int    `json:"SortOrder"`
	Enabled       bool   `json:"Enabled"`
	AllowMultiple bool   `json:"AllowMultiple"`
	Implemented   bool   `json:"Implemented"`
}

// Tool category
type ToolCategory struct {
	ID        string `json:"ID"`
	Name      string `json:"Name"`
	Icon      string `json:"Icon"`
	SortOrder int    `json:"SortOrder"`
}

// SyncTools syncs tool definitions from frontend into database
func (s *ConfigService) SyncTools(tools []ToolDefinition) error {
	db := database.Get()
	if db == nil {
		return fmt.Errorf("database not initialized")
	}

	for i, tool := range tools {
		_, err := db.Exec(`INSERT INTO tools
			(tool_id, name, description, category, icon, route, sort_order, enabled, allow_multiple, implemented, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?,
				COALESCE((SELECT enabled FROM tools WHERE tool_id = ?), 1),
				COALESCE((SELECT allow_multiple FROM tools WHERE tool_id = ?), 1),
				?, datetime('now', 'localtime'), datetime('now', 'localtime'))
			ON CONFLICT(tool_id) DO UPDATE SET
				name = excluded.name,
				description = excluded.description,
				category = excluded.category,
				icon = excluded.icon,
				route = excluded.route,
				sort_order = excluded.sort_order,
				implemented = excluded.implemented,
				updated_at = datetime('now', 'localtime')`,
			tool.ID, tool.Name, tool.Description, tool.Category, tool.Icon, tool.Route, i,
			tool.ID, tool.ID, tool.Implemented)
		if err != nil {
			return fmt.Errorf("sync tool %s: %w", tool.ID, err)
		}
	}
	return nil
}

// GetTools returns all tools from database
func (s *ConfigService) GetTools() []ToolConfig {
	db := database.Get()
	if db == nil {
		return nil
	}

	rows, err := db.Query(`SELECT tool_id, name, description, category, icon, route, sort_order, enabled, allow_multiple, implemented
		FROM tools ORDER BY sort_order ASC`)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var tools []ToolConfig
	for rows.Next() {
		var t ToolConfig
		var enabled, allowMultiple, implemented int
		if rows.Scan(&t.ID, &t.Name, &t.Description, &t.Category, &t.Icon, &t.Route,
			&t.SortOrder, &enabled, &allowMultiple, &implemented) == nil {
			t.Enabled = enabled == 1
			t.AllowMultiple = allowMultiple == 1
			t.Implemented = implemented == 1
			tools = append(tools, t)
		}
	}
	return tools
}

// GetCategories returns all tool categories
func (s *ConfigService) GetCategories() []ToolCategory {
	db := database.Get()
	if db == nil {
		return nil
	}

	rows, err := db.Query(`SELECT id, name, icon, sort_order FROM tool_categories ORDER BY sort_order ASC`)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var cats []ToolCategory
	for rows.Next() {
		var c ToolCategory
		if rows.Scan(&c.ID, &c.Name, &c.Icon, &c.SortOrder) == nil {
			cats = append(cats, c)
		}
	}
	return cats
}

func (s *ConfigService) SetToolEnabled(toolID string, enabled bool) error {
	db := database.Get()
	_, err := db.Exec(`UPDATE tools SET enabled = ?, updated_at = datetime('now', 'localtime') WHERE tool_id = ?`, enabled, toolID)
	return err
}

func (s *ConfigService) SetToolAllowMultiple(toolID string, allowMultiple bool) error {
	db := database.Get()
	_, err := db.Exec(`UPDATE tools SET allow_multiple = ?, updated_at = datetime('now', 'localtime') WHERE tool_id = ?`, allowMultiple, toolID)
	return err
}

// Window background
func (s *ConfigService) SetWindowBackground(isDark bool) {
	if s.window == nil {
		return
	}
	if isDark {
		s.window.SetBackgroundColour(application.NewRGB(28, 28, 30))
	} else {
		s.window.SetBackgroundColour(application.NewRGB(255, 255, 255))
	}
}

// RecordToolUsage - delegates to usage tracking
func (s *ConfigService) RecordToolUsage(toolID string) error {
	db := database.Get()
	if db == nil {
		return nil
	}

	now := time.Now().Format(time.RFC3339)

	var exists bool
	err := db.QueryRow(`SELECT 1 FROM tool_stats WHERE tool_id = ?`, toolID).Scan(&exists)
	if err == sql.ErrNoRows {
		_, err = db.Exec(`INSERT INTO tool_stats (tool_id, total_count, first_used, last_used) VALUES (?, 1, ?, ?)`, toolID, now, now)
	} else if err == nil {
		_, err = db.Exec(`UPDATE tool_stats SET total_count = total_count + 1, last_used = ? WHERE tool_id = ?`, now, toolID)
	}
	if err != nil {
		return err
	}

	_, err = db.Exec(`INSERT INTO usage_history (tool_id, used_at) VALUES (?, ?)`, toolID, now)
	return err
}

// GetUsageStatsSummary returns dashboard stats
type ToolRankingItem struct {
	ToolID   string `json:"toolId"`
	UseCount int    `json:"useCount"`
	LastUsed string `json:"lastUsed"`
}

type RecentUsedItem struct {
	ToolID    string `json:"toolId"`
	Timestamp string `json:"timestamp"`
}

type DailyStatItem struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

type UsageStatsSummary struct {
	TodayCount int               `json:"todayCount"`
	WeekCount  int               `json:"weekCount"`
	MonthCount int               `json:"monthCount"`
	Ranking    []ToolRankingItem `json:"ranking"`
	RecentUsed []RecentUsedItem  `json:"recentUsed"`
	DailyStats []DailyStatItem   `json:"dailyStats"`
}

func (s *ConfigService) GetUsageStatsSummary() *UsageStatsSummary {
	db := database.Get()
	if db == nil {
		return nil
	}

	summary := &UsageStatsSummary{
		Ranking:    make([]ToolRankingItem, 0),
		RecentUsed: make([]RecentUsedItem, 0),
		DailyStats: make([]DailyStatItem, 0),
	}

	now := time.Now()
	todayStr := now.Format("2006-01-02")
	weekAgo := now.AddDate(0, 0, -7).Format(time.RFC3339)
	monthAgo := now.AddDate(0, 0, -30).Format(time.RFC3339)

	// 今日使用 — 用 Go 本地日期匹配
	db.QueryRow(`SELECT COUNT(*) FROM usage_history WHERE SUBSTR(used_at, 1, 10) = ?`, todayStr).Scan(&summary.TodayCount)
	db.QueryRow(`SELECT COUNT(*) FROM usage_history WHERE used_at >= ?`, weekAgo).Scan(&summary.WeekCount)
	db.QueryRow(`SELECT COUNT(*) FROM usage_history WHERE used_at >= ?`, monthAgo).Scan(&summary.MonthCount)

	// 使用排行 TOP5
	rows, err := db.Query(`SELECT tool_id, total_count, last_used FROM tool_stats ORDER BY total_count DESC`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var item ToolRankingItem
			if rows.Scan(&item.ToolID, &item.UseCount, &item.LastUsed) == nil {
				summary.Ranking = append(summary.Ranking, item)
			}
		}
	}

	// 最近使用（按时间倒序取最近10条，去重取前4个工具）
	recentRows, err := db.Query(`SELECT DISTINCT tool_id, used_at FROM usage_history ORDER BY used_at DESC LIMIT 20`)
	if err == nil {
		defer recentRows.Close()
		seen := make(map[string]bool)
		for recentRows.Next() {
			var toolID, usedAt string
			if recentRows.Scan(&toolID, &usedAt) == nil {
				if !seen[toolID] {
					seen[toolID] = true
					summary.RecentUsed = append(summary.RecentUsed, RecentUsedItem{
						ToolID:    toolID,
						Timestamp: usedAt,
					})
					if len(summary.RecentUsed) >= 10 {
						break
					}
				}
			}
		}
	}

	// 近7天每日使用量
	sixDaysAgo := now.AddDate(0, 0, -6).Format(time.RFC3339)
	dailyRows, err := db.Query(`
		SELECT SUBSTR(used_at, 1, 10) as day, COUNT(*) as cnt
		FROM usage_history
		WHERE used_at >= ?
		GROUP BY day
		ORDER BY day ASC
	`, sixDaysAgo)
	if err == nil {
		defer dailyRows.Close()
		for dailyRows.Next() {
			var day string
			var cnt int
			if dailyRows.Scan(&day, &cnt) == nil {
				summary.DailyStats = append(summary.DailyStats, DailyStatItem{
					Date:  day,
					Count: cnt,
				})
			}
		}
	}

	return summary
}

// ClearUsageData clears all usage history and stats
func (s *ConfigService) ClearUsageData() error {
	db := database.Get()
	if db == nil {
		return fmt.Errorf("database not initialized")
	}
	if _, err := db.Exec(`DELETE FROM usage_history`); err != nil {
		return err
	}
	_, err := db.Exec(`DELETE FROM tool_stats`)
	return err
}

// ====== Tool History ======

type ToolHistoryItem struct {
	ID        int    `json:"id"`
	ToolID    string `json:"toolId"`
	Data      string `json:"data"`
	CreatedAt string `json:"createdAt"`
}

func (s *ConfigService) SaveToolHistory(toolID, data string) error {
	db := database.Get()
	if db == nil {
		return fmt.Errorf("database not initialized")
	}

	_, err := db.Exec(
		`INSERT INTO tool_history (tool_id, data, created_at) VALUES (?, ?, datetime('now', 'localtime'))`,
		toolID, data,
	)
	if err != nil {
		return err
	}

	// Keep only the latest 50 records per tool
	_, err = db.Exec(
		`DELETE FROM tool_history WHERE tool_id = ? AND id NOT IN (
			SELECT id FROM tool_history WHERE tool_id = ? ORDER BY created_at DESC LIMIT 50
		)`,
		toolID, toolID,
	)
	return err
}

func (s *ConfigService) GetToolHistory(toolID string, limit int) []ToolHistoryItem {
	db := database.Get()
	if db == nil {
		return nil
	}

	if limit <= 0 {
		limit = 50
	}

	rows, err := db.Query(
		`SELECT id, tool_id, data, created_at FROM tool_history WHERE tool_id = ? ORDER BY created_at DESC LIMIT ?`,
		toolID, limit,
	)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var items []ToolHistoryItem
	for rows.Next() {
		var item ToolHistoryItem
		if rows.Scan(&item.ID, &item.ToolID, &item.Data, &item.CreatedAt) == nil {
			items = append(items, item)
		}
	}
	return items
}

func (s *ConfigService) DeleteToolHistoryItem(id int) error {
	db := database.Get()
	if db == nil {
		return fmt.Errorf("database not initialized")
	}
	_, err := db.Exec(`DELETE FROM tool_history WHERE id = ?`, id)
	return err
}

func (s *ConfigService) ClearToolHistory(toolID string) error {
	db := database.Get()
	if db == nil {
		return fmt.Errorf("database not initialized")
	}
	_, err := db.Exec(`DELETE FROM tool_history WHERE tool_id = ?`, toolID)
	return err
}
