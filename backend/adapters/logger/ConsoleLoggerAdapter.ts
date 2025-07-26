import { LoggerPort } from '../../domain/ports/LoggerPort';

/** Supported log levels in order of severity */
const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
} as const;

export type LogLevel = keyof typeof LEVELS;

/**
 * Console-based implementation of {@link LoggerPort}.
 */
export class ConsoleLoggerAdapter implements LoggerPort {
  private readonly currentLevel: number;

  constructor(env: Record<string, string | undefined> = process.env) {
    const envLevel = (env.LOG_LEVEL?.toLowerCase() as LogLevel) || 'trace';
    this.currentLevel = LEVELS[envLevel] ?? LEVELS.trace;
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.write('error', message, context, console.error);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.write('warn', message, context, console.warn);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.write('info', message, context, console.info);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.write('debug', message, context, console.debug);
  }

  trace(message: string, context?: Record<string, unknown>): void {
    this.write('trace', message, context, console.log);
  }

  private write(
    level: LogLevel,
    message: string,
    context: Record<string, unknown> | undefined,
    logFn: (msg?: unknown, ...optionalParams: unknown[]) => void,
  ): void {
    if (LEVELS[level] > this.currentLevel) return;

    const timestamp = new Date().toISOString();
    const ctx = context ? ` ${JSON.stringify(context)}` : '';
    logFn(`[${timestamp}] [${level.toUpperCase()}] ${message}${ctx}`);
  }
}
