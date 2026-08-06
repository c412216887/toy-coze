import "dotenv/config";
import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities/workflow.activities";
import * as path from "node:path";

async function run() {
  const address = process.env.TEMPORAL_ADDRESS ?? "localhost:7233";
  const namespace = process.env.TEMPORAL_NAMESPACE ?? "default";

  const connection = await NativeConnection.connect({ address });

  const worker = await Worker.create({
    workflowsPath: path.resolve(
      __dirname,
      "./workflows/workflow-execution.workflow.ts",
    ),
    activities,
    taskQueue: "workflow-execution",
    connection,
    namespace,
  });

  console.log(`Temporal Worker 已启动，连接: ${address}`);
  await worker.run();
}

run().catch((err) => {
  console.error("Worker 启动失败:", err);
  process.exit(1);
});
