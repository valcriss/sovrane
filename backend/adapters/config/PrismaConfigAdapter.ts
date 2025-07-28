import { PrismaClient } from '@prisma/client';
import { ConfigPort } from '../../domain/ports/ConfigPort';
import { AppConfig } from '../../domain/entities/AppConfig';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

/**
 * Prisma implementation of {@link ConfigPort}.
 */
export class PrismaConfigAdapter implements ConfigPort {
  constructor(private readonly prisma: PrismaClient, private readonly logger: LoggerPort) {}

  async findByKey(key: string): Promise<AppConfig | null> {
    const record = await this.prisma.appConfig.findUnique({ where: { key } });
    if (!record) {
      return null;
    }
    return new AppConfig(
      record.id,
      record.key,
      record.value,
      record.type as AppConfig['type'],
      record.updatedAt,
      record.updatedBy,
    );
  }

  async upsert(key: string, value: string, type: string, updatedBy: string): Promise<AppConfig> {
    this.logger.debug(`Upserting config ${key}`, getContext());
    const record = await this.prisma.appConfig.upsert({
      where: { key },
      create: { key, value, type, updatedBy },
      update: { value, type, updatedBy },
    });
    return new AppConfig(
      record.id,
      record.key,
      record.value,
      record.type as AppConfig['type'],
      record.updatedAt,
      record.updatedBy,
    );
  }
}
