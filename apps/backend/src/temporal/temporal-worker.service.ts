import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Worker, NativeConnection } from '@temporalio/worker'
import * as activities from './activities/workflow.activities'
import * as path from 'path'

@Injectable()
export class TemporalWorkerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private worker: Worker | null = null

  constructor(private readonly config: ConfigService) {}

  async onApplicationBootstrap() {
    const address = this.config.get<string>('app.temporalAddress') ?? 'localhost:7233'
    const namespace = this.config.get<string>('app.temporalNamespace') ?? 'default'

    const connection = await NativeConnection.connect({ address })

    this.worker = await Worker.create({
      workflowsPath: path.resolve(__dirname, './workflows/workflow-execution.workflow'),
      activities,
      taskQueue: 'workflow-execution',
      connection,
      namespace,
    })

    this.worker.run().catch(err => console.error('Temporal Worker error:', err))
  }

  async onApplicationShutdown() {
    this.worker?.shutdown()
  }
}
