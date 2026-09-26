import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private config: ConfigService) {
    const hexKey = this.config.get<string>('ENCRYPTION_KEY')!;
    this.key = Buffer.from(hexKey, 'hex'); // must be 32 bytes (64 hex chars)
  }

  encrypt(plainText: string): string {
    const iv = crypto.randomBytes(12); // GCM recommended IV size
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // store iv + authTag + ciphertext together, colon-separated, hex-encoded
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(payload: string): string {
    const [ivHex, authTagHex, encryptedHex] = payload.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }

  /** Returns a safe masked preview for API responses — never the real key */
  mask(encryptedPayload: string): string {
    return 'sk-••••••••' + encryptedPayload.slice(-4);
  }
}