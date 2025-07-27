import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaAudit } from '../../../adapters/audit/PrismaAudit';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { AuditEvent } from '../../../domain/entities/AuditEvent';

describe('PrismaAudit', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let logger: DeepMockProxy<LoggerPort>;
  let adapter: PrismaAudit;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    logger = mockDeep<LoggerPort>();
    adapter = new PrismaAudit(prisma, logger);
  });

  it('should create audit log record', async () => {
    const event = new AuditEvent(
      new Date('2024-01-01T00:00:00Z'),
      'actor',
      'user',
      'action',
      'target',
      'id',
      { a: 1 },
      'ip',
      'ua',
    );

    await adapter.log(event);

    expect((prisma as any).auditLog.create).toHaveBeenCalledWith({
      data: {
        timestamp: event.timestamp,
        actorId: 'actor',
        actorType: 'user',
        action: 'action',
        targetType: 'target',
        targetId: 'id',
        details: { a: 1 },
        ipAddress: 'ip',
        userAgent: 'ua',
      },
    });
  });

  it('should handle optional fields', async () => {
    const event = new AuditEvent(
      new Date('2024-01-02T00:00:00Z'),
      null,
      'system',
      'action',
    );

    await adapter.log(event);

    expect((prisma as any).auditLog.create).toHaveBeenCalledWith({
      data: {
        timestamp: event.timestamp,
        actorId: undefined,
        actorType: 'system',
        action: 'action',
        targetType: undefined,
        targetId: undefined,
        details: undefined,
        ipAddress: undefined,
        userAgent: undefined,
      },
    });
  });

  it('should return paginated audit logs', async () => {
    (prisma as any).auditLog.findMany.mockResolvedValue([
      {
        timestamp: new Date('2024-01-01T00:00:00Z'),
        actorId: 'u',
        actorType: 'user',
        action: 'action',
        targetType: null,
        targetId: null,
        details: null,
        ipAddress: null,
        userAgent: null,
      },
    ]);
    (prisma as any).auditLog.count.mockResolvedValue(1);

    const result = await adapter.findPaginated({ page: 1, limit: 20 });

    expect((prisma as any).auditLog.findMany).toHaveBeenCalled();
    expect(result.total).toBe(1);
    expect(result.items[0].action).toBe('action');
  });

  it('should apply filters when retrieving logs', async () => {
    (prisma as any).auditLog.findMany.mockResolvedValue([]);
    (prisma as any).auditLog.count.mockResolvedValue(0);

    await adapter.findPaginated({
      page: 2,
      limit: 10,
      actorId: 'u',
      action: 'a',
      targetType: 't',
      dateFrom: new Date('2024-01-01T00:00:00Z'),
      dateTo: new Date('2024-01-02T00:00:00Z'),
    });

    expect((prisma as any).auditLog.findMany).toHaveBeenCalledWith({
      skip: 10,
      take: 10,
      where: {
        actorId: 'u',
        action: 'a',
        targetType: 't',
        timestamp: { gte: new Date('2024-01-01T00:00:00Z'), lte: new Date('2024-01-02T00:00:00Z') },
      },
      orderBy: { timestamp: 'desc' },
    });
  });

  it('should handle only dateFrom filter', async () => {
    (prisma as any).auditLog.findMany.mockResolvedValue([]);
    (prisma as any).auditLog.count.mockResolvedValue(0);

    await adapter.findPaginated({ page: 1, limit: 5, dateFrom: new Date('2024-01-01T00:00:00Z') });

    expect((prisma as any).auditLog.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 5,
      where: {
        timestamp: { gte: new Date('2024-01-01T00:00:00Z') },
      },
      orderBy: { timestamp: 'desc' },
    });
  });

  it('should handle only dateTo filter', async () => {
    (prisma as any).auditLog.findMany.mockResolvedValue([]);
    (prisma as any).auditLog.count.mockResolvedValue(0);

    await adapter.findPaginated({ page: 1, limit: 5, dateTo: new Date('2024-01-02T00:00:00Z') });

    expect((prisma as any).auditLog.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 5,
      where: {
        timestamp: { lte: new Date('2024-01-02T00:00:00Z') },
      },
      orderBy: { timestamp: 'desc' },
    });
  });
});
