package database

import (
	"database/sql"
	"log"
	"sync"

	_ "modernc.org/sqlite"

	"easy-tools/internal/utils"
)

type DB struct {
	*sql.DB
	mu sync.RWMutex
}

var (
	instance *DB
	once     sync.Once
)

func Init() (*DB, error) {
	var initErr error
	once.Do(func() {
		dataDir, err := utils.GetDataDir()
		if err != nil {
			initErr = err
			return
		}
		if err := utils.EnsureDir(dataDir); err != nil {
			initErr = err
			return
		}

		dbPath, err := utils.GetDBPath()
		if err != nil {
			initErr = err
			return
		}

		log.Printf("Database path: %s", dbPath)

		rawDB, err := sql.Open("sqlite", dbPath+"?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_pragma=foreign_keys(1)&_pragma=synchronous(NORMAL)")
		if err != nil {
			initErr = err
			return
		}

		if err := rawDB.Ping(); err != nil {
			rawDB.Close()
			initErr = err
			return
		}

		instance = &DB{DB: rawDB}
		log.Printf("Database initialized successfully")
	})
	return instance, initErr
}

func Get() *DB { return instance }

func Close() error {
	if instance != nil {
		return instance.DB.Close()
	}
	return nil
}
