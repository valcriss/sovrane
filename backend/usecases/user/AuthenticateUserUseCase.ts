import { AuthServicePort } from '../../domain/ports/AuthServicePort';
import { TokenServicePort } from '../../domain/ports/TokenServicePort';
import { User } from '../../domain/entities/User';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { AuditPort } from '../../domain/ports/AuditPort';
import { AuditEvent } from '../../domain/entities/AuditEvent';
import { AuditEventType } from '../../domain/entities/AuditEventType';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { AccountLockedError } from '../../domain/errors/AccountLockedError';
import { PasswordExpiredException } from '../../domain/errors/PasswordExpiredException';
import { GetConfigUseCase } from '../config/GetConfigUseCase';
import { AppConfigKeys } from '../../domain/entities/AppConfigKeys';

/**
 * Use case for authenticating a user using login and password
 * and issuing authentication tokens.
 */
export class AuthenticateUserUseCase {
  constructor(
    private readonly authService: AuthServicePort,
    private readonly tokenService: TokenServicePort,
    private readonly userRepository: UserRepositoryPort,
    private readonly audit: AuditPort,
    private readonly logger: LoggerPort,
    private readonly config: GetConfigUseCase,
  ) {}

  /**
   * Execute the authentication.
   *
   * @param email - User email used for login.
   * @param password - User password.
   * @returns Authenticated user profile and tokens.
   */
  async execute(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    user: User;
    token?: string;
    refreshToken?: string;
    mfaRequired?: boolean;
    passwordWillExpireSoon?: boolean;
  }> {
    this.logger.debug('Authenticating user');
    const existing = await this.userRepository.findByEmail(email);
    if (existing && existing.lockedUntil && existing.lockedUntil.getTime() > Date.now()) {
      this.logger.warn('User account locked');
      throw new AccountLockedError(existing.lockedUntil!);
    }

    try {
      const user = await this.authService.authenticate(email, password);
      user.failedLoginAttempts = 0;
      user.lastFailedLoginAt = null;
      user.lockedUntil = null;

      const expirationDays =
        (await this.config.execute<number>(AppConfigKeys.ACCOUNT_PASSWORD_EXPIRE_AFTER)) ??
        90;
      const warningDays =
        (await this.config.execute<number>(AppConfigKeys.ACCOUNT_PASSWORD_EXPIRE_WARNING_DAYS)) ??
        7;
      const daysSinceChange = this.daysBetween(user.passwordChangedAt, new Date());
      if (daysSinceChange >= expirationDays) {
        throw new PasswordExpiredException();
      }
      const willExpire = daysSinceChange >= expirationDays - warningDays;

      if (!user.mfaEnabled) {
        user.lastLogin = new Date();
        user.lastActivity = user.lastLogin;
      }

      await this.userRepository.update(user);

      if (user.mfaEnabled) {
        return { user, mfaRequired: true, passwordWillExpireSoon: willExpire };
      }

      const token = this.tokenService.generateAccessToken(user);
      const refreshToken = await this.tokenService.generateRefreshToken(
        user,
        ipAddress,
        userAgent,
      );
      return { user, token, refreshToken, passwordWillExpireSoon: willExpire };
    } catch (err) {
      const lockOnFail =
        (await this.config.execute<boolean>(AppConfigKeys.ACCOUNT_LOCK_ON_LOGIN_FAIL)) ??
        (process.env.LOCK_ACCOUNT_ON_LOGIN_FAIL === 'true');
      const threshold =
        (await this.config.execute<number>(AppConfigKeys.ACCOUNT_LOCK_FAIL_THRESHOLD)) ?? 4;
      const lockDurationSec =
        (await this.config.execute<number>(AppConfigKeys.ACCOUNT_LOCK_DURATION)) ??
        parseInt(process.env.ACCOUNT_LOCK_DURATION || '900', 10);
      if (existing && lockOnFail) {
        existing.failedLoginAttempts += 1;
        existing.lastFailedLoginAt = new Date();
        const lockDuration = lockDurationSec * 1000;
        if (existing.failedLoginAttempts > threshold) {
          existing.lockedUntil = new Date(Date.now() + lockDuration);
          await this.audit.log(
            new AuditEvent(
              new Date(),
              existing.id,
              'user',
              AuditEventType.USER_ACCOUNT_LOCKED,
              'user',
              existing.id,
            ),
          );
        } else {
          await this.audit.log(
            new AuditEvent(
              new Date(),
              existing.id,
              'user',
              AuditEventType.USER_LOGIN_FAILED,
              'user',
              existing.id,
            ),
          );
        }
        await this.userRepository.update(existing);
        if (existing.lockedUntil && existing.failedLoginAttempts > threshold) {
          throw new AccountLockedError(existing.lockedUntil);
        }
      }
      /* istanbul ignore next */
      throw err;
    }
  }

  private daysBetween(a: Date, b: Date): number {
    return Math.floor(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  }
}
