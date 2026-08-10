import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RsaService } from '../common/rsa.service';
import { LoginLockService } from './login-lock.service';
import { LoginLog } from './login-log.entity';
import { PASSWORD_REGEX } from '../users/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly rsaService: RsaService,
    private readonly lockService: LoginLockService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** 登录：RSA 解密 → 锁定检查 → 密码校验 → 记录日志 → 签发 JWT */
  async login(
    email: string,
    cipherPassword: string,
    meta: { ip: string | null; ua: string | null },
  ) {
    // 1. 锁定检查
    const lockedSec = this.lockService.lockedSeconds(email);
    if (lockedSec > 0) {
      await this.writeLog(email, 'locked', meta);
      throw new ForbiddenException(
        `账号已被锁定，请 ${lockedSec} 秒后重试`,
      );
    }

    // 2. RSA 解密
    const plainPassword = this.rsaService.decrypt(cipherPassword);

    // 3. 查用户（统一报错，防止枚举）
    const user = await this.usersService.findByEmail(email).catch(() => null);
    if (!user) {
      this.lockService.recordFailure(email);
      await this.writeLog(email, 'fail', meta);
      throw new UnauthorizedException('账号或密码错误');
    }

    // 4. 密码校验
    const valid = await bcrypt.compare(plainPassword, user.hashedPassword);
    if (!valid) {
      this.lockService.recordFailure(email);
      await this.writeLog(email, 'fail', meta);
      throw new UnauthorizedException('账号或密码错误');
    }

    // 5. 成功
    this.lockService.recordSuccess(email);
    await this.writeLog(email, 'success', meta);

    const payload = { sub: user.id, username: user.username };
    return { accessToken: this.jwtService.sign(payload), tokenType: 'bearer' };
  }

  /** 注册：RSA 解密 → 密码强度校验 → 交给 UsersService */
  decryptPassword(cipherPassword: string): string {
    const plain = this.rsaService.decrypt(cipherPassword);
    if (!PASSWORD_REGEX.test(plain)) {
      throw new UnauthorizedException(
        '密码须 8-32 位，包含大写字母、小写字母、数字、特殊字符各至少一个',
      );
    }
    return plain;
  }

  getPublicKey(): string {
    return this.rsaService.getPublicKeyPem();
  }

  private async writeLog(
    email: string,
    result: LoginLog['result'],
    meta: { ip: string | null; ua: string | null },
  ) {
    try {
      await this.dataSource.query(
        `INSERT INTO t_login_log (email, result, ip_address, user_agent)
         VALUES ($1, $2, $3, $4)`,
        [email, result, meta.ip, meta.ua],
      );
    } catch {
      // 日志写入失败不影响主流程
    }
  }
}
