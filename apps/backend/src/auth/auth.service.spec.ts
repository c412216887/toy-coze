import { ForbiddenException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RsaService } from '../common/rsa.service';
import { LoginLockService } from './login-lock.service';
import { User } from '../users/user.entity';
import { DataSource } from 'typeorm';

jest.mock('bcrypt');

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 'uuid-1',
  username: 'alice',
  email: 'alice@example.com',
  hashedPassword: '$2b$12$hashedpassword',
  isActive: true,
  isSuperuser: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const mockUsersService = (): jest.Mocked<Pick<UsersService, 'findByEmail'>> => ({
  findByEmail: jest.fn(),
});

const mockRsaService = (): jest.Mocked<Pick<RsaService, 'decrypt' | 'getPublicKeyPem'>> => ({
  decrypt: jest.fn(),
  getPublicKeyPem: jest.fn(),
});

const mockLockService = (): jest.Mocked<LoginLockService> => ({
  lockedSeconds: jest.fn(),
  recordFailure: jest.fn(),
  recordSuccess: jest.fn(),
} as unknown as jest.Mocked<LoginLockService>);

const mockJwtService = () => ({
  sign: jest.fn().mockReturnValue('signed-token'),
});

const mockDataSource = (): jest.Mocked<Pick<DataSource, 'query'>> => ({
  query: jest.fn().mockResolvedValue([]),
});

const META = { ip: '127.0.0.1', ua: 'jest-test' };

describe('AuthService', () => {
  let service: AuthService;
  let usersService: ReturnType<typeof mockUsersService>;
  let rsaService: ReturnType<typeof mockRsaService>;
  let lockService: ReturnType<typeof mockLockService>;
  let jwtService: ReturnType<typeof mockJwtService>;
  let dataSource: ReturnType<typeof mockDataSource>;

  beforeEach(() => {
    usersService = mockUsersService();
    rsaService = mockRsaService();
    lockService = mockLockService();
    jwtService = mockJwtService();
    dataSource = mockDataSource();

    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as never,
      rsaService as unknown as RsaService,
      lockService as unknown as LoginLockService,
      dataSource as unknown as DataSource,
    );

    jest.clearAllMocks();
  });

  describe('login', () => {
    it('账号被锁定时抛出 ForbiddenException', async () => {
      lockService.lockedSeconds.mockReturnValue(300);

      await expect(
        service.login('locked@example.com', 'cipher', META),
      ).rejects.toThrow(ForbiddenException);

      expect(lockService.lockedSeconds).toHaveBeenCalledWith('locked@example.com');
      expect(rsaService.decrypt).not.toHaveBeenCalled();
    });

    it('账号被锁定时写入 locked 日志', async () => {
      lockService.lockedSeconds.mockReturnValue(100);
      dataSource.query.mockResolvedValue([]);

      await expect(
        service.login('locked@example.com', 'cipher', META),
      ).rejects.toThrow(ForbiddenException);

      expect(dataSource.query).toHaveBeenCalled();
    });

    it('用户不存在时抛出 UnauthorizedException', async () => {
      lockService.lockedSeconds.mockReturnValue(0);
      rsaService.decrypt.mockReturnValue('PlainPass1!');
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login('ghost@example.com', 'cipher', META),
      ).rejects.toThrow(UnauthorizedException);

      expect(lockService.recordFailure).toHaveBeenCalledWith('ghost@example.com');
    });

    it('用户查询抛错时统一为 UnauthorizedException（防枚举）', async () => {
      lockService.lockedSeconds.mockReturnValue(0);
      rsaService.decrypt.mockReturnValue('PlainPass1!');
      usersService.findByEmail.mockRejectedValue(new Error('db error'));

      await expect(
        service.login('ghost@example.com', 'cipher', META),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('密码错误时抛出 UnauthorizedException', async () => {
      lockService.lockedSeconds.mockReturnValue(0);
      rsaService.decrypt.mockReturnValue('WrongPass1!');
      usersService.findByEmail.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login('alice@example.com', 'cipher', META),
      ).rejects.toThrow(UnauthorizedException);

      expect(lockService.recordFailure).toHaveBeenCalledWith('alice@example.com');
    });

    it('密码正确时返回 JWT accessToken', async () => {
      lockService.lockedSeconds.mockReturnValue(0);
      rsaService.decrypt.mockReturnValue('Correct1!');
      usersService.findByEmail.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login('alice@example.com', 'cipher', META);

      expect(result).toEqual({ accessToken: 'jwt-token', tokenType: 'bearer' });
      expect(lockService.recordSuccess).toHaveBeenCalledWith('alice@example.com');
    });

    it('登录成功时写入 success 日志', async () => {
      lockService.lockedSeconds.mockReturnValue(0);
      rsaService.decrypt.mockReturnValue('Correct1!');
      usersService.findByEmail.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token');

      await service.login('alice@example.com', 'cipher', META);

      expect(dataSource.query).toHaveBeenCalled();
    });

    it('日志写入失败不影响登录结果', async () => {
      lockService.lockedSeconds.mockReturnValue(0);
      rsaService.decrypt.mockReturnValue('Correct1!');
      usersService.findByEmail.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token');
      dataSource.query.mockRejectedValue(new Error('db down'));

      const result = await service.login('alice@example.com', 'cipher', META);

      expect(result.accessToken).toBe('jwt-token');
    });

    it('JWT payload 包含 sub 和 username', async () => {
      lockService.lockedSeconds.mockReturnValue(0);
      rsaService.decrypt.mockReturnValue('Correct1!');
      const user = buildUser({ id: 'user-uuid', username: 'alice' });
      usersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token');

      await service.login('alice@example.com', 'cipher', META);

      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'user-uuid', username: 'alice' });
    });
  });

  describe('decryptPassword', () => {
    it('解密后符合强度规则时返回明文', () => {
      rsaService.decrypt.mockReturnValue('ValidPass1!');

      const result = service.decryptPassword('cipher');

      expect(result).toBe('ValidPass1!');
    });

    it('解密后不符合强度规则时抛出 UnauthorizedException', () => {
      rsaService.decrypt.mockReturnValue('weak');

      expect(() => service.decryptPassword('cipher')).toThrow(UnauthorizedException);
    });

    it('RSA 解密失败时抛出 BadRequestException（由 RsaService 抛出）', () => {
      rsaService.decrypt.mockImplementation(() => {
        throw new BadRequestException('密码解密失败，请刷新页面重试');
      });

      expect(() => service.decryptPassword('bad-cipher')).toThrow(BadRequestException);
    });

    it('密码强度校验：需要大小写、数字、特殊字符', () => {
      const validPasswords = ['ValidPass1!', 'Another@1A', 'Test#1234Bc'];
      const invalidPasswords = ['nouppercase1!', 'NOLOWER1!', 'NoNumber!', 'NoSpecial1A'];

      for (const pw of validPasswords) {
        rsaService.decrypt.mockReturnValue(pw);
        expect(() => service.decryptPassword('cipher')).not.toThrow();
      }

      for (const pw of invalidPasswords) {
        rsaService.decrypt.mockReturnValue(pw);
        expect(() => service.decryptPassword('cipher')).toThrow(UnauthorizedException);
      }
    });
  });

  describe('getPublicKey', () => {
    it('返回 RSA 公钥 PEM', () => {
      rsaService.getPublicKeyPem.mockReturnValue('-----BEGIN PUBLIC KEY-----\n...');

      const result = service.getPublicKey();

      expect(result).toBe('-----BEGIN PUBLIC KEY-----\n...');
    });
  });
});
