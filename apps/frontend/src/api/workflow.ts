import request from './request'

export interface Workflow {
  id: string
  name: string
  description: string
  createdAt: string
}

export interface CreateWorkflowPayload {
  name: string
  description?: string
}

export interface WorkflowDefinition {
  nodes: WorkflowNodeDef[]
  edges: WorkflowEdgeDef[]
}

export interface WorkflowNodeDef {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface WorkflowEdgeDef {
  id: string
  source: string
  target: string
}

export interface WorkflowDetail extends Workflow {
  graphData: WorkflowDefinition | null
}

export interface UpdateWorkflowPayload {
  name?: string
  description?: string
  graphData?: WorkflowDefinition
}

export async function getWorkflows(): Promise<Workflow[]> {
  const res = await request.get<Workflow[]>('/api/v1/workflows')
  return res.data
}

export async function getWorkflow(id: string): Promise<WorkflowDetail> {
  const res = await request.get<WorkflowDetail>(`/api/v1/workflows/${id}`)
  return res.data
}

export async function createWorkflow(payload: CreateWorkflowPayload): Promise<Workflow> {
  const res = await request.post<Workflow>('/api/v1/workflows', payload)
  return res.data
}

export async function updateWorkflow(
  id: string,
  payload: UpdateWorkflowPayload
): Promise<WorkflowDetail> {
  const res = await request.put<WorkflowDetail>(`/api/v1/workflows/${id}`, payload)
  return res.data
}

export async function deleteWorkflow(id: string): Promise<void> {
  await request.delete(`/api/v1/workflows/${id}`)
}

export interface RunWorkflowResponse {
  runId: string
}

export async function runWorkflow(id: string, input: string): Promise<RunWorkflowResponse> {
  const res = await request.post<RunWorkflowResponse>(`/api/v1/workflows/${id}/run`, { input })
  return res.data
}

export type SseEvent =
  | { type: 'token'; content: string }
  | { type: 'done'; status: string; runId: string }
  | { type: 'error'; message: string }

const SSE_MAX_RETRIES = 3
const SSE_RETRY_DELAY_MS = 2000

export async function* streamWorkflowRun(
  id: string,
  runId: string,
  signal?: AbortSignal
): AsyncGenerator<SseEvent> {
  const jwt = localStorage.getItem('coze_token')
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
  }

  let retries = 0

  while (true) {
    if (signal?.aborted) return

    let res: Response
    try {
      res = await fetch(`/api/v1/workflows/${id}/runs/${runId}/stream`, { headers, signal })
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      if (retries >= SSE_MAX_RETRIES) throw err
      retries++
      await delay(SSE_RETRY_DELAY_MS, signal)
      continue
    }

    if (!res.ok || !res.body) {
      throw new Error(`SSE 连接失败：${res.status}`)
    }

    retries = 0

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    let networkDrop = false

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          networkDrop = true
          break
        }

        buf += decoder.decode(value, { stream: true })
        const blocks = buf.split('\n\n')
        buf = blocks.pop() ?? ''

        for (const block of blocks) {
          let eventType = 'message'
          let dataLine = ''

          for (const line of block.split('\n')) {
            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim()
            } else if (line.startsWith('data:')) {
              dataLine = line.slice(5).trim()
            }
          }

          if (!dataLine) continue

          try {
            const parsed = JSON.parse(dataLine) as Record<string, unknown>
            if (eventType === 'token') {
              yield { type: 'token', content: parsed.content as string }
            } else if (eventType === 'done') {
              yield { type: 'done', status: parsed.status as string, runId: parsed.runId as string }
              return
            } else if (eventType === 'error') {
              yield { type: 'error', message: parsed.message as string }
              return
            }
          } catch {
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      networkDrop = true
    } finally {
      reader.cancel()
    }

    if (!networkDrop) return
    if (retries >= SSE_MAX_RETRIES) throw new Error('SSE 连接多次中断，已停止重试')
    retries++
    await delay(SSE_RETRY_DELAY_MS, signal)
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(Object.assign(new Error('AbortError'), { name: 'AbortError' }))
    }, { once: true })
  })
}
