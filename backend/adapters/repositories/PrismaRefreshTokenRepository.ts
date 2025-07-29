/* istanbul ignore file */
import { PrismaClient } from '@prisma/client';
import { RefreshTokenPort } from '../../domain/ports/RefreshTokenPort';
import { RefreshToken } from '../../domain/entities/RefreshToken';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';
import argon2 from 'argon2';

/**
 * Prisma based implementation of {@link RefreshTokenPort}.
 */
export class PrismaRefreshTokenRepository implements RefreshTokenPort {
  constructor(private prisma: PrismaClient, private readonly logger: LoggerPort) {}

  async save(token: RefreshToken): Promise<void> {
    this.logger.info('Creating refresh token', getContext());
    await this.prisma.refreshToken.create({
      data: {
        id: token.id,
        userId: token.userId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
      },
    });
  }

  async findValidByToken(token: string): Promise<RefreshToken | null> {
    this.logger.debug('RefreshToken findValidByToken', getContext());
    const records = await this.prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    for (const record of records) {
      if (await argon2.verify(record.tokenHash, token)) {
        if (record.usedAt) return null;
        return new RefreshToken(
          record.id,
          record.userId,
          record.tokenHash,
          record.expiresAt,
          record.createdAt,
          record.revokedAt,
          record.replacedBy,
          record.usedAt,
        );
      }
    }
    return null;
  }

  async markAsUsed(tokenId: string, replacedBy?: string): Promise<void> {
    this.logger.debug('RefreshToken markAsUsed', getContext());
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: {
        usedAt: new Date(),
        replacedBy: replacedBy ? await argon2.hash(replacedBy) : undefined,
      },
    });
  }

  async revoke(tokenId: string): Promise<void> {
    this.logger.debug('RefreshToken revoke', getContext());
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }
}
