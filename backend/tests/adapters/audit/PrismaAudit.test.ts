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
});
