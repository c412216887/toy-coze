import { proxyActivities } from '@temporalio/workflow'
import type * as activities from '../activities/workflow.activities.js'

const { executeWorkflowNode, finalizeWorkflowRun } = proxyActivities<typeof activities>({
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
  const nodes: Array<{ id: string; type: string; data: Record<string, unknown> }> =
    (input.graphData.nodes as typeof nodes) ?? []

  const nodeOutputs: Record<string, unknown> = {}

  for (const node of nodes) {
    const output = await executeWorkflowNode({
      runId: input.runId,
      nodeId: node.id,
      nodeType: node.type,
      nodeData: node.data,
      inputs: input.inputs,
      previousOutputs: nodeOutputs,
    })
    nodeOutputs[node.id] = output
  }

  await finalizeWorkflowRun({ runId: input.runId, outputs: nodeOutputs })
}
