/* istanbul ignore file */
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { TokenServicePort } from '../../domain/ports/TokenServicePort';
import { User } from '../../domain/entities/User';
import { RefreshTokenRepositoryPort } from '../../domain/ports/RefreshTokenRepositoryPort';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { RefreshToken } from '../../domain/entities/RefreshToken';
import { getContext } from '../../infrastructure/loggerContext';

/**
 * Token service issuing JWT access tokens and persistent refresh tokens.
 */
export class JWTTokenServiceAdapter implements TokenServicePort {
  /**
   * Create a new service instance.
   *
   * @param secret - Secret used to sign access tokens.
   * @param refreshRepo - Repository storing refresh tokens.
   * @param logger - Logger instance.
   * @param accessDuration - JWT expiration duration string.
   * @param refreshDuration - Refresh token validity duration string.
   */
  constructor(
    private readonly secret: string,
    private readonly refreshRepo: RefreshTokenRepositoryPort,
    private readonly logger: LoggerPort,
    private readonly accessDuration: string = process.env.JWT_ACCESS_TOKEN_DURATION || '15m',
    private readonly refreshDuration: string = process.env.JWT_REFRESH_TOKEN_DURATION || '7d',
  ) {}

  generateAccessToken(user: User): string {
    this.logger.debug('Generating access token', getContext());
    return jwt.sign(
      { email: user.email },
      this.secret,
      { subject: user.id, expiresIn: this.accessDuration } as jwt.SignOptions,
    );
  }

  async generateRefreshToken(user: User): Promise<string> {
    this.logger.debug('Generating refresh token', getContext());
    const token = randomUUID();
    const expires = new Date(Date.now() + this.parseDuration(this.refreshDuration));
    await this.refreshRepo.create(new RefreshToken(token, user.id, expires));
    return token;
  }

  private parseDuration(text: string): number {
    const match = text.match(/^(\d+)([smhdw])$/);
    if (!match) return parseInt(text, 10) * 1000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    /* istanbul ignore next */
    switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'w': return value * 7 * 24 * 60 * 60 * 1000;
    default: return value;
    }
  }
}
