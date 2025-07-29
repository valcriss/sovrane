/* istanbul ignore file */
import { RefreshTokenPort } from '../../domain/ports/RefreshTokenPort';
import { InvalidRefreshTokenException } from '../../domain/errors/InvalidRefreshTokenException';

/**
 * Use case for revoking refresh tokens on logout.
 */
export class RevokeRefreshTokensUseCase {
  constructor(private readonly refreshTokenPort: RefreshTokenPort) {}

  /**
   * Revoke the provided token.
   * @param token - Plain refresh token.
   */
  async execute(token: string): Promise<void> {
    const existing = await this.refreshTokenPort.findValidByToken(token);
    if (!existing) throw new InvalidRefreshTokenException();

    await this.refreshTokenPort.revoke(existing.id, 'User logout or security event');
  }
}
