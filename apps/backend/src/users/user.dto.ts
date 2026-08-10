import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** 密码强度规则：8-32 位，必须含大写、小写、数字、特殊字符各至少一个 */
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]{8,32}$/;

const PASSWORD_MSG =
  '密码须 8-32 位，包含大写字母、小写字母、数字、特殊字符各至少一个';

export class CreateUserDto {
  @ApiProperty({ example: 'alice' })
  @IsString()
  username!: string;

  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email!: string;

  /**
   * RSA 加密后的密文（Base64），由前端用服务端公钥加密原始密码后传入。
   * 后端解密后再做密码强度校验，不在 DTO 层做 Matches 校验（密文不符合明文规则）。
   */
  @ApiProperty({ description: 'RSA 加密密码（Base64）' })
  @IsString()
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email!: string;

  /**
   * RSA 加密后的密文（Base64）
   */
  @ApiProperty({ description: 'RSA 加密密码（Base64）' })
  @IsString()
  password!: string;
}

export { PASSWORD_REGEX, PASSWORD_MSG };
