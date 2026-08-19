import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import vm from 'node:vm'

function getEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

async function pushToken(runId: string, type: 'token' | 'done' | 'error', payload: Record<string, unknown>): Promise<void> {
  const url = `${getEnv('INTERNAL_BASE_URL', 'http://localhost:3000')}/api/v1/internal/runs/${runId}/push`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-secret': getEnv('INTERNAL_SECRET', 'internal-dev-secret'),
    },
    body: JSON.stringify({ type, ...payload }),
  })
  if (!res.ok) {
    console.error(`[pushToken] failed: ${res.status} ${await res.text()}`)
  }
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
    case 'startNode':
      return { nodeId: input.nodeId, result: input.inputs.input ?? '', tokensUsed: 0 }
    case 'llmNode':
      return executeLlmNode(input)
    case 'httpNode':
      return executeHttpNode(input)
    case 'codeNode':
      return executeCodeNode(input)
    case 'conditionNode':
      return executeConditionNode(input)
    case 'knowledgeNode':
      return executeKnowledgeNode(input)
    case 'endNode':
      return executeEndNode(input)
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
    buildContext(input),
  )

  const { textStream, usage } = streamText({
    model: openai(modelName),
    system: systemPrompt || undefined,
    messages: [{ role: 'user', content: String(buildContext(input).input ?? '') }],
    temperature,
    onError: (error) => {
      console.error('[streamText error]', error)
    },
  })

  let fullText = ''
  const tokenBatch: string[] = []
  let lastFlush = Date.now()
  const BATCH_SIZE = 5
  const BATCH_INTERVAL_MS = 50

  for await (const token of textStream) {
    fullText += token
    tokenBatch.push(token)
    
    const now = Date.now()
    if (tokenBatch.length >= BATCH_SIZE || now - lastFlush > BATCH_INTERVAL_MS) {
      await pushToken(input.runId, 'token', { content: tokenBatch.join('') })
      tokenBatch.length = 0
      lastFlush = now
    }
  }

  if (tokenBatch.length > 0) {
    await pushToken(input.runId, 'token', { content: tokenBatch.join('') })
  }

  const { totalTokens } = await usage

  return { nodeId: input.nodeId, result: fullText, tokensUsed: totalTokens ?? 0 }
}

function renderTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''))
}

/** 合并用户输入与上游输出：节点输出按 __{label}__ 与 {label} 两个形式暴露，便于引用 */
function buildContext(input: NodeExecutionInput): Record<string, unknown> {
  const ctx: Record<string, unknown> = { ...input.inputs }
  for (const [name, output] of Object.entries(input.previousOutputs)) {
    const o = output as { result?: unknown }
    ctx[name] = o.result
    ctx[`__${name}__`] = output
  }
  return ctx
}

async function executeHttpNode(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
  const { method = 'GET', url, headers = {}, body, authType, authToken, authHeaderName, authHeaderValue } = input.nodeData as {
    method?: string
    url: string
    headers?: Record<string, string>
    body?: string
    authType?: 'none' | 'bearer' | 'custom'
    authToken?: string
    authHeaderName?: string
    authHeaderValue?: string
  }

  const ctx = buildContext(input)
  const resolvedUrl = renderTemplate(url ?? '', ctx)
  const resolvedBody = body ? renderTemplate(body, ctx) : undefined

  const authHeaders: Record<string, string> = {}
  if (authType === 'bearer' && authToken) {
    authHeaders['Authorization'] = `Bearer ${renderTemplate(authToken, ctx)}`
  } else if (authType === 'custom' && authHeaderName) {
    authHeaders[authHeaderName] = renderTemplate(authHeaderValue ?? '', ctx)
  }

  const res = await fetch(resolvedUrl, {
    method,
    headers: { 'content-type': 'application/json', ...headers, ...authHeaders },
    body: resolvedBody && method !== 'GET' ? resolvedBody : undefined,
  })

  let result: unknown
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    result = await res.json()
  } else {
    result = await res.text()
  }

  return { nodeId: input.nodeId, result, tokensUsed: 0 }
}

async function executeCodeNode(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
  const code = (input.nodeData.code as string) ?? ''
  const context = vm.createContext({
    context: buildContext(input),
    output: undefined,
    console: { log: () => {} },
  })

  try {
    vm.runInContext(code, context, { timeout: 5000 })
  } catch (err) {
    throw new Error(`代码节点执行失败: ${(err as Error).message}`)
  }

  return { nodeId: input.nodeId, result: context.output, tokensUsed: 0 }
}

async function executeConditionNode(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
  const { expression } = input.nodeData as { expression: string }
  const ctx = buildContext(input)

  let passed = false
  try {
    passed = Boolean(vm.runInContext(expression ?? 'false', vm.createContext(ctx), { timeout: 1000 }))
  } catch {
    passed = false
  }

  return { nodeId: input.nodeId, result: { branch: passed ? 'true' : 'false', passed }, tokensUsed: 0 }
}

async function executeEndNode(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
  const template = (input.nodeData.outputTemplate as string) ?? ''
  const result = renderTemplate(template, buildContext(input))
  return { nodeId: input.nodeId, result, tokensUsed: 0 }
}

async function executeKnowledgeNode(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
  const { kbCode, topK = 3, threshold = 0.7 } = input.nodeData as {
    kbCode: string
    topK?: number
    threshold?: number
  }

  const ctx = buildContext(input)
  const query = String(ctx.input ?? Object.values(input.previousOutputs).map((o) => (o as { result?: unknown }).result).at(-1) ?? '')
  const knowledgeUrl = getEnv('KNOWLEDGE_SERVICE_URL', 'http://localhost:8001')

  const res = await fetch(`${knowledgeUrl}/api/v1/search`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ kb_code: kbCode, query, top_k: topK, threshold }),
  })

  if (!res.ok) {
    throw new Error(`知识库检索失败: ${res.status}`)
  }

  const data = (await res.json()) as { results: Array<{ content: string; score: number }> }
  const context = data.results.map((r) => r.content).join('\n\n')

  return { nodeId: input.nodeId, result: { context, chunks: data.results }, tokensUsed: 0 }
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
