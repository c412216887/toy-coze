import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Workflow, WorkflowRun } from './workflow.entity'
import { WorkflowsService } from './workflows.service'
import { WorkflowsController, InternalController } from './workflows.controller'
import { TemporalModule } from '../temporal/temporal.module'

@Module({
  imports: [TypeOrmModule.forFeature([Workflow, WorkflowRun]), TemporalModule],
  providers: [WorkflowsService],
  controllers: [WorkflowsController, InternalController],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
