import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Agent } from './agent.entity'
import { AgentsService } from './agents.service'

@Module({
  imports: [TypeOrmModule.forFeature([Agent])],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
