import { ConfigService } from './ConfigService';
import { LoggerPort } from '../ports/LoggerPort';
import { AppConfigKeys } from '../entities/AppConfigKeys';

/**
 * Service initializing default application configuration values.
 */
export class BootstapService {
  /**
   * Create a new bootstrapper.
   *
   * @param config - Service used to persist configuration values.
   * @param logger - Logger instance for runtime information.
   */
  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerPort,
  ) {}

  /**
   * Initialize mandatory configuration entries.
   */
  async initialize(): Promise<void> {
    this.logger.info('Bootstrapping configuration');
    await this.config.update(AppConfigKeys.ACCOUNT_LOCK_ON_LOGIN_FAIL, true, 'bootstrap');
    await this.config.update(AppConfigKeys.ACCOUNT_LOCK_DURATION, 900, 'bootstrap');
    await this.config.update(AppConfigKeys.ACCOUNT_LOCK_FAIL_THRESHOLD, 4, 'bootstrap');
  }
}
