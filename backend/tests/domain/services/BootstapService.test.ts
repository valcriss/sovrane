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
