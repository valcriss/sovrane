import { LoggerPort } from '../../domain/ports/LoggerPort';

/**
 * Example use case executed periodically by the scheduler.
 */
export class DummyCronUseCase {
  /**
   * Create a new instance.
   *
   * @param logger - Logger used to output execution information.
   */
  constructor(private readonly logger: LoggerPort) {}

  /**
   * Execute the use case logic.
   */
  async execute(): Promise<void> {
    this.logger.info('DummyCronUseCase executed');
  }
}
