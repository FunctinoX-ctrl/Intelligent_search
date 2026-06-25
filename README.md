# Intelligent Search

一个集**文章发布、检索、社区互动**于一体的智能搜索/博客平台。前端基于 Electron + 原生 HTML/CSS/JS，提供桌面与 Web 双端体验；后端基于 Spring Boot 3 + MyBatis-Plus + MySQL，提供企业用户与个人用户双轨登录、文章/评论/点赞/消息/浏览历史等完整 REST API。

> 仓库地址：https://github.com/FunctinoX-ctrl/Intelligent_search

---

## 目录结构

```
.
├── Intelligent_search/        # 前端（Electron 桌面端 + Web 静态页）
│   ├── pages/                 #  页面 HTML / CSS / 图片
│   │   ├── home.html
│   │   ├── profile.html
│   │   ├── login.html
│   │   └── css/
│   ├── backend/               #  旧版 Node.js 后端（Express + MySQL）
│   ├── main.js                #  Electron 主进程
│   ├── preload.js             #  Electron 预加载
│   └── package.json
│
├── backend-java/              # 新版 Spring Boot 后端（推荐）
│   ├── src/main/java/com/intelligentsearch/
│   │   ├── controller/        #  REST 控制器
│   │   ├── service/           #  业务层
│   │   ├── mapper/            #  MyBatis-Plus Mapper
│   │   ├── entity/            #  数据库实体
│   │   ├── interceptor/       #  JWT 鉴权拦截器
│   │   ├── util/              #  工具类
│   │   └── config/            #  配置类
│   ├── src/main/resources/
│   │   └── application.yml
│   ├── init_messages.sql      #  初始化数据脚本
│   └── pom.xml
│
├── ssh/                       #  部署 / 运维脚本（已加入 .gitignore）
├── .gitignore
└── README.md
```

---

## 技术栈

### 前端 `Intelligent_search/`
- **Electron 42** —— 桌面端壳
- **HTML5 / CSS3 / Vanilla JS** —— 页面与交互
- **前后端双端适配** —— Electron 通过 IPC、Web 通过 HTTP API

### 后端 `backend-java/`
- **Spring Boot 3.2** / **Java 17**
- **MyBatis-Plus 3.5.5** —— ORM
- **MySQL 8** —— 数据存储
- **Hutool 5.8** —— Java 工具集
- **jjwt 0.12** —— JWT 鉴权

### 历史版本 `Intelligent_search/backend/`
- **Node.js / Express** —— 旧版后端（保留作参考）

---

## 功能模块

| 模块 | 描述 |
| --- | --- |
| 用户体系 | 个人用户 / 企业用户双轨注册登录，JWT 鉴权 |
| 文章 | 发布、列表、详情、分类、标签、搜索（标题/内容/摘要模糊匹配） |
| 互动 | 评论、点赞、浏览历史 |
| 消息中心 | 全部 / 评论 / 点赞 / 系统 四类消息，含未读红点 |
| 个人主页 | 头像、资料、统计、主题切换（明/暗） |
| 双端适配 | Electron 桌面端 + 浏览器 Web 端同源体验 |

---

## 快速开始

### 1. 后端 `backend-java`

```bash
cd backend-java

# 准备 MySQL 数据库
mysql -u root -p < init_messages.sql

# 修改 src/main/resources/application.yml 中的 datasource / jwt 密钥

# 启动（需 Java 17 + Maven）
./mvnw spring-boot:run
# 或
mvn spring-boot:run
```

默认监听 `http://localhost:8080`。

### 2. 前端 `Intelligent_search`（Web）

任选其一：

```bash
# 方式一：Node 静态托管（推荐，已自带 backend/）
cd Intelligent_search
npm install
npm start          # 启动 Electron 桌面端
```

```bash
# 方式二：直接用任意静态服务器
cd Intelligent_search/pages
npx serve .        # 或 python -m http.server 3001
```

访问 `http://localhost:3001/login.html`。

### 3. Electron 桌面端

```bash
cd Intelligent_search
npm install
npm start
```

主进程会创建窗口并加载 `pages/home.html`，通过 `preload.js` 暴露的 IPC 与后端通信。

---

## 部署

项目已提供一组基于 Paramiko 的 Python 部署脚本（`ssh/`），用于将前端静态页与后端 Jar 一键发布到远端服务器：
- `deploy_all.py` —— 一键全量部署
- `deploy_backend_v3.py` —— 部署 Spring Boot
- `deploy_home_v7.py` —— 部署前端页面
- `start_springboot.py` —— 远端启动后端服务

> 部署脚本依赖服务器信息，已加入 `.gitignore`，请勿提交凭据。

---

## 环境要求

| 组件 | 版本 |
| --- | --- |
| Node.js | ≥ 18 |
| Java | 17 |
| Maven | ≥ 3.8 |
| MySQL | ≥ 8.0 |
| Electron | 42（仅桌面端需要） |

---

## License

MIT
