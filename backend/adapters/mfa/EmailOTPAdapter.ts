import { randomInt } from 'crypto';
import { MfaServicePort } from '../../domain/ports/MfaServicePort';
import { CachePort } from '../../domain/ports/CachePort';
import { User } from '../../domain/entities/User';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';
import { NodemailerEmailServiceAdapter } from '../email/NodemailerEmailServiceAdapter';

/**
 * MFA adapter sending one-time passwords via email.
 * Codes are stored temporarily in the provided cache.
 */
export class EmailOTPAdapter implements MfaServicePort {
  /**
   * Create a new adapter instance.
   *
   * @param cache - Cache used to store the generated codes.
   * @param mailer - Adapter used to send emails.
   * @param logger - Logger instance for application logs.
   * @param ttlSeconds - Code validity duration in seconds.
   * @param maxAttempts - Maximum number of verification attempts.
   */
  constructor(
    private readonly cache: CachePort,
    private readonly mailer: NodemailerEmailServiceAdapter,
    private readonly logger: LoggerPort,
    /* istanbul ignore next */ private readonly ttlSeconds = 300,
    /* istanbul ignore next */ private readonly maxAttempts = 5,
  ) {}

  /** @inheritdoc */
  async generateTotpSecret(_user: User): Promise<string> {
    void _user;
    this.logger.debug('generateTotpSecret not supported', getContext());
    throw new Error('Not supported');
  }

  /** @inheritdoc */
  async verifyTotp(_user: User, _token: string): Promise<boolean> {
    void _user;
    void _token;
    this.logger.debug('verifyTotp not supported', getContext());
    throw new Error('Not supported');
  }

  /** @inheritdoc */
  async generateEmailOtp(user: User): Promise<string> {
    const code = randomInt(100000, 999999).toString();
    await this.cache.set(`mfa:email:${user.id}`, code, this.ttlSeconds);
    await this.mailer.sendMail({
      to: user.email,
      subject: 'Your verification code',
      text: `Your verification code is ${code}`,
    });
    this.logger.info('Email OTP generated', getContext());
    return code;
  }

  /** @inheritdoc */
  async verifyEmailOtp(user: User, otp: string): Promise<boolean> {
    const attemptsKey = `mfa:email:attempts:${user.id}`;
    const attempts = (await this.cache.get<number>(attemptsKey)) ?? 0;
    if (attempts >= this.maxAttempts) {
      this.logger.warn('Email OTP verification attempt limit reached', getContext());
      return false;
    }

    const stored = await this.cache.get<string>(`mfa:email:${user.id}`);
    const match = stored === otp;
    if (match) {
      await this.cache.delete(`mfa:email:${user.id}`);
      await this.cache.delete(attemptsKey);
    } else {
      await this.cache.set(attemptsKey, attempts + 1, this.ttlSeconds);
    }
    this.logger.debug(`Email OTP verification ${match ? 'succeeded' : 'failed'}`, getContext());
    return match;
  }

  /** @inheritdoc */
  async disableMfa(user: User): Promise<void> {
    await this.cache.delete(`mfa:email:${user.id}`);
    this.logger.info('Email MFA disabled', getContext());
  }
}
