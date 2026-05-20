# My Ledger

My Ledger 是一个本地优先的个人记账应用，支持收支记录、分类筛选、统计汇总、图表分析、运行日志和数据库备份。

## 功能

- 记录收入和支出
- 按月份或年份查看账目
- 统计收入、支出、结余和记录数量
- 查看支出分类分布与每日收支趋势
- 手动和定时备份 SQLite 数据库
- 查看后端运行日志
- 可选局域网访问
- 局域网访问密码和限时 token
- 自定义收入/支出分类、排序和图标

## 技术栈

- 后端：Python 3 + FastAPI + SQLAlchemy + SQLite
- 前端：React + TypeScript + Vite + Tailwind CSS + Recharts

## 快速开始

环境要求：

- Python 3.12 或更新版本
- Node.js 22 或更新版本
- npm 11 或更新版本

### 手动启动

启动后端：

```bash
cd backend
pip install -r requirements.txt
python main.py
```

启动前端：

```bash
cd my-ledger-front
npm install
npm run dev
```

默认访问地址：

- 前端：http://127.0.0.1:3000
- 后端：http://127.0.0.1:8000
- API 文档：http://127.0.0.1:8000/docs

### 一键启动

Windows：

```bash
start-all.bat
```

Mac/Linux：

```bash
chmod +x start.sh
./start.sh
```

## 配置

后端支持以下环境变量：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `MY_LEDGER_DATABASE_URL` | `sqlite:///./ledger.db` | 数据库连接地址 |
| `MY_LEDGER_BACKEND_HOST` | `127.0.0.1` | 后端监听地址 |
| `MY_LEDGER_BACKEND_PORT` | `8000` | 后端监听端口 |
| `MY_LEDGER_CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | 允许跨域来源，多个值用逗号分隔 |

前端开发服务支持以下环境变量：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `MY_LEDGER_FRONTEND_HOST` | `127.0.0.1` | 前端监听地址 |
| `MY_LEDGER_FRONTEND_PORT` | `3000` | 前端监听端口 |
| `MY_LEDGER_BACKEND_HOST` | `127.0.0.1` | 前端代理访问的后端地址 |
| `MY_LEDGER_BACKEND_PORT` | `8000` | 前端代理访问的后端端口 |

局域网访问需要显式将前端监听地址配置为 `0.0.0.0`，并确保防火墙允许前端端口。后端可以继续只监听本机，由前端代理转发请求并带上真实访问来源。个人账本包含敏感数据，只建议在可信网络中开启。

## 局域网访问密码

My Ledger 会区分本机访问和局域网设备访问：

- 本机访问不需要输入密码。
- 本机可在设置页开启局域网访问，并查看或修改局域网访问密码。
- 非本机访问受保护接口时需要输入局域网访问密码。
- 密码验证成功后，前端会保存一个访问 token，默认 12 小时内无需再次输入密码。
- 如果开启了局域网访问但没有设置密码，非本机设备不能访问账本数据。

## API

### 账目管理

| 方法 | 路径 | 功能 |
| --- | --- | --- |
| `POST` | `/api/ledger/` | 新增账目 |
| `POST` | `/api/ledger/batch` | 批量导入账目 |
| `GET` | `/api/ledger/` | 查询账目列表 |
| `GET` | `/api/ledger/{id}` | 查询单个账目 |
| `PUT` | `/api/ledger/{id}` | 修改账目 |
| `DELETE` | `/api/ledger/{id}` | 删除账目 |
| `GET` | `/api/ledger/summary/` | 统计汇总 |
| `GET` | `/api/ledger/categories/` | 查询所有分类名称，兼容旧接口 |

### 系统接口

| 方法 | 路径 | 功能 |
| --- | --- | --- |
| `GET` | `/api/settings/` | 获取设置 |
| `PUT` | `/api/settings/` | 更新设置 |
| `GET` | `/api/settings/ip` | 获取本机 IP |
| `GET` | `/api/auth/status` | 查询访问校验状态 |
| `POST` | `/api/auth/login` | 使用局域网访问密码换取 token |
| `GET` | `/api/categories/` | 查询分类配置 |
| `PUT` | `/api/categories/` | 更新分类配置 |
| `POST` | `/api/categories/reset` | 重置默认分类配置 |
| `GET` | `/api/logs/` | 查看运行日志 |
| `POST` | `/api/backup/` | 手动备份数据库 |
| `GET` | `/api/backup/` | 查看备份列表 |

## 数据文件

账目金额在数据库中按“分”存储，API 仍使用元为单位的 `amount` 字段，避免浮点误差影响汇总。

以下文件是运行时生成的本地数据，不应提交到仓库：

- 数据库：`backend/ledger.db`
- 设置：`backend/settings.json`
- 分类：`backend/categories.json`
- 日志：`backend/logs/app.log`
- 备份：`backend/backups/`

## 开发检查

前端类型检查和构建：

```bash
cd my-ledger-front
npm run lint
npm run build
```

后端语法检查：

```bash
python -m compileall backend
```

## 贡献

欢迎提交 issue 和 pull request。开始前请阅读 `CONTRIBUTING.md`。

## 安全

这个项目默认用于个人本地记账，局域网访问只提供简单密码和限时 token 保护。公开部署或局域网访问前，请先阅读 `SECURITY.md`。

## 许可证

Apache License 2.0。详情见 `LICENSE`。
