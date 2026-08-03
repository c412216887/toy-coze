---
name: coze-project-handoff
description: Coze AI 工作流平台项目交接上下文，记录架构决策、当前进度、已知问题。新对话开始时使用。
---

# Coze 项目交接上下文

## 项目定位

面向 B 端的可视化 AI 工作流配置平台，对标 Coze/Dify。用户可拖拽搭建工作流、接入多模型、使用知识库 RAG 问答。

---

## 仓库路径

`/Users/ewan/Desktop/Ewan/coze`

---

## 架构决策（已定稿，不要改变）

### 技术栈

| 层 | 技术 | 原因 |
|---|---|---|
| 前端 | Vue 3 + Vite + TypeScript + Vue Flow | 已定 |
| 主后端 | NestJS（Node.js/TypeScript） | HTTP IO 层，不做 AI 计算 |
| 工作流调度 | Temporal | 支持断点续跑，Celery 不支持 |
| AI 编排 | @langchain/langgraph（JS SDK）| 运行在 Temporal Worker 独立进程 |
| 知识库微服务 | Python FastAPI | RAG 生态 Python 更成熟 |
| 数据库 | PostgreSQL + pgvector | 业务 + 向量存储共用一个实例 |

### 关键架构决策

1. **Temporal Worker 独立进程**：Workflow 代码运行在 V8 沙箱，不能内嵌 NestJS，必须单独用 `pnpm dev:worker` 启动
2. **多语言微服务**：NestJS 做 HTTP IO，Python 做重型 AI 计算（RAG），通过 HTTP 通信
3. **数据库分库**：`coze_db`（业务）、`temporal`、`temporal_visibility` 三个库，同一 PostgreSQL 实例
4. **表名前缀**：`t_`（NestJS 主后端）、`ks_`（知识库微服务）

---

## 仓库结构

```
coze/
├── apps/
│   ├── frontend/           # Vue3 + Vue Flow
│   ├── backend/            # NestJS + Temporal Worker
│   └── knowledge-service/  # Python FastAPI + pgvector
├── infra/
│   └── init-db.sql         # PostgreSQL 初始化（建库 + pgvector）
├── docker-compose.yml      # 一键启动基础设施
├── pnpm-workspace.yaml
└── README.md
```

---

## 启动方式

```bash
# 基础设施
docker compose up -d

# 前端
pnpm dev:frontend

# NestJS 后端
pnpm dev:backend

# Temporal Worker（独立进程，需 Temporal 已启动）
pnpm dev:worker

# 知识库微服务
cd apps/knowledge-service
.venv/bin/uvicorn app.main:app --port 8001 --reload
```

---

## 当前进度

### 已完成

- [x] pnpm monorepo 结构搭建
- [x] `apps/frontend` Vue3 骨架（路由、布局、Vue Flow 编辑器页面、工具链）
- [x] `apps/backend` NestJS 骨架
  - 模块：auth / users / workflows / agents / models / knowledge / temporal
  - 实体：User / Workflow / WorkflowRun / Agent / ModelProvider
  - JWT 认证完整实现
  - Temporal Client + Worker 拆分为独立进程
  - LangGraph LLM 节点 Activity 骨架
- [x] `apps/knowledge-service` Python FastAPI 骨架
  - 文档解析（PDF / Word / MD）
  - 分块（RecursiveCharacterTextSplitter，中文友好）
  - 向量化（OpenAI Embedding，100条批量）
  - pgvector HNSW 索引存储
  - cosine 相似度检索
  - Alembic 迁移配置
- [x] `docker-compose.yml`：PostgreSQL + pgvector + Temporal Server + Temporal Web UI
- [x] README.md 完整文档

### 待完成（MVP 核心路径）

- [ ] 前端登录页（`/login`）
- [ ] 前端工作流列表页（`/workflow`）
- [ ] 前端工作流编辑器（Vue Flow 画布，LLM 节点 + 开始/结束节点）
- [ ] 前端 SSE 流式输出展示
- [ ] NestJS 工作流运行接口（`POST /workflows/:id/run`，触发 Temporal）
- [ ] Temporal Workflow 完整节点执行逻辑
- [ ] NestJS SSE 端点（转发 Temporal 执行进度）

---

## 已知问题 / 注意事项

### backend

1. **TypeORM 实体字段必须显式声明 `type`**
   `emitDecoratorMetadata` 对联合类型（`string | null`）会推断为 `Object`，导致 `DataTypeNotSupportedError`。所有 `@Column` 都要加 `type: 'varchar'` / `type: 'text'` 等。

2. **Temporal Worker 路径**
   开发模式（`ts-node`）下 `workflowsPath` 必须带 `.ts` 扩展名：
   ```ts
   path.resolve(__dirname, './workflows/workflow-execution.workflow.ts')
   ```
   生产编译后改为不带扩展名。

3. **reflect-metadata 必须最先导入**
   `src/main.ts` 第一行必须是 `import 'reflect-metadata'`，否则 TypeORM 装饰器反射失败。

4. **`pnpm dev:worker` 依赖 Temporal Server**
   Worker 启动失败不影响主服务，但工作流执行功能不可用。

### knowledge-service

1. **Python 版本**：必须用 Python 3.12，宿主机 Python 3.14/3.9 都有问题（3.14 pydantic-core 无轮子，3.9 无法建 venv）
2. **venv 路径**：`.venv/` 在 `apps/knowledge-service/` 下，用 `/opt/homebrew/bin/python3.12 -m venv .venv` 创建

### docker-compose

1. Temporal 使用 `temporalio/auto-setup:1.22.4`（固定版本），`latest` 有环境变量识别问题
2. `DB=postgres12`（不是 `postgresql`）
3. `init-db.sql` 会自动建 `temporal` / `temporal_visibility` 库并启用 `pgvector` 扩展，首次 `docker compose up` 自动执行

---

## NestJS 接口清单（已实现）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/register` | 注册 |
| POST | `/api/v1/auth/login` | 登录，返回 JWT |
| GET | `/api/v1/workflows` | 工作流列表 |
| POST | `/api/v1/workflows` | 创建工作流 |
| GET | `/api/v1/workflows/:id` | 工作流详情 |
| PUT | `/api/v1/workflows/:id` | 更新工作流 |
| DELETE | `/api/v1/workflows/:id` | 删除工作流 |
| GET | `/api/v1/workflows/:id/runs` | 运行记录列表 |

Swagger 文档：`http://localhost:3000/docs`

---

## 下一步建议

MVP 最小路径：**登录 → 创建工作流 → 编辑节点 → 运行 → 看结果**

优先级：
1. 前端登录页 + 工作流列表页（视觉工程）
2. 工作流编辑器（Vue Flow 节点拖拽）
3. 后端运行接口 + SSE 流式输出
4. 端到端跑通一次 LLM 节点执行
