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

export function createRunStream(id: string, runId: string): EventSource {
  return new EventSource(`/api/v1/workflows/${id}/runs/${runId}/stream`)
}
