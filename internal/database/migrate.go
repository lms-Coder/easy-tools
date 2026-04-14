package database

import "log"

func Migrate(db *DB) error {
	// App settings (key-value)
	db.Exec(`CREATE TABLE IF NOT EXISTS app_settings (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL,
		updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
	)`)

	// Tool categories
	db.Exec(`CREATE TABLE IF NOT EXISTS tool_categories (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		icon TEXT NOT NULL DEFAULT '',
		sort_order INTEGER NOT NULL DEFAULT 0
	)`)

	// Tools (full metadata + config)
	db.Exec(`CREATE TABLE IF NOT EXISTS tools (
		tool_id        TEXT PRIMARY KEY,
		name           TEXT NOT NULL,
		description    TEXT NOT NULL DEFAULT '',
		category       TEXT NOT NULL DEFAULT '',
		icon           TEXT NOT NULL DEFAULT '',
		route          TEXT NOT NULL DEFAULT '',
		sort_order     INTEGER NOT NULL DEFAULT 0,
		enabled        INTEGER NOT NULL DEFAULT 1,
		allow_multiple INTEGER NOT NULL DEFAULT 1,
		implemented    INTEGER NOT NULL DEFAULT 0,
		created_at     TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
		updated_at     TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
	)`)

	// Usage stats
	db.Exec(`CREATE TABLE IF NOT EXISTS tool_stats (
		tool_id TEXT PRIMARY KEY,
		total_count INTEGER DEFAULT 0,
		first_used TEXT,
		last_used TEXT
	)`)

	// Usage history
	db.Exec(`CREATE TABLE IF NOT EXISTS usage_history (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		tool_id TEXT NOT NULL,
		used_at TEXT NOT NULL
	)`)

	// Tool history (per-tool data)
	db.Exec(`CREATE TABLE IF NOT EXISTS tool_history (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		tool_id TEXT NOT NULL,
		data TEXT NOT NULL,
		created_at TEXT NOT NULL
	)`)

	// Indexes
	indexes := []string{
		`CREATE INDEX IF NOT EXISTS idx_usage_history_used_at ON usage_history(used_at)`,
		`CREATE INDEX IF NOT EXISTS idx_usage_history_tool_id ON usage_history(tool_id)`,
		`CREATE INDEX IF NOT EXISTS idx_tool_history_tool_id ON tool_history(tool_id)`,
		`CREATE INDEX IF NOT EXISTS idx_tool_history_created_at ON tool_history(created_at)`,
		`CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category)`,
	}
	for _, idx := range indexes {
		if _, err := db.Exec(idx); err != nil {
			log.Printf("Warning: failed to create index: %v", err)
		}
	}

	// Default settings
	var count int
	db.QueryRow(`SELECT COUNT(*) FROM app_settings`).Scan(&count)
	if count == 0 {
		defaults := map[string]string{
			"app_name":          "Easy Tools",
			"theme":             "light",
			"primary_color":     "#007AFF",
			"sidebar_collapsed": "false",
			"minimize_to_tray":  "true",
			"close_behavior":    "minimize",
			"launch_on_startup": "false",
			"language":          "zh-CN",
		}
		for k, v := range defaults {
			db.Exec(`INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)`, k, v)
		}
		log.Printf("Inserted default settings")
	}

	// Default categories
	var catCount int
	db.QueryRow(`SELECT COUNT(*) FROM tool_categories`).Scan(&catCount)
	if catCount == 0 {
		categories := []struct {
			id, name, icon string
			order          int
		}{
			{"dev", "开发工具", "Code", 1},
			{"encode", "编码转换", "ArrowLeftRight", 2},
			{"time", "时间处理", "Clock", 3},
			{"text", "文本处理", "FileText", 4},
			{"security", "安全工具", "Lock", 5},
			{"system", "系统工具", "Settings", 6},
			{"other", "其他", "Wrench", 99},
		}
		for _, cat := range categories {
			db.Exec(`INSERT OR IGNORE INTO tool_categories (id, name, icon, sort_order) VALUES (?, ?, ?, ?)`,
				cat.id, cat.name, cat.icon, cat.order)
		}
		log.Printf("Inserted default categories")
	}

	return nil
}
