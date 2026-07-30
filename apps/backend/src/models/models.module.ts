import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ModelProvider } from './model-provider.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ModelProvider])],
  exports: [TypeOrmModule],
})
export class ModelsModule {}
