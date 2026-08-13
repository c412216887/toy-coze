import { LoginLockService } from './login-lock.service';

describe('LoginLockService', () => {
  let service: LoginLockService;

  beforeEach(() => {
    service = new LoginLockService();
  });

  describe('lockedSeconds', () => {
    it('未登录过的账号不锁定', () => {
      expect(service.lockedSeconds('test@example.com')).toBe(0);
    });

    it('失败次数未达上限时不锁定', () => {
      const email = 'test@example.com';
      service.recordFailure(email);
      service.recordFailure(email);
      expect(service.lockedSeconds(email)).toBe(0);
    });

    it('失败 5 次后锁定，剩余时间大于 0', () => {
      const email = 'lock@example.com';
      for (let i = 0; i < 5; i++) {
        service.recordFailure(email);
      }
      expect(service.lockedSeconds(email)).toBeGreaterThan(0);
    });

    it('锁定剩余时间约为 15 分钟（秒）', () => {
      const email = 'time@example.com';
      for (let i = 0; i < 5; i++) {
        service.recordFailure(email);
      }
      const remaining = service.lockedSeconds(email);
      // 15 分钟 = 900 秒，允许 2 秒误差
      expect(remaining).toBeGreaterThanOrEqual(898);
      expect(remaining).toBeLessThanOrEqual(900);
    });

    it('锁定到期后自动解除（模拟过期）', () => {
      const email = 'expire@example.com';
      for (let i = 0; i < 5; i++) {
        service.recordFailure(email);
      }
      // 手动把锁定时间改到过去
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records = (service as any).records as Map<string, { failures: number; lockedUntil: number | null }>;
      records.get(email)!.lockedUntil = Date.now() - 1000;

      expect(service.lockedSeconds(email)).toBe(0);
    });
  });

  describe('recordFailure', () => {
    it('每次失败累加计数', () => {
      const email = 'count@example.com';
      service.recordFailure(email);
      service.recordFailure(email);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records = (service as any).records as Map<string, { failures: number }>;
      expect(records.get(email)?.failures).toBe(2);
    });

    it('第 5 次失败时触发锁定', () => {
      const email = 'fifth@example.com';
      for (let i = 0; i < 4; i++) {
        service.recordFailure(email);
      }
      expect(service.lockedSeconds(email)).toBe(0);

      service.recordFailure(email);
      expect(service.lockedSeconds(email)).toBeGreaterThan(0);
    });

    it('超过 5 次失败仍保持锁定', () => {
      const email = 'over@example.com';
      for (let i = 0; i < 8; i++) {
        service.recordFailure(email);
      }
      expect(service.lockedSeconds(email)).toBeGreaterThan(0);
    });
  });

  describe('recordSuccess', () => {
    it('成功登录后清除失败记录', () => {
      const email = 'success@example.com';
      service.recordFailure(email);
      service.recordFailure(email);
      service.recordSuccess(email);
      expect(service.lockedSeconds(email)).toBe(0);
    });

    it('成功登录后可以重新计数失败', () => {
      const email = 'reset@example.com';
      for (let i = 0; i < 4; i++) {
        service.recordFailure(email);
      }
      service.recordSuccess(email);
      for (let i = 0; i < 4; i++) {
        service.recordFailure(email);
      }
      expect(service.lockedSeconds(email)).toBe(0);
    });

    it('未登录过的账号调用 recordSuccess 不抛错', () => {
      expect(() => service.recordSuccess('unknown@example.com')).not.toThrow();
    });
  });
});
