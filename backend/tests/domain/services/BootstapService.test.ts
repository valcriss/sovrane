import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { BootstapService } from '../../../domain/services/BootstapService';
import { ConfigService } from '../../../domain/services/ConfigService';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { PermissionRepositoryPort } from '../../../domain/ports/PermissionRepositoryPort';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { AppConfigKeys } from '../../../domain/entities/AppConfigKeys';

describe('BootstapService', () => {
  let config: DeepMockProxy<ConfigService>;
  let logger: DeepMockProxy<LoggerPort>;
  let permissions: DeepMockProxy<PermissionRepositoryPort>;
  let service: BootstapService;

  beforeEach(() => {
    config = mockDeep<ConfigService>();
    logger = mockDeep<LoggerPort>();
    permissions = mockDeep<PermissionRepositoryPort>();
    service = new BootstapService(config, logger, permissions);
  });

  it('should initialize configuration keys', async () => {
    await service.initialize();
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.ACCOUNT_LOCK_ON_LOGIN_FAIL, true, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.ACCOUNT_LOCK_DURATION, 900, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.ACCOUNT_LOCK_FAIL_THRESHOLD, 4, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.ACCOUNT_PASSWORD_MIN_LENGTH, 8, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.ACCOUNT_PASSWORD_MAX_LENGTH, 30, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.ACCOUNT_PASSWORD_MUST_HAVE_UPPERCASE, true, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.ACCOUNT_PASSWORD_MUST_HAVE_LOWERCASE, true, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.ACCOUNT_PASSWORD_MUST_HAVE_DIGIT, true, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.ACCOUNT_PASSWORD_MUST_HAVE_SPECIAL_CHAR, true, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.ACCOUNT_PASSWORD_EXPIRE, true, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.ACCOUNT_PASSWORD_EXPIRE_AFTER, 90, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.ACCOUNT_PASSWORD_HISTORY, true, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.ACCOUNT_PASSWORD_HISTORY_COUNT, 50, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.ACCOUNT_ALLOW_MFA, true, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.ACCOUNT_REQUIRE_MFA, false, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(
      AppConfigKeys.AUDIT_SENSITIVE_ROUTES,
      ['/api/admin/*', '/api/audit', '/api/config/*'],
      'bootstrap',
    );
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.LOCKOUT_ALERT_THRESHOLD, 5, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.FAILED_LOGIN_ALERT_THRESHOLD, 10, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.FAILED_LOGIN_TIME_WINDOW, 15, 'bootstrap');
  });

  it('should create missing permissions', async () => {
    permissions.findByKey.mockResolvedValue(null);

    await service.initialize();

    const keys = Object.values(PermissionKeys);
    expect(permissions.create).toHaveBeenCalledTimes(keys.length);
    for (const key of keys) {
      const call = permissions.create.mock.calls.find(c => c[0].permissionKey === key);
      expect(call).toBeDefined();
      expect(call?.[0]).toBeInstanceOf(Permission);
    }
  });
  it('should skip permissions that already exist', async () => {
    permissions.findByKey.mockResolvedValue(new Permission("1", PermissionKeys.CREATE_USER, "create"));
    await service.initialize();
    expect(permissions.create).not.toHaveBeenCalled();
  });

});
