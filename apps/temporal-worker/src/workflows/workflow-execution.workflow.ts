import { proxyActivities } from '@temporalio/workflow'
import type * as activities from '../activities/workflow.activities.js'

const { executeWorkflowNode, finalizeWorkflowRun, failWorkflowRun } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
  retry: { maximumAttempts: 3 },
})

export interface WorkflowRunInput {
  runId: string
  workflowId: string
  userId: string
  graphData: Record<string, unknown>
  inputs: Record<string, unknown>
}

export async function runWorkflowExecution(input: WorkflowRunInput): Promise<void> {
  const startedAt = Date.now()
  const nodes: Array<{ id: string; type: string; data: Record<string, unknown> }> =
    (input.graphData.nodes as typeof nodes) ?? []

  const nodeOutputs: Record<string, unknown> = {}
  let totalTokens = 0

  try {
    for (const node of nodes) {
      const output = await executeWorkflowNode({
        runId: input.runId,
        nodeId: node.id,
        nodeType: node.type,
        nodeData: node.data,
        inputs: input.inputs,
        previousOutputs: nodeOutputs,
      })
      // 按节点 name（变量引用标识符）索引，供下游通过 {{name}} 引用
      const name = (node.data.name as string) || (node.data.label as string) || node.id
      nodeOutputs[name] = output
      totalTokens += output.tokensUsed
    }

    await finalizeWorkflowRun({
      runId: input.runId,
      outputs: nodeOutputs,
      totalTokens,
      elapsedMs: Date.now() - startedAt,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    await failWorkflowRun({
      runId: input.runId,
      message,
      elapsedMs: Date.now() - startedAt,
    })
    throw err
  }
}
