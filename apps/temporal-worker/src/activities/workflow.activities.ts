import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'

function getEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

async function pushToken(runId: string, type: 'token' | 'done' | 'error', payload: Record<string, unknown>): Promise<void> {
  await fetch(`${getEnv('INTERNAL_BASE_URL', 'http://localhost:3000')}/api/v1/internal/runs/${runId}/push`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-secret': getEnv('INTERNAL_SECRET', 'internal-dev-secret'),
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
  const openai = createOpenAI({
    apiKey: getEnv('OPENAI_API_KEY', ''),
    baseURL: getEnv('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
  })

  const modelName = (input.nodeData.model as string) ?? getEnv('DEFAULT_LLM_MODEL', 'gpt-4o')
  const temperature = (input.nodeData.temperature as number) ?? 0.7
  const systemPrompt = renderTemplate(
    (input.nodeData.systemPrompt as string) ?? '',
    { ...input.inputs, ...input.previousOutputs },
  )

  const { textStream, usage } = streamText({
    model: openai(modelName),
    system: systemPrompt || undefined,
    messages: [{ role: 'user', content: String(input.inputs.input ?? '') }],
    temperature,
    onError: (error) => {
      console.error('[streamText error]', error)
    },
  })

  let fullText = ''

  for await (const token of textStream) {
    fullText += token
    await pushToken(input.runId, 'token', { content: token })
  }

  const { totalTokens } = await usage

  return { nodeId: input.nodeId, result: fullText, tokensUsed: totalTokens ?? 0 }
}

function renderTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''))
}

export async function finalizeWorkflowRun(input: {
  runId: string
  outputs: Record<string, unknown>
  totalTokens: number
  elapsedMs: number
}): Promise<void> {
  await pushToken(input.runId, 'done', {
    outputs: input.outputs,
    totalTokens: input.totalTokens,
    elapsedMs: input.elapsedMs,
  })
}

export async function failWorkflowRun(input: {
  runId: string
  message: string
  elapsedMs: number
}): Promise<void> {
  await pushToken(input.runId, 'error', {
    message: input.message,
    elapsedMs: input.elapsedMs,
  })
}
