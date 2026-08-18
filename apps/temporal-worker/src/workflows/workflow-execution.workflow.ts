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

interface GraphNode {
  id: string
  type: string
  data: Record<string, unknown>
}

interface GraphEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
}

function resolveSourceHandle(edge: GraphEdge): string | undefined {
  if (edge.sourceHandle) return edge.sourceHandle
  // VueFlow edge id 格式: vueflow__edge-{source}{sourceHandle}-{target}
  // 如 vueflow__edge-conditionNode-123true-endNode-456 → sourceHandle = 'true'
  const match = edge.id.match(new RegExp(`${edge.source}(true|false)-${edge.target}`))
  return match?.[1]
}

function buildAdjacency(edges: GraphEdge[]): Map<string, Array<{ target: string; sourceHandle?: string }>> {
  const adj = new Map<string, Array<{ target: string; sourceHandle?: string }>>()
  for (const edge of edges) {
    if (!adj.has(edge.source)) adj.set(edge.source, [])
    adj.get(edge.source)!.push({ target: edge.target, sourceHandle: resolveSourceHandle(edge) })
  }
  return adj
}

export async function runWorkflowExecution(input: WorkflowRunInput): Promise<void> {
  const startedAt = Date.now()
  const nodes: GraphNode[] = (input.graphData.nodes as GraphNode[]) ?? []
  const edges: GraphEdge[] = (input.graphData.edges as GraphEdge[]) ?? []

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const adj = buildAdjacency(edges)

  const nodeOutputs: Record<string, unknown> = {}
  let totalTokens = 0

  const startNode = nodes.find((n) => n.type === 'startNode')
  if (!startNode) throw new Error('工作流缺少开始节点')

  const visited = new Set<string>()
  const queue: string[] = [startNode.id]

  try {
    while (queue.length > 0) {
      const nodeId = queue.shift()!
      if (visited.has(nodeId)) continue
      visited.add(nodeId)

      const node = nodeMap.get(nodeId)
      if (!node) continue

      const output = await executeWorkflowNode({
        runId: input.runId,
        nodeId: node.id,
        nodeType: node.type,
        nodeData: node.data,
        inputs: input.inputs,
        previousOutputs: nodeOutputs,
      })

      const name = (node.data.name as string) || (node.data.label as string) || node.id
      nodeOutputs[name] = output
      totalTokens += output.tokensUsed

      const outEdges = adj.get(nodeId) ?? []

      if (node.type === 'conditionNode') {
        const branch = (output.result as { branch?: string })?.branch ?? 'false'
        for (const edge of outEdges) {
          if ((edge.sourceHandle ?? '') === branch && !visited.has(edge.target)) {
            queue.push(edge.target)
          }
        }
      } else {
        for (const edge of outEdges) {
          if (!visited.has(edge.target)) queue.push(edge.target)
        }
      }
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
