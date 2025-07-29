/* istanbul ignore file */
import { RefreshTokenPort } from '../../domain/ports/RefreshTokenPort';
import { TokenServicePort } from '../../domain/ports/TokenServicePort';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { AuditPort } from '../../domain/ports/AuditPort';
import { AuditEvent } from '../../domain/entities/AuditEvent';
import { InvalidRefreshTokenException } from '../../domain/errors/InvalidRefreshTokenException';

/**
 * Use case handling refresh token rotation.
 */
export class RotateRefreshTokenUseCase {
  constructor(
    private readonly refreshTokenPort: RefreshTokenPort,
    private readonly tokenService: TokenServicePort,
    private readonly userRepository: UserRepositoryPort,
    private readonly auditPort: AuditPort,
  ) {}

  /**
   * Rotate a refresh token and return new tokens.
   *
   * @param oldToken - Token presented by the client.
   * @param ipAddress - Optional IP address of the requester.
   * @param userAgent - Optional user agent string.
   */
  async execute(
    oldToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ token: string; refreshToken: string }> {
    const existing = await this.refreshTokenPort.findValidByToken(oldToken);
    if (!existing) throw new InvalidRefreshTokenException();

    const user = await this.userRepository.findById(existing.userId);
    if (!user) throw new InvalidRefreshTokenException();

    const newRefresh = await this.tokenService.generateRefreshToken(user);
    await this.refreshTokenPort.markAsUsed(existing.id, newRefresh);

    await this.auditPort.log(
      new AuditEvent(
        new Date(),
        user.id,
        'user',
        'auth.refresh',
        'user',
        user.id,
        undefined,
        ipAddress,
        userAgent,
      ),
    );

    const newJwt = this.tokenService.generateAccessToken(user);

    return { token: newJwt, refreshToken: newRefresh };
  }
}
