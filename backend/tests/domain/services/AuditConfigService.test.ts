import { AuditConfigService } from '../../../domain/services/AuditConfigService';
import { InMemoryCacheAdapter } from '../../../adapters/cache/InMemoryCacheAdapter';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AuditConfigPort } from '../../../domain/ports/AuditConfigPort';
import { AuditConfig } from '../../../domain/entities/AuditConfig';

describe('AuditConfigService', () => {
  let cache: InMemoryCacheAdapter;
  let repo: DeepMockProxy<AuditConfigPort>;
  let service: AuditConfigService;

  beforeEach(() => {
    cache = new InMemoryCacheAdapter();
    repo = mockDeep<AuditConfigPort>();
    service = new AuditConfigService(cache, repo);
  });

  it('should return cached config', async () => {
    const cfg = new AuditConfig(1, ['info'], ['auth'], new Date(), 'u');
    await cache.set('audit-config', cfg);
    const result = await service.get();
    expect(result).toBe(cfg);
    expect(repo.get).not.toHaveBeenCalled();
  });

  it('should return null when not found', async () => {
    repo.get.mockResolvedValue(null);
    const result = await service.get();
    expect(result).toBeNull();
  });

  it('should load from repository and cache result', async () => {
    const cfg = new AuditConfig(1, ['error'], ['system'], new Date(), 'a');
    repo.get.mockResolvedValue(cfg);
    const result = await service.get();
    expect(result).toBe(cfg);
    expect(await cache.get<AuditConfig>('audit-config')).toBe(cfg);
  });

  it('should update repository and cache', async () => {
    const cfg = new AuditConfig(1, ['info'], ['auth'], new Date(), 'u');
    repo.update.mockResolvedValue(cfg);
    const result = await service.update(['info'], ['auth'], 'u');
    expect(result).toBe(cfg);
    expect(repo.update).toHaveBeenCalledWith(['info'], ['auth'], 'u');
    expect(await cache.get<AuditConfig>('audit-config')).toBe(cfg);
  });

  it('should invalidate cache', async () => {
    await cache.set('audit-config', new AuditConfig(1, [], [], new Date(), 'u'));
    await service.invalidate();
    expect(await cache.get('audit-config')).toBeNull();
  });
});
