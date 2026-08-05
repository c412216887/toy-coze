import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Sse,
  MessageEvent,
  Headers,
  UnauthorizedException,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiTags, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger'
import { Observable, Subject, fromEvent } from 'rxjs'
import { map, takeUntil } from 'rxjs/operators'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ConfigService } from '@nestjs/config'
import { WorkflowsService } from './workflows.service'
import { CreateWorkflowDto, UpdateWorkflowDto, RunWorkflowDto } from './workflow.dto'
import { CurrentUser } from '../auth/current-user.decorator'
import { User } from '../users/user.entity'

@ApiTags('工作流')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('workflows')
export class WorkflowsController {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly config: ConfigService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.workflowsService.findAll(user.id)
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateWorkflowDto) {
    return this.workflowsService.create(user.id, dto)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.workflowsService.findOne(id, user.id)
  }

  @Put(':id')
  update(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: UpdateWorkflowDto) {
    return this.workflowsService.update(id, user.id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.workflowsService.remove(id, user.id)
  }

  @Get(':id/runs')
  getRuns(@Param('id') id: string, @CurrentUser() user: User) {
    return this.workflowsService.findRuns(id, user.id)
  }

  @Post(':id/run')
  async runWorkflow(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: RunWorkflowDto,
  ) {
    const runId = await this.workflowsService.runWorkflow(id, user.id, dto.input)
    return { runId }
  }

  @Sse(':id/runs/:runId/stream')
  streamRun(
    @Param('id') _id: string,
    @Param('runId') runId: string,
  ): Observable<MessageEvent> {
    const done$ = new Subject<void>()

    return fromEvent(this.eventEmitter, `run.${runId}`).pipe(
      takeUntil(done$),
      map((payload: unknown) => {
        const data = payload as { type: 'token' | 'done' | 'error'; content?: string; message?: string; outputs?: unknown }

        if (data.type === 'done' || data.type === 'error') {
          done$.next()
          done$.complete()
        }

        return {
          type: data.type,
          data: JSON.stringify(
            data.type === 'token'
              ? { content: data.content }
              : data.type === 'done'
                ? { status: 'completed', runId }
                : { message: data.message },
          ),
        } satisfies MessageEvent
      }),
    )
  }
}

@Controller('internal')
export class InternalController {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly config: ConfigService,
  ) {}

  @ApiExcludeEndpoint()
  @Post('runs/:runId/push')
  @HttpCode(HttpStatus.NO_CONTENT)
  push(
    @Param('runId') runId: string,
    @Headers('x-internal-secret') secret: string,
    @Body() body: { type: 'token' | 'done' | 'error'; content?: string; message?: string; outputs?: unknown },
  ) {
    if (secret !== this.config.get<string>('app.internalSecret')) {
      throw new UnauthorizedException()
    }
    this.eventEmitter.emit(`run.${runId}`, body)
  }
}
