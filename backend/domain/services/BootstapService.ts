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
    await this.config.update(AppConfigKeys.ACCOUNT_PASSWORD_MIN_LENGTH, 8, 'bootstrap');
    await this.config.update(AppConfigKeys.ACCOUNT_PASSWORD_MAX_LENGTH, 30, 'bootstrap');
    await this.config.update(AppConfigKeys.ACCOUNT_PASSWORD_MUST_HAVE_UPPERCASE, true, 'bootstrap');
    await this.config.update(AppConfigKeys.ACCOUNT_PASSWORD_MUST_HAVE_LOWERCASE, true, 'bootstrap');
    await this.config.update(AppConfigKeys.ACCOUNT_PASSWORD_MUST_HAVE_DIGIT, true, 'bootstrap');
    await this.config.update(AppConfigKeys.ACCOUNT_PASSWORD_MUST_HAVE_SPECIAL_CHAR, true, 'bootstrap');
    await this.config.update(AppConfigKeys.ACCOUNT_PASSWORD_EXPIRE, true, 'bootstrap');
    await this.config.update(AppConfigKeys.ACCOUNT_PASSWORD_EXPIRE_AFTER, 90, 'bootstrap');
    await this.config.update(
      AppConfigKeys.ACCOUNT_PASSWORD_EXPIRE_WARNING_DAYS,
      7,
      'bootstrap',
    );
    await this.config.update(AppConfigKeys.ACCOUNT_PASSWORD_HISTORY, true, 'bootstrap');
    await this.config.update(AppConfigKeys.ACCOUNT_PASSWORD_HISTORY_COUNT, 50, 'bootstrap');
    await this.config.update(AppConfigKeys.ACCOUNT_ALLOW_MFA, true, 'bootstrap');
    await this.config.update(AppConfigKeys.ACCOUNT_REQUIRE_MFA, false, 'bootstrap');
    await this.config.update(
      AppConfigKeys.AUDIT_SENSITIVE_ROUTES,
      ['/api/admin/*', '/api/audit', '/api/config/*'],
      'bootstrap',
    );

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
