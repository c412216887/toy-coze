# Coze — AI 工作流平台

面向 B 端的可视化 AI 工作流配置与编排平台，对标 Coze/Dify，支持拖拽搭建工作流、多模型接入、知识库 RAG 问答。

---

## 技术架构

```
┌─────────────────────────────────────────────────┐
│           CDN（Vercel / Netlify）                │
│         Vue 3 构建产物（静态托管）               │
└────────────────────┬────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────┐
│            NestJS 主后端（端口 3000）            │
│  · 用户认证（JWT）                              │
│  · 工作流 / Agent / 模型 CRUD                   │
│  · SSE 流式输出                                 │
└──────────────┬──────────────────────────────────┘
               │                    │
               ▼                    ▼
┌──────────────────────┐  ┌────────────────────────┐
│   Temporal Worker    │  │  Python 知识库微服务   │
│   （独立进程）       │  │    （端口 8001）        │
│   · 工作流持久化调度 │  │  · PDF / Word / MD 解析 │
│   · LangGraph 编排   │  │  · 向量化（OpenAI）     │
│   · 断点续跑 / 重试  │  │  · pgvector RAG 检索    │
└──────────┬───────────┘  └────────────────────────┘
           │                         │
           ▼                         │
┌──────────────────────┐             │
│   Temporal Server    │             │
│   （Docker，7233）   │             │
└──────────────────────┘             │
           │                         │
           └──────────┬──────────────┘
                      ▼
         ┌─────────────────────────┐
         │      PostgreSQL         │
         │  · coze_db（业务库）    │
         │    t_user               │
         │    t_workflow           │
         │    t_workflow_run       │
         │    t_agent              │
         │    t_model_provider     │
         │    ks_knowledge_base    │
         │    ks_document          │
         │    ks_document_chunk    │
         │  · temporal（调度库）   │
         │  · temporal_visibility  │
         └─────────────────────────┘
```

---

## 仓库结构

```
coze/
├── apps/
│   ├── frontend/           # Vue 3 + Vite + TypeScript + Vue Flow
│   ├── backend/            # NestJS 主后端 + Temporal Worker（独立进程）
│   └── knowledge-service/  # Python FastAPI + pgvector（RAG 微服务）
├── infra/
│   └── init-db.sql         # PostgreSQL 初始化脚本（自动建库、启用 pgvector）
├── docker-compose.yml      # 基础设施一键启动
├── pnpm-workspace.yaml
└── package.json
```

### apps/frontend

| 技术 | 说明 |
|------|------|
| Vue 3 + Vite | 前端框架与构建工具 |
| TypeScript | 全量类型覆盖 |
| Vue Flow | 工作流可视化画布 |
| Pinia | 状态管理 |
| Vue Router | 路由 |
| Axios | HTTP 请求 |
| ESLint + Prettier + Stylelint | 代码质量 |
| Husky + CommitLint | Git 提交规范 |

页面路由：

| 路由 | 页面 |
|------|------|
| `/` | 首页 |
| `/workflow` | 工作流列表 |
| `/workflow/:id/edit` | 工作流可视化编辑器 |
| `/agent` | Agent 管理 |
| `/knowledge` | 知识库 |
| `/settings` | 系统设置 |

### apps/backend

| 技术 | 说明 |
|------|------|
| NestJS 11 | 服务端框架 |
| TypeORM 0.3 + PostgreSQL | ORM 与数据库 |
| Temporal | 工作流持久化调度，支持断点续跑 |
| @langchain/langgraph | AI 工作流节点编排 |
| @langchain/openai | LLM 调用 |
| JWT + Passport | 用户认证 |
| Swagger | 接口文档（`/docs`）|

模块结构：

```
src/
├── auth/           # 登录、注册、JWT 策略
├── users/          # 用户实体与服务
├── workflows/      # 工作流 CRUD + 运行记录
├── agents/         # Agent 实体与服务
├── models/         # 模型供应商管理
├── knowledge/      # 知识库 HTTP 代理客户端
├── temporal/
│   ├── worker.ts           # Temporal Worker 独立入口（单独进程运行）
│   ├── workflows/          # Temporal Workflow 定义（LangGraph 编排）
│   ├── activities/         # Temporal Activity（LLM 节点执行）
│   ├── temporal-worker.service.ts
│   └── temporal-client.service.ts
└── config/         # 环境变量配置
```

> **注意**：Temporal Worker 运行在独立进程中（`pnpm dev:worker`），不内嵌于 NestJS 主进程。这是 Temporal 的架构要求——Workflow 代码运行在独立 V8 沙箱中，不能与普通 Node.js 代码混用。

### apps/knowledge-service

| 技术 | 说明 |
|------|------|
| Python 3.12 + FastAPI | 服务端框架 |
| SQLAlchemy 2.0 async | ORM |
| pgvector | 向量存储与 HNSW 索引检索 |
| pypdf + python-docx | PDF / Word 文档解析 |
| langchain-text-splitters | 递归分块（中文友好）|
| OpenAI Embeddings | 文本向量化 |
| Alembic | 数据库迁移 |

接口：

| 接口 | 说明 |
|------|------|
| `POST /api/v1/knowledge/bases` | 创建知识库 |
| `POST /api/v1/knowledge/bases/:kb_code/documents` | 上传文档（解析+入库）|
| `GET /api/v1/knowledge/bases/:kb_code/documents` | 文档列表 |
| `DELETE /api/v1/knowledge/documents/:doc_id` | 删除文档 |
| `POST /api/v1/search` | cosine 相似度检索 |

---

## 本地启动

### 前置依赖

- Node.js 18+
- pnpm 8+
- Python 3.12
- Docker Desktop

### 1. 启动基础设施（一键）

```bash
cd /path/to/coze
docker compose up -d
```

启动以下服务：

| 服务 | 端口 | 说明 |
|------|------|------|
| PostgreSQL + pgvector | `5432` | 自动建库、启用 pgvector 扩展 |
| Temporal Server | `7233` | gRPC，Worker 和 Client 连接 |
| Temporal Web UI | `8088` | 浏览器查看工作流执行历史 |

### 2. 前端

```bash
pnpm dev:frontend     # http://localhost:5173
```

### 3. NestJS 后端

```bash
cd apps/backend
cp .env.example .env  # 填写 OPENAI_API_KEY 等
cd ../..
pnpm dev:backend      # http://localhost:3000
                      # Swagger 文档：http://localhost:3000/docs
```

### 4. Temporal Worker（独立进程）

```bash
pnpm dev:worker       # 需要 Temporal Server 已启动
```

### 5. 知识库微服务

```bash
cd apps/knowledge-service
cp .env.example .env  # 填写 OPENAI_API_KEY
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --port 8001 --reload
```

---

## 环境变量

### apps/backend/.env

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://coze:coze123@localhost:5432/coze_db` |
| `JWT_SECRET` | JWT 签名密钥 | — |
| `OPENAI_API_KEY` | OpenAI API Key | — |
| `OPENAI_BASE_URL` | API Base URL（支持代理）| `https://api.openai.com/v1` |
| `DEFAULT_LLM_MODEL` | 默认模型 | `gpt-4o` |
| `KNOWLEDGE_SERVICE_URL` | 知识库微服务地址 | `http://localhost:8001` |
| `TEMPORAL_ADDRESS` | Temporal 服务地址 | `localhost:7233` |
| `TEMPORAL_NAMESPACE` | Temporal 命名空间 | `default` |

### apps/knowledge-service/.env

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接串（同库）| `postgresql+asyncpg://coze:coze123@localhost:5432/coze_db` |
| `OPENAI_API_KEY` | OpenAI API Key | — |
| `EMBEDDING_MODEL` | Embedding 模型 | `text-embedding-3-small` |
| `EMBEDDING_DIMENSIONS` | 向量维度 | `1536` |

---

## 数据库说明

所有库运行在同一个 PostgreSQL 实例，按用途分库：

| 库名 | 用途 |
|------|------|
| `coze_db` | 业务数据，`t_` 前缀（NestJS）+ `ks_` 前缀（知识库服务）|
| `temporal` | Temporal 调度持久化 |
| `temporal_visibility` | Temporal 工作流查询索引 |

---

## 开发规范

- 前端包管理器：**必须使用 pnpm**，禁止 npm / yarn
- 提交格式：遵循 [Conventional Commits](https://www.conventionalcommits.org/)（feat / fix / docs / style / refactor / perf / test / chore）
- 代码风格：ESLint + Prettier 自动格式化，提交前 husky 自动触发
- 分支策略：`main` 保持可发布状态，功能开发在 `feat/xxx` 分支
