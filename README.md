# Easy Tools

一款基于 Wails v3 构建的现代化桌面工具箱，为开发者提供高效实用的日常工具集合。

## 功能概览

提供 **22 款内置工具**，覆盖开发、编码、安全、文本处理等常见场景：

### 开发工具
- **JSON 格式化** — JSON 美化、压缩、校验
- **JSON Schema** — Schema 编辑与验证
- **正则表达式** — 正则测试与匹配
- **Cron 表达式** — Cron 解析与可视化
- **XML 格式化** — XML 美化与压缩
- **Linux 命令** — 常用命令速查

### 编码转换
- **Base64** — 编码与解码
- **URL 编码** — URL 编解码
- **Unicode** — Unicode 转换
- **ASCII** — ASCII 码查询

### 安全工具
- **JWT 解析** — Token 解码与验证
- **哈希计算** — MD5 / SHA 系列
- **加解密** — AES / DES / RSA / ChaCha20

### 文本处理
- **文本对比** — Diff 差异比较
- **Markdown** — 编辑器与预览（支持 Mermaid、KaTeX、代码高亮）

### 时间处理
- **时间戳转换** — 时间戳与日期互转
- **日历** — 农历、节假日查询

### 系统工具
- **端口管理** — 端口扫描与进程管理
- **JDK 管理** — JDK 版本切换
- **环境变量** — 系统环境变量查看与编辑

### 其他工具
- **二维码** — 生成与解析
- **取色器** — 屏幕颜色选取
- **UUID 生成** — 批量生成 UUID

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Wails v3 |
| 后端 | Go 1.25 + SQLite |
| 前端 | Vue 3 + TypeScript + Vite |
| 状态管理 | Pinia |
| 图标 | Lucide Icons |

## 快速开始

### 环境要求

- Go 1.25+
- Node.js 18+
- [Wails v3 CLI](https://v3.wails.io/)
- [Task](https://taskfile.dev/)（构建工具）

### 开发

```bash
# 克隆项目
git clone https://github.com/your-username/easy-tools.git
cd easy-tools

# 安装前端依赖
cd frontend && npm install && cd ..

# 启动开发模式（热重载）
wails3 dev
```

### 构建

```bash
# 生产构建
wails3 build

# 构建产物在 build/ 目录
```

## 项目结构

```
easy-tools/
├── main.go                    # 应用入口
├── Taskfile.yml               # 构建任务
├── internal/
│   ├── database/              # SQLite 初始化与迁移
│   └── services/              # Go 后端服务（12 个）
├── frontend/
│   ├── src/
│   │   ├── views/             # 页面组件
│   │   │   └── tools/         # 各工具实现（按类别组织）
│   │   ├── components/        # 通用组件（布局、UI）
│   │   ├── composables/       # Vue 组合式函数
│   │   ├── stores/            # Pinia 状态管理
│   │   ├── router/            # 路由配置
│   │   └── tools/             # 工具定义
│   └── package.json
└── build/
    └── config.yml             # Wails 构建配置
```

## 特性

- **无边框窗口** — 自定义标题栏，原生拖拽体验
- **系统托盘** — 最小化到托盘，关闭行为可配置
- **单实例运行** — 防止多开
- **多窗口** — 工具可在独立窗口中打开
- **深色/浅色主题** — 一键切换，支持自定义主题色
- **本地存储** — SQLite 持久化配置与历史记录
- **开机启动** — 可选开机自启（写入注册表）

## 开源协议

MIT License
