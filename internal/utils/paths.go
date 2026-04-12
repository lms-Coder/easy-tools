package utils

import (
	"os"
	"path/filepath"
)

const AppDirName = ".easy-tools"
const DataDirName = "data"
const DBName = "easy-tools.db"

func getHomeDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, AppDirName), nil
}

func GetConfigDir() (string, error) {
	home, err := getHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, "config"), nil
}

func GetDataDir() (string, error) {
	home, err := getHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, DataDirName), nil
}

func GetDBPath() (string, error) {
	dataDir, err := GetDataDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dataDir, DBName), nil
}

func EnsureDir(dir string) error {
	return os.MkdirAll(dir, 0755)
}
