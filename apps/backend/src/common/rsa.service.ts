import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as forge from 'node-forge';

@Injectable()
export class RsaService {
  private readonly privateKey: forge.pki.rsa.PrivateKey;

  constructor(private readonly config: ConfigService) {
    const pem = this.config.get<string>('app.rsaPrivateKey') ?? '';
    if (!pem) throw new Error('RSA_PRIVATE_KEY 未配置');
    this.privateKey = forge.pki.privateKeyFromPem(pem);
  }

  /** 解密前端传来的 Base64 密文，返回原始明文密码 */
  decrypt(cipherBase64: string): string {
    try {
      const bytes = forge.util.decode64(cipherBase64);
      return this.privateKey.decrypt(bytes, 'RSA-OAEP');
    } catch {
      throw new BadRequestException('密码解密失败，请刷新页面重试');
    }
  }

  /** 返回 PEM 格式公钥（供 /auth/public-key 接口使用） */
  getPublicKeyPem(): string {
    const pub = forge.pki.setRsaPublicKey(
      this.privateKey.n,
      this.privateKey.e,
    );
    return forge.pki.publicKeyToPem(pub);
  }
}
