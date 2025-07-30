import { CachePort } from '../ports/CachePort';
import { ConfigPort } from '../ports/ConfigPort';
import { AppConfig } from '../entities/AppConfig';

/**
 * Service responsible for retrieving and updating configuration values
 * with caching support.
 */
export class ConfigService {
  /**
   * Construct the service with required adapters.
   *
   * @param cache - Cache layer used for fast access.
   * @param repository - Repository used to persist values.
   */
  constructor(
    private readonly cache: CachePort,
    private readonly repository: ConfigPort,
  ) {}

  /**
   * Retrieve a configuration value.
   *
   * @param key - Configuration key to obtain.
   * @returns Parsed configuration value or `null` if missing.
   */
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const record = await this.repository.findByKey(key);
    if (!record) {
      return null;
    }
    const value = this.parseValue<T>(record.value, record.type);
    await this.cache.set(key, value);
    return value;
  }

  /**
   * Update a configuration value in the repository and cache.
   *
   * @param key - Configuration key.
   * @param value - New value to store.
   * @param updatedBy - Identifier of the user performing the change.
   */
  async update(key: string, value: unknown, updatedBy: string): Promise<AppConfig> {
    const { stored, type } = this.serialize(value);
    const record = await this.repository.upsert(key, stored, type, updatedBy);
    await this.cache.set(key, value);
    return record;
  }

  /**
   * Delete a configuration value and invalidate the cache.
   *
   * @param key - Configuration key to remove.
   * @returns The removed configuration or `null` if it does not exist.
   */
  async delete(key: string): Promise<AppConfig | null> {
    const record = await this.repository.findByKey(key);
    if (!record) {
      return null;
    }
    await this.repository.delete(key);
    await this.invalidate(key);
    return record;
  }

  /**
   * Remove a cached configuration entry.
   *
   * @param key - Key of the cache entry to invalidate.
   */
  async invalidate(key: string): Promise<void> {
    await this.cache.delete(key);
  }

  private parseValue<T>(value: string, type: string): T {
    switch (type) {
    case 'number':
      return Number(value) as unknown as T;
    case 'boolean':
      return (value === 'true') as unknown as T;
    case 'json':
      return JSON.parse(value) as T;
    default:
      return value as unknown as T;
    }
  }

  private serialize(value: unknown): { stored: string; type: string } {
    const t = typeof value;
    if (t === 'number' || t === 'boolean') {
      return { stored: String(value), type: t };
    }
    if (t === 'object') {
      return { stored: JSON.stringify(value), type: 'json' };
    }
    return { stored: String(value), type: 'string' };
  }
}
