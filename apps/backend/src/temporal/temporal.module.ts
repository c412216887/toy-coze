import { Module } from '@nestjs/common'
import { TemporalWorkerService } from './temporal-worker.service'
import { TemporalClientService } from './temporal-client.service'

@Module({
  providers: [TemporalWorkerService, TemporalClientService],
  exports: [TemporalClientService],
})
export class TemporalModule {}
