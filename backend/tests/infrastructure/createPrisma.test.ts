jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $on: jest.fn(),
    })),
  };
});

import { createPrisma } from '../../infrastructure/createPrisma';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { mockDeep } from 'jest-mock-extended';
import { withContext } from '../../infrastructure/loggerContext';

describe('createPrisma', () => {
  it('should register query listener', () => {
    const logger = mockDeep<LoggerPort>();
    const prisma = createPrisma(logger);
    const mockClient: any = (prisma as any);
    expect(mockClient.$on).toHaveBeenCalledWith('query', expect.any(Function));
  });

  it('should forward query events to logger with context', () => {
    const logger = mockDeep<LoggerPort>();
    const prisma = createPrisma(logger);
    const handler = (prisma as any).$on.mock.calls[0][1];
    withContext({ requestId: '1' }, () => {
      handler({ query: 'SELECT 1', params: '[]' });
    });
    expect(logger.trace).toHaveBeenCalledWith('SQL: SELECT 1 -- []', { requestId: '1' });
  });
});
