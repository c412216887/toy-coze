# Workflow 执行流程详解

## 概览

Temporal Worker 负责执行工作流，通过 BFS（广度优先搜索）遍历节点 DAG，支持条件分支路由。

---

## 核心组件

### 1. Workflow 入口
**文件**: `apps/temporal-worker/src/workflows/workflow-execution.workflow.ts`

**主函数**: `runWorkflowExecution(input: WorkflowRunInput)`

**输入参数**:
```typescript
{
  runId: string          // 运行 ID
  workflowId: string     // 工作流 ID
  userId: string         // 用户 ID
  graphData: {           // 画布数据
    nodes: GraphNode[]   // 节点列表
    edges: GraphEdge[]   // 边列表
  }
  inputs: {              // 用户输入
    input: string        // 开始节点的输入值
  }
}
```

---

## 执行流程

### 阶段 1: 初始化

```typescript
const nodes = input.graphData.nodes       // 提取节点列表
const edges = input.graphData.edges       // 提取边列表
const nodeMap = new Map(nodes.map(n => [n.id, n]))  // 节点 id → 节点对象
const adj = buildAdjacency(edges)         // 构建邻接表 source → [{target, sourceHandle}]
const nodeOutputs = {}                    // 存储每个节点的执行结果
const visited = new Set()                 // 防止重复执行
const queue = [startNode.id]              // BFS 队列，从 startNode 开始
```

**邻接表构建** (`buildAdjacency`):
- 输入: `edges` 数组
- 输出: `Map<nodeId, [{target, sourceHandle}]>`
- 关键逻辑: 
  - 优先使用 `edge.sourceHandle`
  - 如果为空，从 VueFlow 自动生成的 edge id 中解析
  - 格式: `vueflow__edge-{source}{handle}-{target}`
  - 正则匹配: `source(true|false)-target` 提取 handle

---

### 阶段 2: BFS 遍历

```typescript
while (queue.length > 0) {
  const nodeId = queue.shift()
  if (visited.has(nodeId)) continue  // 已执行，跳过（处理分支合并）
  visited.add(nodeId)
  
  const node = nodeMap.get(nodeId)
  
  // 1. 执行节点
  const output = await executeWorkflowNode({
    runId,
    nodeId: node.id,
    nodeType: node.type,
    nodeData: node.data,
    inputs: input.inputs,
    previousOutputs: nodeOutputs
  })
  
  // 2. 存储结果（按 name 索引）
  const name = node.data.name || node.data.label || node.id
  nodeOutputs[name] = output  // { nodeId, result, tokensUsed }
  totalTokens += output.tokensUsed
  
  // 3. 决定下一步走向
  const outEdges = adj.get(nodeId) ?? []
  
  if (node.type === 'conditionNode') {
    // 条件分支：只走匹配的 handle 方向
    const branch = output.result.branch  // 'true' 或 'false'
    for (const edge of outEdges) {
      if (edge.sourceHandle === branch && !visited.has(edge.target)) {
        queue.push(edge.target)
      }
    }
  } else {
    // 普通节点：所有出边都走
    for (const edge of outEdges) {
      if (!visited.has(edge.target)) {
        queue.push(edge.target)
      }
    }
  }
}
```

**关键机制**:
- **visited 集合**: 防止两个分支归一到同一节点时重复执行
- **条件路由**: 条件节点根据 `branch` 值只推入匹配 `sourceHandle` 的下游节点
- **按名称索引**: `nodeOutputs[name]` 存储结果，供下游通过 `{{name}}` 引用

---

### 阶段 3: 节点执行器

**文件**: `apps/temporal-worker/src/activities/workflow.activities.ts`

**统一入口**: `executeWorkflowNode(input: NodeExecutionInput)`

```typescript
switch (input.nodeType) {
  case 'startNode':
    return { nodeId, result: input.inputs.input ?? '', tokensUsed: 0 }
  
  case 'llmNode':
    return executeLlmNode(input)  // 调用 LLM，逐 token 推送
  
  case 'httpNode':
    return executeHttpNode(input)  // 发起 HTTP 请求
  
  case 'codeNode':
    return executeCodeNode(input)  // 执行 JS 代码（vm 沙箱）
  
  case 'conditionNode':
    return executeConditionNode(input)  // 求值表达式，返回 {branch, passed}
  
  case 'knowledgeNode':
    return executeKnowledgeNode(input)  // 知识库检索
  
  case 'endNode':
    return executeEndNode(input)  // 渲染输出模板
  
  default:
    return { nodeId, result: null, tokensUsed: 0 }
}
```

---

## 各节点执行器详解

### 1. startNode
```typescript
{
  nodeId: input.nodeId,
  result: input.inputs.input ?? '',  // 用户输入的字符串
  tokensUsed: 0
}
```
- 作用: 将用户输入暴露为 `start_1` 变量
- 下游通过 `{{start_1}}` 或表达式 `start_1 === 'xxx'` 引用

---

### 2. llmNode
```typescript
async function executeLlmNode(input) {
  const { systemPrompt, model, temperature } = input.nodeData
  const ctx = buildContext(input)
  const resolvedPrompt = renderTemplate(systemPrompt, ctx)  // 替换 {{变量}}
  
  const { textStream, usage } = streamText({
    model: openai(model),
    prompt: resolvedPrompt,
    temperature
  })
  
  let fullText = ''
  for await (const token of textStream) {
    fullText += token
    await pushToken(input.runId, 'token', { content: token })  // 逐 token 推送
  }
  
  return { nodeId, result: fullText, tokensUsed: usage.totalTokens }
}
```
- 关键: 逐 token 调用 `pushToken` → NestJS → SSE → 前端打字机效果
- `buildContext` 构建变量上下文（见下文）

---

### 3. httpNode
```typescript
async function executeHttpNode(input) {
  const { method, url, body, authType, authToken } = input.nodeData
  const ctx = buildContext(input)
  
  const resolvedUrl = renderTemplate(url, ctx)        // 支持 {{变量}}
  const resolvedBody = renderTemplate(body, ctx)
  
  // 组装认证 header
  const authHeaders = {}
  if (authType === 'bearer') authHeaders['Authorization'] = `Bearer ${authToken}`
  
  const res = await fetch(resolvedUrl, {
    method,
    headers: { 'content-type': 'application/json', ...authHeaders },
    body: resolvedBody && method !== 'GET' ? resolvedBody : undefined
  })
  
  const result = res.headers.get('content-type')?.includes('application/json')
    ? await res.json()
    : await res.text()
  
  return { nodeId, result, tokensUsed: 0 }
}
```

---

### 4. codeNode
```typescript
async function executeCodeNode(input) {
  const code = input.nodeData.code ?? ''
  const vmContext = vm.createContext({
    context: buildContext(input),  // 上游变量作为 context.xxx
    output: undefined,
    console: { log: () => {} }     // 禁用 console
  })
  
  try {
    vm.runInContext(code, vmContext, { timeout: 5000 })
  } catch (err) {
    throw new Error(`代码节点执行失败: ${err.message}`)
  }
  
  return { nodeId, result: vmContext.output, tokensUsed: 0 }
}
```
- 沙箱变量: `context.start_1`、`context.llm_1`
- 用户代码: `output = context.llm_1.toUpperCase()`

---

### 5. conditionNode
```typescript
async function executeConditionNode(input) {
  const { expression } = input.nodeData
  const ctx = buildContext(input)
  
  let passed = false
  try {
    passed = Boolean(vm.runInContext(expression, vm.createContext(ctx), { timeout: 1000 }))
  } catch {
    passed = false
  }
  
  return {
    nodeId,
    result: { branch: passed ? 'true' : 'false', passed },
    tokensUsed: 0
  }
}
```
- 表达式: `start_1 === 'hello'`、`llm_1.includes('success')`
- 返回 `branch` 字段供工作流引擎路由

---

### 6. endNode
```typescript
async function executeEndNode(input) {
  const template = input.nodeData.outputTemplate ?? ''
  const result = renderTemplate(template, buildContext(input))
  return { nodeId, result, tokensUsed: 0 }
}
```
- 模板: `{{llm_1}}\n结论：{{code_1}}`
- 支持自由拼接多个节点输出

---

### 7. knowledgeNode
```typescript
async function executeKnowledgeNode(input) {
  const { kbCode, topK, threshold } = input.nodeData
  const ctx = buildContext(input)
  const query = ctx.input ?? 最后一个节点的输出
  
  const res = await fetch(`${KNOWLEDGE_SERVICE_URL}/api/v1/search`, {
    method: 'POST',
    body: JSON.stringify({ kb_code: kbCode, query, top_k: topK, threshold })
  })
  
  const data = await res.json()
  const context = data.results.map(r => r.content).join('\n\n')
  
  return { nodeId, result: { context, chunks: data.results }, tokensUsed: 0 }
}
```

---

## 核心工具函数

### buildContext(input)
**作用**: 合并用户输入与上游节点输出，供模板引用

```typescript
function buildContext(input: NodeExecutionInput): Record<string, unknown> {
  const ctx = { ...input.inputs }  // { input: "用户输入" }
  
  for (const [name, output] of Object.entries(input.previousOutputs)) {
    const o = output as { result?: unknown }
    ctx[name] = o.result              // start_1, llm_1, code_1 等
    ctx[`__${name}__`] = output       // 完整对象（含 nodeId、tokensUsed）
  }
  
  return ctx
}
```

**示例**:
- 输入: `{ input: "hello" }`
- 上游输出: `{ start_1: {result: "hello"}, llm_1: {result: "Hi!"} }`
- 结果: `{ input: "hello", start_1: "hello", llm_1: "Hi!", __start_1__: {...}, __llm_1__: {...} }`

---

### renderTemplate(template, vars)
**作用**: 替换模板中的 `{{变量名}}`

```typescript
function renderTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''))
}
```

**示例**:
- 模板: `"你好 {{start_1}}，回复：{{llm_1}}"`
- 变量: `{ start_1: "世界", llm_1: "你好！" }`
- 结果: `"你好 世界，回复：你好！"`

---

### pushToken(runId, type, payload)
**作用**: 推送事件给 NestJS 主进程

```typescript
async function pushToken(runId: string, type: 'token'|'done'|'error', payload: object) {
  await fetch(`${INTERNAL_BASE_URL}/api/v1/internal/runs/${runId}/push`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-secret': INTERNAL_SECRET
    },
    body: JSON.stringify({ type, ...payload })
  })
}
```

**事件类型**:
- `token`: `{ type: 'token', content: "单个字" }` — LLM 流式输出
- `done`: `{ type: 'done', outputs, totalTokens, elapsedMs }` — 工作流完成
- `error`: `{ type: 'error', message }` — 执行失败

---

## 阶段 4: 完成与清理

### 成功完成
```typescript
await finalizeWorkflowRun({
  runId,
  outputs: nodeOutputs,       // 所有节点的输出 { start_1: {result}, llm_1: {result}, ... }
  totalTokens,
  elapsedMs: Date.now() - startedAt
})
```

`finalizeWorkflowRun` 内部调用:
```typescript
await pushToken(runId, 'done', {
  outputs: input.outputs,
  totalTokens: input.totalTokens,
  elapsedMs: input.elapsedMs
})
```

---

### 失败处理
```typescript
catch (err) {
  await failWorkflowRun({
    runId,
    message: err.message,
    elapsedMs: Date.now() - startedAt
  })
  throw err
}
```

`failWorkflowRun` 内部调用:
```typescript
await pushToken(runId, 'error', {
  message: input.message,
  elapsedMs: input.elapsedMs
})
```

---

## 前端 SSE 处理

### NestJS 转发
**文件**: `apps/backend/src/workflows/workflows.controller.ts`

```typescript
@Sse('runs/:runId/stream')
streamRun(@Param('runId') runId: string) {
  const subject = getOrCreateStream(runId)  // ReplaySubject，支持重放
  
  return subject.pipe(
    takeWhile(data => data.type !== 'done' && data.type !== 'error', true),
    map(data => ({
      data:
        data.type === 'token'
          ? { type: 'token', content: data.content }
          : data.type === 'done'
            ? { type: 'done', status: 'completed', runId, outputs: data.outputs }
            : { type: 'error', message: data.message }
    }))
  )
}
```

**关键**:
- `ReplaySubject` 缓存所有事件，后连接的客户端也能收到历史 token
- 30 秒后自动清理，防止内存泄漏

---

### 前端订阅
**文件**: `apps/frontend/src/pages/workflow/WorkflowEditorPage.vue`

```typescript
for await (const event of streamWorkflowRun(workflowId, runId, signal)) {
  if (event.type === 'token') {
    runDrawer.output += event.content  // 累加 token，打字机效果
  } else if (event.type === 'done') {
    // 如果没有 token 流（纯条件分支），从 outputs 取结束节点结果
    if (!runDrawer.output) {
      const endOutput = event.outputs['end_1']
      runDrawer.output = String(endOutput?.result ?? '')
    }
    runDrawer.status = 'completed'
  } else if (event.type === 'error') {
    runDrawer.status = 'failed'
    runDrawer.errorMsg = event.message
  }
}
```

---

## 数据流示意图

```
用户点击「运行」
  ↓
POST /workflows/:id/run { input: "hello" }
  ↓
NestJS 创建 ReplaySubject
  ↓
触发 Temporal Workflow: runWorkflowExecution
  ↓
┌────────────────────────────────────────┐
│  Worker BFS 遍历                        │
├────────────────────────────────────────┤
│  1. startNode                          │
│     result: "hello"                    │
│     nodeOutputs['start_1'] = {result}  │
│                                        │
│  2. conditionNode                      │
│     expression: start_1 === 'hello'    │
│     result: {branch: 'true'}           │
│     只推 sourceHandle='true' 的边      │
│                                        │
│  3. llmNode (true 分支)                │
│     systemPrompt: "回复{{start_1}}"    │
│     → "回复hello"                       │
│     逐 token pushToken('token', ...)   │  ← SSE → 前端打字机
│     result: 完整回复文本                │
│                                        │
│  4. endNode                            │
│     outputTemplate: "{{llm_1}}"        │
│     result: 渲染后的最终输出            │
└────────────────────────────────────────┘
  ↓
pushToken('done', { outputs: {...}, totalTokens, elapsedMs })
  ↓
NestJS subject.next(payload) → subject.complete()
  ↓
SSE 推送 data: {"type":"done","outputs":{...}}
  ↓
前端收到 done 事件，显示最终结果
```

---

## 关键设计要点

### 1. 为什么用 BFS 不用递归
- **支持条件分支**: 条件节点可以动态决定走哪条路径
- **防重复执行**: 两个分支归一到同一节点时，`visited` 保证只执行一次
- **易于扩展**: 后续可加循环、并行等复杂逻辑

### 2. 为什么按 name 索引
- **可读性**: `{{llm_1}}` 比 `{{llmNode-17870367...}}` 更易理解
- **稳定性**: 节点 id 每次创建都不同，name 是用户可控的语义化标识
- **前端一致**: 配置面板展示 name，表达式也用 name

### 3. 为什么 ReplaySubject
- **时序容错**: Worker 可能在前端连接 SSE 之前就推完了所有 token
- **无缓冲丢失**: 前端晚连 1 秒也能收到完整的 token 流
- **自动清理**: 30 秒后 complete + 清理 Map，防内存泄漏

### 4. sourceHandle 解析策略
- **优先使用显式字段**: `edge.sourceHandle` 如果存在直接用
- **Fallback 解析 id**: VueFlow 自动生成的 id 里包含 handle 信息
- **兼容存量数据**: 旧工作流没有保存 `sourceHandle` 字段，从 id 解析保证兼容

---

## 常见问题排查

### 问题 1: 条件分支后续节点不执行
**排查**:
1. 检查 `edge.sourceHandle` 是否正确（前端保存时是否序列化）
2. 看 worker 日志 `[bfs] condition branch=xxx, outEdges: [...]`
3. 确认 `sourceHandle` 匹配逻辑：`edge.sourceHandle === branch`

### 问题 2: 变量引用报 undefined
**排查**:
1. 确认节点 `data.name` 字段存在（旧工作流需重新保存）
2. 看 `buildContext` 生成的 context 是否包含该变量
3. 检查表达式语法：代码节点用 `context.xxx`，条件/模板用 `xxx`

### 问题 3: 前端收不到结束节点输出
**排查**:
1. 后端是否重启（`workflows.controller.ts` 改动需重启）
2. SSE done 事件是否带 `outputs` 字段（看浏览器 Network 标签）
3. `event.outputs['end_1']` 是否存在（节点 name 是否匹配）

### 问题 4: LLM 打字机不流畅
**排查**:
1. Worker 日志看 token 推送频率
2. NestJS ReplaySubject 是否正常转发
3. 前端 SSE 连接是否稳定（Network 标签 EventStream）
