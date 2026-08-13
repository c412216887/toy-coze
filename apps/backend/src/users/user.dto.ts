import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]{8,32}$/;

export class CreateUserDto {
  @ApiProperty({ example: 'alice' })
  @IsString()
  username!: string;

  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'RSA 加密密码（Base64）' })
  @IsString()
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'RSA 加密密码（Base64）' })
  @IsString()
  password!: string;
}

export class UpdateProfileDto {
  @ApiProperty({ example: 'new_alice', required: false })
  @IsString()
  @IsOptional()
  username?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'RSA 加密的当前密码（Base64）' })
  @IsString()
  oldPassword!: string;

  @ApiProperty({ description: 'RSA 加密的新密码（Base64）' })
  @IsString()
  newPassword!: string;
}
