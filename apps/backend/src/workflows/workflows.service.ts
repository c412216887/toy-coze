import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow, WorkflowRun } from './workflow.entity';
import { CreateWorkflowDto, UpdateWorkflowDto } from './workflow.dto';
import { TemporalClientService } from '../temporal/temporal-client.service';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepo: Repository<Workflow>,
    @InjectRepository(WorkflowRun)
    private readonly runRepo: Repository<WorkflowRun>,
    private readonly temporalClient: TemporalClientService,
  ) {}

  async findAll(userId: string): Promise<Workflow[]> {
    return this.workflowRepo.findBy({ userId });
  }

  async findOne(id: string, userId: string): Promise<Workflow> {
    const wf = await this.workflowRepo.findOneBy({ id });
    if (!wf) throw new NotFoundException('工作流不存在');
    if (wf.userId !== userId) throw new ForbiddenException();
    return wf;
  }

  async create(userId: string, dto: CreateWorkflowDto): Promise<Workflow> {
    const wf = this.workflowRepo.create({
      userId,
      ...dto,
      graphData: dto.graphData ?? {},
    });
    return this.workflowRepo.save(wf);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateWorkflowDto,
  ): Promise<Workflow> {
    const wf = await this.findOne(id, userId);
    Object.assign(wf, dto);
    return this.workflowRepo.save(wf);
  }

  async remove(id: string, userId: string): Promise<void> {
    const wf = await this.findOne(id, userId);
    await this.workflowRepo.remove(wf);
  }

  async runWorkflow(
    workflowId: string,
    userId: string,
    input: string,
  ): Promise<string> {
    const wf = await this.findOne(workflowId, userId);

    const run = await this.runRepo.save(
      this.runRepo.create({
        workflowId,
        userId,
        inputs: { input },
      }),
    );

    await this.temporalClient.startWorkflowRun({
      runId: run.id,
      workflowId,
      userId,
      graphData: wf.graphData,
      inputs: { input },
    });

    return run.id;
  }

  async createRun(
    workflowId: string,
    userId: string,
    inputs?: Record<string, unknown>,
  ): Promise<WorkflowRun> {
    const run = this.runRepo.create({
      workflowId,
      userId,
      inputs: inputs ?? null,
    });
    return this.runRepo.save(run);
  }

  async updateRun(
    runId: string,
    patch: Partial<
      Pick<
        WorkflowRun,
        | 'status'
        | 'temporalRunId'
        | 'outputs'
        | 'errorMessage'
        | 'elapsedMs'
        | 'totalTokens'
        | 'finishedAt'
      >
    >,
  ): Promise<void> {
    await this.runRepo
      .createQueryBuilder()
      .update(WorkflowRun)
      .set(patch as object)
      .where('id = :id', { id: runId })
      .execute();
  }

  async findRuns(workflowId: string, userId: string): Promise<WorkflowRun[]> {
    await this.findOne(workflowId, userId);
    return this.runRepo.findBy({ workflowId });
  }

  async findRun(runId: string, userId: string): Promise<WorkflowRun> {
    const run = await this.runRepo.findOneBy({ id: runId });
    if (!run) throw new NotFoundException('运行记录不存在');
    if (run.userId !== userId) throw new ForbiddenException();
    return run;
  }

  async assertRunBelongsToUser(runId: string, userId: string): Promise<void> {
    await this.findRun(runId, userId);
  }
}
