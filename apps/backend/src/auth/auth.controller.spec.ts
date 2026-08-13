import { ConflictException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { Request } from 'express';

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

const mockAuthService = (): jest.Mocked<
  Pick<AuthService, 'getPublicKey' | 'decryptPassword' | 'login'>
> => ({
  getPublicKey: jest.fn(),
  decryptPassword: jest.fn(),
  login: jest.fn(),
});

const mockUsersService = (): jest.Mocked<Pick<UsersService, 'create'>> => ({
  create: jest.fn(),
});

const buildRequest = (overrides: Partial<Request> = {}): Request =>
  ({
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  }) as unknown as Request;

describe('AuthController', () => {
  let controller: AuthController;
  let authService: ReturnType<typeof mockAuthService>;
  let usersService: ReturnType<typeof mockUsersService>;

  beforeEach(() => {
    authService = mockAuthService();
    usersService = mockUsersService();
    controller = new AuthController(
      authService as unknown as AuthService,
      usersService as unknown as UsersService,
    );
    jest.clearAllMocks();
  });

  describe('getPublicKey', () => {
    it('返回包含 publicKey 的对象', () => {
      authService.getPublicKey.mockReturnValue(
        '-----BEGIN PUBLIC KEY-----\n...',
      );

      const result = controller.getPublicKey();

      expect(result).toEqual({ publicKey: '-----BEGIN PUBLIC KEY-----\n...' });
    });
  });

  describe('register', () => {
    const dto = {
      username: 'alice',
      email: 'alice@example.com',
      password: 'encrypted-cipher',
    };

    it('成功注册返回用户基本信息', async () => {
      authService.decryptPassword.mockReturnValue('Plain1!A');
      usersService.create.mockResolvedValue(buildUser());

      const result = await controller.register(dto);

      expect(authService.decryptPassword).toHaveBeenCalledWith(
        'encrypted-cipher',
      );
      expect(usersService.create).toHaveBeenCalledWith({
        username: 'alice',
        email: 'alice@example.com',
        password: 'Plain1!A',
      });
      expect(result).toEqual({
        id: 'uuid-1',
        username: 'alice',
        email: 'alice@example.com',
      });
    });

    it('注册结果不包含 hashedPassword', async () => {
      authService.decryptPassword.mockReturnValue('Plain1!A');
      usersService.create.mockResolvedValue(buildUser());

      const result = await controller.register(dto);

      expect(result).not.toHaveProperty('hashedPassword');
    });

    it('用户名已存在时透传 ConflictException', async () => {
      authService.decryptPassword.mockReturnValue('Plain1!A');
      usersService.create.mockRejectedValue(
        new ConflictException('用户名已存在'),
      );

      await expect(controller.register(dto)).rejects.toThrow(ConflictException);
    });

    it('密码解密失败时 decryptPassword 抛出的异常向上透传', async () => {
      authService.decryptPassword.mockImplementation(() => {
        throw new Error('密码解密失败');
      });

      await expect(controller.register(dto)).rejects.toThrow('密码解密失败');
    });
  });

  describe('login', () => {
    const dto = { email: 'alice@example.com', password: 'cipher' };

    it('成功登录返回 accessToken', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'jwt-token',
        tokenType: 'bearer',
      });
      const req = buildRequest({
        socket: { remoteAddress: '10.0.0.1' } as never,
      });

      const result = await controller.login(dto, req);

      expect(result).toEqual({ accessToken: 'jwt-token', tokenType: 'bearer' });
    });

    it('从 socket.remoteAddress 提取 IP', async () => {
      authService.login.mockResolvedValue({
        accessToken: 't',
        tokenType: 'bearer',
      });
      const req = buildRequest({
        socket: { remoteAddress: '192.168.1.1' } as never,
      });

      await controller.login(dto, req);

      expect(authService.login).toHaveBeenCalledWith(
        'alice@example.com',
        'cipher',
        expect.objectContaining({ ip: '192.168.1.1' }),
      );
    });

    it('从 x-forwarded-for 头提取 IP（优先于 socket）', async () => {
      authService.login.mockResolvedValue({
        accessToken: 't',
        tokenType: 'bearer',
      });
      const req = buildRequest({
        headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
        socket: { remoteAddress: '10.0.0.2' } as never,
      });

      await controller.login(dto, req);

      expect(authService.login).toHaveBeenCalledWith(
        'alice@example.com',
        'cipher',
        expect.objectContaining({ ip: '203.0.113.1' }),
      );
    });

    it('传递 user-agent 到 AuthService', async () => {
      authService.login.mockResolvedValue({
        accessToken: 't',
        tokenType: 'bearer',
      });
      const req = buildRequest({
        headers: { 'user-agent': 'Mozilla/5.0' },
        socket: { remoteAddress: '1.2.3.4' } as never,
      });

      await controller.login(dto, req);

      expect(authService.login).toHaveBeenCalledWith(
        'alice@example.com',
        'cipher',
        expect.objectContaining({ ua: 'Mozilla/5.0' }),
      );
    });

    it('无 x-forwarded-for 和 socket 时 ip 为 null', async () => {
      authService.login.mockResolvedValue({
        accessToken: 't',
        tokenType: 'bearer',
      });
      const req = buildRequest({
        headers: {},
        socket: {} as never,
      });

      await controller.login(dto, req);

      expect(authService.login).toHaveBeenCalledWith(
        'alice@example.com',
        'cipher',
        expect.objectContaining({ ip: null }),
      );
    });
  });
});
