/**
 * Generic caching operations used by the application.
 */
export interface CachePort {
  /**
   * Retrieve a cached value by key.
   *
   * @param key - Identifier of the cached item.
   * @returns The cached value or `null` if absent.
   */
  get<T = string>(key: string): Promise<T | null>;

  /**
   * Store a value in cache.
   *
   * @param key - Identifier of the value to store.
   * @param value - Value to cache.
   * @param ttlSeconds - Optional time-to-live in seconds.
   */
  set<T = string>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Remove a cached entry.
   *
   * @param key - Key of the entry to remove.
   */
  delete(key: string): Promise<void>;

  /**
   * Clear cached entries matching a pattern or all if omitted.
   *
   * @param pattern - Pattern of keys to clear.
   */
  clear(pattern?: string): Promise<void>;
}
