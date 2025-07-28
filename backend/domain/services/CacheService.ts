import { CachePort } from '../ports/CachePort';

/**
 * Utility service wrapping a {@link CachePort} to lazily load values.
 */
export class CacheService {
  /**
   * Create a new cache service instance.
   *
   * @param cache - Adapter implementing cache operations.
   */
  constructor(private readonly cache: CachePort) {}

  /**
   * Retrieve the cached value or load and cache it using the provided loader.
   *
   * @param key - Cache key to fetch.
   * @param loader - Function invoked when the value is missing.
   * @param ttlSeconds - Optional TTL in seconds for the cached entry.
   * @returns The cached or loaded value.
   */
  async getOrLoad<T>(key: string, loader: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const value = await loader();
    await this.cache.set(key, value, ttlSeconds);
    return value;
  }
}
