import { PrismaAuditConfigAdapter } from '../../../adapters/audit/PrismaAuditConfigAdapter';
import { PrismaClient } from '@prisma/client';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('PrismaAuditConfigAdapter', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let logger: DeepMockProxy<LoggerPort>;
  let adapter: PrismaAuditConfigAdapter;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    logger = mockDeep<LoggerPort>();
    adapter = new PrismaAuditConfigAdapter(prisma, logger);
  });

  it('should return null when config missing', async () => {
    (prisma as any).auditConfig.findUnique.mockResolvedValue(null);
    const result = await adapter.get();
    expect(result).toBeNull();
  });

  it('should retrieve audit config', async () => {
    const record = {
      id: 1,
      levels: ['info'],
      categories: ['auth'],
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      updatedBy: 'u',
      singleton: 1,
    };
    (prisma as any).auditConfig.findUnique.mockResolvedValue(record);
    const result = await adapter.get();
    expect(result?.id).toBe(1);
    expect(result?.levels).toEqual(['info']);
    expect(result?.categories).toEqual(['auth']);
  });

  it('should upsert audit config', async () => {
    const record = {
      id: 2,
      levels: ['error'],
      categories: ['system'],
      updatedAt: new Date('2024-01-02T00:00:00Z'),
      updatedBy: 'a',
      singleton: 1,
    };
    (prisma as any).auditConfig.upsert.mockResolvedValue(record);
    const result = await adapter.update(['error'], ['system'], 'a');
    expect(result.id).toBe(2);
    expect((prisma as any).auditConfig.upsert).toHaveBeenCalledWith({
      where: { singleton: 1 },
      create: { singleton: 1, levels: ['error'], categories: ['system'], updatedBy: 'a' },
      update: { levels: ['error'], categories: ['system'], updatedBy: 'a' },
    });
  });
});
