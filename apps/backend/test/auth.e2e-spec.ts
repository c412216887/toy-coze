import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as forge from 'node-forge';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TransformInterceptor } from '../src/common/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import { AuthService } from '../src/auth/auth.service';
import { AuthController } from '../src/auth/auth.controller';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { LoginLockService } from '../src/auth/login-lock.service';
import { RsaService } from '../src/common/rsa.service';
import { UsersService } from '../src/users/users.service';
import { UserRepository } from '../src/users/user.repository';
import { DataSource } from 'typeorm';

const RSA_KEY_SIZE = 2048;
let cachedKeyPair: forge.pki.rsa.KeyPair | null = null;

function getOrCreateKeyPair(): forge.pki.rsa.KeyPair {
  if (!cachedKeyPair) {
    cachedKeyPair = forge.pki.rsa.generateKeyPair({ bits: RSA_KEY_SIZE });
  }
  return cachedKeyPair;
}

function encryptPassword(publicKey: forge.pki.rsa.PublicKey, plaintext: string): string {
  const encrypted = publicKey.encrypt(plaintext, 'RSAES-PKCS1-V1_5');
  return forge.util.encode64(encrypted);
}

interface StoredUser {
  id: string;
  username: string;
  email: string;
  hashed_password: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: Date;
  updated_at: Date;
}

class InMemoryDataSource {
  private users: StoredUser[] = [];
  private counter = 0;

  async query(sql: string, params: unknown[] = []): Promise<unknown[]> {
    const s = sql.replace(/\s+/g, ' ').trim().toLowerCase();

    if (s.includes('select count(*)') && s.includes('t_user') && s.includes('username =')) {
      const count = this.users.filter((u) => u.username === (params[0] as string)).length;
      return [{ count: String(count) }];
    }

    if (s.includes('select count(*)') && s.includes('t_user') && s.includes('email =')) {
      const count = this.users.filter((u) => u.email === (params[0] as string)).length;
      return [{ count: String(count) }];
    }

    if (s.startsWith('insert into t_user')) {
      const [username, email, hashed_password] = params as [string, string, string];
      const row: StoredUser = {
        id: `id-${++this.counter}`,
        username,
        email,
        hashed_password,
        is_active: true,
        is_superuser: false,
        created_at: new Date(),
        updated_at: new Date(),
      };
      this.users.push(row);
      return [{
        id: row.id, username: row.username, email: row.email,
        isActive: row.is_active, isSuperuser: row.is_superuser,
        createdAt: row.created_at, updatedAt: row.updated_at,
      }];
    }

    if (s.includes('from t_user') && s.includes('email =')) {
      const row = this.users.find((u) => u.email === (params[0] as string));
      if (!row) return [];
      return [{
        id: row.id, username: row.username, email: row.email,
        hashedPassword: row.hashed_password,
        isActive: row.is_active, isSuperuser: row.is_superuser,
        createdAt: row.created_at, updatedAt: row.updated_at,
      }];
    }

    if (s.includes('from t_user') && s.includes('username =')) {
      const row = this.users.find((u) => u.username === (params[0] as string));
      if (!row) return [];
      return [{
        id: row.id, username: row.username, email: row.email,
        hashedPassword: row.hashed_password,
        isActive: row.is_active, isSuperuser: row.is_superuser,
        createdAt: row.created_at, updatedAt: row.updated_at,
      }];
    }

    if (s.includes('from t_user') && s.includes('where id =')) {
      const row = this.users.find((u) => u.id === (params[0] as string));
      if (!row) return [];
      return [{
        id: row.id, username: row.username, email: row.email,
        isActive: row.is_active, isSuperuser: row.is_superuser,
        createdAt: row.created_at, updatedAt: row.updated_at,
      }];
    }

    if (s.startsWith('insert into t_login_log')) {
      return [];
    }

    return [];
  }

  reset() {
    this.users = [];
    this.counter = 0;
  }
}

async function createTestApp(ds: InMemoryDataSource): Promise<INestApplication<App>> {
  const kp = getOrCreateKeyPair();
  const privateKeyPem = forge.pki.privateKeyToPem(kp.privateKey);

  const module: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      PassportModule,
      JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1h' } }),
      ThrottlerModule.forRoot([{ ttl: 60000, limit: 1000 }]),
      EventEmitterModule.forRoot(),
    ],
    controllers: [AuthController],
    providers: [
      AuthService,
      LoginLockService,
      UsersService,
      UserRepository,
      JwtStrategy,
      {
        provide: DataSource,
        useValue: ds,
      },
      {
        provide: ConfigService,
        useValue: {
          get: (key: string) => {
            const map: Record<string, string> = {
              'app.jwtSecret': 'test-secret',
              'app.jwtExpiresIn': '1h',
              'app.rsaPrivateKey': privateKeyPem,
            };
            return map[key];
          },
        },
      },
      RsaService,
    ],
  }).compile();

  const app = module.createNestApplication();
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.setGlobalPrefix('api/v1');
  await app.init();
  return app;
}

describe('Auth E2E', () => {
  let app: INestApplication<App>;
  let ds: InMemoryDataSource;
  let publicKey: forge.pki.rsa.PublicKey;

  beforeAll(async () => {
    const kp = getOrCreateKeyPair();
    publicKey = kp.publicKey;
    ds = new InMemoryDataSource();
    app = await createTestApp(ds);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    ds.reset();
  });

  const enc = (plain: string) => encryptPassword(publicKey, plain);

  describe('GET /api/v1/auth/public-key', () => {
    it('返回包含 BEGIN PUBLIC KEY 的 PEM', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/auth/public-key');

      expect(res.status).toBe(200);
      expect(res.body.data.publicKey).toContain('BEGIN PUBLIC KEY');
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('合法参数注册成功：返回 id/username/email，不含密码', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ username: 'alice', email: 'alice@example.com', password: enc('ValidPass1!') });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ username: 'alice', email: 'alice@example.com' });
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).not.toHaveProperty('hashedPassword');
    });

    it('邮箱格式非法 → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ username: 'alice', email: 'bad-email', password: enc('ValidPass1!') });

      expect(res.status).toBe(400);
    });

    it('缺少 username → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'alice@example.com', password: enc('ValidPass1!') });

      expect(res.status).toBe(400);
    });

    it('密码强度不足（无大写）→ 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ username: 'bob', email: 'bob@example.com', password: enc('weakpassword1!') });

      expect(res.status).toBe(401);
    });

    it('重复用户名 → 409', async () => {
      const body = { username: 'dup', email: 'dup@example.com', password: enc('ValidPass1!') };
      await request(app.getHttpServer()).post('/api/v1/auth/register').send(body);

      const res = await request(app.getHttpServer()).post('/api/v1/auth/register').send(body);

      expect(res.status).toBe(409);
    });

    it('重复邮箱（不同用户名）→ 409', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ username: 'u1', email: 'shared@example.com', password: enc('ValidPass1!') });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ username: 'u2', email: 'shared@example.com', password: enc('ValidPass1!') });

      expect(res.status).toBe(409);
    });

    it('响应体遵循统一格式 { code, message, data }', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ username: 'fmt', email: 'fmt@example.com', password: enc('ValidPass1!') });

      expect(res.body).toHaveProperty('code');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const PASS = 'ValidPass1!';

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ username: 'alice', email: 'alice@example.com', password: enc(PASS) });
    });

    it('正确凭据 → 200 + accessToken + tokenType bearer', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'alice@example.com', password: enc(PASS) });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.tokenType).toBe('bearer');
    });

    it('accessToken 为标准三段式 JWT', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'alice@example.com', password: enc(PASS) });

      const parts = (res.body.data.accessToken as string).split('.');
      expect(parts).toHaveLength(3);
    });

    it('密码错误 → 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'alice@example.com', password: enc('WrongPass1!') });

      expect(res.status).toBe(401);
    });

    it('邮箱不存在 → 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'ghost@example.com', password: enc(PASS) });

      expect(res.status).toBe(401);
    });

    it('邮箱格式非法 → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'bad-email', password: enc(PASS) });

      expect(res.status).toBe(400);
    });

    it('连续错误密码 5 次后触发锁定 → 403', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: 'alice@example.com', password: enc('WrongPass1!') });
      }

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'alice@example.com', password: enc(PASS) });

      expect(res.status).toBe(403);
    });

    it('错误响应也遵循统一格式 { code, message, data }', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'alice@example.com', password: enc('WrongPass1!') });

      expect(res.body).toHaveProperty('code');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
    });
  });

  describe('注册 → 登录完整流程', () => {
    it('成功注册后立即可用正确密码登录', async () => {
      const plain = 'FlowTest1!';
      const regRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ username: 'flowuser', email: 'flow@example.com', password: enc(plain) });
      expect(regRes.status).toBe(201);

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'flow@example.com', password: enc(plain) });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data).toHaveProperty('accessToken');
    });

    it('错误密码无法登录刚注册的账号', async () => {
      const plain = 'FlowTest1!';
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ username: 'flowuser2', email: 'flow2@example.com', password: enc(plain) });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'flow2@example.com', password: enc('WrongPass1!') });
      expect(res.status).toBe(401);
    });
  });
});
