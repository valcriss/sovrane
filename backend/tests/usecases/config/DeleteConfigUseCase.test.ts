import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { DeleteConfigUseCase } from '../../../usecases/config/DeleteConfigUseCase';
import { ConfigService } from '../../../domain/services/ConfigService';
import { ConfigPort } from '../../../domain/ports/ConfigPort';
import { InMemoryCacheAdapter } from '../../../adapters/cache/InMemoryCacheAdapter';
import { AppConfig } from '../../../domain/entities/AppConfig';
import { AuditPort } from '../../../domain/ports/AuditPort';
import { AuditEvent } from '../../../domain/entities/AuditEvent';
import { AuditEventType } from '../../../domain/entities/AuditEventType';

describe('DeleteConfigUseCase', () => {
  let repo: DeepMockProxy<ConfigPort>;
  let cache: InMemoryCacheAdapter;
  let service: ConfigService;
  let audit: DeepMockProxy<AuditPort>;
  let useCase: DeleteConfigUseCase;

  beforeEach(() => {
    repo = mockDeep<ConfigPort>();
    cache = new InMemoryCacheAdapter();
    service = new ConfigService(cache, repo);
    audit = mockDeep<AuditPort>();
    useCase = new DeleteConfigUseCase(service, audit);
  });

  it('should delete existing config and log event', async () => {
    const record = new AppConfig(1, 'foo', 'bar', 'string', new Date(), 'u');
    repo.findByKey.mockResolvedValue(record);
    repo.delete.mockResolvedValue(record);
    await cache.set('foo', 'bar');

    await useCase.execute('foo', 'u');

    expect(repo.delete).toHaveBeenCalledWith('foo');
    expect(await cache.get('foo')).toBeNull();
    expect(audit.log).toHaveBeenCalledWith(expect.any(AuditEvent));
    const event = audit.log.mock.calls[0][0] as AuditEvent;
    expect(event.action).toBe(AuditEventType.CONFIG_DELETED);
    expect(event.details).toEqual({ key: 'foo', oldValue: 'bar', newValue: null });
  });

  it('should not log when key missing', async () => {
    repo.findByKey.mockResolvedValue(null);

    await useCase.execute('missing', 'u');

    expect(repo.delete).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });
});
