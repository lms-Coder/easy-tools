package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"

	"easy-tools/internal/database"
	"easy-tools/internal/services"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/windows/icon.ico
var iconData []byte

func main() {
	// 1. 初始化数据库
	db, err := database.Init()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()

	// 2. 执行数据库迁移
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}

	// 3. 创建服务
	configService := services.NewConfigService(nil)
	windowService := services.NewWindowService(nil)
	diffService := services.NewDiffService(nil)
	portService := services.NewPortService(nil)
	regexService := services.NewRegexService()
	cronService := services.NewCronService()
	hashService := services.NewHashService()
	jdkService := services.NewJDKService()
	linuxCmdService := services.NewLinuxCommandService()
	cryptoService := services.NewCryptoService()
	envService := services.NewEnvService()

	// 4. 创建应用
	var win *application.WebviewWindow
	app := application.New(application.Options{
		Name:        "Easy Tools",
		Description: "A modern desktop toolbox",
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Windows: application.WindowsOptions{
			DisableQuitOnLastWindowClosed: true,
		},
		SingleInstance: &application.SingleInstanceOptions{
			UniqueID: "com.easy-tools.app",
			OnSecondInstanceLaunch: func(data application.SecondInstanceData) {
				win.Show()
				win.Focus()
			},
		},
		Services: []application.Service{
			application.NewService(configService),
			application.NewService(windowService),
			application.NewService(diffService),
			application.NewService(portService),
			application.NewService(regexService),
			application.NewService(cronService),
			application.NewService(hashService),
			application.NewService(jdkService),
			application.NewService(linuxCmdService),
			application.NewService(cryptoService),
			application.NewService(envService),
		},
	})

	// 5. 将 app 注入服务
	configService.SetApp(app)
	windowService.SetApp(app)
	diffService.SetApp(app)

	// 6. 创建主窗口
	win = app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            "Easy Tools",
		Frameless:        true,
		BackgroundColour: application.NewRGB(255, 255, 255),
		URL:              "/",
		Width:            1200,
		Height:           800,
		MinWidth:         800,
		MinHeight:        600,
	})

	// 7. 设置窗口引用
	windowService.SetMainWindow(win)
	configService.SetWindow(win)

	// 8. 系统托盘
	trayMenu := application.NewMenu()
	trayMenu.Add("显示窗口").OnClick(func(ctx *application.Context) {
		win.Show()
		win.Focus()
	})
	trayMenu.AddSeparator()
	trayMenu.Add("退出").OnClick(func(ctx *application.Context) {
		app.Quit()
	})

	tray := app.SystemTray.New()
	tray.SetTooltip("Easy Tools")
	tray.SetIcon(iconData)
	tray.SetMenu(trayMenu)
	tray.OnClick(func() {
		win.Show()
		win.Focus()
	})

	// 9. 拦截窗口关闭事件
	win.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
		closeBehavior := configService.GetCloseBehavior()
		switch closeBehavior {
		case "minimize":
			win.Hide()
			e.Cancel()
		case "ask":
			// 通知前端弹出确认框，同时先隐藏窗口
			app.Event.Emit("window:close-confirm")
			win.Hide()
			e.Cancel()
		default:
			// "close" — 不取消，让窗口正常关闭并退出
		}
	})

	// 10. 启动时同步开机自启设置到注册表
	if configService.GetLaunchOnStartup() {
		_ = configService.SyncLaunchOnStartup()
	}

	// 11. 运行
	err = app.Run()
	if err != nil {
		log.Fatal(err)
	}
}
