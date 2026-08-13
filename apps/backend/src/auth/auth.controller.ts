import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CurrentUser } from './current-user.decorator';
import { User } from '../users/user.entity';
import { LoginDto, CreateUserDto, UpdateProfileDto, ChangePasswordDto } from '../users/user.dto';
import { PASSWORD_REGEX } from '../users/user.dto';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('public-key')
  @ApiOperation({ summary: '获取 RSA 公钥' })
  getPublicKey() {
    return { publicKey: this.authService.getPublicKey() };
  }

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: '注册' })
  async register(@Body() dto: CreateUserDto) {
    const plainPassword = this.authService.decryptPassword(dto.password);
    const user = await this.usersService.create({ ...dto, password: plainPassword });
    return { id: user.id, username: user.username, email: user.email };
  }

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

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  async me(@CurrentUser() user: User) {
    return { id: user.id, username: user.username, email: user.email };
  }

  @Put('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改用户名' })
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    if (!dto.username) return { id: user.id, username: user.username, email: user.email };
    const updated = await this.usersService.updateUsername(user.id, dto.username);
    return { id: updated.id, username: updated.username, email: updated.email };
  }

  @Put('password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '修改密码' })
  async changePassword(@CurrentUser() user: User, @Body() dto: ChangePasswordDto) {
    const oldPlain = this.authService.decryptPassword(dto.oldPassword);
    const newPlain = this.authService.decryptPassword(dto.newPassword);
    if (!PASSWORD_REGEX.test(newPlain)) {
      throw new Error('密码须 8-32 位，包含大写字母、小写字母、数字、特殊字符各至少一个');
    }
    await this.usersService.changePassword(user.id, oldPlain, newPlain);
  }
}
