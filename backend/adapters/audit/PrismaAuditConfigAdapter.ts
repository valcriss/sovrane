import { PrismaClient } from '@prisma/client';
import { AuditConfigPort } from '../../domain/ports/AuditConfigPort';
import { AuditConfig } from '../../domain/entities/AuditConfig';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

/**
 * Prisma-based implementation of {@link AuditConfigPort}.
 */
export class PrismaAuditConfigAdapter implements AuditConfigPort {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: LoggerPort,
  ) {}

  async get(): Promise<AuditConfig | null> {
    const record = await this.prisma.auditConfig.findUnique({ where: { singleton: 1 } });
    if (!record) {
      return null;
    }
    return new AuditConfig(
      record.id,
      record.levels,
      record.categories,
      record.updatedAt,
      record.updatedBy,
    );
  }

  async update(levels: string[], categories: string[], updatedBy: string): Promise<AuditConfig> {
    this.logger.debug('Updating audit config', getContext());
    const record = await this.prisma.auditConfig.upsert({
      where: { singleton: 1 },
      create: { singleton: 1, levels, categories, updatedBy },
      update: { levels, categories, updatedBy },
    });
    return new AuditConfig(
      record.id,
      record.levels,
      record.categories,
      record.updatedAt,
      record.updatedBy,
    );
  }
}
