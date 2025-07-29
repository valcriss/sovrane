import { MfaServicePort } from '../../domain/ports/MfaServicePort';
import { TokenServicePort } from '../../domain/ports/TokenServicePort';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';

/**
 * Use case verifying a multi-factor authentication code and issuing tokens.
 */
export class VerifyMfaUseCase {
  constructor(
    private readonly mfaService: MfaServicePort,
    private readonly tokenService: TokenServicePort,
    private readonly userRepository: UserRepositoryPort,
  ) {}

  /**
   * Verify the provided code and complete the authentication.
   *
   * @param user - User verifying MFA.
   * @param code - Submitted code.
   * @param ipAddress - Optional IP address.
   * @param userAgent - Optional user agent string.
   * @returns Authenticated user and tokens.
   */
  async execute(
    user: User,
    code: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ user: User; token: string; refreshToken: string }> {
    let valid = false;
    if (user.mfaType === 'totp') {
      valid = await this.mfaService.verifyTotp(user, code);
    } else if (user.mfaType === 'email') {
      valid = await this.mfaService.verifyEmailOtp(user, code);
    } else {
      throw new Error('MFA not enabled');
    }

    if (!valid) {
      throw new Error('Invalid MFA code');
    }

    user.lastLogin = new Date();
    user.lastActivity = user.lastLogin;
    await this.userRepository.update(user);

    const token = this.tokenService.generateAccessToken(user);
    const refreshToken = await this.tokenService.generateRefreshToken(
      user,
      ipAddress,
      userAgent,
    );

    return { user, token, refreshToken };
  }
}
