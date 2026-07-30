import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Agent } from './agent.entity'

@Injectable()
export class AgentsService {
  constructor(@InjectRepository(Agent) private readonly repo: Repository<Agent>) {}

  findAll(userId: string) { return this.repo.findBy({ userId }) }

  async findOne(id: string, userId: string): Promise<Agent> {
    const agent = await this.repo.findOneBy({ id })
    if (!agent) throw new NotFoundException('Agent 不存在')
    if (agent.userId !== userId) throw new ForbiddenException()
    return agent
  }

  create(userId: string, dto: Partial<Agent>) {
    return this.repo.save(this.repo.create({ userId, ...dto }))
  }

  async update(id: string, userId: string, dto: Partial<Agent>) {
    const agent = await this.findOne(id, userId)
    return this.repo.save(Object.assign(agent, dto))
  }

  async remove(id: string, userId: string) {
    await this.repo.remove(await this.findOne(id, userId))
  }
}
