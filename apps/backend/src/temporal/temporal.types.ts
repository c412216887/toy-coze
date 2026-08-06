// WorkflowRunInput 与 temporal-worker 中的定义保持一致
// Temporal Client 只需类型，不需要 import Worker 侧的实现
export interface WorkflowRunInput {
  runId: string
  workflowId: string
  userId: string
  graphData: Record<string, unknown>
  inputs: Record<string, unknown>
}
