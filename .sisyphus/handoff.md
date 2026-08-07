---
name: coze-project-handoff
description: Coze AI 工作流平台项目交接上下文，记录架构决策、当前进度、已知问题。新对话开始时使用。
---

# Coze 项目交接上下文

## 项目定位

面向 B 端的可视化 AI 工作流配置平台，对标 Coze/Dify。用户可拖拽搭建工作流、接入多模型、使用知识库 RAG 问答。

MVP 目标：**跑通一条端到端链路**——登录 → 工作流列表 → 编辑器拖拽节点 → 运行 → 实时看到 LLM 流式输出。

**MVP 端到端链路已全部跑通。**

---

## 仓库路径

`/Users/ewan/Desktop/Ewan/coze`

---

## 架构总览

```
前端 (Vue3) :5173
    │ HTTPS (Vite proxy)
NestJS 主后端 :3000
    ├── JWT 认证
    ├── 工作流 CRUD
    ├── POST /workflows/:id/run        → 创建 ReplaySubject 缓存，触发 Temporal
    ├── SSE  /workflows/:id/runs/:runId/stream  → 订阅 ReplaySubject，重放已缓存 token
    └── POST /internal/runs/:runId/push  ← Worker 回调（x-internal-secret 鉴权）
          │
    Temporal Server :7233
          │
    Temporal Worker 微服务 (apps/temporal-worker，独立 ESM 进程)
          └── Activity: executeWorkflowNode
                └── Vercel AI SDK streamText → 逐 token POST /internal/push
PostgreSQL :5432
    ├── coze_db      (业务：t_ 前缀 NestJS，ks_ 前缀知识库)
    ├── temporal
    └── temporal_visibility

Python 知识库微服务 :8001 (MVP 暂不涉及)
```

### 关键架构决策

| 决策 | 原因 |
|---|---|
| Temporal Worker 独立微服务 (`apps/temporal-worker`) | Workflow 代码运行在 V8 沙箱，不能内嵌 NestJS；代码解耦便于独立部署 |
| Worker → NestJS 内部 HTTP 推 token | Worker 和主进程不共享内存，用 `POST /internal/push` 作为桥接 |
| `ReplaySubject` 替代 `EventEmitter` | 解决时序问题：Worker 推完 token 后前端才连 SSE，ReplaySubject 可重放历史事件 |
| `runStreams` Map 管理生命周期 | `done`/`error` 后 complete，30 秒后清理，防内存泄漏 |
| Vercel AI SDK (`ai@7` + `@ai-sdk/openai@4`) | LangChain 仅用了最薄的封装层，SDK 正确 token 计数，ESM 原生支持 |
| temporal-worker 整体 ESM | `ai`/`@ai-sdk/openai` 是纯 ESM 包；tsx 运行，NodeNext 模块解析 |
| `dotenv/config` 第一行 import | ESM 静态 import 按源码顺序执行，保证 activities 读 env 时已加载 |
| `workflowsPath` 用 `import.meta.url` | ESM 下无 `__dirname`，`new URL('./...', import.meta.url).pathname` 跨环境可靠 |
| SSE data 解析从 `parsed.data.type` 读 | NestJS `@Sse` 将 MessageEvent 对象序列化为 `{"data":{...}}`，type 在内层 |
| fetch + ReadableStream 替代 EventSource | EventSource 不支持自定义 header，无法携带 JWT |
| 画布数据字段名 `graphData` | 后端实体列名 `graph_data`，DTO 字段名 `graphData` |

---

## 仓库结构

```
coze/
├── apps/
│   ├── frontend/                        # Vue3 + Vite + TypeScript
│   │   └── src/
│   │       ├── api/
│   │       │   ├── request.ts           # axios 封装，自动带 JWT
│   │       │   ├── auth.ts
│   │       │   └── workflow.ts          # 工作流全部接口 + SSE AsyncGenerator
│   │       ├── stores/
│   │       │   ├── auth.ts
│   │       │   └── workflow.ts          # Pinia store
│   │       ├── pages/
│   │       │   ├── login/LoginPage.vue
│   │       │   └── workflow/
│   │       │       ├── WorkflowPage.vue       # 列表页
│   │       │       └── WorkflowEditorPage.vue # 编辑器页（从 nodeRegistry 驱动）
│   │       ├── components/nodes/        # 节点注册表架构
│   │       │   ├── registry.ts          # NodeDefinition 接口 + 所有节点注册（唯一改动点）
│   │       │   ├── index.ts             # 自动派生 nodeTypes / configPanelMap
│   │       │   ├── StartNode.vue        # 画布节点
│   │       │   ├── StartNodeConfig.vue  # 配置面板
│   │       │   ├── LlmNode.vue
│   │       │   ├── LlmNodeConfig.vue
│   │       │   ├── EndNode.vue
│   │       │   └── EndNodeConfig.vue
│   │       ├── assets/styles/main.scss  # 全局公共样式（form-field / config-panel）
│   │       └── layouts/DefaultLayout.vue
│   ├── backend/
│   │   └── src/
│   │       ├── workflows/
│   │       │   ├── workflow.entity.ts
│   │       │   ├── workflow.dto.ts
│   │       │   ├── workflows.service.ts
│   │       │   ├── workflows.controller.ts  # WorkflowsController + InternalController
│   │       │   │                            # runStreams: Map<string, ReplaySubject>
│   │       │   └── workflows.module.ts
│   │       ├── temporal/
│   │       │   ├── temporal-client.service.ts  # Temporal Client
│   │       │   ├── temporal-worker.service.ts  # 占位（Worker 已独立）
│   │       │   ├── temporal.module.ts
│   │       │   └── temporal.types.ts           # WorkflowRunInput
│   │       └── config/app.config.ts
│   ├── temporal-worker/                 # 独立 ESM 微服务
│   │   ├── src/
│   │   │   ├── worker.ts                # 入口：import 'dotenv/config' 第一行
│   │   │   ├── workflows/
│   │   │   │   └── workflow-execution.workflow.ts
│   │   │   └── activities/
│   │   │       └── workflow.activities.ts  # Vercel AI SDK streamText，getEnv() 懒读
│   │   ├── .env                         # 本地环境变量（不提交）
│   │   └── .env.example
│   └── knowledge-service/               # Python FastAPI（MVP 暂不涉及）
├── .sisyphus/
│   ├── mvp.md
│   └── handoff.md
├── docker-compose.yml
└── pnpm-workspace.yaml
```

---

## 启动方式

```bash
# 基础设施
docker compose up -d

# 前端  http://localhost:5173
pnpm dev:frontend

# NestJS 后端  http://localhost:3000  Swagger: /docs
pnpm dev:backend

# Temporal Worker（需 Temporal Server 已启动）
# 首次需 cp apps/temporal-worker/.env.example apps/temporal-worker/.env 并填写 Key
pnpm dev:worker
```

---

## MVP 当前进度

### 前端

| 模块 | 状态 | 文件 |
|---|---|---|
| 模块1 登录页 | ✅ | `pages/login/LoginPage.vue` |
| 模块2 工作流列表 | ✅ | `pages/workflow/WorkflowPage.vue` |
| 模块3 工作流编辑器 | ✅ | `pages/workflow/WorkflowEditorPage.vue` |
| 模块4 运行与流式输出 | ✅ | `WorkflowEditorPage.vue` 内运行 Drawer |

### 后端

| 接口 | 状态 |
|---|---|
| `POST /api/v1/auth/login` | ✅ |
| `GET/POST /api/v1/workflows` | ✅ |
| `GET/PUT/DELETE /api/v1/workflows/:id` | ✅ |
| `POST /api/v1/workflows/:id/run` | ✅ |
| `GET /api/v1/workflows/:id/runs/:runId/stream` (SSE) | ✅ |
| `POST /api/v1/internal/runs/:runId/push` | ✅ |

### 运行链路（已验证）

1. `POST /run` → 创建 `ReplaySubject` 缓存到 `runStreams` → 触发 Temporal Workflow
2. Temporal Worker 执行 `runWorkflowExecution` → 遍历节点 → `executeWorkflowNode`
3. `llmNode` → `executeLlmNode`：`streamText()` streaming → 每个 token `POST /internal/push`
4. `InternalController.push()` 验证 secret → `subject.next(payload)`
5. SSE `streamRun`：订阅 `ReplaySubject`，重放所有已缓存事件，实时推送后续 token
6. 前端 `parseSseBlock` 解析 `data.data.type` → 累加到 `runDrawer.output`

---

## 节点注册表架构（新增节点的方式）

**新增一个节点类型只需两步，编辑器零改动：**

1. 新建 `XxxNode.vue` + `XxxNodeConfig.vue`
2. 在 `components/nodes/registry.ts` 加一个 `NodeDefinition` 对象：
   - `type` / `label` / `component` / `configPanel`
   - `defaultData()` — 拖入时的初始 data
   - `miniMapColor` — minimap 颜色
   - `draggable` — 是否出现在左侧面板

---

## 环境变量

### apps/backend/.env

```env
DATABASE_URL=postgresql://coze:coze123@localhost:5432/coze_db
JWT_SECRET=dev-secret-change-in-production
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
DEFAULT_LLM_MODEL=gpt-4o
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
INTERNAL_SECRET=internal-dev-secret
KNOWLEDGE_SERVICE_URL=http://localhost:8001
```

### apps/temporal-worker/.env

```env
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
INTERNAL_BASE_URL=http://localhost:3000
INTERNAL_SECRET=internal-dev-secret
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
DEFAULT_LLM_MODEL=gpt-4o
```

---

## 已知问题 / 注意事项

### 后端

1. **`workflow.entity.ts` LSP 报 binary**：LSP 误判（BOM 编码问题），`tsc --noEmit` 零错误，可忽略
2. **TypeORM `@Column` 必须显式声明 `type`**：`emitDecoratorMetadata` 对联合类型推断为 `Object`
3. **`reflect-metadata` 必须最先导入**：`src/main.ts` 第一行

### Temporal Worker

1. **整体 ESM**：`package.json` `"type": "module"`，用 `tsx` 运行，不能用 `ts-node`
2. **`workflowsPath` 指向 `.ts`**：tsx 运行时不存在 `.js` 文件，用 `new URL('./workflows/...workflow.ts', import.meta.url).pathname`
3. **`dotenv/config` 必须第一行 import**：ESM 静态 import 按源码顺序执行，保证 activities 读 env 时已加载
4. **`getEnv()` 懒读**：activities 模块级常量改为函数内读取，防止 import 提升导致 env 未加载
5. **activities 不能 import NestJS 模块**：同进程但无 NestJS 上下文，只能用原生 fetch

### 前端

1. **Vue Flow 连线必须手动处理 `onConnect`**
2. **编辑器路由脱离 DefaultLayout**：`/workflow/:id/edit` 独立全屏路由
3. **nodes/edges 用 `ref` 不用 `shallowRef`**：Vue Flow 拖动直接改 position
4. **SSE 数据格式**：NestJS `@Sse` 输出 `data: {"data":{...}}`，type 在 `parsed.data.type`
5. **Vite proxy SSE**：已加 `configure` 钩子注入 `x-accel-buffering: no` 防缓冲

### 待完成（MVP 后续）

- [ ] 知识库微服务接入（Python FastAPI :8001）
- [ ] 注册页面（当前只有 API，无前端入口）
- [ ] 工作流运行历史列表
