import { ConfigService } from './ConfigService';
import { LoggerPort } from '../ports/LoggerPort';
import { AppConfigKeys } from '../entities/AppConfigKeys';
import { PermissionRepositoryPort } from '../ports/PermissionRepositoryPort';
import { Permission } from '../entities/Permission';
import { PermissionKeys } from '../entities/PermissionKeys';
import { randomUUID } from 'crypto';

/**
 * Service initializing default application configuration values and
 * ensuring that all permission keys are present in the repository.
 */
export class BootstapService {
  /**
   * Create a new bootstrapper.
   *
   * @param config - Service used to persist configuration values.
   * @param logger - Logger instance for runtime information.
   * @param permissions - Repository managing permission entities.
   */
  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerPort,
    private readonly permissions: PermissionRepositoryPort,
  ) {}

  /**
   * Initialize mandatory configuration entries and ensure all permissions exist.
   */
  async initialize(): Promise<void> {
    this.logger.info('Bootstrapping configuration');
    await this.config.update(AppConfigKeys.ACCOUNT_LOCK_ON_LOGIN_FAIL, true, 'bootstrap');
    await this.config.update(AppConfigKeys.ACCOUNT_LOCK_DURATION, 900, 'bootstrap');
    await this.config.update(AppConfigKeys.ACCOUNT_LOCK_FAIL_THRESHOLD, 4, 'bootstrap');

    this.logger.info('Bootstrapping permissions');
    const keys = Object.values(PermissionKeys);
    for (const key of keys) {
      const existing = await this.permissions.findByKey(key);
      if (!existing) {
        await this.permissions.create(new Permission(randomUUID(), key, key));
      }
    }
  }
}
