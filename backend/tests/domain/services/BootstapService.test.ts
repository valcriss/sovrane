import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { BootstapService } from '../../../domain/services/BootstapService';
import { ConfigService } from '../../../domain/services/ConfigService';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { AppConfigKeys } from '../../../domain/entities/AppConfigKeys';

describe('BootstapService', () => {
  let config: DeepMockProxy<ConfigService>;
  let logger: DeepMockProxy<LoggerPort>;
  let service: BootstapService;

  beforeEach(() => {
    config = mockDeep<ConfigService>();
    logger = mockDeep<LoggerPort>();
    service = new BootstapService(config, logger);
  });

  it('should initialize configuration keys', async () => {
    await service.initialize();
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.ACCOUNT_LOCK_ON_LOGIN_FAIL, true, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.ACCOUNT_LOCK_DURATION, 900, 'bootstrap');
    expect(config.update).toHaveBeenCalledWith(AppConfigKeys.ACCOUNT_LOCK_FAIL_THRESHOLD, 4, 'bootstrap');
  });
});
