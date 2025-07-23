import { PrismaClient } from '@prisma/client';
import { LoggerPort } from '../domain/ports/LoggerPort';
import { getContext } from './loggerContext';

/**
 * Instantiate a {@link PrismaClient} configured to forward query logs to the
 * provided {@link LoggerPort}.
 *
 * @param logger - Logger used to record SQL queries at trace level.
 * @returns Configured Prisma client.
 */
export function createPrisma(logger: LoggerPort): PrismaClient {
  const prisma = new PrismaClient({ log: ['query'] });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (prisma as any).$on('query', (e: any) => {
    logger.trace(`SQL: ${e.query} -- ${e.params}`, getContext());
  });

  return prisma;
}
