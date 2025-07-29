import { RefreshTokenPort } from '../../domain/ports/RefreshTokenPort';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { TokenServicePort } from '../../domain/ports/TokenServicePort';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { User } from '../../domain/entities/User';

/**
 * Use case for exchanging a refresh token for new authentication tokens.
 */
export class RefreshAccessTokenUseCase {
  constructor(
    private readonly refreshRepo: RefreshTokenPort,
    private readonly userRepository: UserRepositoryPort,
    private readonly tokenService: TokenServicePort,
    private readonly logger: LoggerPort,
  ) {}

  /**
   * Execute the token refresh.
   *
   * @param refreshToken - Previous refresh token issued to the user.
   * @returns Newly generated access and refresh tokens.
   */
  async execute(refreshToken: string): Promise<{ token: string; refreshToken: string; user?: User }> {
    this.logger.debug('Refreshing access token');
    const stored = await this.refreshRepo.findValidByToken(refreshToken);
    if (!stored || stored.expiresAt.getTime() <= Date.now()) {
      this.logger.warn('Invalid or expired refresh token');
      throw new Error('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findById(stored.userId);
    if (!user) {
      this.logger.warn('Refresh token user not found');
      throw new Error('Invalid or expired refresh token');
    }
    if (user.status === 'archived' || user.status === 'suspended') {
      this.logger.warn('User account is suspended or archived');
      throw new Error('User account is suspended or archived');
    }

    await this.refreshRepo.markAsUsed(stored.id);
    user.lastActivity = new Date();
    await this.userRepository.update(user);
    const token = this.tokenService.generateAccessToken(user);
    const newRefresh = await this.tokenService.generateRefreshToken(user);
    this.logger.debug('Access token refreshed');
    return { token, refreshToken: newRefresh };
  }
}
