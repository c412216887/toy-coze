import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

const INTERNAL_BASE_URL = process.env.INTERNAL_BASE_URL ?? 'http://localhost:3000'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? 'internal-dev-secret'

async function pushToken(runId: string, type: 'token' | 'done' | 'error', payload: Record<string, unknown>): Promise<void> {
  await fetch(`${INTERNAL_BASE_URL}/api/v1/internal/runs/${runId}/push`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-secret': INTERNAL_SECRET,
    },
    body: JSON.stringify({ type, ...payload }),
  })
}

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
    case 'llmNode':
      return executeLlmNode(input)
    default:
      return { nodeId: input.nodeId, result: null, tokensUsed: 0 }
  }
}

async function executeLlmNode(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
  const model = new ChatOpenAI({
    model: (input.nodeData.model as string) ?? process.env.DEFAULT_LLM_MODEL ?? 'gpt-4o',
    apiKey: process.env.OPENAI_API_KEY,
    configuration: { baseURL: process.env.OPENAI_BASE_URL },
    temperature: (input.nodeData.temperature as number) ?? 0.7,
    streaming: true,
  })

  const systemPrompt = renderTemplate(
    (input.nodeData.systemPrompt as string) ?? '',
    { ...input.inputs, ...input.previousOutputs },
  )

  const messages = [
    ...(systemPrompt ? [new SystemMessage(systemPrompt)] : []),
    new HumanMessage(String(input.inputs.input ?? '')),
  ]

  let fullText = ''
  let tokensUsed = 0

  const stream = await model.stream(messages)

  for await (const chunk of stream) {
    const token = typeof chunk.content === 'string' ? chunk.content : ''
    if (token) {
      fullText += token
      await pushToken(input.runId, 'token', { content: token })
    }
    tokensUsed += chunk.usage_metadata?.total_tokens ?? 0
  }

  return { nodeId: input.nodeId, result: fullText, tokensUsed }
}

function renderTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''))
}

export async function finalizeWorkflowRun(input: { runId: string; outputs: Record<string, unknown> }): Promise<void> {
  await pushToken(input.runId, 'done', { outputs: input.outputs })
}
