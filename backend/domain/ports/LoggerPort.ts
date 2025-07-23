/**
 * Defines methods for application logging. Implementations should forward logs
 * to the desired output (console, file, remote, etc.). Each log can optionally
 * include contextual information like request or user identifiers.
 */
export interface LoggerPort {
  /**
   * Log a message at error level.
   *
   * @param message - Message to log.
   * @param context - Optional context values to include.
   */
  error(message: string, context?: Record<string, unknown>): void;

  /**
   * Log a warning message.
   *
   * @param message - Message to log.
   * @param context - Optional context values to include.
   */
  warn(message: string, context?: Record<string, unknown>): void;

  /**
   * Log an informational message.
   *
   * @param message - Message to log.
   * @param context - Optional context values to include.
   */
  info(message: string, context?: Record<string, unknown>): void;

  /**
   * Log a debug message used while troubleshooting.
   *
   * @param message - Message to log.
   * @param context - Optional context values to include.
   */
  debug(message: string, context?: Record<string, unknown>): void;

  /**
   * Log very detailed trace information, such as SQL queries.
   *
   * @param message - Message to log.
   * @param context - Optional context values to include.
   */
  trace(message: string, context?: Record<string, unknown>): void;
}
