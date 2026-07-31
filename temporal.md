# temporal

## 是什么？

是一个工作流编排平台，主要用于构建、运行和拓展高可靠、分布式应用

## 怎么用？

### 概念

- workflow（工作流）
- activity（任务节点）
- Worker（工作进程）
- temporal server（服务端）

### 使用流程（TypeScript SDK）

1. 安装与开发环境准备

- nodejs
- temoral cli
  1.1 启动cli

```bash
# 启动本地 Temporal 服务（默认监听 7233 端口，Web UI 位于 http://localhost:8233）
temporal server start-dev
```

1.2 项目内安装temporal sdk

```bash
pnpm add @temporalio/client @temporalio/worker @temporalio/workflow
```

2. 编写activity（任务节点）
   创建一个`activities.ts`文件

```typescript
// activities.ts
export async function greet(name): Promise<string> {
  /**
   * 可以增加http请求、数据库查询等操作
   */
  return `hello ${name}`;
}
```

3. 编写Workflow（工作流）
   创建一个`workflow.ts`文件, 代理调用Activity并编排逻辑

```typescript
// workflow.ts
import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities.ts";

// 设置activities超时和重试策略
const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export async function exampleWorkFlow(name: string): Promise<string> {
  // 编排业务逻辑，若失败，Temporal会自动重试 Activity
  const result = await greet(name);
  return result;
}
```

4. 启动worker监听任务
   创建一个`worker.ts`，负责与temporal server连接并监听Task Queue（任务队列）

```typescript
// worker.ts
import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities.ts";

async function run() {
  const connection = await NativeConnection.connect({
    address: "localhost:7233",
  });
  const worker = await Worker.create({
    connection,
    namespace: "default",
    taskQueue: "hello-world",
    workflowPath: path.resolve("./workflow"),
    activities,
  });
  // 开始监听
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

5. Client触发Workflow运行
   创建一个`client.ts`,通过Temporal Client启动工作流

```typescript
import { Connection, Client } from "@temporalio/client";
import { exampleWorkflow } from "./exampleWorkflow";

async function run() {
  const connection = Connection.connection({ address: "localhost: 7233" });
  const client = new Client({ connection });
  // 触发workflow
  const handle = client.workflow.start(exampleWorkflow, {
    taskQueue: "hello-world",
    args: ["Temporal"],
    workflowId: "workflow-" + Date.now(),
  });
  // 等待并获取结果
  const result = await handle.result();
}
run();
```
