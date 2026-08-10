import { Injectable } from '@nestjs/common';

interface LockRecord {
  failures: number;
  lockedUntil: number | null;
}

const MAX_FAILURES = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 分钟

@Injectable()
export class LoginLockService {
  private readonly records = new Map<string, LockRecord>();

  /** 检查账号是否被锁定，若锁定则返回剩余秒数，否则返回 0 */
  lockedSeconds(email: string): number {
    const rec = this.records.get(email);
    if (!rec?.lockedUntil) return 0;
    const remaining = rec.lockedUntil - Date.now();
    if (remaining <= 0) {
      // 锁定已过期，自动重置
      this.records.delete(email);
      return 0;
    }
    return Math.ceil(remaining / 1000);
  }

  /** 登录失败，累计计数；达到上限则锁定 */
  recordFailure(email: string): void {
    const rec = this.records.get(email) ?? { failures: 0, lockedUntil: null };
    rec.failures += 1;
    if (rec.failures >= MAX_FAILURES) {
      rec.lockedUntil = Date.now() + LOCK_DURATION_MS;
    }
    this.records.set(email, rec);
  }

  /** 登录成功，清除记录 */
  recordSuccess(email: string): void {
    this.records.delete(email);
  }
}
