import { PrismaClient, Prisma } from '@prisma/client';
import { AuditPort } from '../../domain/ports/AuditPort';
import { AuditEvent } from '../../domain/entities/AuditEvent';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';
import { AuditLogQuery } from '../../domain/dtos/AuditLogQuery';
import { PaginatedResult } from '../../domain/dtos/PaginatedResult';

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

  async findPaginated(query: AuditLogQuery): Promise<PaginatedResult<AuditEvent>> {
    this.logger.debug('Retrieving audit logs', getContext());
    const where: Prisma.AuditLogWhereInput = {};
    if (query.actorId) {
      where.actorId = query.actorId;
    }
    if (query.action) {
      where.action = query.action;
    }
    if (query.targetType) {
      where.targetType = query.targetType;
    }
    if (query.dateFrom || query.dateTo) {
      where.timestamp = {};
      if (query.dateFrom) (where.timestamp as Prisma.DateTimeFilter).gte = query.dateFrom;
      if (query.dateTo) (where.timestamp as Prisma.DateTimeFilter).lte = query.dateTo;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records = await (this.prisma as any).auditLog.findMany({
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      where,
      orderBy: { timestamp: 'desc' },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total = await (this.prisma as any).auditLog.count({ where });
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: records.map((r: any) =>
        new AuditEvent(
          r.timestamp,
          r.actorId,
          r.actorType,
          r.action,
          r.targetType,
          r.targetId,
          r.details,
          r.ipAddress,
          r.userAgent,
        ),
      ),
      page: query.page,
      limit: query.limit,
      total,
    };
  }
}
