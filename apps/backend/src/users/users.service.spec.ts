import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { UserRepository } from './user.repository';
import { User } from './user.entity';

jest.mock('bcrypt');

const mockUserRepo = (): jest.Mocked<UserRepository> => ({
  existsByUsername: jest.fn(),
  existsByEmail: jest.fn(),
  insert: jest.fn(),
  findByUsername: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
} as unknown as jest.Mocked<UserRepository>);

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 'uuid-1',
  username: 'alice',
  email: 'alice@example.com',
  hashedPassword: 'hashed',
  isActive: true,
  isSuperuser: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    repo = mockUserRepo();
    service = new UsersService(repo);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = { username: 'alice', email: 'alice@example.com', password: 'Plain1234!' };

    it('用户名和邮箱均不存在时成功创建', async () => {
      repo.existsByUsername.mockResolvedValue(false);
      repo.existsByEmail.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      const created = buildUser({ hashedPassword: 'hashed-pw' });
      repo.insert.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(repo.existsByUsername).toHaveBeenCalledWith('alice');
      expect(repo.existsByEmail).toHaveBeenCalledWith('alice@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('Plain1234!', 12);
      expect(repo.insert).toHaveBeenCalledWith({
        username: 'alice',
        email: 'alice@example.com',
        hashedPassword: 'hashed-pw',
      });
      expect(result).toBe(created);
    });

    it('用户名已存在时抛出 ConflictException', async () => {
      repo.existsByUsername.mockResolvedValue(true);
      repo.existsByEmail.mockResolvedValue(false);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow('用户名已存在');
    });

    it('邮箱已被注册时抛出 ConflictException', async () => {
      repo.existsByUsername.mockResolvedValue(false);
      repo.existsByEmail.mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow('邮箱已被注册');
    });

    it('用户名优先于邮箱冲突检测', async () => {
      repo.existsByUsername.mockResolvedValue(true);
      repo.existsByEmail.mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toThrow('用户名已存在');
    });

    it('并行执行用户名和邮箱检查', async () => {
      repo.existsByUsername.mockResolvedValue(false);
      repo.existsByEmail.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('h');
      repo.insert.mockResolvedValue(buildUser());

      await service.create(dto);

      expect(repo.existsByUsername).toHaveBeenCalledTimes(1);
      expect(repo.existsByEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByUsername', () => {
    it('用户存在时返回用户', async () => {
      const user = buildUser();
      repo.findByUsername.mockResolvedValue(user);

      const result = await service.findByUsername('alice');

      expect(result).toBe(user);
    });

    it('用户不存在时返回 null', async () => {
      repo.findByUsername.mockResolvedValue(null);

      const result = await service.findByUsername('nobody');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('用户存在时返回用户', async () => {
      const user = buildUser();
      repo.findById.mockResolvedValue(user);

      const result = await service.findById('uuid-1');

      expect(result).toBe(user);
    });

    it('用户不存在时抛出 NotFoundException', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findById('no-such-id')).rejects.toThrow(NotFoundException);
      await expect(service.findById('no-such-id')).rejects.toThrow('用户不存在');
    });
  });

  describe('findByEmail', () => {
    it('邮箱存在时返回用户', async () => {
      const user = buildUser();
      repo.findByEmail.mockResolvedValue(user);

      const result = await service.findByEmail('alice@example.com');

      expect(result).toBe(user);
    });

    it('邮箱不存在时返回 null', async () => {
      repo.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('ghost@example.com');

      expect(result).toBeNull();
    });
  });
});
