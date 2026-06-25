# Intelligent Search 智能搜索

基于 Electron + Node.js 的智能搜索客户端，支持局域网服务器自动发现。

![Version](https://img.shields.io/badge/version-v0.9--Beta1-blue)
![Platform](https://img.shields.io/badge/platform-Windows-blue)
![License](https://img.shields.io/badge/license-Apache--2.0-green)

## 许可证

本项目基于 [Apache License 2.0](LICENSE) 开源许可。

- 您可以自由使用、复制、修改、分发本项目
- 允许商业使用，只需保留版权声明
- 详细条款请参阅 [LICENSE](LICENSE) 文件

## 功能特性

### 核心功能
- **局域网服务器自动发现** - 启动时自动扫描局域网中的服务器
- **智能缓存** - 自动缓存已连接服务器，下次启动优先连接
- **一键重连** - 连接失败时提供重新连接按钮

### 用户界面
- 简洁美观的登录界面
- 状态指示灯实时显示连接状态
- 企业/个人双模式登录
- 响应式设计，固定宽度布局

### 文章管理
- 文章列表浏览（支持分类筛选）
- 全文搜索功能
- 文章点赞与评论
- 发布文章

## 技术栈

### 客户端
- **Electron 42.4.1** - 跨平台桌面应用框架
- **Node.js** - 后端运行环境
- **HTML/CSS/JavaScript** - 前端技术

### 后端
- **Express** - Web 框架
- **MySQL** - 数据库
- **JWT** - 身份认证

## 安装使用

### Windows 安装包
下载 [智能搜索-Setup-1.0.0-x64.exe](https://github.com/FunctinoX-ctrl/Intelligent_search/releases/download/v0.9-Beta1/智能搜索-Setup-1.0.0-x64.exe) 进行安装。

### 从源码运行

```bash
# 克隆仓库
git clone https://github.com/FunctinoX-ctrl/Intelligent_search.git
cd Intelligent_search

# 安装依赖
npm install
cd backend && npm install && cd ..

# 启动后端服务
cd backend
node server.js

# 启动客户端（新终端）
npm start
```

## 部署服务器

### 前端部署
将 `pages` 目录部署到 Web 服务器（如 Nginx），确保支持静态文件访问。

### 后端部署
1. 安装 Node.js 和 MySQL
2. 配置数据库连接（参考 `backend/config/db.js`）
3. 启动服务：`node server.js`

### 默认账户

| 类型 | 账户 | 密码 |
|------|------|------|
| 个人用户 | root | Root@123456 |
| 企业用户 | root@enterprise.com | Root@123456 |
| 企业工号 | ROOT001 | - |

## 项目结构

```
Intelligent_search/
├── main.js              # Electron 主进程
├── preload.js           # 预加载脚本
├── package.json         # 项目配置
├── backend/            # 后端服务
│   ├── server.js       # 服务入口
│   ├── config/         # 配置文件
│   ├── models/         # 数据模型
│   └── routes/         # 路由
├── pages/              # 前端页面
│   ├── login.html     # 登录页
│   ├── home.html      # 首页
│   ├── profile.html   # 个人主页
│   └── css/           # 样式文件
└── installer/         # 安装包配置
```

## 接口说明

### 健康检查
```
GET /api/health
```
响应：
```json
{
  "status": "ok",
  "message": "Intelligent Search Backend is running",
  "timestamp": 1782307689248,
  "version": "1.0.0",
  "service": "intelligent-search"
}
```

### 认证接口
- `POST /api/auth/personal/login` - 个人用户登录
- `POST /api/auth/enterprise/login` - 企业用户登录
- `POST /api/auth/personal/register` - 个人用户注册
- `POST /api/auth/enterprise/register` - 企业用户注册

### 文章接口
- `GET /api/posts/list` - 获取文章列表
- `GET /api/posts/search` - 搜索文章
- `GET /api/posts/hot` - 热门文章
- `GET /api/posts/detail/:id` - 文章详情
- `POST /api/posts/create` - 发布文章

## 开发相关

### 打包构建
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# 打包产物位于 dist/ 目录
```

### 自定义配置
- 服务器配置：`config/server.json`
- 日志输出：控制台

## 更新日志

### v0.9-Beta1 (2026-06-24)
- 新增局域网服务器自动搜索功能
- 优化登录页面 UI
- 修复后端启动问题
- 增强 API 健康检查接口

## 联系方式

- GitHub: https://github.com/FunctinoX-ctrl/Intelligent_search
- Issues: https://github.com/FunctinoX-ctrl/Intelligent_search/issues
