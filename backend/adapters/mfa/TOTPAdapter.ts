import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import * as speakeasy from 'speakeasy';
import { MfaServicePort } from '../../domain/ports/MfaServicePort';
import { User } from '../../domain/entities/User';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';
import { CachePort } from '../../domain/ports/CachePort';

/**
 * MFA adapter implementing time-based one-time passwords (TOTP).
 * Secrets are encrypted before being persisted on the user entity.
 */
export class TOTPAdapter implements MfaServicePort {
  /**
   * Create a new adapter instance.
   *
   * @param repo - Repository used to persist updated users.
   * @param cache - Cache used to track OTP usage and attempts.
   * @param logger - Logger instance for application logs.
   * @param encryptionKey - Hex encoded key used to encrypt secrets.
   * @param attemptTtl - TTL in seconds for the attempt counter.
   * @param maxAttempts - Maximum number of verification attempts.
   */
  constructor(
    private readonly repo: UserRepositoryPort,
    private readonly cache: CachePort,
    private readonly logger: LoggerPort,
    private readonly encryptionKey: string,
    /* istanbul ignore next */ private readonly attemptTtl = 300,
    /* istanbul ignore next */ private readonly maxAttempts = 5,
  ) {}

  /** @inheritdoc */
  async generateTotpSecret(user: User): Promise<string> {
    const secret = speakeasy.generateSecret({ length: 20 }).base32;
    user.mfaEnabled = true;
    user.mfaType = 'totp';
    user.mfaSecret = this.encrypt(secret);
    await this.repo.update(user);
    this.logger.info('Generated TOTP secret', getContext());
    return secret;
  }

  /** @inheritdoc */
  async verifyTotp(user: User, token: string): Promise<boolean> {
    if (!user.mfaSecret) return false;
    const attemptsKey = `mfa:totp:attempts:${user.id}`;
    const usedKey = `mfa:totp:used:${user.id}:${token}`;

    if (await this.cache.get(usedKey)) {
      this.logger.warn('TOTP code reuse detected', getContext());
      return false;
    }

    const attempts = (await this.cache.get<number>(attemptsKey)) ?? 0;
    if (attempts >= this.maxAttempts) {
      this.logger.warn('TOTP verification attempt limit reached', getContext());
      return false;
    }

    const secret = this.decrypt(user.mfaSecret);
    const valid = speakeasy.totp.verify({ secret, encoding: 'base32', token });
    if (valid) {
      await this.cache.delete(attemptsKey);
      await this.cache.set(usedKey, true, 30);
    } else {
      await this.cache.set(attemptsKey, attempts + 1, this.attemptTtl);
    }
    this.logger.debug(`TOTP verification ${valid ? 'succeeded' : 'failed'}`, getContext());
    return valid;
  }

  /** @inheritdoc */
  async generateEmailOtp(_user: User): Promise<string> {
    void _user;
    this.logger.debug('generateEmailOtp not supported', getContext());
    throw new Error('Not supported');
  }

  /** @inheritdoc */
  async verifyEmailOtp(_user: User, _otp: string): Promise<boolean> {
    void _user;
    void _otp;
    this.logger.debug('verifyEmailOtp not supported', getContext());
    throw new Error('Not supported');
  }

  /** @inheritdoc */
  async disableMfa(user: User): Promise<void> {
    user.mfaEnabled = false;
    user.mfaType = null;
    user.mfaSecret = null;
    await this.repo.update(user);
    this.logger.info('MFA disabled for user', getContext());
  }

  private encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decrypt(data: string): string {
    const [ivHex, payload] = data.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(payload, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }
}
