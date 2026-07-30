import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { WorkflowsService } from './workflows.service'
import { CreateWorkflowDto, UpdateWorkflowDto, RunWorkflowDto } from './workflow.dto'
import { CurrentUser } from '../auth/current-user.decorator'
import { User } from '../users/user.entity'

@ApiTags('工作流')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

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
}
