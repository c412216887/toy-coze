import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getWorkflows,
  createWorkflow,
  deleteWorkflow,
  type Workflow,
  type CreateWorkflowPayload
} from '@/api/workflow'

export const useWorkflowStore = defineStore('workflow', () => {
  const workflows = ref<Workflow[]>([])
  const loading = ref(false)

  async function fetchWorkflows() {
    loading.value = true
    try {
      workflows.value = await getWorkflows()
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateWorkflowPayload): Promise<Workflow> {
    const workflow = await createWorkflow(payload)
    workflows.value.unshift(workflow)
    return workflow
  }

  async function remove(id: string) {
    await deleteWorkflow(id)
    workflows.value = workflows.value.filter((w) => w.id !== id)
  }

  return { workflows, loading, fetchWorkflows, create, remove }
})
