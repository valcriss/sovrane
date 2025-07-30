import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { SecurityAlertDetectorUseCase } from '../../usecases/SecurityAlertDetectorUseCase';
import { AuditPort } from '../../domain/ports/AuditPort';
import { GetConfigUseCase } from '../../usecases/config/GetConfigUseCase';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { AppConfigKeys } from '../../domain/entities/AppConfigKeys';
import { AuditEventType } from '../../domain/entities/AuditEventType';

describe('SecurityAlertDetectorUseCase', () => {
  let audit: DeepMockProxy<AuditPort>;
  let config: DeepMockProxy<GetConfigUseCase>;
  let logger: DeepMockProxy<LoggerPort>;
  let useCase: SecurityAlertDetectorUseCase;

  beforeEach(() => {
    audit = mockDeep<AuditPort>();
    config = mockDeep<GetConfigUseCase>();
    logger = mockDeep<LoggerPort>();
    (config.execute as jest.Mock).mockImplementation(async (key: string) => {
      switch (key) {
      case AppConfigKeys.LOCKOUT_ALERT_THRESHOLD:
        return 5;
      case AppConfigKeys.FAILED_LOGIN_ALERT_THRESHOLD:
        return 10;
      case AppConfigKeys.FAILED_LOGIN_TIME_WINDOW:
        return 15;
      default:
        return null;
      }
    });
    useCase = new SecurityAlertDetectorUseCase(audit, config, logger);
  });

  it('should return no alerts when counts below thresholds', async () => {
    audit.findPaginated.mockResolvedValueOnce({ items: [], page: 1, limit: 1, total: 4 });
    audit.findPaginated.mockResolvedValueOnce({ items: [], page: 1, limit: 1, total: 8 });

    await expect(useCase.execute()).resolves.toEqual([]);
    expect(audit.findPaginated).toHaveBeenNthCalledWith(1, {
      page: 1,
      limit: 1,
      action: AuditEventType.USER_ACCOUNT_LOCKED,
      dateFrom: expect.any(Date),
    });
    expect(audit.findPaginated).toHaveBeenNthCalledWith(2, {
      page: 1,
      limit: 1,
      action: AuditEventType.USER_LOGIN_FAILED,
      dateFrom: expect.any(Date),
    });
  });

  it('should alert on lockouts only', async () => {
    audit.findPaginated.mockResolvedValueOnce({ items: [], page: 1, limit: 1, total: 6 });
    audit.findPaginated.mockResolvedValueOnce({ items: [], page: 1, limit: 1, total: 4 });

    const result = await useCase.execute();

    expect(result).toEqual([
      { type: 'lockout', count: 6, threshold: 5, window: 15 * 60 },
    ]);
  });

  it('should alert on failed logins only', async () => {
    audit.findPaginated.mockResolvedValueOnce({ items: [], page: 1, limit: 1, total: 3 });
    audit.findPaginated.mockResolvedValueOnce({ items: [], page: 1, limit: 1, total: 12 });

    const result = await useCase.execute();

    expect(result).toEqual([
      { type: 'failedLogin', count: 12, threshold: 10, window: 15 * 60 },
    ]);
  });

  it('should alert on both lockouts and failed logins', async () => {
    audit.findPaginated.mockResolvedValueOnce({ items: [], page: 1, limit: 1, total: 8 });
    audit.findPaginated.mockResolvedValueOnce({ items: [], page: 1, limit: 1, total: 11 });

    const result = await useCase.execute();

    expect(result).toEqual([
      { type: 'lockout', count: 8, threshold: 5, window: 15 * 60 },
      { type: 'failedLogin', count: 11, threshold: 10, window: 15 * 60 },
    ]);
  });

  it('should use default values when config missing', async () => {
    (config.execute as jest.Mock).mockResolvedValue(null);
    audit.findPaginated.mockResolvedValueOnce({ items: [], page: 1, limit: 1, total: 6 });
    audit.findPaginated.mockResolvedValueOnce({ items: [], page: 1, limit: 1, total: 12 });

    const result = await useCase.execute();

    expect(result).toEqual([
      { type: 'lockout', count: 6, threshold: 5, window: 15 * 60 },
      { type: 'failedLogin', count: 12, threshold: 10, window: 15 * 60 },
    ]);
  });
});
