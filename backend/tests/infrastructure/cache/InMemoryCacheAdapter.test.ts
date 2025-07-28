import { InMemoryCacheAdapter } from '../../../infrastructure/cache/InMemoryCacheAdapter';

describe('InMemoryCacheAdapter', () => {
  let cache: InMemoryCacheAdapter;

  beforeEach(() => {
    cache = new InMemoryCacheAdapter();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should store and retrieve values', async () => {
    await cache.set('k', 1);
    expect(await cache.get<number>('k')).toBe(1);
    await cache.delete('k');
    expect(await cache.get('k')).toBeNull();
  });

  it('should expire values', async () => {
    await cache.set('k', 'v', 1);
    jest.advanceTimersByTime(1100);
    expect(await cache.get('k')).toBeNull();
  });

  it('should clear all', async () => {
    await cache.set('a', 1);
    await cache.set('b', 2);
    await cache.clear();
    expect(await cache.get('a')).toBeNull();
    expect(await cache.get('b')).toBeNull();
  });
});
