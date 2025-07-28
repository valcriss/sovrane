import { CacheService } from '../../../domain/services/CacheService';
import { InMemoryCacheAdapter } from '../../../infrastructure/cache/InMemoryCacheAdapter';

describe('CacheService', () => {
  it('getOrLoad should load when cache empty', async () => {
    const cache = new InMemoryCacheAdapter();
    const service = new CacheService(cache);
    const loader = jest.fn().mockResolvedValue('value');

    const first = await service.getOrLoad('k', loader);
    const second = await service.getOrLoad('k', loader);

    expect(first).toBe('value');
    expect(second).toBe('value');
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
