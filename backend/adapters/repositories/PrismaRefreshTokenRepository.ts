/* istanbul ignore file */
import { PrismaClient } from '@prisma/client';
import { RefreshTokenRepositoryPort } from '../../domain/ports/RefreshTokenRepositoryPort';
import { RefreshToken } from '../../domain/entities/RefreshToken';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

/**
 * Prisma based implementation of {@link RefreshTokenRepositoryPort}.
 */
export class PrismaRefreshTokenRepository implements RefreshTokenRepositoryPort {
  constructor(private prisma: PrismaClient, private readonly logger: LoggerPort) {}

  async create(token: RefreshToken): Promise<RefreshToken> {
    this.logger.info('Creating refresh token', getContext());
    await this.prisma.refreshToken.create({
      data: {
        token: token.token,
        userId: token.userId,
        expiresAt: token.expiresAt,
      },
    });
    return token;
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    this.logger.debug('RefreshToken findByToken', getContext());
    const record = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!record) return null;
    return new RefreshToken(record.token, record.userId, record.expiresAt);
  }

  async delete(token: string): Promise<void> {
    this.logger.debug('RefreshToken delete', getContext());
    await this.prisma.refreshToken.deleteMany({ where: { token } });
  }
}
