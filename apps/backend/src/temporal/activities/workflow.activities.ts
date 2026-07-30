import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

export interface NodeExecutionInput {
  runId: string
  nodeId: string
  nodeType: string
  nodeData: Record<string, unknown>
  inputs: Record<string, unknown>
  previousOutputs: Record<string, unknown>
}

export interface NodeExecutionOutput {
  nodeId: string
  result: unknown
  tokensUsed: number
}

export async function executeWorkflowNode(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
  switch (input.nodeType) {
    case 'llm':
      return executeLlmNode(input)
    case 'condition':
      return executeConditionNode(input)
    default:
      return { nodeId: input.nodeId, result: null, tokensUsed: 0 }
  }
}

async function executeLlmNode(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
  const model = new ChatOpenAI({
    model: (input.nodeData.modelId as string) ?? 'gpt-4o',
    apiKey: process.env.OPENAI_API_KEY,
  })

  const systemPrompt = (input.nodeData.systemPrompt as string) ?? ''
  const userPrompt = renderTemplate((input.nodeData.prompt as string) ?? '', {
    ...input.inputs,
    ...input.previousOutputs,
  })

  const messages = [
    ...(systemPrompt ? [new SystemMessage(systemPrompt)] : []),
    new HumanMessage(userPrompt),
  ]

  const response = await model.invoke(messages)
  const tokensUsed = response.usage_metadata?.total_tokens ?? 0

  return { nodeId: input.nodeId, result: response.content, tokensUsed }
}

async function executeConditionNode(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
  return { nodeId: input.nodeId, result: true, tokensUsed: 0 }
}

function renderTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''))
}

export async function finalizeWorkflowRun(input: { runId: string; outputs: Record<string, unknown> }): Promise<void> {
  console.log(`workflow run ${input.runId} finalized`)
}
