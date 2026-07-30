import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule } from '@nestjs/throttler'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { WorkflowsModule } from './workflows/workflows.module'
import { AgentsModule } from './agents/agents.module'
import { ModelsModule } from './models/models.module'
import { KnowledgeModule } from './knowledge/knowledge.module'
import { TemporalModule } from './temporal/temporal.module'
import appConfig from './config/app.config'
import databaseConfig from './config/database.config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('database.url'),
        autoLoadEntities: true,
        synchronize: config.get('app.debug'),
        logging: config.get('app.debug'),
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    EventEmitterModule.forRoot(),
    AuthModule,
    UsersModule,
    WorkflowsModule,
    AgentsModule,
    ModelsModule,
    KnowledgeModule,
    TemporalModule,
  ],
})
export class AppModule {}
