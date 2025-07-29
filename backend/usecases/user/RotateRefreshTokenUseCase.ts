/* istanbul ignore file */
import { RefreshTokenPort } from '../../domain/ports/RefreshTokenPort';
import { TokenServicePort } from '../../domain/ports/TokenServicePort';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { InvalidRefreshTokenException } from '../../domain/errors/InvalidRefreshTokenException';

/**
 * Use case handling refresh token rotation.
 */
export class RotateRefreshTokenUseCase {
  constructor(
    private readonly refreshTokenPort: RefreshTokenPort,
    private readonly tokenService: TokenServicePort,
    private readonly userRepository: UserRepositoryPort,
  ) {}

  /**
   * Rotate a refresh token and return new tokens.
   *
   * @param oldToken - Token presented by the client.
   */
  async execute(oldToken: string): Promise<{ token: string; refreshToken: string }> {
    const existing = await this.refreshTokenPort.findValidByToken(oldToken);
    if (!existing) throw new InvalidRefreshTokenException();

    const user = await this.userRepository.findById(existing.userId);
    if (!user) throw new InvalidRefreshTokenException();

    const newRefresh = await this.tokenService.generateRefreshToken(user);
    await this.refreshTokenPort.markAsUsed(existing.id, newRefresh);

    const newJwt = this.tokenService.generateAccessToken(user);

    return { token: newJwt, refreshToken: newRefresh };
  }
}
