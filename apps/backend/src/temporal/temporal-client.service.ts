import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client, Connection } from '@temporalio/client'
import { runWorkflowExecution, type WorkflowRunInput } from './workflows/workflow-execution.workflow'

@Injectable()
export class TemporalClientService {
  private client: Client | null = null

  constructor(private readonly config: ConfigService) {}

  private async getClient(): Promise<Client> {
    if (!this.client) {
      const address = this.config.get<string>('app.temporalAddress') ?? 'localhost:7233'
      const namespace = this.config.get<string>('app.temporalNamespace') ?? 'default'
      try {
        const connection = await Connection.connect({ address })
        this.client = new Client({ connection, namespace })
      } catch {
        throw new ServiceUnavailableException('Temporal 服务不可用，请先启动 Temporal')
      }
    }
    return this.client
  }

  async startWorkflowRun(input: WorkflowRunInput): Promise<string> {
    const client = await this.getClient()
    const handle = await client.workflow.start(runWorkflowExecution, {
      taskQueue: 'workflow-execution',
      workflowId: `wf-run-${input.runId}`,
      args: [input],
    })
    return handle.workflowId
  }

  async getRunStatus(workflowId: string) {
    const client = await this.getClient()
    const handle = client.workflow.getHandle(workflowId)
    return handle.describe()
  }
}
