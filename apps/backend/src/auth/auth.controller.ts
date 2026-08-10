import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto, CreateUserDto } from '../users/user.dto';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /** 获取 RSA 公钥（前端加密密码用） */
  @Get('public-key')
  @ApiOperation({ summary: '获取 RSA 公钥' })
  getPublicKey() {
    return { publicKey: this.authService.getPublicKey() };
  }

  /** 注册 */
  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: '注册' })
  async register(@Body() dto: CreateUserDto) {
    const plainPassword = this.authService.decryptPassword(dto.password);
    const user = await this.usersService.create({
      ...dto,
      password: plainPassword,
    });
    return { id: user.id, username: user.username, email: user.email };
  }

  /** 登录 */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: '登录' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      req.socket.remoteAddress ??
      null;
    const ua = (req.headers['user-agent'] as string | undefined) ?? null;
    return this.authService.login(dto.email, dto.password, { ip, ua });
  }
}
