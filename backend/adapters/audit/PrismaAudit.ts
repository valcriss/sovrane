import { PrismaClient } from '@prisma/client';
import { AuditPort } from '../../domain/ports/AuditPort';
import { AuditEvent } from '../../domain/entities/AuditEvent';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

/**
 * Prisma-based implementation of {@link AuditPort}.
 */
export class PrismaAudit implements AuditPort {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: LoggerPort,
  ) {}

  async log(event: AuditEvent): Promise<void> {
    this.logger.debug('Creating audit log', getContext());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this.prisma as any).auditLog.create({
      data: {
        timestamp: event.timestamp,
        actorId: event.actorId ?? undefined,
        actorType: event.actorType,
        action: event.action,
        targetType: event.targetType,
        targetId: event.targetId,
        details: event.details,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
      },
    });
  }
}
