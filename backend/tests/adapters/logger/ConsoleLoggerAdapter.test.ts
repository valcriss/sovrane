import { ConsoleLoggerAdapter } from '../../../adapters/logger/ConsoleLoggerAdapter';

describe('ConsoleLoggerAdapter', () => {
  const fixedDate = new Date('2024-01-01T00:00:00Z');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(fixedDate);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    delete process.env.LOG_LEVEL;
  });

  it('should respect LOG_LEVEL and log message with context', () => {
    process.env.LOG_LEVEL = 'warn';
    const logger = new ConsoleLoggerAdapter();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    logger.warn('something', { requestId: '1' });
    logger.info('ignored');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toBe(
      `[${fixedDate.toISOString()}] [WARN] something {"requestId":"1"}`,
    );
  });

  it('should log trace when level is trace', () => {
    process.env.LOG_LEVEL = 'trace';
    const logger = new ConsoleLoggerAdapter();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    logger.trace('sql');

    expect(logSpy).toHaveBeenCalledWith(
      `[${fixedDate.toISOString()}] [TRACE] sql`,
    );
  });

  it('should not log debug when level is info', () => {
    process.env.LOG_LEVEL = 'info';
    const logger = new ConsoleLoggerAdapter();
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

    logger.debug('dbg');

    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('should log error always', () => {
    process.env.LOG_LEVEL = 'info';
    const logger = new ConsoleLoggerAdapter();
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    logger.error('boom');

    expect(errSpy).toHaveBeenCalledWith(
      `[${fixedDate.toISOString()}] [ERROR] boom`,
    );
  });

  it('should default to info level when LOG_LEVEL not set', () => {
    const logger = new ConsoleLoggerAdapter({});
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('hello');
    expect(infoSpy).toHaveBeenCalledWith(
      `[${fixedDate.toISOString()}] [INFO] hello`,
    );
  });

  it('should fall back to info level for unknown LOG_LEVEL value', () => {
    const logger = new ConsoleLoggerAdapter({ LOG_LEVEL: 'unknown' });
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    logger.debug('ignored');
    expect(debugSpy).not.toHaveBeenCalled();
  });
});
