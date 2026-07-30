import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from './user.entity'
import { CreateUserDto } from './user.dto'

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.repo.findOneBy({ username: dto.username })
    if (exists) throw new ConflictException('用户名已存在')
    const user = this.repo.create({
      username: dto.username,
      email: dto.email,
      hashedPassword: await bcrypt.hash(dto.password, 10),
    })
    return this.repo.save(user)
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.repo.createQueryBuilder('u').addSelect('u.hashedPassword').where('u.username = :username', { username }).getOne()
  }

  async findById(id: string): Promise<User> {
    const user = await this.repo.findOneBy({ id })
    if (!user) throw new NotFoundException('用户不存在')
    return user
  }
}
