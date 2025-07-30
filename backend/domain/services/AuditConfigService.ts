import { CachePort } from '../ports/CachePort';
import { AuditConfigPort } from '../ports/AuditConfigPort';
import { AuditConfig } from '../entities/AuditConfig';

/**
 * Service handling retrieval and persistence of audit logging configuration
 * with caching support.
 */
export class AuditConfigService {
  /**
   * Key used to store the configuration in cache.
   */
  private readonly cacheKey = 'audit-config';

  /**
   * Create a new audit configuration service.
   *
   * @param cache - Cache layer for quick access.
   * @param repository - Repository used to persist configuration changes.
   */
  constructor(
    private readonly cache: CachePort,
    private readonly repository: AuditConfigPort,
  ) {}

  /**
   * Retrieve the audit configuration.
   *
   * @returns The stored {@link AuditConfig} or `null` when none exists.
   */
  async get(): Promise<AuditConfig | null> {
    const cached = await this.cache.get<AuditConfig>(this.cacheKey);
    if (cached !== null) {
      return cached;
    }
    const config = await this.repository.get();
    if (config) {
      await this.cache.set(this.cacheKey, config);
    }
    return config;
  }

  /**
   * Update the audit configuration and cache the result.
   *
   * @param levels - Enabled audit levels to persist.
   * @param categories - Categories of events to log.
   * @param updatedBy - Identifier of the user applying the update.
   * @returns The updated configuration instance.
   */
  async update(
    levels: string[],
    categories: string[],
    updatedBy: string,
  ): Promise<AuditConfig> {
    const config = await this.repository.update(levels, categories, updatedBy);
    await this.cache.set(this.cacheKey, config);
    return config;
  }

  /**
   * Invalidate the cached configuration entry.
   */
  async invalidate(): Promise<void> {
    await this.cache.delete(this.cacheKey);
  }
}
