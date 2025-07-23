import { LoggerPort } from '../../../domain/ports/LoggerPort';

class InMemoryLogger implements LoggerPort {
  public records: { level: string; message: string; context?: Record<string, unknown> }[] = [];

  error(message: string, context?: Record<string, unknown>): void {
    this.records.push({ level: 'error', message, context });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.records.push({ level: 'warn', message, context });
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.records.push({ level: 'info', message, context });
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.records.push({ level: 'debug', message, context });
  }

  trace(message: string, context?: Record<string, unknown>): void {
    this.records.push({ level: 'trace', message, context });
  }
}

describe('LoggerPort Interface', () => {
  it('should record messages for all levels', () => {
    const logger = new InMemoryLogger();

    logger.error('e');
    logger.warn('w', { a: 1 });
    logger.info('i');
    logger.debug('d');
    logger.trace('t', { req: '1' });

    expect(logger.records).toEqual([
      { level: 'error', message: 'e', context: undefined },
      { level: 'warn', message: 'w', context: { a: 1 } },
      { level: 'info', message: 'i', context: undefined },
      { level: 'debug', message: 'd', context: undefined },
      { level: 'trace', message: 't', context: { req: '1' } },
    ]);
  });
});
