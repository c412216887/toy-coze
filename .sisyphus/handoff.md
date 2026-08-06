---
name: coze-project-handoff
description: Coze AI 工作流平台项目交接上下文，记录架构决策、当前进度、已知问题。新对话开始时使用。
---

# Coze 项目交接上下文

## 项目定位

面向 B 端的可视化 AI 工作流配置平台，对标 Coze/Dify。用户可拖拽搭建工作流、接入多模型、使用知识库 RAG 问答。

MVP 目标：**跑通一条端到端链路**——登录 → 工作流列表 → 编辑器拖拽节点 → 运行 → 实时看到 LLM 流式输出。

---

## 仓库路径

`/Users/ewan/Desktop/Ewan/coze`

---

## 架构总览

```
前端 (Vue3)
    │ HTTPS
NestJS 主后端 :3000
    ├── JWT 认证
    ├── 工作流 CRUD
    ├── POST /workflows/:id/run   → 触发 Temporal
    ├── SSE  /workflows/:id/runs/:runId/stream  → 转发 token
    └── POST /internal/runs/:runId/push  ← Worker 回调
          │
    Temporal Server :7233
          │
    Temporal Worker 微服务 (apps/temporal-worker，独立进程)
          └── Activity: executeWorkflowNode
                └── OpenAI streaming → 逐 token POST /internal/push
PostgreSQL :5432
    ├── coze_db      (业务：t_ 前缀 NestJS，ks_ 前缀知识库)
    ├── temporal
    └── temporal_visibility

Python 知识库微服务 :8001 (MVP 暂不涉及)
```

### 关键架构决策

| 决策 | 原因 |
|---|---|
| Temporal Worker 独立进程 | Workflow 代码运行在 V8 沙箱，不能内嵌 NestJS |
| Worker → NestJS 内部 HTTP 推 token | Worker 和主进程不共享内存，EventEmitter 无法跨进程，用 `POST /internal/push` 作为桥接 |
| fetch + ReadableStream 替代 EventSource | EventSource 不支持自定义 header，无法携带 JWT；fetch 支持完整 header + 断线重连 |
| SSE 端点保留 JWT Guard | fetch 可携带 Authorization header，无需移除鉴权 |
| 画布数据字段名 `graphData` | 后端实体列名 `graph_data`，DTO 字段名 `graphData`，前端对齐后端（历史文档写的 `definition` 已全部修正） |

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
│   │       │       ├── WorkflowPage.vue       # 列表页（模块2，已完成）
│   │       │       └── WorkflowEditorPage.vue # 编辑器页（模块3+4，已完成）
│   │       ├── components/nodes/
│   │       │   ├── StartNode.vue
│   │       │   ├── LlmNode.vue
│   │       │   └── EndNode.vue
│   │       └── layouts/DefaultLayout.vue
│   ├── backend/
│   │   └── src/
│   │       ├── workflows/
│   │       │   ├── workflow.entity.ts   # Workflow + WorkflowRun 实体
│   │       │   ├── workflow.dto.ts      # CreateWorkflowDto / UpdateWorkflowDto / RunWorkflowDto
│   │       │   ├── workflows.service.ts # 含 runWorkflow()
│   │       │   ├── workflows.controller.ts  # WorkflowsController + InternalController
│   │       │   └── workflows.module.ts
│   │       ├── temporal/
│   │       │   ├── temporal-client.service.ts  # Temporal Client（向 Server 提交任务）
│   │       │   ├── temporal-worker.service.ts  # NestJS 生命周期占位（Worker 已独立）
│   │       │   ├── temporal.module.ts
│   │       │   └── temporal.types.ts           # 共享类型 WorkflowRunInput
│   │       └── config/app.config.ts     # 含 internalSecret / internalBaseUrl
│   ├── temporal-worker/                 # ← Temporal Worker 独立微服务
│   │   └── src/
│   │       ├── worker.ts                # 入口，连接 Temporal Server，注册 Activities
│   │       ├── workflows/
│   │       │   └── workflow-execution.workflow.ts  # Workflow 定义
│   │       └── activities/
│   │           └── workflow.activities.ts          # LLM streaming + token push
│   └── knowledge-service/               # Python FastAPI（MVP 暂不涉及）
├── .sisyphus/
│   ├── mvp.md                           # MVP PRD（已同步最新接口和字段）
│   └── handoff.md                       # 本文件
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

# Temporal Worker 微服务（需 Temporal Server 已启动）
# apps/temporal-worker 需先 cp .env.example .env 并填写环境变量
pnpm dev:worker
```

---

## MVP 当前进度

### 前端

| 模块 | 状态 | 文件 |
|---|---|---|
| 模块1 登录页 | ✅ 已完成 | `pages/login/LoginPage.vue` |
| 模块2 工作流列表 | ✅ 已完成 | `pages/workflow/WorkflowPage.vue` |
| 模块3 工作流编辑器 | ✅ 已完成 | `pages/workflow/WorkflowEditorPage.vue` |
| 模块4 运行与流式输出 | ✅ 已完成 | `WorkflowEditorPage.vue` 内运行 Drawer |

**模块3 实现细节：**
- Vue Flow 画布，dotted 背景，MiniMap + Controls
- 3 种自定义节点：`startNode` / `llmNode` / `endNode`，对应 `components/nodes/`
- 顶部工具栏：返回列表、工作流名称内联编辑、保存、运行
- 左侧节点面板可折叠，LLM 节点可拖拽到画布
- 右侧配置面板：点击节点展开，支持 System Prompt / 模型 / Temperature 配置
- 保存：序列化为 `graphData` 结构，`PUT /api/v1/workflows/:id`
- 加载：从 `GET /api/v1/workflows/:id` 的 `graphData` 反序列化还原画布
- 首次进入自动放置开始节点 + 结束节点

**模块4 实现细节：**
- 运行 Drawer（右侧固定抽屉，滑入动画）
- `POST /api/v1/workflows/:id/run` 触发，获取 `runId`
- `streamWorkflowRun()` 用 `fetch + ReadableStream` 手动解析 SSE，携带 JWT header
- 断线自动重连：最多 3 次，间隔 2 秒，`AbortSignal` 支持立即中止
- 4 种状态：`pending` / `streaming`（打字机）/ `completed` / `failed`

### 后端

| 接口 | 状态 |
|---|---|
| `POST /api/v1/auth/login` | ✅ |
| `GET/POST /api/v1/workflows` | ✅ |
| `GET/PUT/DELETE /api/v1/workflows/:id` | ✅ |
| `POST /api/v1/workflows/:id/run` | ✅ |
| `GET /api/v1/workflows/:id/runs/:runId/stream` (SSE) | ✅ |
| `POST /api/v1/internal/runs/:runId/push` | ✅ |

**运行链路：**
1. `POST /run` → `WorkflowsService.runWorkflow()` → 创建 `WorkflowRun` 记录 → `TemporalClientService.startWorkflowRun()`
2. Temporal Worker 执行 `runWorkflowExecution` → 遍历节点 → `executeWorkflowNode`
3. `llmNode` 对应 `executeLlmNode`：OpenAI streaming → 每个 token `fetch POST /internal/runs/:runId/push`
4. `InternalController.push()` 验证 `x-internal-secret` → `eventEmitter.emit('run.${runId}', payload)`
5. SSE `streamRun`：`fromEvent(eventEmitter, 'run.${runId}')` → `takeUntil(done$)` → `map` 格式化 → `@Sse` 写入响应

---

## 重要字段对应关系

| 概念 | 前端类型 | 后端 DTO | 数据库列 |
|---|---|---|---|
| 画布数据 | `WorkflowDefinition` | `graphData` | `graph_data` (JSONB) |
| 节点类型标识 | `startNode` / `llmNode` / `endNode` | 存入 `graphData.nodes[].type` | 同左 |
| 用户 token | `localStorage.coze_token` | JWT Bearer | — |
| 内部鉴权 | — | `x-internal-secret` header | — |

---

## graphData JSON 结构

```json
{
  "nodes": [
    { "id": "start-1", "type": "startNode", "position": {"x":80,"y":180}, "data": {"label":"开始"} },
    { "id": "llm-1",   "type": "llmNode",   "position": {"x":400,"y":180},
      "data": {"label":"LLM 节点","systemPrompt":"你是助手，请回答：{{input}}","model":"gpt-4o","temperature":0.7} },
    { "id": "end-1",   "type": "endNode",   "position": {"x":700,"y":180}, "data": {"label":"结束","outputSource":"llm-1"} }
  ],
  "edges": [
    {"id":"e1","source":"start-1","target":"llm-1"},
    {"id":"e2","source":"llm-1","target":"end-1"}
  ]
}
```

---

## 环境变量（apps/backend/.env）

```env
DATABASE_URL=postgresql://coze:coze123@localhost:5432/coze_db
JWT_SECRET=dev-secret-change-in-production
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
DEFAULT_LLM_MODEL=gpt-4o
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
INTERNAL_SECRET=internal-dev-secret       # Worker 回调鉴权
INTERNAL_BASE_URL=http://localhost:3000   # Worker 回调地址
```

---

## 已知问题 / 注意事项

### 后端

1. **`workflow.entity.ts` LSP 报 binary**：LSP 误判（BOM 编码问题），`tsc --noEmit` 零错误，可忽略
2. **TypeORM `@Column` 必须显式声明 `type`**：`emitDecoratorMetadata` 对联合类型推断为 `Object`，会报 `DataTypeNotSupportedError`
3. **Temporal Worker 路径**：`ts-node` 开发模式下 `workflowsPath` 必须带 `.ts` 扩展名
4. **`reflect-metadata` 必须最先导入**：`src/main.ts` 第一行，否则 TypeORM 装饰器反射失败
5. **`activities/workflow.activities.ts` 不能 import NestJS 模块**：运行在 Temporal Worker 独立进程，无 NestJS 上下文，只能用原生 `fetch` 和 `process.env`

### 前端

1. **Vue Flow 连线必须手动处理 `onConnect`**：`v-model:edges` 不自动添加边，需：
   ```ts
   const { onConnect, addEdges } = useVueFlow()
   onConnect(params => addEdges([params]))
   ```
2. **编辑器路由脱离 DefaultLayout**：`/workflow/:id/edit` 是独立全屏路由，不在 DefaultLayout children 下
3. **nodes/edges 用 `ref` 不用 `shallowRef`**：Vue Flow 内部直接修改节点属性（拖动更新 position），`shallowRef` 不追踪深层变化会导致渲染不更新

### 待完成（MVP 验收剩余）

- [ ] 端到端实际跑通验证（需要填写有效的 `OPENAI_API_KEY`）
- [ ] Temporal Worker 与 NestJS 联调测试
- [ ] 创建测试账号（注册接口已有，暂无前端入口，直接调 `POST /api/v1/auth/register`）
