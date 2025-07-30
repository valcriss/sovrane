import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { UpdateConfigUseCase } from '../../../usecases/config/UpdateConfigUseCase';
import { ConfigService } from '../../../domain/services/ConfigService';
import { ConfigPort } from '../../../domain/ports/ConfigPort';
import { InMemoryCacheAdapter } from '../../../adapters/cache/InMemoryCacheAdapter';
import { AppConfig } from '../../../domain/entities/AppConfig';
import { AuditPort } from '../../../domain/ports/AuditPort';
import { AuditEvent } from '../../../domain/entities/AuditEvent';
import { AuditEventType } from '../../../domain/entities/AuditEventType';

describe('UpdateConfigUseCase', () => {
  let repo: DeepMockProxy<ConfigPort>;
  let cache: InMemoryCacheAdapter;
  let service: ConfigService;
  let audit: DeepMockProxy<AuditPort>;
  let useCase: UpdateConfigUseCase;

  beforeEach(() => {
    repo = mockDeep<ConfigPort>();
    cache = new InMemoryCacheAdapter();
    service = new ConfigService(cache, repo);
    audit = mockDeep<AuditPort>();
    useCase = new UpdateConfigUseCase(service, audit);
  });

  it('should update repository and cache', async () => {
    const stored = new AppConfig(1, 'maxAttempts', '5', 'number', new Date(), 'u');
    repo.upsert.mockResolvedValue(stored);
    repo.findByKey.mockResolvedValue(null);

    await useCase.execute('maxAttempts', 5, 'u');

    expect(repo.upsert).toHaveBeenCalledWith('maxAttempts', '5', 'number', 'u');
    const cached = await cache.get<number>('maxAttempts');
    expect(cached).toBe(5);
    expect(audit.log).toHaveBeenCalledWith(expect.any(AuditEvent));
    const event = audit.log.mock.calls[0][0] as AuditEvent;
    expect(event.action).toBe(AuditEventType.CONFIG_CREATED);
    expect(event.details).toEqual({ key: 'maxAttempts', oldValue: null, newValue: 5 });
  });

  it('should log update when entry exists', async () => {
    const stored = new AppConfig(1, 'maxAttempts', '5', 'number', new Date(), 'u');
    repo.upsert.mockResolvedValue(stored);
    repo.findByKey.mockResolvedValue(stored);
    await cache.set('maxAttempts', 5); // ensure service.get returns cached value

    await useCase.execute('maxAttempts', 6, 'u');

    expect(audit.log).toHaveBeenCalledWith(expect.any(AuditEvent));
    const event = audit.log.mock.calls[0][0] as AuditEvent;
    expect(event.action).toBe(AuditEventType.CONFIG_UPDATED);
    expect(event.details).toEqual({ key: 'maxAttempts', oldValue: 5, newValue: 6 });
  });

  it('should validate password length', async () => {
    await expect(useCase.execute('passwordMinLength', 6, 'u')).rejects.toThrow('passwordMinLength must be >= 8');
  });

  it('should validate maxAttempts', async () => {
    await expect(useCase.execute('maxAttempts', 20, 'u')).rejects.toThrow('maxAttempts must be between 1 and 10');
  });

  it('should accept valid password length', async () => {
    repo.upsert.mockResolvedValue(new AppConfig(1, 'passwordMinLength', '10', 'number', new Date(), 'u'));
    await useCase.execute('passwordMinLength', 10, 'u');
    expect(repo.upsert).toHaveBeenCalledWith('passwordMinLength', '10', 'number', 'u');
  });
});
