import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepo: UserRepository) {}

  async create(dto: CreateUserDto): Promise<User> {
    const [nameExists, emailExists] = await Promise.all([
      this.userRepo.existsByUsername(dto.username),
      this.userRepo.existsByEmail(dto.email),
    ]);
    if (nameExists) throw new ConflictException('用户名已存在');
    if (emailExists) throw new ConflictException('邮箱已被注册');
    return this.userRepo.insert({
      username: dto.username,
      email: dto.email,
      hashedPassword: await bcrypt.hash(dto.password, 12),
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findByUsername(username);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findByEmail(email);
  }

  async updateUsername(userId: string, username: string): Promise<User> {
    const exists = await this.userRepo.existsByUsername(username);
    if (exists) throw new ConflictException('用户名已存在');
    return this.userRepo.updateUsername(userId, username);
  }

  async changePassword(userId: string, oldPlain: string, newPlain: string): Promise<void> {
    const user = await this.userRepo.findByIdWithPassword(userId);
    if (!user) throw new NotFoundException('用户不存在');
    const valid = await bcrypt.compare(oldPlain, user.hashedPassword);
    if (!valid) throw new UnauthorizedException('当前密码错误');
    await this.userRepo.updatePassword(userId, await bcrypt.hash(newPlain, 12));
  }
}
