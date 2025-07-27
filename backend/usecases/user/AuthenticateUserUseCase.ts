import { AuthServicePort } from '../../domain/ports/AuthServicePort';
import { TokenServicePort } from '../../domain/ports/TokenServicePort';
import { User } from '../../domain/entities/User';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { AuditPort } from '../../domain/ports/AuditPort';
import { AuditEvent } from '../../domain/entities/AuditEvent';
import { LoggerPort } from '../../domain/ports/LoggerPort';

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
  ): Promise<{ user: User; token: string; refreshToken: string }> {
    this.logger.debug('Authenticating user');
    const existing = await this.userRepository.findByEmail(email);
    if (existing && existing.lockedUntil && existing.lockedUntil.getTime() > Date.now()) {
      this.logger.warn('User account locked');
      throw new Error('Account temporarily locked');
    }

    try {
      const user = await this.authService.authenticate(email, password);
      user.lastLogin = new Date();
      user.lastActivity = user.lastLogin;
      user.failedLoginAttempts = 0;
      user.lastFailedLoginAt = null;
      user.lockedUntil = null;
      await this.userRepository.update(user);
      const token = this.tokenService.generateAccessToken(user);
      const refreshToken = await this.tokenService.generateRefreshToken(user);
      return { user, token, refreshToken };
    } catch (err) {
      if (existing && process.env.LOCK_ACCOUNT_ON_LOGIN_FAIL === 'true') {
        existing.failedLoginAttempts += 1;
        existing.lastFailedLoginAt = new Date();
        const threshold = 5;
        const lockDuration = parseInt(process.env.ACCOUNT_LOCK_DURATION || '900', 10) * 1000;
        if (existing.failedLoginAttempts > threshold) {
          existing.lockedUntil = new Date(Date.now() + lockDuration);
          await this.audit.log(new AuditEvent(new Date(), existing.id, 'user', 'user.accountLocked', 'user', existing.id));
        } else {
          await this.audit.log(new AuditEvent(new Date(), existing.id, 'user', 'user.loginFailed', 'user', existing.id));
        }
        await this.userRepository.update(existing);
      }
      /* istanbul ignore next */
      throw err;
    }
  }
}
