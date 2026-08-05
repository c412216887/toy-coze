---
name: coze-mvp-prd
description: Coze AI 工作流平台 MVP 产品需求文档。记录 MVP 核心路径、功能模块、接口清单、数据结构与验收标准，开发时使用。
---

# Coze MVP 产品需求文档

## 一、产品定位

面向技术团队的**可视化 AI 工作流配置平台**，核心路径：用户登录 → 创建工作流 → 可视化编辑节点 → 运行 → 实时看到 LLM 输出结果。

MVP 目标：**跑通一条端到端链路**，验证技术可行性，不做多余功能。

---

## 二、MVP 核心路径

```
登录 → 工作流列表 → 新建工作流 → 编辑器（拖拽节点）→ 运行 → 看结果
```

---

## 三、功能模块

### 模块 1：用户认证

**页面：`/login`**

| 字段     | 说明                         |
| -------- | ---------------------------- |
| 邮箱     | 文本输入                     |
| 密码     | 密码输入                     |
| 登录按钮 | 调 `POST /api/v1/auth/login` |

交互规则：

- 登录成功 → JWT 存 `localStorage` → 跳转 `/workflow`
- 登录失败 → 表单下方红色提示文字（不弹窗）
- 已登录状态访问 `/login` → 自动重定向 `/workflow`
- 未登录访问受保护路由 → 重定向 `/login`

MVP 不做：注册页（后端接口已有，暂不做前端入口，开发阶段直接调接口创建测试账号）

---

### 模块 2：工作流列表

**页面：`/workflow`**

**列表展示：**

| 字段       | 说明                 |
| ---------- | -------------------- |
| 工作流名称 | 可点击，跳转编辑器   |
| 描述       | 单行截断，最多 60 字 |
| 创建时间   | `YYYY-MM-DD` 格式    |
| 操作       | 编辑按钮 / 删除按钮  |

**新建工作流：**

- 右上角「新建工作流」按钮
- 点击弹出 Dialog（不跳页），填写名称（必填）+ 描述（选填）
- 提交后调 `POST /api/v1/workflows`，成功后列表刷新，并自动跳转到新工作流的编辑器页

**删除：**

- 点击删除弹出二次确认（一句话 + 确认/取消按钮）
- 调 `DELETE /api/v1/workflows/:id`，成功后列表刷新

**空状态：**

- 无工作流时展示空状态插图 + 「创建第一个工作流」按钮

---

### 模块 3：工作流编辑器

**页面：`/workflow/:id/edit`**

#### 3.1 画布

- 使用 Vue Flow，背景网格点阵（dotted）
- 支持拖拽移动节点、连线、缩放、平移
- 默认初始化时放置一个**开始节点**和一个**结束节点**（首次打开）
- 工作流 JSON 存在后端 `t_workflow.graph_data` 字段（JSONB），对应 DTO 字段名 `graphData`

#### 3.2 节点类型（MVP 仅 3 种）

| 节点类型 | type 值     | 说明                                              |
| -------- | ----------- | ------------------------------------------------- |
| 开始节点 | `startNode` | 工作流入口，接收用户输入（单个文本 `input` 字段） |
| LLM 节点 | `llmNode`   | 调用大语言模型，含 System Prompt + 引用变量       |
| 结束节点 | `endNode`   | 工作流出口，展示输出内容                          |

**开始节点配置（右侧 Panel）：**

- 无需配置，仅展示「用户输入：`{{input}}`」说明

**LLM 节点配置（右侧 Panel）：**

| 配置项        | 类型               | 说明                                |
| ------------- | ------------------ | ----------------------------------- |
| 节点名称      | 文本输入           | 默认「LLM 节点」                    |
| System Prompt | 多行文本           | 支持 `{{变量名}}` 引用上游输出      |
| 模型          | 下拉选择           | 默认 `gpt-4o`，MVP 固定一个选项即可 |
| Temperature   | 滑块 0~2，步长 0.1 | 默认 0.7                            |

**结束节点配置（右侧 Panel）：**

- 配置「输出变量」，下拉选择上游节点的输出（MVP 固定选择 LLM 节点的 output）

#### 3.3 工具栏

顶部工具栏：

- 左侧：「← 返回列表」
- 中间：工作流名称（可点击内联编辑）
- 右侧：「保存」按钮 + 「运行」按钮

左侧节点面板（可折叠）：

- 列出可拖拽的节点类型：LLM 节点（开始/结束节点不允许从面板新增，一个工作流只能有一个）

#### 3.4 保存逻辑

- 点击「保存」→ 将 Vue Flow 的 `nodes` + `edges` 序列化为 JSON → 调 `PUT /api/v1/workflows/:id`（字段 `graphData`）
- 进入编辑器时，从 `GET /api/v1/workflows/:id` 加载 `graphData`，反序列化还原画布

---

### 模块 4：运行与结果展示

#### 4.1 触发运行

- 编辑器右上角「运行」按钮
- 点击弹出右侧抽屉（Drawer），包含：
  - 「用户输入」文本框（对应开始节点的 `input`）
  - 「开始运行」按钮

#### 4.2 SSE 流式结果展示

- 调 `POST /api/v1/workflows/:id/run`，Body：`{ "input": "..." }`
- 后端触发 Temporal 工作流，返回 `{ runId }`
- 前端随即连接 SSE 端点：`GET /api/v1/workflows/:id/runs/:runId/stream`
- Drawer 下半部分实时展示流式文字输出（打字机效果由后端逐 token 推送实现）
- 执行完毕显示「✓ 运行完成」状态标记

**SSE 事件格式（后端约定）：**

```
event: token
data: {"content": "这是"}

event: token
data: {"content": "一段"}

event: done
data: {"status": "completed", "runId": "xxx"}

event: error
data: {"message": "执行失败原因"}
```

#### 4.3 运行状态

| 状态      | 展示                          |
| --------- | ----------------------------- |
| pending   | 「运行中...」+ spinner        |
| streaming | 打字机实时输出                |
| completed | 「✓ 运行完成」                |
| failed    | 「✗ 运行失败：{message}」红色 |

---

## 四、接口清单

### 业务接口（已实现）

| 方法   | 路径                                       | 用途                            |
| ------ | ------------------------------------------ | ------------------------------- |
| POST   | `/api/v1/auth/login`                       | 登录                            |
| GET    | `/api/v1/workflows`                        | 工作流列表                      |
| POST   | `/api/v1/workflows`                        | 创建工作流                      |
| GET    | `/api/v1/workflows/:id`                    | 工作流详情（含 `graphData`）    |
| PUT    | `/api/v1/workflows/:id`                    | 保存工作流（含 `graphData`）    |
| DELETE | `/api/v1/workflows/:id`                    | 删除工作流                      |
| POST   | `/api/v1/workflows/:id/run`                | 触发工作流运行，返回 `{runId}`  |
| GET    | `/api/v1/workflows/:id/runs/:runId/stream` | SSE 流式输出                    |

### 内部接口（服务间通信，不对外暴露）

| 方法 | 路径                                  | 用途                                                   |
| ---- | ------------------------------------- | ------------------------------------------------------ |
| POST | `/api/v1/internal/runs/:runId/push`   | Temporal Worker 推送 token/done/error 事件到主进程 SSE |

> 内部接口需携带 `x-internal-secret` header，值来自环境变量 `INTERNAL_SECRET`。

---

## 五、工作流 graphData JSON 结构

```json
{
  "nodes": [
    {
      "id": "start-1",
      "type": "startNode",
      "position": { "x": 100, "y": 200 },
      "data": { "label": "开始" }
    },
    {
      "id": "llm-1",
      "type": "llmNode",
      "position": { "x": 400, "y": 200 },
      "data": {
        "label": "LLM 节点",
        "systemPrompt": "你是一个助手，请回答：{{input}}",
        "model": "gpt-4o",
        "temperature": 0.7
      }
    },
    {
      "id": "end-1",
      "type": "endNode",
      "position": { "x": 700, "y": 200 },
      "data": { "label": "结束", "outputSource": "llm-1" }
    }
  ],
  "edges": [
    { "id": "e1", "source": "start-1", "target": "llm-1" },
    { "id": "e2", "source": "llm-1", "target": "end-1" }
  ]
}
```

---

## 六、MVP 不做的功能

以下功能**明确排除在 MVP 之外**：

- 注册页面
- 多用户权限管理
- 工作流版本管理
- 条件分支节点（If/Else）
- 知识库 RAG 节点
- Agent 管理页面
- 模型供应商管理页面
- 工作流运行历史记录页
- 移动端适配

---

## 七、验收标准

MVP 验收只需满足以下 6 条：

1. 能用测试账号登录，看到工作流列表
2. 能新建工作流，进入编辑器
3. 编辑器能放置 LLM 节点并配置 System Prompt
4. 画布能保存，刷新后节点位置和配置不丢失
5. 点击运行，输入文字，能看到 LLM 流式输出结果
6. 整条链路跑通，LLM 实际回复正确内容
